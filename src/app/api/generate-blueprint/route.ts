import { NextRequest, NextResponse } from 'next/server';
import { blueprintRequestSchema } from '@/schemas';
import { generateBlueprintWithGemini, GeminiError, isGeminiConfigured } from '@/lib/ai/client';
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
        { status: 413 },
      );
    }

    // 2. Per-IP and Global Rate Limiting
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, 15, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many celebration requests. Please retry in ${Math.ceil(rateCheck.resetMs / 1000)} seconds.`,
        },
        { status: 429 },
      );
    }

    // 3. Check if API Key is configured before processing
    const customKey = req.headers.get('x-gemini-key');
    if (!isGeminiConfigured(customKey)) {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message:
            'Google Gemini API key is missing. Please configure GEMINI_API_KEY in your .env.local file or session settings.',
        },
        { status: 503 },
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
        { status: 400 },
      );
    }

    // 5. Schema Validation
    const validation = blueprintRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid event details provided.',
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    // 6. Generate AI blueprint with Gemini
    const blueprint = await generateBlueprintWithGemini(validation.data, customKey);

    return NextResponse.json({
      success: true,
      blueprint,
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    });
  } catch (error: unknown) {
    // Log error details server-side only; never log full AI output or leak secrets
    console.error(
      'Error generating blueprint:',
      error instanceof Error ? error.message : 'Unknown server error',
    );

    if (error instanceof GeminiError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode },
      );
    }

    // Return generic error message to client
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to generate blueprint. Please try again later.',
      },
      { status: 500 },
    );
  }
}
