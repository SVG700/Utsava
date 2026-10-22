import { ideasRequestSchema } from '@/schemas';
import { generateIdeasWithGemini } from '@/lib/ai/client';
import { createAiRouteHandler } from '@/lib/server/aiRouteHandler';

export const POST = createAiRouteHandler({
  schema: ideasRequestSchema,
  run: generateIdeasWithGemini,
  toResponse: (ideas) => ({ ideas }),
  rateLimitPerMinute: 20,
  logLabel: 'Error in idea studio:',
  messages: {
    rateLimited: (s) => `Too many idea requests. Please wait ${s} seconds before trying again.`,
    missingKey: 'Gemini API key is not configured in server environment or session settings.',
    invalidRequest: 'Invalid ideas request payload.',
    internalError: 'Failed to generate ideas. Please try again later.',
  },
});
