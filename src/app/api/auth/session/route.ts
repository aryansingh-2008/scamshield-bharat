import { NextRequest, NextResponse } from 'next/server';
import {
  verifySessionTokenAsync,
  SESSION_COOKIE_NAME,
} from '../../../../lib/server-auth';
import { getCitizenAccountAsync } from '../../../../lib/server-citizen-auth';
import type { UserProfile } from '../../../../lib/auth-constants';

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  const searchParams = req.nextUrl.searchParams;
  const queryUid = searchParams.get('uid');

  const verification = await verifySessionTokenAsync(token);

  // 1. Unauthenticated or Invalid / Revoked Session Handling
  if (!verification.valid || !verification.user) {
    const isRevoked = verification.error === 'REVOKED_TOKEN' || verification.error === 'REVOKED_USER';

    // Check if client provided UID query parameter and whether that account is deleted / nonexistent
    let isAccountDeleted = isRevoked;
    if (queryUid && queryUid.trim().startsWith('SSB-')) {
      const acct = await getCitizenAccountAsync(queryUid.trim());
      if (!acct) {
        isAccountDeleted = true;
      }
    }

    const res = NextResponse.json({
      authenticated: false,
      user: null,
      accountDeleted: isAccountDeleted ? true : undefined,
      error: isAccountDeleted ? 'ACCOUNT_DELETED' : (verification.error || 'UNAUTHENTICATED'),
    }, { status: 200 });

    // Consistently clear session cookie whenever account is deleted or session is revoked
    if (isAccountDeleted || isRevoked) {
      res.cookies.delete(SESSION_COOKIE_NAME);
    }

    return res;
  }

  // 2. Authenticated Session - Prevent UID Spoofing / Impersonation
  // If the client explicitly requests a UID query parameter, verify it matches the authenticated session
  if (queryUid && queryUid.trim().startsWith('SSB-')) {
    const cleanQueryUid = queryUid.trim();
    if (verification.user.role !== 'admin' && cleanQueryUid !== verification.user.uid) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: 'UID_MISMATCH',
      }, { status: 403 });
    }
  }

  // 3. Authoritative Datastore Check for Authenticated Citizen
  let authoritativeUser: UserProfile = { ...verification.user };

  if (verification.user.role !== 'admin') {
    let acct = verification.user.uid ? await getCitizenAccountAsync(verification.user.uid) : null;
    if (!acct && verification.user.emailOrPhone) {
      acct = await getCitizenAccountAsync(verification.user.emailOrPhone);
    }

    if (!acct) {
      // Citizen account was deleted from authoritative datastore
      const response = NextResponse.json({
        authenticated: false,
        user: null,
        accountDeleted: true,
        error: 'ACCOUNT_DELETED',
      }, { status: 200 });
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    const now = Date.now();
    const isUnlimitedActive = Boolean(
      acct.role === 'admin' ||
      (acct.isUnlimited && (!acct.unlimitedExpiresAt || acct.unlimitedExpiresAt > now))
    );
    authoritativeUser = {
      ...authoritativeUser,
      name: acct.name,
      role: acct.role,
      designation: acct.designation,
      organization: acct.organization,
      credits: acct.credits,
      isUnlimited: isUnlimitedActive,
      unlimitedExpiresAt: acct.unlimitedExpiresAt,
      planType: acct.planType || (isUnlimitedActive ? 'pro' : 'free'),
    };
  } else {
    authoritativeUser.isUnlimited = true;
    authoritativeUser.credits = 9999;
  }

  return NextResponse.json({
    authenticated: true,
    user: authoritativeUser,
  });
}
