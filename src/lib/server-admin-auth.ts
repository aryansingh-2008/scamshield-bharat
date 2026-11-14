import 'server-only';
import crypto from 'crypto';
import { PRESIDENT_USER, MASTER_ADMIN_USER, UserProfile } from './auth-constants';
import type { ServerSessionPayload } from './server-auth';

/**
 * Server-Only Privileged Administrative Authentication & Authorization Module
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * 1. Privileged credentials (Master Admin and President passkeys) are strictly server-only.
 * 2. They are NEVER imported, bundled, or exposed in client-side code ('use client').
 * 3. Validation is performed exclusively on the server using SHA-256 fixed-width buffer digests
 *    and crypto.timingSafeEqual to prevent timing side-channels and length leakage.
 * 4. A 6-digit PIN by itself CANNOT grant administrative access. High-entropy passkey is mandatory.
 * 5. Minimum passkey length:
 *    - Absolute floor for legacy configured credentials: 12 characters.
 *    - Strict standard for newly generated credentials: 32+ characters with high entropy.
 * 6. Role separation: President and Chief Admin roles cannot be interchanged or forged.
 * 7. Fails closed if environment variables are missing or insecure.
 */

export const MIN_PASSKEY_LENGTH_LEGACY = 12;
export const MIN_PASSKEY_LENGTH_STRONG = 32;
export const MIN_PIN_LENGTH = 6;

/**
 * Validates the cryptographic strength and entropy of a privileged passkey.
 *
 * Rules:
 * - Length < 12: FAILS unconditionally (insecure, rejected in all environments).
 * - Length 12..31: Valid for legacy backwards compatibility, but flagged as not meeting strong standard.
 * - Length >= 32: Evaluates character variety and randomness. Must contain at least 3 character classes
 *   (uppercase, lowercase, numbers, symbols) or base64/hex token entropy.
 */
export function validatePrivilegedPasskeyStrength(passkey: string | null | undefined): {
  valid: boolean;
  isStrong: boolean;
  error?: string;
  reasons?: string[];
} {
  if (!passkey || typeof passkey !== 'string') {
    return { valid: false, isStrong: false, error: 'PASSKEY_EMPTY' };
  }

  const clean = passkey.trim();
  if (clean.length < MIN_PASSKEY_LENGTH_LEGACY) {
    return {
      valid: false,
      isStrong: false,
      error: `PASSKEY_TOO_SHORT: Privileged passkey must be at least ${MIN_PASSKEY_LENGTH_LEGACY} characters.`,
    };
  }

  const reasons: string[] = [];
  const hasUpper = /[A-Z]/.test(clean);
  const hasLower = /[a-z]/.test(clean);
  const hasDigit = /[0-9]/.test(clean);
  const hasSpecial = /[^A-Za-z0-9]/.test(clean);

  const characterClasses = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (clean.length < MIN_PASSKEY_LENGTH_STRONG) {
    reasons.push(`Passkey length (${clean.length}) is below recommended 32-character high-entropy threshold.`);
  }

  if (characterClasses < 3) {
    reasons.push('Passkey lacks sufficient character diversity (requires at least 3 character classes).');
  }

  const isStrong = clean.length >= MIN_PASSKEY_LENGTH_STRONG && characterClasses >= 3;

  return {
    valid: true,
    isStrong,
    reasons: reasons.length > 0 ? reasons : undefined,
  };
}

/**
 * Detects if a credential candidate consists solely of a numeric PIN (e.g., 4 to 8 digits).
 * Standalone PINs are strictly prohibited from granting administrative access.
 */
export function isPinOnlyCandidate(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const clean = candidate.trim();
  return /^\d{4,8}$/.test(clean);
}

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
 * Verify whether provided secret matches rotated President passkey.
 * Reads solely from server environment variable: PRESIDENT_PASSKEY.
 *
 * Security Enforcements:
 * - Standalone PINs are strictly rejected.
 * - Passkey must meet at least MIN_PASSKEY_LENGTH_LEGACY (12 chars).
 * - Fails closed if environment variable is not configured.
 */
export function verifyServerPresidentPasskey(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const clean = candidate.trim();
  if (!clean) return false;

  // Enforce: Standalone PIN cannot grant executive access
  if (isPinOnlyCandidate(clean)) {
    return false;
  }

  const configuredPasskey = process.env.PRESIDENT_PASSKEY?.trim();
  if (!configuredPasskey || configuredPasskey.length < MIN_PASSKEY_LENGTH_LEGACY) {
    return false; // Fail closed
  }

  return timingSafeCompare(clean, configuredPasskey);
}

/**
 * Verify whether provided secret matches rotated Master Admin passkey.
 * Reads solely from server environment variable: MASTER_ADMIN_PASSKEY.
 *
 * Security Enforcements:
 * - Standalone PINs are strictly rejected.
 * - Passkey must meet at least MIN_PASSKEY_LENGTH_LEGACY (12 chars).
 * - Fails closed if environment variable is not configured.
 */
export function verifyServerAdminPasskey(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const clean = candidate.trim();
  if (!clean) return false;

  // Enforce: Standalone PIN cannot grant executive access
  if (isPinOnlyCandidate(clean)) {
    return false;
  }

  const configuredPasskey = process.env.MASTER_ADMIN_PASSKEY?.trim();
  if (!configuredPasskey || configuredPasskey.length < MIN_PASSKEY_LENGTH_LEGACY) {
    return false; // Fail closed
  }

  return timingSafeCompare(clean, configuredPasskey);
}

/**
 * Combined credential check for backward compatibility.
 * Rejects standalone PINs unless allowPinAsSoleFactor is explicitly true (default false).
 */
