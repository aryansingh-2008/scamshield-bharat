import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPasskeyChallengeToken,
  consumePasskeyChallenge,
  signSessionToken,
  SESSION_COOKIE_NAME,
  PASKEY_CHALLENGE_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  CITIZEN_SESSION_TTL_SECONDS,
} from '@/lib/server-auth';
import {
  MASTER_ADMIN_USER,
  PRESIDENT_USER,
  UserProfile,
} from '@/lib/auth-constants';
import {
  verifyServerPresidentPasskey,
  verifyServerAdminPasskey,
  isPinOnlyCandidate,
  isCompromisedPasskey,
} from '@/lib/server-admin-auth';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecureCookie = process.env.NODE_ENV === 'production' && !isLocalhost;

    // WebAuthn Origin / RP ID validation
    const origin = req.headers.get('origin') || '';
    const validOrigins = [
      'https://scamshieldbharat.live',
      'https://www.scamshieldbharat.live',
      'http://localhost',
      'http://127.0.0.1',
    ];
    if (origin && !validOrigins.some((vo) => origin.startsWith(vo))) {
      return NextResponse.json(
        { error: 'Security Origin Mismatch: Cross-origin passkey ceremony is prohibited.', code: 'INVALID_ORIGIN' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { challenge, userType, passkeySecret } = body;

    const challengeCookie = req.cookies.get(PASKEY_CHALLENGE_COOKIE_NAME)?.value;
    if (!challengeCookie || !verifyPasskeyChallengeToken(challengeCookie, challenge)) {
      return NextResponse.json(
        { error: 'Security challenge expired or invalid. Please try again.' },
        { status: 400 }
      );
    }

    const cleanSecret = (passkeySecret || '').trim();
    const claimsPresident = userType === 'president';
    const claimsAdmin = userType === 'admin';
    const hasSecret = Boolean(cleanSecret);

    // If an administrative claim or secret is provided, disallow standalone PIN
    if ((claimsPresident || claimsAdmin || hasSecret) && isPinOnlyCandidate(cleanSecret)) {
      return NextResponse.json(
        {
          error: 'Access Denied: A numeric PIN cannot be used as the sole administrative factor. Master Security Passkey is required.',
          code: 'SOLE_PIN_DISALLOWED',
        },
        { status: 401 }
      );
    }

    // Reject revoked / compromised credentials immediately
    if (isCompromisedPasskey(cleanSecret)) {
      return NextResponse.json(
        {
          error: 'Access Denied: This administrative credential has been revoked due to security compromise. Please use rotated credentials.',
          code: 'CREDENTIAL_REVOKED_COMPROMISED',
        },
        { status: 401 }
      );
    }

    // Verify privileged claims strictly on the server with strict role separation
    let privilegedUser: UserProfile | null = null;

    if (claimsPresident || claimsAdmin || hasSecret) {
      if (claimsPresident) {
        if (!verifyServerPresidentPasskey(cleanSecret)) {
          return NextResponse.json({ error: 'Access Denied: Invalid President Security Passkey.' }, { status: 401 });
        }
        privilegedUser = PRESIDENT_USER;
      } else if (claimsAdmin) {
        if (!verifyServerAdminPasskey(cleanSecret)) {
          return NextResponse.json({ error: 'Access Denied: Invalid Master Admin Security Passkey.' }, { status: 401 });
        }
        privilegedUser = MASTER_ADMIN_USER;
      } else if (hasSecret) {
        if (verifyServerPresidentPasskey(cleanSecret)) {
          privilegedUser = PRESIDENT_USER;
        } else if (verifyServerAdminPasskey(cleanSecret)) {
          privilegedUser = MASTER_ADMIN_USER;
        } else {
          return NextResponse.json({ error: 'Access Denied: Unrecognized Security Passkey.' }, { status: 401 });
        }
      }
    }

    const isPrivileged = privilegedUser !== null;

    // Atomic Server-Side Challenge Consumption (Guaranteed Single-Use)
    const consumption = await consumePasskeyChallenge(challenge, isPrivileged);
    if (!consumption.success) {
      const isDistributedRequired = consumption.error === 'DISTRIBUTED_STORE_REQUIRED_FOR_PRIVILEGED_AUTH';
      return NextResponse.json(
        {
          error: isDistributedRequired
            ? 'Security Policy Violation: Privileged administrative passkey access requires an active distributed datastore. Access is failed-closed.'
            : consumption.error === 'CHALLENGE_ALREADY_CONSUMED'
            ? 'Security challenge has already been consumed. Replay attacks are rejected.'
            : 'Security challenge validation failed. Please request a new passkey prompt.',
          code: consumption.error,
        },
        { status: isDistributedRequired ? 503 : 400 }
      );
    }

    // Determine user profile based on server verification
    let authorizedUser: UserProfile;

    if (privilegedUser) {
      authorizedUser = privilegedUser;
    } else {
      // General passkey verified citizen - cannot be escalated to admin without server credentials
      authorizedUser = {
        uid: `SSB-PASSKEY-${Date.now().toString(36).toUpperCase()}`,
        name: 'Verified Passkey Holder',
        emailOrPhone: 'passkey@scamshieldbharat.live',
        role: 'investor' as const,
        designation: 'Hardware Key Verified Citizen',
        organization: 'ScamShield Bharat',
        verified: true,
      };
    }

    const sessionTtl = isPrivileged ? ADMIN_SESSION_TTL_SECONDS : CITIZEN_SESSION_TTL_SECONDS;

    const token = signSessionToken({
      uid: authorizedUser.uid!,
      name: authorizedUser.name,
      emailOrPhone: authorizedUser.emailOrPhone,
      role: authorizedUser.role,
      designation: authorizedUser.designation,
      organization: authorizedUser.organization,
      verified: true,
    }, sessionTtl);

    const response = NextResponse.json(
      {
        success: true,
        user: authorizedUser,
      },
      {
        headers: {
          'X-Passkey-SingleUse-Mode': consumption.mode,
        },
      }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTtl,
    });

    // Clear challenge cookie
    response.cookies.set({
      name: PASKEY_CHALLENGE_COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Passkey verification failed.' }, { status: 500 });
  }
}
