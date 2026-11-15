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

  const verification = await verifySessionTokenAsync(token);

  if (!verification.valid || !verification.user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  let authoritativeUser: UserProfile = { ...verification.user };

  if (verification.user.uid) {
    const acct = await getCitizenAccountAsync(verification.user.uid);
    if (acct) {
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
    } else if (verification.user.role === 'admin') {
      authoritativeUser.isUnlimited = true;
      authoritativeUser.credits = 9999;
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: authoritativeUser,
  });
}
