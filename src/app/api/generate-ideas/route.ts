import { NextRequest, NextResponse } from 'next/server';
import { ideasRequestSchema } from '@/schemas';
import { generateIdeasWithGemini, GeminiError, isGeminiConfigured } from '@/lib/ai/client';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const MAX_BODY_BYTES = 64 * 1024; // 64 KB

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce 64 KB Payload Limit before parsing body
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds the 64 KB limit.',
        },
        { status: 413 }
      );
    }

    // 2. Per-IP and Global Rate Limiting
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, 20, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many idea requests. Please wait ${Math.ceil(rateCheck.resetMs / 1000)} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 3. Check if API Key is configured
    const customKey = req.headers.get('x-gemini-key');
    if (!isGeminiConfigured(customKey)) {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message: 'Gemini API key is not configured in server environment or session settings.',
        },
        { status: 503 }
      );
    }

    // 4. Safe JSON Body Parsing (wrap in try/catch -> 400)
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: 'MALFORMED_JSON',
          message: 'Malformed JSON payload. Please provide valid JSON.',
        },
        { status: 400 }
      );
    }

    // 5. Schema Validation
    const validation = ideasRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid ideas request payload.',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // 6. Generate AI ideas with Gemini
    const ideas = await generateIdeasWithGemini(validation.data, customKey);

    return NextResponse.json({
      success: true,
      ideas,
    });
  } catch (error: unknown) {
    // Log error details server-side only; never log full AI output or leak secrets
    console.error('Error in idea studio:', error instanceof Error ? error.message : 'Unknown server error');

    if (error instanceof GeminiError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    // Return generic error message to client
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to generate ideas. Please try again later.',
      },
      { status: 500 }
    );
  }
}
