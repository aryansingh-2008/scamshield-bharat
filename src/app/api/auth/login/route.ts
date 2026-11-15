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
} from '../../../../lib/server-auth';
import {
  MASTER_ADMIN_USER,
  PRESIDENT_USER,
  DEMO_USERS,
  generateCitizenId,
  normalizeCitizenIdentifier,
  UserProfile,
} from '../../../../lib/auth-constants';
import {
  verifyServerPresidentPasskey,
  verifyServerAdminPasskey,
  verifyServerAdminPasskeyAsync,
  isPinOnlyCandidate,
  isCompromisedPasskey,
} from '../../../../lib/server-admin-auth';
import {
  createCitizenAccountAsync,
  verifyCitizenLoginAsync,
} from '../../../../lib/server-citizen-auth';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecureCookie = process.env.NODE_ENV === 'production' && !isLocalhost;

    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    const body = await req.json();
    const { identifier, password, isDemo, demoType, isSignup, name } = body;

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

    const cleanIdent = normalizeCitizenIdentifier(identifier);
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

      // Enforcement D: Reject revoked / compromised credentials immediately
      if (isCompromisedPasskey(cleanPass)) {
        await recordFailedAuthAttempt(cleanIdent, clientIp);
        return NextResponse.json(
          {
            error: 'Access Denied: This administrative credential has been revoked due to security compromise. Please use rotated credentials.',
            code: 'CREDENTIAL_REVOKED_COMPROMISED',
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

    let citizenUser: UserProfile & { uid: string };

    if (isSignup) {
      const createResult = await createCitizenAccountAsync({
        identifier: cleanIdent,
        password: cleanPass,
        name: (name || '').trim(),
      });

      if (!createResult.success || !createResult.citizen) {
        return NextResponse.json(
          {
            error: createResult.error || 'Failed to create citizen account.',
            code: createResult.code,
          },
          { status: createResult.code === 'ACCOUNT_ALREADY_EXISTS' ? 409 : 400 }
        );
      }

      const now = Date.now();
      const isUnlimitedActive = Boolean(
        createResult.citizen.role === 'admin' ||
        (createResult.citizen.isUnlimited &&
          (!createResult.citizen.unlimitedExpiresAt || createResult.citizen.unlimitedExpiresAt > now))
      );

      citizenUser = {
        uid: createResult.citizen.uid,
        name: createResult.citizen.name,
        emailOrPhone: createResult.citizen.normalizedIdentifier,
        role: createResult.citizen.role,
        designation: createResult.citizen.designation,
        organization: createResult.citizen.organization,
        verified: true,
        credits: createResult.citizen.credits,
        isUnlimited: isUnlimitedActive,
        unlimitedExpiresAt: createResult.citizen.unlimitedExpiresAt,
        planType: createResult.citizen.planType,
      };
    } else {
      const verifyResult = await verifyCitizenLoginAsync(cleanIdent, cleanPass);

      if (!verifyResult.success || !verifyResult.citizen) {
        return NextResponse.json(
          {
            error: verifyResult.error || 'Authentication failed. Please verify your credentials.',
            code: verifyResult.code,
          },
          { status: verifyResult.code === 'ACCOUNT_NOT_FOUND' ? 404 : 401 }
        );
      }

      const now = Date.now();
      const isUnlimitedActive = Boolean(
        verifyResult.citizen.role === 'admin' ||
        (verifyResult.citizen.isUnlimited &&
          (!verifyResult.citizen.unlimitedExpiresAt || verifyResult.citizen.unlimitedExpiresAt > now))
      );

      citizenUser = {
        uid: verifyResult.citizen.uid,
        name: verifyResult.citizen.name,
        emailOrPhone: verifyResult.citizen.normalizedIdentifier,
        role: verifyResult.citizen.role,
        designation: verifyResult.citizen.designation,
        organization: verifyResult.citizen.organization,
        verified: true,
        credits: verifyResult.citizen.credits,
        isUnlimited: isUnlimitedActive,
        unlimitedExpiresAt: verifyResult.citizen.unlimitedExpiresAt,
        planType: verifyResult.citizen.planType,
      };
    }

    const token = signSessionToken({
      uid: citizenUser.uid,
      name: citizenUser.name,
      emailOrPhone: citizenUser.emailOrPhone,
      role: citizenUser.role,
      designation: citizenUser.designation,
      organization: citizenUser.organization,
      verified: true,
      credits: citizenUser.credits,
      isUnlimited: citizenUser.isUnlimited,
      unlimitedExpiresAt: citizenUser.unlimitedExpiresAt,
      planType: citizenUser.planType,
    });

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
    console.error('CRITICAL AUTH LOGIN ERROR:', error);
    return NextResponse.json(
      {
        error: 'Authentication failed due to a server configuration or processing error.',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
