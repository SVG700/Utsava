import type { z } from 'zod';
import { GeminiError } from './errors';
import { callGemini } from './gemini';

/** Extra business rule a schema-valid response must satisfy (e.g. "refinement changed something"). */
export interface AcceptanceRule<T> {
  /** Returns true when the validated data is usable. */
  isAcceptable: (data: T) => boolean;
  /** Validation-issue path segment that also means "not acceptable" (e.g. 'changedSections'). */
  issuePath?: string;
  /** Sentence appended to the correction prompt explaining the rule to the model. */
  correctionHint: string;
  /** Error thrown when the rule still fails after the corrective retry. */
  rejection: () => GeminiError;
}

/** Inputs for {@link generateStructured}. */
export interface StructuredCallOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  responseJsonSchema: unknown;
  customApiKey?: string | null;
  /** Human-readable name used in error messages, e.g. "blueprint". */
  label: string;
  acceptance?: AcceptanceRule<T>;
}

/** Strips a ```json fenced block that some models wrap around JSON output. */
export function cleanJsonResponse(rawText: string): string {
  return rawText
    .trim()
    .replace(/^```(?:json)?/, '')
    .replace(/```$/, '')
    .trim();
}

function tryParseJson(rawText: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(cleanJsonResponse(rawText)) };
  } catch {
    return { ok: false };
  }
}

const invalidResponse = (message: string) => new GeminiError(message, 'INVALID_RESPONSE', 502);

const formatIssues = (error: z.ZodError) =>
  error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

/**
 * Calls Gemini and returns schema-validated data, with at most one corrective retry
 * for unparseable JSON and one for schema/business-rule violations.
 * Thrown messages are generic; validation details are only fed back to the model.
 */
export async function generateStructured<T>(options: StructuredCallOptions<T>): Promise<T> {
  const { prompt, schema, responseJsonSchema, customApiKey, label, acceptance } = options;
  const call = (text: string) => callGemini(text, { customApiKey, responseJsonSchema });

  let parsed = tryParseJson(await call(prompt));
  if (!parsed.ok) {
    parsed = tryParseJson(
      await call(
        `${prompt}\n\nIMPORTANT: The previous output failed JSON parsing. Return ONLY raw valid JSON without markdown.`,
      ),
    );
    if (!parsed.ok) {
      throw invalidResponse(`Failed to parse ${label} JSON from AI output after retry.`);
    }
  }

  const first = schema.safeParse(parsed.value);
  if (first.success && (!acceptance || acceptance.isAcceptable(first.data))) {
    return first.data;
  }

  const violatesRule = (result: z.ZodSafeParseResult<T>) =>
    acceptance !== undefined &&
    (result.success
      ? !acceptance.isAcceptable(result.data)
      : result.error.issues.some((issue) => issue.path.includes(acceptance.issuePath ?? '')));

  const problems = first.success
    ? 'The response did not satisfy the request rules.'
    : formatIssues(first.error);
  const hint = acceptance ? ` ${acceptance.correctionHint}` : '';
  const retried = tryParseJson(
    await call(
      `${prompt}\n\nCORRECTION REQUIRED: Your previous JSON had issues: [${problems}].${hint} Please fix and return compliant JSON.`,
    ),
  );
  if (!retried.ok) {
    throw invalidResponse(`Failed to parse corrected ${label} JSON after retry.`);
  }

  const second = schema.safeParse(retried.value);
  if (second.success && (!acceptance || acceptance.isAcceptable(second.data))) {
    return second.data;
  }
  if (acceptance && (violatesRule(second) || violatesRule(first))) {
    throw acceptance.rejection();
  }
  throw invalidResponse(`AI ${label} output did not match the expected format. Please try again.`);
}
