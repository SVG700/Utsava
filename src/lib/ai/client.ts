/**
 * Official @google/genai client integration.
 * Called ONLY from server-side route handlers.
 * Never exposes GEMINI_API_KEY to browser.
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import {
  aiBlueprintSchema,
  aiRefinementSchema,
  aiIdeasSchema,
  type AIBlueprint,
  type AIRefinement,
  type AIIdeas,
  type BlueprintRequest,
  type RefinementRequest,
  type IdeasRequest,
} from '@/schemas';
import {
  UTSAVA_SYSTEM_INSTRUCTION,
  buildBlueprintPrompt,
  buildRefinementPrompt,
  buildIdeasPrompt,
} from './prompts';

// Pre-computed JSON schemas generated from Zod schemas for reliable structured output
export const FORBIDDEN_GEMINI_SCHEMA_KEYS = new Set([
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  '$schema',
  'default',
]);

/**
 * Recursively removes OpenAPI schema keywords unsupported by Gemini structured output:
 * minLength, maxLength, minItems, maxItems, minimum, maximum, $schema, default.
 */
export function sanitizeSchemaForGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map((item) => sanitizeSchemaForGemini(item));
  }
  if (schema !== null && typeof schema === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
      if (!FORBIDDEN_GEMINI_SCHEMA_KEYS.has(key)) {
        cleaned[key] = sanitizeSchemaForGemini(value);
      }
    }
    return cleaned;
  }
  return schema;
}

export const blueprintJsonSchema = sanitizeSchemaForGemini(
  z.toJSONSchema(aiBlueprintSchema, { io: 'input' }),
);
export const refinementJsonSchema = sanitizeSchemaForGemini(
  z.toJSONSchema(aiRefinementSchema, { io: 'input' }),
);
export const ideasJsonSchema = sanitizeSchemaForGemini(
  z.toJSONSchema(aiIdeasSchema, { io: 'input' }),
);

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code:
      'MISSING_KEY' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'API_ERROR' | 'NO_CHANGES',
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/** Check if the Gemini API key is configured */
export function isGeminiConfigured(customKey?: string | null): boolean {
  const key = customKey || process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0 && key !== 'your_api_key_here');
}

/** Helper to instantiate the official SDK */
function getGeminiClient(customKey?: string | null): GoogleGenAI {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || apiKey === 'your_api_key_here') {
    throw new GeminiError(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local or enter it in app settings.',
      'MISSING_KEY',
      503,
    );
  }
  return new GoogleGenAI({ apiKey });
}

export interface CallGeminiResult {
  text: string;
  modelUsed: string;
}

export function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash';
}

export function setModelFallback(..._args: unknown[]) {
  void _args;
  // Deprecated: Per-call fallback is now automatically handled without mutating shared global state.
}

/**
 * Clean potential markdown wrappers (```json ... ```) from model response.
 */
function cleanJsonResponse(rawText: string): string {
  let text = rawText.trim();
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  return text.trim();
}

interface CallGeminiOptions {
  systemInstruction?: string;
  customApiKey?: string | null;
  attempt?: number;
  overrideModel?: string;
  responseJsonSchema?: unknown;
}

/**
 * Execute Gemini generateContent with 45-second timeout wired to abortSignal.
 */
