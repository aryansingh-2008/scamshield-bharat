import { NextRequest, NextResponse } from 'next/server';
import {
  signSessionToken,
  SESSION_COOKIE_NAME,
  isDistributedStoreConfigured,
  ADMIN_SESSION_TTL_SECONDS,
  CITIZEN_SESSION_TTL_SECONDS,
  checkAccountLockout,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
} from '@/lib/server-auth';
import {
  MASTER_ADMIN_USER,
  PRESIDENT_USER,
  DEMO_USERS,
  generateCitizenId,
} from '@/lib/auth-constants';
import {
  verifyServerPresidentPasskey,
  verifyServerAdminPasskey,
  verifyServerAdminPasskeyAsync,
  isPinOnlyCandidate,
} from '@/lib/server-admin-auth';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecureCookie = process.env.NODE_ENV === 'production' && !isLocalhost;

    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    const body = await req.json();
    const { identifier, password, isDemo, demoType } = body;

    // 1. Handle Demo Login
    if (isDemo && demoType) {
      const demoUser = demoType === 'investigator' ? DEMO_USERS.investigator : DEMO_USERS.investor;
      const token = signSessionToken({
        uid: demoUser.uid,
        name: demoUser.name,
        emailOrPhone: demoUser.emailOrPhone,
        role: demoUser.role,
        designation: demoUser.designation,
        organization: demoUser.organization,
        verified: true,
      });

      const response = NextResponse.json({
        success: true,
        user: demoUser,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        path: '/',
        maxAge: CITIZEN_SESSION_TTL_SECONDS,
      });

      return response;
    }

    const cleanIdent = (identifier || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanIdent) {
      return NextResponse.json(
        { error: 'Identifier (phone, email, or executive ID) is required.' },
        { status: 400 }
      );
    }

    const isPresident =
      cleanIdent === 'arti' ||
      cleanIdent === 'president' ||
      cleanIdent === 'arti@scamshieldbharat.live' ||
      cleanIdent === 'president@scamshieldbharat.live' ||
      cleanIdent === 'ssb-president-0001';

    const isMasterAdmin =
      cleanIdent === 'admin' ||
      cleanIdent === 'aryan' ||
      cleanIdent === 'admin@scamshieldbharat.live' ||
      cleanIdent === 'ssb-admin-0001';

    const isPrivilegedAttempt = isPresident || isMasterAdmin;

    // 2. Privileged Attempt Controls: Fail-Closed & Lockout Throttling
    if (isPrivilegedAttempt) {
      // Enforcement A: Distributed store requirement when configured
      if (process.env.REQUIRE_DISTRIBUTED_AUTH?.trim().toLowerCase() === 'true' && !isDistributedStoreConfigured()) {
        return NextResponse.json(
          {
            error: 'Security Policy Violation: Privileged administrative access requires an active distributed datastore. Access is failed-closed.',
            code: 'DISTRIBUTED_STORE_REQUIRED',
          },
          { status: 503 }
        );
      }

      // Enforcement B: Account lockout check across serverless instances (identity & origin aware)
      const lockout = await checkAccountLockout(cleanIdent, clientIp);
      if (lockout.locked) {
        return NextResponse.json(
          {
            error: `Account temporarily locked due to excessive failed attempts. Please try again after ${Math.ceil(lockout.retryAfterSeconds / 60)} minutes.`,
            code: 'ACCOUNT_LOCKED',
            retryAfter: lockout.retryAfterSeconds,
            scope: lockout.scope,
          },
          {
            status: 423,
            headers: {
              'Retry-After': String(lockout.retryAfterSeconds),
            },
          }
        );
      }

      // Enforcement C: Reject numeric PIN as the sole privileged factor
      if (isPinOnlyCandidate(cleanPass)) {
        await recordFailedAuthAttempt(cleanIdent, clientIp);
        return NextResponse.json(
          {
            error: 'Access Denied: A numeric PIN cannot be used as the sole administrative authentication factor. Master Security Passkey is required.',
            code: 'SOLE_PIN_DISALLOWED',
          },
          { status: 401 }
        );
      }
    }

    // 3. Check President Executive Credentials (Strict Role Separation)
    if (isPresident) {
      const isPassValid = verifyServerPresidentPasskey(cleanPass);
      if (!isPassValid) {
        const failureState = await recordFailedAuthAttempt(cleanIdent, clientIp);
        return NextResponse.json(
          {
            error: failureState.locked
              ? 'Access Denied: Account has been temporarily locked due to excessive failed attempts.'
              : 'Access Denied: Invalid President Security Passkey.',
            code: failureState.locked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
          },
          { status: failureState.locked ? 423 : 401 }
        );
      }

      await clearFailedAuthAttempts(cleanIdent, clientIp);

      const token = signSessionToken({
        uid: PRESIDENT_USER.uid!,
        name: PRESIDENT_USER.name,
        emailOrPhone: PRESIDENT_USER.emailOrPhone,
        role: 'admin',
        designation: PRESIDENT_USER.designation,
        organization: PRESIDENT_USER.organization,
        verified: true,
      });

      const response = NextResponse.json({
        success: true,
        user: PRESIDENT_USER,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        path: '/',
        maxAge: ADMIN_SESSION_TTL_SECONDS,
      });

      return response;
    }

    // 4. Check Master Admin Credentials (Strict Role Separation)
    if (isMasterAdmin) {
      const isPassValid = await verifyServerAdminPasskeyAsync(cleanPass);
      if (!isPassValid) {
        const failureState = await recordFailedAuthAttempt(cleanIdent, clientIp);
        return NextResponse.json(
          {
            error: failureState.locked
              ? 'Access Denied: Account has been temporarily locked due to excessive failed attempts.'
              : 'Access Denied: Invalid Master Admin Security Passkey.',
            code: failureState.locked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
          },
          { status: failureState.locked ? 423 : 401 }
        );
      }

      await clearFailedAuthAttempts(cleanIdent, clientIp);

      const token = signSessionToken({
        uid: MASTER_ADMIN_USER.uid!,
        name: MASTER_ADMIN_USER.name,
        emailOrPhone: MASTER_ADMIN_USER.emailOrPhone,
        role: 'admin',
        designation: MASTER_ADMIN_USER.designation,
        organization: MASTER_ADMIN_USER.organization,
        verified: true,
      });

      const response = NextResponse.json({
        success: true,
        user: MASTER_ADMIN_USER,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        path: '/',
        maxAge: ADMIN_SESSION_TTL_SECONDS,
      });

      return response;
    }

    // 5. Citizen / Retail Investor Member Authentication
    if (!cleanPass || cleanPass.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const assignedUid = generateCitizenId();
    const citizenUser = {
      uid: assignedUid,
      name:
        cleanIdent.includes('@')
          ? cleanIdent.split('@')[0]
          : `Citizen +91 ***${cleanIdent.replace(/\D/g, '').slice(-4)}`,
      emailOrPhone: cleanIdent,
      role: 'investor' as const,
      designation: 'Verified Citizen Member',
      organization: 'ScamShield Bharat',
      verified: true,
    };

    const token = signSessionToken(citizenUser);

    const response = NextResponse.json({
      success: true,
      user: citizenUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: CITIZEN_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error: any) {
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        error: 'Authentication failed due to a server configuration or processing error.',
        ...(isDev ? { details: error?.message || String(error) } : {}),
      },
      { status: 500 }
    );
  }
}
