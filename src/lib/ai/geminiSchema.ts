import { z } from 'zod';
import { aiBlueprintSchema, aiIdeasSchema, aiRefinementSchema } from '@/schemas';

/**
 * JSON-schema keywords rejected by Gemini structured output (verified live:
 * gemini-3.5-flash-lite returns 400 INVALID_ARGUMENT when bounds are present).
 * Bounds are still enforced afterwards by the Zod schemas.
 */
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

/** Recursively removes {@link FORBIDDEN_GEMINI_SCHEMA_KEYS} from a JSON schema. */
export function sanitizeSchemaForGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchemaForGemini);
  }
  if (schema !== null && typeof schema === 'object') {
    return Object.fromEntries(
      Object.entries(schema)
        .filter(([key]) => !FORBIDDEN_GEMINI_SCHEMA_KEYS.has(key))
        .map(([key, value]) => [key, sanitizeSchemaForGemini(value)]),
    );
  }
  return schema;
}

/** Converts a Zod schema into the response schema sent to Gemini. */
function toGeminiSchema(schema: z.ZodType): unknown {
  return sanitizeSchemaForGemini(z.toJSONSchema(schema, { io: 'input' }));
}

export const blueprintJsonSchema = toGeminiSchema(aiBlueprintSchema);
export const refinementJsonSchema = toGeminiSchema(aiRefinementSchema);
export const ideasJsonSchema = toGeminiSchema(aiIdeasSchema);
