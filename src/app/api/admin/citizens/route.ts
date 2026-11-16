import { NextRequest, NextResponse } from 'next/server';
import { verifySessionTokenAsync, SESSION_COOKIE_NAME } from '../../../../lib/server-auth';
import { verifyPrivilegedAdminSession } from '../../../../lib/server-admin-auth';
import { getAllCitizenAccountsAsync, deleteCitizenAccountAsync } from '../../../../lib/server-citizen-auth';

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

/**
 * Dedicated Authoritative Administrative Citizen Deletion Endpoint
 */
export async function DELETE(req: NextRequest) {
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

  // Deleting a citizen requires chief administrator authority
  const privilegeCheck = verifyPrivilegedAdminSession(verification.user, 'chief_admin');
  if (!privilegeCheck.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: privilegeCheck.error || 'Access Denied: Chief Administrative privileges required.',
        code: privilegeCheck.code || 'FORBIDDEN_ROLE',
      },
      { status: 403 }
    );
  }

  // Support UID via query parameter or JSON body
  let targetUid = req.nextUrl.searchParams.get('uid');
  if (!targetUid) {
    const body = await req.json().catch(() => ({}));
    targetUid = body?.uid;
  }

  if (!targetUid || typeof targetUid !== 'string' || !targetUid.trim()) {
    return NextResponse.json(
      { success: false, error: 'Target Citizen UID is required for deletion.', code: 'MISSING_UID' },
      { status: 400 }
    );
  }

  const cleanUid = targetUid.trim();
  const deleteResult = await deleteCitizenAccountAsync(cleanUid);

  if (!deleteResult.success) {
    const isForbidden = deleteResult.code === 'PROTECTED_ACCOUNT';
    const isTimeout = deleteResult.code === 'REDIS_TIMEOUT';
    const isDatastoreError = deleteResult.code?.startsWith('REDIS_') || deleteResult.code === 'DATASTORE_ERROR';
    const status = isForbidden ? 403 : (isTimeout ? 504 : (isDatastoreError ? 500 : 400));
    return NextResponse.json(
      {
        success: false,
        error: deleteResult.message,
        code: deleteResult.code || 'DELETE_FAILED',
      },
      { status }
    );
  }

  return NextResponse.json({
    success: true,
    uid: cleanUid,
    alreadyDeleted: deleteResult.alreadyDeleted,
    message: deleteResult.message,
    executedBy: verification.user.uid,
  });
}
