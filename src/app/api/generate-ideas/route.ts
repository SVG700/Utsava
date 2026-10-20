import { NextRequest, NextResponse } from 'next/server';
import { ideasRequestSchema } from '@/schemas';
import { generateIdeasWithGemini, GeminiError, isGeminiConfigured } from '@/lib/ai/client';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 20, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many idea requests. Please wait ${Math.ceil(rateCheck.resetMs / 1000)}s before trying again.`,
        },
        { status: 429 }
      );
    }

    const customKey = req.headers.get('x-gemini-key');
    if (!isGeminiConfigured(customKey)) {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message: 'Gemini API key is not configured in server environment or app settings.',
        },
        { status: 503 }
      );
    }

    const rawBody = await req.json();
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

    const ideas = await generateIdeasWithGemini(validation.data, customKey);

    return NextResponse.json({
      success: true,
      ideas,
    });
  } catch (error: unknown) {
    console.error('Error in idea studio:', error);

    if (error instanceof GeminiError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : 'An error occurred generating ideas.';
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message,
      },
      { status: 500 }
    );
  }
}