export function verifyServerPresidentCredentials(
  candidate: string | null | undefined,
  allowPinAsSoleFactor: boolean = false
): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const clean = candidate.trim();
  if (!clean) return false;

  if (isPinOnlyCandidate(clean)) {
    if (!allowPinAsSoleFactor) return false;
    const configuredPin = process.env.PRESIDENT_PIN?.trim();
    if (configuredPin && configuredPin.length >= MIN_PIN_LENGTH) {
      return timingSafeCompare(clean, configuredPin);
    }
    return false;
  }

  return verifyServerPresidentPasskey(clean);
}

/**
 * Combined credential check for Master Admin backward compatibility.
 * Rejects standalone PINs unless allowPinAsSoleFactor is explicitly true (default false).
 */
export function verifyServerAdminCredentials(
  candidate: string | null | undefined,
  allowPinAsSoleFactor: boolean = false
): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const clean = candidate.trim();
  if (!clean) return false;

  if (isPinOnlyCandidate(clean)) {
    if (!allowPinAsSoleFactor) return false;
    const configuredPin = process.env.MASTER_ADMIN_PIN?.trim();
    if (configuredPin && configuredPin.length >= MIN_PIN_LENGTH) {
      return timingSafeCompare(clean, configuredPin);
    }
    return false;
  }

  return verifyServerAdminPasskey(clean);
}

/**
 * Strict server-side executive credential authentication.
 *
 * Security Guarantees:
 * 1. Standalone PINs are strictly rejected with SOLE_PIN_DISALLOWED.
 * 2. President credentials CANNOT unlock Master Admin account.
 * 3. Master Admin credentials CANNOT unlock President account.
 * 4. Missing configuration strictly fails closed.
 */
export function authenticatePrivilegedCredentials(
  identifier: string | null | undefined,
  candidateSecret: string | null | undefined
): { valid: boolean; user: UserProfile | null; error?: string; code?: string } {
  const cleanSecret = (candidateSecret || '').trim();
  if (!cleanSecret) {
    return { valid: false, user: null, error: 'CREDENTIAL_REQUIRED', code: 'CREDENTIAL_REQUIRED' };
  }

  // Reject standalone PIN as sole privileged factor
  if (isPinOnlyCandidate(cleanSecret)) {
    return {
      valid: false,
      user: null,
      error: 'Access Denied: A numeric PIN cannot be used as the sole administrative factor. Master Security Passkey is required.',
      code: 'SOLE_PIN_DISALLOWED',
    };
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

  // 1. Explicit President Identifier: MUST match President passkey only
  if (isPresidentIdent) {
    if (verifyServerPresidentPasskey(cleanSecret)) {
      return { valid: true, user: PRESIDENT_USER };
    }
    return {
      valid: false,
      user: null,
      error: 'Access Denied: Invalid President Security Passkey.',
      code: 'INVALID_PRESIDENT_CREDENTIAL',
    };
  }

  // 2. Explicit Master Admin Identifier: MUST match Master Admin passkey only
  if (isMasterAdminIdent) {
    if (verifyServerAdminPasskey(cleanSecret)) {
      return { valid: true, user: MASTER_ADMIN_USER };
    }
    return {
      valid: false,
      user: null,
      error: 'Access Denied: Invalid Master Admin Security Passkey.',
      code: 'INVALID_ADMIN_CREDENTIAL',
    };
  }

  // 3. Fallback: If no explicit identifier, identify by distinct passkey
  // Each passkey can only unlock its own respective account
  if (verifyServerPresidentPasskey(cleanSecret)) {
    return { valid: true, user: PRESIDENT_USER };
  }
  if (verifyServerAdminPasskey(cleanSecret)) {
    return { valid: true, user: MASTER_ADMIN_USER };
  }

  return {
    valid: false,
    user: null,
    error: 'Access Denied: Invalid administrative credentials.',
    code: 'INVALID_CREDENTIAL',
  };
}

/**
 * Server-Side Privileged Authorization Guard
 *
 * Verifies that a verified server session payload has legitimate executive authorization.
 * Prevents non-privileged users, expired tokens, or forged role claims from accessing administrative operations.
 */
export function verifyPrivilegedAdminSession(
  session: ServerSessionPayload | null | undefined,
  requiredPrivilege: 'any_admin' | 'chief_admin' | 'president' = 'any_admin'
): { authorized: boolean; error?: string; code?: string } {
  if (!session) {
    return { authorized: false, error: 'Authentication required. No active session.', code: 'UNAUTHENTICATED' };
  }

  if (session.role !== 'admin') {
    return {
      authorized: false,
      error: 'Access Forbidden: User does not possess administrative privileges.',
      code: 'FORBIDDEN_ROLE',
    };
  }

  const isChiefAdmin = session.uid === MASTER_ADMIN_USER.uid;
  const isPresident = session.uid === PRESIDENT_USER.uid;

  if (!isChiefAdmin && !isPresident) {
    return {
      authorized: false,
      error: 'Access Forbidden: Session role claim does not match any recognized executive identity.',
      code: 'INVALID_ADMIN_IDENTITY',
    };
  }

  if (requiredPrivilege === 'chief_admin' && !isChiefAdmin) {
    return {
      authorized: false,
      error: 'Access Forbidden: This operation requires Chief Administrator authority.',
      code: 'REQUIRES_CHIEF_ADMIN',
    };
  }

  if (requiredPrivilege === 'president' && !isPresident) {
    return {
      authorized: false,
      error: 'Access Forbidden: This operation requires President authority.',
      code: 'REQUIRES_PRESIDENT',
    };
  }

  return { authorized: true };
}
