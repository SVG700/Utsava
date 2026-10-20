import { NextRequest, NextResponse } from 'next/server';
import { blueprintRequestSchema } from '@/schemas';
import { generateBlueprintWithGemini, GeminiError, isGeminiConfigured } from '@/lib/ai/client';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Per-IP Rate Limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 15, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many planning requests. Please retry in ${Math.ceil(rateCheck.resetMs / 1000)} seconds.`,
        },
        { status: 429 }
      );
    }

    // 2. Check if API Key is configured before parsing heavy payload
    const customKey = req.headers.get('x-gemini-key');
    if (!isGeminiConfigured(customKey)) {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message:
            'Google Gemini API key is missing. Please configure GEMINI_API_KEY in your .env.local file or enter it in App Settings.',
        },
        { status: 503 }
      );
    }

    // 3. Request body parsing & length limit check
    const rawBody = await req.json();
    const validation = blueprintRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid event details provided.',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // 4. Generate AI blueprint with Gemini
    const blueprint = await generateBlueprintWithGemini(validation.data, customKey);

    return NextResponse.json({
      success: true,
      blueprint,
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    });
  } catch (error: unknown) {
    console.error('Error generating blueprint:', error);

    if (error instanceof GeminiError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message,
      },
      { status: 500 }
    );
  }
}
