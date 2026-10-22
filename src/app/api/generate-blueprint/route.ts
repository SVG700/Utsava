import { blueprintRequestSchema } from '@/schemas';
import { generateBlueprintWithGemini } from '@/lib/ai/client';
import { createAiRouteHandler } from '@/lib/server/aiRouteHandler';

export const POST = createAiRouteHandler({
  schema: blueprintRequestSchema,
  run: generateBlueprintWithGemini,
  toResponse: (blueprint) => ({
    blueprint,
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  }),
  rateLimitPerMinute: 15,
  logLabel: 'Error generating blueprint:',
  messages: {
    rateLimited: (s) => `Too many celebration requests. Please retry in ${s} seconds.`,
    missingKey:
      'Google Gemini API key is missing. Please configure GEMINI_API_KEY in your .env.local file or session settings.',
    invalidRequest: 'Invalid event details provided.',
    internalError: 'Failed to generate blueprint. Please try again later.',
  },
});
