import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequestSchema } from '@/lib/schema';
import { analyzeFinancialContent } from '@/lib/ai-analyzer';
import { validateImageUpload } from '@/lib/file-security';
import { validateAndParseUrl } from '@/lib/url-security';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // 1. IP-Based Abuse & Rate Limiting Defense
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment before analyzing another message.',
          retryAfter: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const contentType = req.headers.get('content-type') || '';

    // 2. Handle Multipart Form Data (Screenshot Upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('screenshot') as File | null;
      const textContext = (formData.get('context') as string) || '';

      if (!file) {
        return NextResponse.json(
          { error: 'No screenshot file was provided in the upload.' },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      const fileValidation = validateImageUpload({
        name: file.name,
        size: file.size,
        type: file.type,
        buffer,
      });

      if (!fileValidation.isValid) {
        return NextResponse.json(
          { error: fileValidation.error, errorHi: fileValidation.errorHi },
          { status: 400 }
        );
      }

      const trimmedContext = textContext.trim();

      // If textContext is provided (from client extraction or user context input), analyze it.
      // If no text context is available, do NOT fabricate synthetic scam text.
      // analyzeFinancialContent will return a structured UNABLE_TO_ASSESS result.
      const result = await analyzeFinancialContent(trimmedContext, 'screenshot');
      return NextResponse.json(result, {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      });
    }

    // 3. Handle JSON Payload with Size Restrictions
    const rawBodyText = await req.text();
    if (rawBodyText.length > 50000) {
      return NextResponse.json(
        { error: 'Request payload exceeds maximum allowed size (50KB).' },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBodyText);
    } catch {
      return NextResponse.json(
        { error: 'Malformed JSON payload in request.' },
        { status: 400 }
      );
    }

    const parseResult = AnalyzeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { content, inputMode, demoId } = parseResult.data;

    // Additional URL security check if URL mode is selected
    if (inputMode === 'url') {
      const urlCheck = validateAndParseUrl(content);
      if (!urlCheck.isValid) {
        return NextResponse.json(
          {
            error: urlCheck.error || 'Invalid or prohibited URL address.',
          },
          { status: 400 }
        );
      }
    }

    const result = await analyzeFinancialContent(content, inputMode, demoId);
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error: any) {
    // Zero sensitive content logging
    return NextResponse.json(
      {
        error: 'Unable to complete analysis. Please check your message content and try again.',
      },
      { status: 500 }
    );
  }
}
