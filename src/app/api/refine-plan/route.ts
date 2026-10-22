import { refinementRequestSchema } from '@/schemas';
import { refinePlanWithGemini } from '@/lib/ai/client';
import { createAiRouteHandler } from '@/lib/server/aiRouteHandler';

export const POST = createAiRouteHandler({
  schema: refinementRequestSchema,
  run: refinePlanWithGemini,
  toResponse: (refinement) => ({ refinement }),
  rateLimitPerMinute: 20,
  logLabel: 'Error in plan refinement:',
  messages: {
    rateLimited: (s) =>
      `Too many refinement requests. Please wait ${s} seconds before trying again.`,
    missingKey: 'Gemini API key is not configured in server environment or session settings.',
    invalidRequest: 'Invalid refinement payload.',
    internalError: 'Failed to refine plan. Please try again later.',
  },
});
