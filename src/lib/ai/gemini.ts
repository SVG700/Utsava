/**
 * Low-level transport to Google Gemini via the official @google/genai SDK.
 * Server-only: GEMINI_API_KEY never reaches the browser.
 */

import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/logger';
import { GeminiError } from './errors';
import { UTSAVA_SYSTEM_INSTRUCTION } from './prompts';

const DEFAULT_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_TRANSIENT_RETRIES = 3;
const PLACEHOLDER_KEY = 'your_api_key_here';

/** Options for a single {@link callGemini} invocation. */
export interface CallGeminiOptions {
  customApiKey?: string | null;
  responseJsonSchema?: unknown;
  systemInstruction?: string;
  /** Internal: 1-based attempt counter used for retries and fallback. */
  attempt?: number;
  /** Internal: forces a specific model (used for the quota fallback). */
  overrideModel?: string;
}

function resolveApiKey(customKey?: string | null): string | undefined {
  const key = customKey || process.env.GEMINI_API_KEY;
  return key && key.trim().length > 0 && key !== PLACEHOLDER_KEY ? key : undefined;
}

/** Returns true when a usable Gemini API key is available. */
export function isGeminiConfigured(customKey?: string | null): boolean {
  return resolveApiKey(customKey) !== undefined;
}

/** Model used for requests, configurable via GEMINI_MODEL. */
export function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function createClient(customKey?: string | null): GoogleGenAI {
  const apiKey = resolveApiKey(customKey);
  if (!apiKey) {
    throw new GeminiError(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local or enter it in app settings.',
      'MISSING_KEY',
      503,
    );
  }
  return new GoogleGenAI({ apiKey });
}

const lower = (s: string) => s.toLowerCase();
const isSchemaRejected = (msg: string) =>
  msg.includes('400') ||
  lower(msg).includes('invalid_argument') ||
  lower(msg).includes('invalid argument');
const isQuotaError = (msg: string) =>
  lower(msg).includes('quota') || msg.includes('429') || msg.includes('FreeTier');
const isTransientError = (msg: string) =>
  msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE');
const isTimeout = (msg: string) => msg.includes('aborted') || msg.includes('timeout');
const isRateLimited = (msg: string) => isQuotaError(msg) || lower(msg).includes('rate limit');

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls Gemini once and returns the raw text, with resilience built in:
 * - retries once without the response schema if Gemini rejects it (400),
 * - falls back to {@link FALLBACK_MODEL} when the primary model's quota is exhausted,
 * - retries transient 503s with linear backoff,
 * - aborts after {@link REQUEST_TIMEOUT_MS}.
 * Upstream error details are logged server-side only; callers receive safe messages.
 */
export async function callGemini(prompt: string, options: CallGeminiOptions = {}): Promise<string> {
  const attempt = options.attempt ?? 1;
  const model = options.overrideModel || getModelName();
  const client = createClient(options.customApiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: options.systemInstruction || UTSAVA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: options.responseJsonSchema,
        temperature: 0.7,
        abortSignal: controller.signal,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new GeminiError('Empty response received from Gemini model.', 'INVALID_RESPONSE', 502);
    }
    return text;
  } catch (error: unknown) {
    clearTimeout(timeoutId); // stop this attempt's timer before any retry starts its own
    if (error instanceof GeminiError) throw error;

    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Gemini upstream call error:', errMsg.replace(/key=[\w-]+/gi, 'key=[REDACTED]'));

    if (options.responseJsonSchema && isSchemaRejected(errMsg)) {
      logger.warn('Gemini rejected responseJsonSchema (400); retrying once without schema.');
      return callGemini(prompt, { ...options, responseJsonSchema: undefined });
    }

    // Fall back once per call chain, even if a transient retry already happened.
    if (isQuotaError(errMsg) && model !== FALLBACK_MODEL) {
      logger.warn(
        `Model ${model} quota exhausted; falling back to ${FALLBACK_MODEL} for this call.`,
      );
      return callGemini(prompt, {
        ...options,
        attempt: attempt + 1,
        overrideModel: FALLBACK_MODEL,
      });
    }

    if (isTransientError(errMsg) && attempt <= MAX_TRANSIENT_RETRIES) {
      await delay(attempt * 2000);
      return callGemini(prompt, { ...options, attempt: attempt + 1 });
    }

    if (isTimeout(errMsg) || controller.signal.aborted) {
      throw new GeminiError(
        'Gemini request timed out after 45 seconds. Please try again.',
        'TIMEOUT',
        504,
      );
    }

    if (isRateLimited(errMsg)) {
      throw new GeminiError(
        'Gemini API rate limit exceeded. Please wait a moment before trying again.',
        'RATE_LIMIT',
        429,
      );
    }

    throw new GeminiError('AI service error. Please try again.', 'API_ERROR', 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
