import { NextRequest, NextResponse } from 'next/server';
import { verifySessionTokenAsync, SESSION_COOKIE_NAME } from '../../../../lib/server-auth';
import { verifyPrivilegedAdminSession } from '../../../../lib/server-admin-auth';
import { getAllCitizenAccountsAsync } from '../../../../lib/server-citizen-auth';

/**
 * Dedicated Authoritative Administrative Citizen Listing Endpoint
 *
 * Security Requirements:
 * 1. Strictly gates access behind active privileged administrator sessions.
 * 2. Rejects unauthenticated, citizen, investor, and expired sessions (HTTP 401/403).
 * 3. Cryptographic fields (salt, passwordHash, iterations) are stripped before returning.
 * 4. Fails closed if distributed datastore is required and unreachable.
 */
export async function GET(req: NextRequest) {
  const token =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. No active administrative session.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  const verification = await verifySessionTokenAsync(token);
  if (!verification.valid || !verification.user) {
    const isDistributedRequired = verification.error === 'DISTRIBUTED_STORE_REQUIRED';
    return NextResponse.json(
      {
        success: false,
        error: isDistributedRequired
          ? 'Security Policy Violation: Privileged administrative access requires an active distributed datastore. Access is failed-closed.'
          : 'Session token invalid or expired.',
        code: verification.error,
      },
      { status: isDistributedRequired ? 503 : 401 }
    );
  }

  // Enforce administrative role verification server-side
  const privilegeCheck = verifyPrivilegedAdminSession(verification.user, 'any_admin');
  if (!privilegeCheck.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: privilegeCheck.error || 'Access Denied: Administrative privileges required.',
        code: privilegeCheck.code || 'FORBIDDEN_ROLE',
      },
      { status: 403 }
    );
  }

  const accounts = await getAllCitizenAccountsAsync();

  // Strip sensitive cryptographic credentials
  const safeCitizens = accounts.map((acct) => ({
    uid: acct.uid,
    name: acct.name,
    emailOrPhone: acct.normalizedIdentifier,
    role: acct.role,
    designation: acct.designation,
    organization: acct.organization,
    credits: acct.credits,
    isUnlimited: acct.isUnlimited,
    unlimitedExpiresAt: acct.unlimitedExpiresAt,
    premiumStartedAt: acct.premiumStartedAt || null,
    planType: acct.planType || (acct.isUnlimited ? (acct.unlimitedExpiresAt && acct.unlimitedExpiresAt - Date.now() > 100 * 86400000 ? 'annual' : 'pro') : 'free'),
    registeredAt: acct.createdAt,
    lastActiveAt: acct.updatedAt,
    totalScans: 0,
    isVerified: true,
  }));

  return NextResponse.json({
    success: true,
    citizens: safeCitizens,
    count: safeCitizens.length,
  });
}
