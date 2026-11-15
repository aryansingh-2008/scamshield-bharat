import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequestSchema } from '@/lib/schema';
import { analyzeFinancialContent, extractTextFromScreenshot } from '@/lib/ai-analyzer';
import { validateImageUpload } from '@/lib/file-security';
import { validateAndParseUrl } from '@/lib/url-security';
import { checkRateLimit, checkIpFreeQuota, recordIpFreeScan } from '@/lib/rate-limiter';
import {
  verifySessionTokenAsync,
  signGuestQuotaCookie,
  verifyGuestQuotaCookie,
  incrementDistributedCounter,
  getPrivacyHashedIp,
  SESSION_COOKIE_NAME,
  GUEST_QUOTA_COOKIE_NAME,
} from '@/lib/server-auth';
import { deductCitizenCreditAsync, refundCitizenCreditAsync } from '@/lib/server-citizen-auth';

export async function POST(req: NextRequest) {
  let shouldRefundOnFailure = false;
  let citizenUidToCharge: string | null = null;

  try {
    const host = req.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecureCookie = process.env.NODE_ENV === 'production' && !isLocalhost;

    // 1. IP-Based Abuse & Sliding Window Rate Limiting Defense
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment before analyzing another message.',
          errorHi: 'बहुत अधिक अनुरोध। कृपया पुनः जांच से पहले कुछ सेकंड प्रतीक्षा करें।',
          retryAfter: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetSeconds),
          },
        }
      );
    }

    // 2. Cryptographic Server-Side Authentication Verification
    // CRITICAL SECURITY ENFORCEMENT:
    // Never trust client-supplied 'x-user-uid' header or localStorage strings.
    // An identity is valid ONLY if signed by the server's private secret in an HttpOnly session cookie or Bearer token.
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const sessionToken = sessionCookie || authHeader;

    const authVerification = await verifySessionTokenAsync(sessionToken);
    const isAuthenticated = authVerification.valid && authVerification.user !== null;

    let newGuestQuotaCookie: string | null = null;
    let quotaStoreMode: 'authenticated' | 'distributed-redis' | 'local-ledger-fallback' = 'authenticated';
    let creditsRemaining: number | undefined;
    let isUnlimitedUser: boolean | undefined = undefined;

    if (isAuthenticated && authVerification.user) {
      // 3A. Authenticated Citizen Credit Accounting
      const isPrivileged = authVerification.user.role === 'admin';
      if (isPrivileged) {
        isUnlimitedUser = true;
        creditsRemaining = 9999;
      } else {
        citizenUidToCharge = authVerification.user.uid || authVerification.user.emailOrPhone;
        const deduction = await deductCitizenCreditAsync(citizenUidToCharge);
        if (!deduction.success) {
          return NextResponse.json(
            {
              error: 'Insufficient safety credits. Please recharge your account to continue scanning.',
              errorHi: 'आपके सुरक्षा क्रेडिट्स समाप्त हो चुके हैं। कृपया आगे जांच के लिए रीचार्ज करें।',
              code: 'INSUFFICIENT_CREDITS',
              creditsRemaining: 0,
              requiresRecharge: true,
            },
            { status: 402 }
          );
        }
        creditsRemaining = deduction.creditsRemaining;
        isUnlimitedUser = deduction.isUnlimited;
        shouldRefundOnFailure = true;
      }
    } else {
      // 3B. Multi-Layered Guest Quota Enforcement (5 scans per IP / Device)
      // Check A: Tamper-proof server-signed cryptographic guest cookie (survives container restarts)
      const rawGuestCookie = req.cookies.get(GUEST_QUOTA_COOKIE_NAME)?.value;
      const guestCookieVerification = verifyGuestQuotaCookie(rawGuestCookie);

      // Check B: In-memory IP ledger
      const ipQuota = checkIpFreeQuota(clientIp);

      // Check C: Distributed Redis/KV store with privacy-hashed IP (if configured)
      const privacyHashedKey = `scamshield:guest:${getPrivacyHashedIp(clientIp)}`;
      const distributedCount = await incrementDistributedCounter(privacyHashedKey, 86400 * 30);
      quotaStoreMode = distributedCount !== null ? 'distributed-redis' : 'local-ledger-fallback';

      // Current scan count is the maximum observed across all active protection layers
      const cookieScans = guestCookieVerification.valid ? guestCookieVerification.count : 0;
      const effectiveScans = Math.max(
        cookieScans,
        ipQuota.used,
        distributedCount !== null ? distributedCount - 1 : 0
      );

      if (effectiveScans >= 5 || !ipQuota.allowed || (distributedCount !== null && distributedCount > 5)) {
        return NextResponse.json(
          {
            error: 'Free trial limit (5 scans) exhausted. Please sign in or register to verify your account and continue scanning.',
            errorHi: 'इस डिवाइस/नेटवर्क के लिए 5 मुफ्त सुरक्षा जांच समाप्त हो चुकी हैं। आगे जांच जारी रखने के लिए कृपया लॉगिन या पंजीकरण करें।',
            requiresAuth: true,
            used: 5,
            limit: 5,
          },
          {
            status: 402,
            headers: {
              'X-Guest-Scans-Remaining': '0',
              'X-Quota-Store': quotaStoreMode,
            },
          }
        );
      }

      // Record scan in local ledger and sign new tamper-proof guest cookie
      recordIpFreeScan(clientIp);
      const nextCount = effectiveScans + 1;
      newGuestQuotaCookie = signGuestQuotaCookie(nextCount, guestCookieVerification.firstSeen);
    }

    const contentType = req.headers.get('content-type') || '';

    // 4. Handle Multipart Form Data (Screenshot Upload) with Strict Size Validation & Multimodal OCR
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('screenshot') as File | null;
      const textContext = (formData.get('context') as string) || '';

      if (!file) {
        if (shouldRefundOnFailure && citizenUidToCharge) {
          await refundCitizenCreditAsync(citizenUidToCharge).catch(() => {});
        }
        return NextResponse.json(
          { error: 'No screenshot file was provided in the upload.' },
          { status: 400 }
        );
      }

      // Size limit: 5MB
      if (file.size > 5 * 1024 * 1024) {
        if (shouldRefundOnFailure && citizenUidToCharge) {
          await refundCitizenCreditAsync(citizenUidToCharge).catch(() => {});
        }
        return NextResponse.json(
          { error: 'Screenshot file exceeds maximum allowed size (5MB).' },
          { status: 413 }
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
        if (shouldRefundOnFailure && citizenUidToCharge) {
          await refundCitizenCreditAsync(citizenUidToCharge).catch(() => {});
        }
        return NextResponse.json(
          { error: fileValidation.error, errorHi: fileValidation.errorHi },
          { status: 400 }
        );
      }

      // Run Multimodal OCR on screenshot buffer
      const ocrResult = await extractTextFromScreenshot(buffer, file.type);
      const extractedText = ocrResult.extractedText.trim();
      const trimmedContext = textContext.trim();
      const combinedContent = [extractedText, trimmedContext].filter(Boolean).join('\n\n');

      if (!combinedContent || combinedContent.length < 5) {
        // Refund credit if the image genuinely had zero extractable text
        if (shouldRefundOnFailure && citizenUidToCharge) {
          await refundCitizenCreditAsync(citizenUidToCharge).catch(() => {});
        }
        return NextResponse.json(
          {
            id: `analysis_${Date.now()}_ocr_empty`,
            timestamp: new Date().toISOString(),
            status: 'UNABLE_TO_ASSESS',
            riskScore: 0,
            headlineSummary: 'Unable to Assess: No readable text detected in screenshot.',
            headlineSummaryHi: 'जांच करने में असमर्थ: स्क्रीनशॉट से कोई पठनीय पाठ नहीं मिला।',
            detailedExplanation:
              'Could not reliably extract readable financial claims from this image. Please ensure the screenshot is clear and not blurry, or paste the message text directly.',
            detailedExplanationHi:
              'इस स्क्रीनशॉट से कोई स्पष्ट पाठ नहीं पढ़ा जा सका। कृपया स्पष्ट स्क्रीनशॉट अपलोड करें या सीधे संदेश टेक्स्ट दर्ज करें।',
            claims: [],
            riskSignals: [],
            evidence: [],
            uncertaintyFactors: [
              'Image did not contain legible financial text or claims',
              'Low image resolution or unreadable font',
            ],
            safeNextSteps: [
              {
                stepNumber: 1,
                title: 'Upload Clearer Screenshot',
                titleHi: 'स्पष्ट स्क्रीनशॉट अपलोड करें',
                description: 'Take a direct full-screen capture of the message or investment advertisement.',
                descriptionHi: 'संदेश या विज्ञापन का स्पष्ट फुल-स्क्रीन स्क्रीनशॉट लें।',
                urgency: 'OPTIONAL',
              },
            ],
            piiRedacted: false,
            inputMode: 'screenshot',
            creditsRemaining,
            isUnlimited: isUnlimitedUser,
          },
          { status: 200 }
        );
      }

      const result = await analyzeFinancialContent(combinedContent, 'screenshot');

      const response = NextResponse.json({ ...result, creditsRemaining, isUnlimited: isUnlimitedUser }, {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-Auth-Verified': isAuthenticated ? 'true' : 'false',
          'X-Quota-Store': quotaStoreMode,
        },
      });

      if (newGuestQuotaCookie) {
        response.cookies.set({
          name: GUEST_QUOTA_COOKIE_NAME,
          value: newGuestQuotaCookie,
          httpOnly: true,
          secure: isSecureCookie,
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });
      }

      return response;
    }

    // 5. Handle JSON Payload with Size Restrictions (Max 50KB)
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
      if (shouldRefundOnFailure && citizenUidToCharge) {
        await refundCitizenCreditAsync(citizenUidToCharge).catch(() => {});
      }
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
        if (shouldRefundOnFailure && citizenUidToCharge) {
          await refundCitizenCreditAsync(citizenUidToCharge).catch(() => {});
        }
        return NextResponse.json(
          {
            error: urlCheck.error || 'Invalid or prohibited URL address.',
          },
          { status: 400 }
        );
      }
    }

    const result = await analyzeFinancialContent(content, inputMode, demoId);

    const response = NextResponse.json({ ...result, creditsRemaining, isUnlimited: isUnlimitedUser }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-Auth-Verified': isAuthenticated ? 'true' : 'false',
        'X-Quota-Store': quotaStoreMode,
      },
    });

    if (newGuestQuotaCookie) {
      response.cookies.set({
        name: GUEST_QUOTA_COOKIE_NAME,
        value: newGuestQuotaCookie,
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error: any) {
    if (shouldRefundOnFailure && citizenUidToCharge) {
      await refundCitizenCreditAsync(citizenUidToCharge).catch(() => {});
    }
    return NextResponse.json(
      {
        error: 'Unable to complete analysis. Please check your message content and try again.',
      },
      { status: 500 }
    );
  }
}
