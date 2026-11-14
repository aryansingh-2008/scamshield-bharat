import 'server-only';
import crypto from 'crypto';
import { PRESIDENT_USER, MASTER_ADMIN_USER, UserProfile } from './auth-constants';

/**
 * Server-Only Privileged Administrative Authentication Module
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * 1. Privileged credentials (Master Admin and President passkeys / PINs) are strictly server-only.
 * 2. They are NEVER imported, bundled, or exposed in client-side code ('use client').
 * 3. Validation is performed exclusively on the server using SHA-256 fixed-width buffer digests
 *    and crypto.timingSafeEqual to prevent timing side-channels and length leakage.
 * 4. No plaintext credentials, reversible representations, or low-entropy unsalted hashes exist in the codebase.
 * 5. If server-side environment variables are missing, privileged authentication strictly FAILS CLOSED.
 */

/**
 * Cryptographically timing-safe string comparison.
 * Hashes both candidate and expected strings with SHA-256 to fixed 32-byte buffers
 * before performing constant-time comparison via crypto.timingSafeEqual.
 * This guarantees:
 * - Constant-time execution regardless of input length.
 * - Zero timing leakage regarding expected string length or character prefix matches.
 * - No buffer length mismatch exceptions.
 */
function timingSafeCompare(candidate: string, expected: string): boolean {
  if (!candidate || !expected) return false;
  const hashCandidate = crypto.createHash('sha256').update(candidate, 'utf-8').digest();
  const hashExpected = crypto.createHash('sha256').update(expected, 'utf-8').digest();
  return crypto.timingSafeEqual(hashCandidate, hashExpected);
}

/**
 * Verify whether provided secret matches rotated President credentials.
 * Reads solely from server environment variables:
 * - PRESIDENT_PASSKEY (min 12 chars)
 * - PRESIDENT_PIN (min 6 chars)
 *
 * Fails closed if environment variables are not configured.
 */
export function verifyServerPresidentCredentials(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const clean = candidate.trim();
  if (!clean) return false;

  const configuredPasskey = process.env.PRESIDENT_PASSKEY?.trim();
  const configuredPin = process.env.PRESIDENT_PIN?.trim();

  // Fail closed if server has no privileged credentials configured
  if (!configuredPasskey && !configuredPin) {
    return false;
  }

  let passkeyMatch = false;
  let pinMatch = false;

  if (configuredPasskey && configuredPasskey.length >= 12) {
    passkeyMatch = timingSafeCompare(clean, configuredPasskey);
  }
  if (configuredPin && configuredPin.length >= 6) {
    pinMatch = timingSafeCompare(clean, configuredPin);
  }

  return passkeyMatch || pinMatch;
}

/**
 * Verify whether provided secret matches rotated Master Admin credentials.
 * Reads solely from server environment variables:
 * - MASTER_ADMIN_PASSKEY (min 12 chars)
 * - MASTER_ADMIN_PIN (min 6 chars)
 *
 * Fails closed if environment variables are not configured.
 */
export function verifyServerAdminCredentials(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const clean = candidate.trim();
  if (!clean) return false;

  const configuredPasskey = process.env.MASTER_ADMIN_PASSKEY?.trim();
  const configuredPin = process.env.MASTER_ADMIN_PIN?.trim();

  // Fail closed if server has no privileged credentials configured
  if (!configuredPasskey && !configuredPin) {
    return false;
  }

  let passkeyMatch = false;
  let pinMatch = false;

  if (configuredPasskey && configuredPasskey.length >= 12) {
    passkeyMatch = timingSafeCompare(clean, configuredPasskey);
  }
  if (configuredPin && configuredPin.length >= 6) {
    pinMatch = timingSafeCompare(clean, configuredPin);
  }

  return passkeyMatch || pinMatch;
}

/**
 * Unified server-side executive credential authentication.
 * Resolves whether the candidate secret validates as President or Master Admin.
 */
export function authenticatePrivilegedCredentials(
  identifier: string | null | undefined,
  candidateSecret: string | null | undefined
): { valid: boolean; user: UserProfile | null; error?: string } {
  const cleanSecret = (candidateSecret || '').trim();
  if (!cleanSecret) {
    return { valid: false, user: null, error: 'CREDENTIAL_REQUIRED' };
  }

  const cleanIdent = (identifier || '').toLowerCase().trim();

  const isPresidentIdent =
    cleanIdent === 'arti' ||
    cleanIdent === 'president' ||
    cleanIdent === 'arti@scamshieldbharat.live' ||
    cleanIdent === 'president@scamshieldbharat.live' ||
    cleanIdent === 'ssb-president-0001';

  const isMasterAdminIdent =
    cleanIdent === 'admin' ||
    cleanIdent === 'aryan' ||
    cleanIdent === 'admin@scamshieldbharat.live' ||
    cleanIdent === 'ssb-admin-0001' ||
    cleanIdent === 'ssb-admin-unlock';

  // 1. Explicit President Identifier
  if (isPresidentIdent) {
    if (verifyServerPresidentCredentials(cleanSecret)) {
      return { valid: true, user: PRESIDENT_USER };
    }
    return { valid: false, user: null, error: 'INVALID_PRESIDENT_CREDENTIAL' };
  }

  // 2. Explicit Master Admin Identifier
  if (isMasterAdminIdent) {
    if (verifyServerAdminCredentials(cleanSecret)) {
      return { valid: true, user: MASTER_ADMIN_USER };
    }
    // President passkey is also permitted to authenticate through admin portal
    if (verifyServerPresidentCredentials(cleanSecret)) {
      return { valid: true, user: PRESIDENT_USER };
    }
    return { valid: false, user: null, error: 'INVALID_ADMIN_CREDENTIAL' };
  }

  // 3. Fallback: Check if secret matches either executive account directly
  if (verifyServerPresidentCredentials(cleanSecret)) {
    return { valid: true, user: PRESIDENT_USER };
  }
  if (verifyServerAdminCredentials(cleanSecret)) {
    return { valid: true, user: MASTER_ADMIN_USER };
  }

  return { valid: false, user: null, error: 'INVALID_CREDENTIAL' };
}
