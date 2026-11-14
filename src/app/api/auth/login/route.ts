import { NextRequest, NextResponse } from 'next/server';
import {
  signSessionToken,
  SESSION_COOKIE_NAME,
  isDistributedStoreConfigured,
} from '@/lib/server-auth';
import {
  MASTER_ADMIN_USER,
  PRESIDENT_USER,
  MASTER_ADMIN_PASSKEY,
  MASTER_ADMIN_PIN,
  PRESIDENT_PASSKEY,
  PRESIDENT_PIN,
  DEMO_USERS,
  generateCitizenId,
} from '@/lib/auth-constants';

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isSecureCookie = process.env.NODE_ENV === 'production' && !isLocalhost;

    const body = await req.json();
    const { identifier, password, role, name, isDemo, demoType } = body;

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
        maxAge: 7 * 24 * 60 * 60,
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

    // 2. Check President Executive Credentials
    const isPresident =
      cleanIdent === 'arti' ||
      cleanIdent === 'president' ||
      cleanIdent === 'arti@scamshieldbharat.live' ||
      cleanIdent === 'president@scamshieldbharat.live' ||
      cleanIdent === 'ssb-president-0001';

    if (isPresident) {
      if (process.env.REQUIRE_DISTRIBUTED_AUTH?.trim().toLowerCase() === 'true' && !isDistributedStoreConfigured()) {
        return NextResponse.json(
          {
            error: 'Security Policy Violation: Privileged administrative access requires an active distributed datastore. Access is failed-closed.',
            code: 'DISTRIBUTED_STORE_REQUIRED',
          },
          { status: 503 }
        );
      }

      const isPassValid = cleanPass === PRESIDENT_PASSKEY || cleanPass === PRESIDENT_PIN;
      if (!isPassValid) {
        return NextResponse.json(
          { error: 'Access Denied: Invalid President Security Passkey or PIN.' },
          { status: 401 }
        );
      }

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
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 3. Check Master Admin Credentials
    const isMasterAdmin =
      cleanIdent === 'admin' ||
      cleanIdent === 'admin@scamshieldbharat.live' ||
      cleanIdent === 'ssb-admin-0001';

    if (isMasterAdmin) {
      if (process.env.REQUIRE_DISTRIBUTED_AUTH?.trim().toLowerCase() === 'true' && !isDistributedStoreConfigured()) {
        return NextResponse.json(
          {
            error: 'Security Policy Violation: Privileged administrative access requires an active distributed datastore. Access is failed-closed.',
            code: 'DISTRIBUTED_STORE_REQUIRED',
          },
          { status: 503 }
        );
      }

      const isPassValid = cleanPass === MASTER_ADMIN_PASSKEY || cleanPass === MASTER_ADMIN_PIN;
      if (!isPassValid) {
        return NextResponse.json(
          { error: 'Access Denied: Invalid Master Admin Security Passkey.' },
          { status: 401 }
        );
      }

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
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 4. Citizen / Retail Investor Member Authentication
    if (!cleanPass || cleanPass.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const assignedUid = generateCitizenId();
    const citizenUser = {
      uid: assignedUid,
      name: (name || '').trim() || (cleanIdent.includes('@') ? cleanIdent.split('@')[0] : `Citizen +91 ***${cleanIdent.replace(/\D/g, '').slice(-4)}`),
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
      maxAge: 7 * 24 * 60 * 60,
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