async function callGemini(prompt: string, options?: CallGeminiOptions): Promise<string> {
  const customApiKey = options?.customApiKey;
  const attempt = options?.attempt || 1;
  const overrideModel = options?.overrideModel;
  const systemInstruction = options?.systemInstruction;
  const responseJsonSchema = options?.responseJsonSchema;

  const client = getGeminiClient(customApiKey);
  const model = overrideModel || getModelName();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || UTSAVA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema,
        temperature: 0.7,
        abortSignal: controller.signal,
      },
    });

    clearTimeout(timeoutId);

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new GeminiError('Empty response received from Gemini model.', 'INVALID_RESPONSE', 502);
    }

    return text;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof GeminiError) throw error;

    const errMsg = error instanceof Error ? error.message : String(error);
    const safeErrMsg = errMsg.replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]');
    console.error('Gemini upstream call error:', safeErrMsg);

    // If a call with a schema fails with 400 INVALID_ARGUMENT, retry once without responseJsonSchema (Zod still validates)
    if (
      responseJsonSchema &&
      (errMsg.includes('400') ||
        errMsg.toUpperCase().includes('INVALID_ARGUMENT') ||
        errMsg.toLowerCase().includes('invalid argument'))
    ) {
      console.warn(
        'Gemini returned 400 INVALID_ARGUMENT with responseJsonSchema; retrying once without schema...',
      );
      return callGemini(prompt, {
        ...options,
        responseJsonSchema: undefined,
      });
    }

    // Fallback to flash-lite if primary model FreeTier daily quota is exhausted
    if (
      (errMsg.toLowerCase().includes('quota') ||
        errMsg.includes('429') ||
        errMsg.includes('FreeTier')) &&
      model !== 'gemini-3.5-flash-lite' &&
      attempt === 1
    ) {
      console.warn(
        `Model ${model} daily free tier quota hit. Falling back to resilient model gemini-3.5-flash-lite for this call only...`,
      );
      return callGemini(prompt, {
        ...options,
        attempt: attempt + 1,
        overrideModel: 'gemini-3.5-flash-lite',
      });
    }

    // Transient high-demand or service unavailable retry
    if (
      (errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE')) &&
      attempt <= 3
    ) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      return callGemini(prompt, {
        ...options,
        attempt: attempt + 1,
      });
    }

    if (errMsg.includes('aborted') || errMsg.includes('timeout') || controller.signal.aborted) {
      throw new GeminiError(
        'Gemini request timed out after 45 seconds. Please try again.',
        'TIMEOUT',
        504,
      );
    }

    if (
      errMsg.includes('429') ||
      errMsg.toLowerCase().includes('quota') ||
      errMsg.toLowerCase().includes('rate limit')
    ) {
      throw new GeminiError(
        'Gemini API rate limit exceeded. Please wait a moment before trying again.',
        'RATE_LIMIT',
        429,
      );
    }

    throw new GeminiError('AI service error. Please try again.', 'API_ERROR', 502);
  }
}

/**
 * Generate Event Blueprint with 1 automatic retry on schema validation failure.
 */
export async function generateBlueprintWithGemini(
  req: BlueprintRequest,
  customApiKey?: string | null,
): Promise<AIBlueprint> {
  const prompt = buildBlueprintPrompt(req);

  let rawText = await callGemini(prompt, {
    customApiKey,
    responseJsonSchema: blueprintJsonSchema,
  });
  let cleaned = cleanJsonResponse(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    // Retry once with a stricter fix prompt
    const retryPrompt = `${prompt}\n\nIMPORTANT: The previous output failed JSON parsing. Return ONLY raw JSON without markdown or formatting.`;
    rawText = await callGemini(retryPrompt, {
      customApiKey,
      responseJsonSchema: blueprintJsonSchema,
    });
    cleaned = cleanJsonResponse(rawText);
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      throw new GeminiError(
        'Failed to parse blueprint JSON from AI output after retry.',
        'INVALID_RESPONSE',
        502,
      );
    }
  }

  const validation = aiBlueprintSchema.safeParse(parsedJson);
  if (!validation.success) {
    // Retry once on schema mismatch
    const errorDetails = validation.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    const retryPrompt = `${prompt}\n\nCORRECTION REQUIRED: Your previous JSON had schema validation errors: [${errorDetails}]. Please fix and return compliant JSON.`;
    rawText = await callGemini(retryPrompt, {
      customApiKey,
      responseJsonSchema: blueprintJsonSchema,
    });
    cleaned = cleanJsonResponse(rawText);
    let retryParsed: unknown;
    try {
      retryParsed = JSON.parse(cleaned);
    } catch {
      throw new GeminiError(
        'Failed to parse corrected blueprint JSON after retry.',
        'INVALID_RESPONSE',
        502,
      );
    }
    const retryValidation = aiBlueprintSchema.safeParse(retryParsed);

    if (!retryValidation.success) {
      throw new GeminiError(
        `AI blueprint output did not match expected schema: ${retryValidation.error.issues[0]?.message || 'Unknown issue'}`,
        'INVALID_RESPONSE',
        502,
      );
    }
    return retryValidation.data;
  }

  return validation.data;
}

function hasValidChangedSections(refinement: AIRefinement): boolean {
  if (!refinement.changedSections || refinement.changedSections.length === 0) {
    return false;
  }
  for (const sec of refinement.changedSections) {
    if (refinement[sec] === undefined || refinement[sec] === null) {
      return false;
    }
  }
  return true;
}

/**
 * Refine an existing plan with Gemini with 1 automatic retry on schema validation failure.
 */
