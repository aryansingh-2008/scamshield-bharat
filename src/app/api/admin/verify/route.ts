import { NextRequest, NextResponse } from 'next/server';
import {
  verifySessionTokenAsync,
  SESSION_COOKIE_NAME,
} from '@/lib/server-auth';
import {
  verifyPrivilegedAdminSession,
} from '@/lib/server-admin-auth';

/**
 * Server-Side Administrative Authorization Route
 *
 * Verifies that the caller possesses a cryptographically valid, active, and unrevoked
 * session belonging strictly to an authorized executive (Chief Admin or President).
 *
 * Security Controls:
 * - Does NOT trust client UI state or localStorage.
 * - HTTP 401 Unauthorized for missing/expired/invalid sessions.
 * - HTTP 503 Fail-Closed if distributed store check is unavailable and REQUIRE_DISTRIBUTED_AUTH=true.
 * - HTTP 403 Forbidden for non-privileged authenticated users.
 * - Confirms role separation (Chief Admin vs President).
 */
export async function GET(req: NextRequest) {
  const token =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return NextResponse.json(
      { authorized: false, error: 'Authentication required. No active session.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  const verification = await verifySessionTokenAsync(token);
  if (!verification.valid || !verification.user) {
    const isDistributedRequired = verification.error === 'DISTRIBUTED_STORE_REQUIRED';
    return NextResponse.json(
      {
        authorized: false,
        error: isDistributedRequired
          ? 'Security Policy Violation: Privileged administrative access requires an active distributed datastore. Access is failed-closed.'
          : 'Session token invalid or expired.',
        code: verification.error,
      },
      { status: isDistributedRequired ? 503 : 401 }
    );
  }

  const privilegeCheck = verifyPrivilegedAdminSession(verification.user, 'any_admin');
  if (!privilegeCheck.authorized) {
    return NextResponse.json(
      { authorized: false, error: privilegeCheck.error, code: privilegeCheck.code },
      { status: 403 }
    );
  }

  return NextResponse.json({
    authorized: true,
    user: {
      uid: verification.user.uid,
      name: verification.user.name,
      role: verification.user.role,
      designation: verification.user.designation,
      organization: verification.user.organization,
    },
    isChiefAdmin: verification.user.uid === 'SSB-ADMIN-0001',
    isPresident: verification.user.uid === 'SSB-PRESIDENT-0001',
  });
}
