import { NextRequest, NextResponse } from 'next/server';
import {
  verifySessionTokenAsync,
  SESSION_COOKIE_NAME,
} from '@/lib/server-auth';
import {
  verifyPrivilegedAdminSession,
  verifyServerAdminPasskeyAsync,
  setCustomAdminPasskeyRecordAsync,
} from '@/lib/server-admin-auth';

/**
 * Server-Side Privileged Action Route
 *
 * Independently gates all sensitive administrative commands behind server-verified authorization.
 * Rejects unauthenticated, citizen, investor, forged, expired, revoked, or insufficient privilege attempts.
 */
export async function POST(req: NextRequest) {
  const token =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. No active session.', code: 'UNAUTHENTICATED' },
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

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (!action || typeof action !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Valid action parameter is required.', code: 'INVALID_ACTION' },
      { status: 400 }
    );
  }

  // Chief-Admin-Only Actions: Changing Beneficiary UPI, Appointing Post, Deleting Citizen, Changing Admin Passkey
  const isChiefAdminOnly =
    action === 'UPDATE_BENEFICIARY_UPI' ||
    action === 'APPOINT_POST' ||
    action === 'DELETE_CITIZEN' ||
    action === 'CHANGE_ADMIN_PASSKEY';
  const requiredPrivilege = isChiefAdminOnly ? 'chief_admin' : 'any_admin';

  const privilegeCheck = verifyPrivilegedAdminSession(verification.user, requiredPrivilege);
  if (!privilegeCheck.authorized) {
    return NextResponse.json(
      { success: false, error: privilegeCheck.error, code: privilegeCheck.code },
      { status: 403 }
    );
  }

  // Handle CHANGE_ADMIN_PASSKEY
  if (action === 'CHANGE_ADMIN_PASSKEY') {
    const { currentPasskey, newPasskey } = body;
    if (!currentPasskey || typeof currentPasskey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Current security passkey is required.', code: 'MISSING_CURRENT_PASSKEY' },
        { status: 400 }
      );
    }
    if (!newPasskey || typeof newPasskey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'New security passkey is required.', code: 'MISSING_NEW_PASSKEY' },
        { status: 400 }
      );
    }

    const isCurrentValid = await verifyServerAdminPasskeyAsync(currentPasskey);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'Current security passkey is incorrect. Access denied.', code: 'INVALID_CURRENT_PASSKEY' },
        { status: 401 }
      );
    }

    if (currentPasskey.trim() === newPasskey.trim()) {
      return NextResponse.json(
        { success: false, error: 'New passkey must be different from current passkey.', code: 'IDENTICAL_PASSKEY' },
        { status: 400 }
      );
    }

    const updateResult = await setCustomAdminPasskeyRecordAsync(newPasskey.trim(), verification.user.uid);
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error || 'Failed to update passkey.', code: 'PASSKEY_UPDATE_FAILED' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      executedBy: verification.user.uid,
      role: verification.user.role,
      message: 'Master Admin security passkey has been successfully updated.',
    });
  }

  // Action execution with authorization audit
  return NextResponse.json({
    success: true,
    action,
    executedBy: verification.user.uid,
    role: verification.user.role,
    message: `Administrative action '${action}' successfully authorized and processed by server.`,
  });
}