export async function refinePlanWithGemini(
  req: RefinementRequest,
  customApiKey?: string | null,
): Promise<AIRefinement> {
  const prompt = buildRefinementPrompt(req);
  let rawText = await callGemini(prompt, {
    customApiKey,
    responseJsonSchema: refinementJsonSchema,
  });
  let cleaned = cleanJsonResponse(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    const retryPrompt = `${prompt}\n\nIMPORTANT: Previous output failed JSON parsing. Return ONLY raw valid JSON conforming to the refinement schema.`;
    rawText = await callGemini(retryPrompt, {
      customApiKey,
      responseJsonSchema: refinementJsonSchema,
    });
    cleaned = cleanJsonResponse(rawText);
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      throw new GeminiError(
        'Failed to parse plan refinement JSON from AI output after retry.',
        'INVALID_RESPONSE',
        502,
      );
    }
  }

  const validation = aiRefinementSchema.safeParse(parsedJson);
  const isValidFirstAttempt = validation.success && hasValidChangedSections(validation.data);

  if (!isValidFirstAttempt) {
    const isChangedSectionsIssue =
      (validation.success && !hasValidChangedSections(validation.data)) ||
      (!validation.success &&
        validation.error.issues.some((i) => i.path.includes('changedSections')));

    const errorDetails = validation.success
      ? 'The changedSections array was empty or listed sections were not provided in full.'
      : validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');

    const retryPrompt = `${prompt}\n\nCORRECTION REQUIRED: Your previous JSON had issues: [${errorDetails}]. You must specify non-empty 'changedSections' and include each of those sections in full. Please fix and return compliant JSON.`;
    rawText = await callGemini(retryPrompt, {
      customApiKey,
      responseJsonSchema: refinementJsonSchema,
    });
    cleaned = cleanJsonResponse(rawText);
    let retryParsed: unknown;
    try {
      retryParsed = JSON.parse(cleaned);
    } catch {
      throw new GeminiError(
        'Failed to parse corrected refinement JSON after retry.',
        'INVALID_RESPONSE',
        502,
      );
    }
    const retryValidation = aiRefinementSchema.safeParse(retryParsed);

    if (!retryValidation.success) {
      const isRetryChangedIssue = retryValidation.error.issues.some((i) =>
        i.path.includes('changedSections'),
      );
      if (isRetryChangedIssue || isChangedSectionsIssue) {
        throw new GeminiError(
          'No changes could be applied to your plan. Try a more specific request.',
          'NO_CHANGES',
          422,
        );
      }
      throw new GeminiError(
        `AI refinement did not match expected schema: ${retryValidation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        'INVALID_RESPONSE',
        502,
      );
    }

    if (!hasValidChangedSections(retryValidation.data)) {
      throw new GeminiError(
        'No changes could be applied to your plan. Try a more specific request.',
        'NO_CHANGES',
        422,
      );
    }

    return retryValidation.data;
  }

  return validation.data;
}

/**
 * Generate creative personalized ideas with Gemini with 1 automatic retry on schema validation failure.
 */
export async function generateIdeasWithGemini(
  req: IdeasRequest,
  customApiKey?: string | null,
): Promise<AIIdeas> {
  const prompt = buildIdeasPrompt(req);
  let rawText = await callGemini(prompt, {
    customApiKey,
    responseJsonSchema: ideasJsonSchema,
  });
  let cleaned = cleanJsonResponse(rawText);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    const retryPrompt = `${prompt}\n\nIMPORTANT: Previous output failed JSON parsing. Return ONLY raw valid JSON for ideas schema.`;
    rawText = await callGemini(retryPrompt, {
      customApiKey,
      responseJsonSchema: ideasJsonSchema,
    });
    cleaned = cleanJsonResponse(rawText);
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      throw new GeminiError(
        'Failed to parse idea studio JSON from AI output after retry.',
        'INVALID_RESPONSE',
        502,
      );
    }
  }

  const validation = aiIdeasSchema.safeParse(parsedJson);
  if (!validation.success) {
    const errorDetails = validation.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    const retryPrompt = `${prompt}\n\nCORRECTION REQUIRED: Your previous ideas JSON had schema validation errors: [${errorDetails}]. Please fix and return compliant JSON.`;
    rawText = await callGemini(retryPrompt, {
      customApiKey,
      responseJsonSchema: ideasJsonSchema,
    });
    cleaned = cleanJsonResponse(rawText);
    let retryParsed: unknown;
    try {
      retryParsed = JSON.parse(cleaned);
    } catch {
      throw new GeminiError(
        'Failed to parse corrected idea studio JSON after retry.',
        'INVALID_RESPONSE',
        502,
      );
    }
    const retryValidation = aiIdeasSchema.safeParse(retryParsed);

    if (!retryValidation.success) {
      throw new GeminiError(
        `AI ideas output did not match expected schema: ${retryValidation.error.issues[0]?.message}`,
        'INVALID_RESPONSE',
        502,
      );
    }
    return retryValidation.data;
  }

  return validation.data;
}
