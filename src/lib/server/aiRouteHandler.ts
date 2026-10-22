import { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import { GeminiError, isGeminiConfigured } from '@/lib/ai/client';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

/** Maximum accepted request body size for AI routes. */
export const MAX_BODY_BYTES = 64 * 1024;

/** Per-route configuration for {@link createAiRouteHandler}. */
export interface AiRouteConfig<TSchema extends z.ZodType, TResult> {
  /** Zod schema that validates the parsed JSON body. */
  schema: TSchema;
  /** Calls Gemini with the validated request and an optional session API key. */
  run: (input: z.infer<TSchema>, customApiKey: string | null) => Promise<TResult>;
  /** Shapes the success payload (merged with `{ success: true }`). */
  toResponse: (result: TResult) => Record<string, unknown>;
  /** Requests allowed per client per minute. */
  rateLimitPerMinute: number;
  /** User-facing messages for this route. */
  messages: {
    rateLimited: (retryInSeconds: number) => string;
    missingKey: string;
    invalidRequest: string;
    internalError: string;
  };
  /** Prefix used when logging server-side failures. */
  logLabel: string;
}

const RATE_LIMIT_WINDOW_MS = 60_000;

function errorResponse(
  error: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, message, ...extra }, { status });
}

/**
 * Builds a POST handler that runs the shared AI route pipeline:
 * body size limit → rate limit → API key check → JSON parse → Zod validation →
 * Gemini call → sanitised error mapping (no upstream details reach the client).
 */
export function createAiRouteHandler<TSchema extends z.ZodType, TResult>(
  config: AiRouteConfig<TSchema, TResult>,
) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    try {
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
        return errorResponse('PAYLOAD_TOO_LARGE', 'Request payload exceeds the 64 KB limit.', 413);
      }

      const rateCheck = checkRateLimit(
        getClientIp(req),
        config.rateLimitPerMinute,
        RATE_LIMIT_WINDOW_MS,
      );
      if (!rateCheck.success) {
        return errorResponse(
          'RATE_LIMIT_EXCEEDED',
          config.messages.rateLimited(Math.ceil(rateCheck.resetMs / 1000)),
          429,
        );
      }

      const customKey = req.headers.get('x-gemini-key');
      if (!isGeminiConfigured(customKey)) {
        return errorResponse('MISSING_API_KEY', config.messages.missingKey, 503);
      }

      let rawBody: unknown;
      try {
        rawBody = await req.json();
      } catch {
        return errorResponse(
          'MALFORMED_JSON',
          'Malformed JSON payload. Please provide valid JSON.',
          400,
        );
      }

      const validation = config.schema.safeParse(rawBody);
      if (!validation.success) {
        return errorResponse('INVALID_REQUEST', config.messages.invalidRequest, 400, {
          details: validation.error.issues,
        });
      }

      const result = await config.run(validation.data, customKey);
      return NextResponse.json({ success: true, ...config.toResponse(result) });
    } catch (error: unknown) {
      logger.error(
        config.logLabel,
        error instanceof Error ? error.message : 'Unknown server error',
      );

      if (error instanceof GeminiError) {
        return errorResponse(error.code, error.message, error.statusCode);
      }
      return errorResponse('INTERNAL_ERROR', config.messages.internalError, 500);
    }
  };
}
