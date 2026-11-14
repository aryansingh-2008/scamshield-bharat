import crypto from 'crypto';
import { UserProfile } from './auth-context';

export interface ServerSessionPayload {
  uid: string;
  name: string;
  emailOrPhone: string;
  role: 'investor' | 'investigator' | 'guest' | 'admin';
  designation?: string;
  organization?: string;
  verified: boolean;
  iat: number; // Issued at (seconds)
  exp: number; // Expiry (seconds)
}

export interface SessionVerificationResult {
  valid: boolean;
  user: ServerSessionPayload | null;
  error?: string;
}

export interface GuestQuotaToken {
  count: number;
  firstSeen: number;
  nonce: string;
}

// Cookie names
export const SESSION_COOKIE_NAME = 'ssb_session';
export const GUEST_QUOTA_COOKIE_NAME = 'ssb_guest_quota';
export const PASKEY_CHALLENGE_COOKIE_NAME = 'ssb_passkey_challenge';

// Session Lifetimes (NIST SP 800-63B / RBI Cybersecurity Guidelines)
// Privileged administrative accounts are restricted to 2 hours maximum session duration
export const ADMIN_SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 hours
export const CITIZEN_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Brute-force throttling constants for privileged authentication
export const MAX_PRIVILEGED_FAILED_ATTEMPTS = 5;
export const PRIVILEGED_LOCKOUT_SECONDS = 15 * 60; // 15 minutes lockout

// In-memory revocation and brute-force tracking caches (for instance-level fallback)
const localRevokedTokens = new Map<string, number>();
const localFailedAttempts = new Map<string, { count: number; lockedUntil: number; firstSeen: number }>();

function cleanupLocalCaches() {
  const now = Date.now();
  for (const [hash, exp] of localRevokedTokens.entries()) {
    if (now > exp) localRevokedTokens.delete(hash);
  }
  for (const [key, state] of localFailedAttempts.entries()) {
    if (now > state.lockedUntil && now > state.firstSeen + PRIVILEGED_LOCKOUT_SECONDS * 1000) {
      localFailedAttempts.delete(key);
    }
  }
}

// Resolve Secret: Environment variable AUTH_SECRET or secure fallback
export function getAuthSecret(): string {
  const envSecret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL CONFIGURATION ERROR: AUTH_SECRET environment variable is missing or insecure (<16 characters) in production. Authentication operations halted.'
    );
  }
  // Deterministic local development/test application secret
  return 'scamshield-bharat-auth-salt-8f92b7c4d1e3a6f0';
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Computes deterministic SHA-256 hash of a session token for revocation lookups.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sign a payload using HMAC-SHA256.
 * Enforces a strict 2-hour TTL for administrative accounts, and 7 days for general citizen accounts.
 */
export function signSessionToken(
  user: Omit<ServerSessionPayload, 'iat' | 'exp'>,
  ttlSeconds?: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const effectiveTtl =
    ttlSeconds !== undefined
      ? ttlSeconds
      : user.role === 'admin'
      ? ADMIN_SESSION_TTL_SECONDS
      : CITIZEN_SESSION_TTL_SECONDS;

  const payload: ServerSessionPayload = {
    ...user,
    iat: now,
    exp: now + effectiveTtl,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const secret = getAuthSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

/**
 * Synchronous verification of a session token's cryptographic HMAC-SHA256 signature, expiry, and local revocation.
 */
export function verifySessionToken(token: string | null | undefined): SessionVerificationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, user: null, error: 'MISSING_TOKEN' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, user: null, error: 'MALFORMED_TOKEN' };
  }

  const tokenHash = hashSessionToken(token);
  cleanupLocalCaches();
  if (localRevokedTokens.has(tokenHash)) {
    return { valid: false, user: null, error: 'REVOKED_TOKEN' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const secret = getAuthSecret();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, user: null, error: 'INVALID_SIGNATURE' };
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: ServerSessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, user: null, error: 'EXPIRED_TOKEN' };
    }

    if (!payload.uid || !payload.role) {
      return { valid: false, user: null, error: 'INVALID_PAYLOAD' };
    }

    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, user: null, error: 'PARSE_ERROR' };
  }
}

/**
 * Asynchronous verification of session token including distributed Redis revocation checks.
 */
export async function verifySessionTokenAsync(token: string | null | undefined): Promise<SessionVerificationResult> {
  const syncResult = verifySessionToken(token);
  if (!syncResult.valid || !token) {
    return syncResult;
  }

  const isRevoked = await isSessionRevoked(token);
  if (isRevoked) {
    return { valid: false, user: null, error: 'REVOKED_TOKEN' };
  }

  return syncResult;
}

/**
 * Invalidate/Revoke a session across distributed serverless instances upon logout.
 */
export async function revokeDistributedSession(token: string | null | undefined): Promise<void> {
  if (!token || typeof token !== 'string') return;

  const tokenHash = hashSessionToken(token);
  cleanupLocalCaches();
  localRevokedTokens.set(tokenHash, Date.now() + 86400 * 1000);

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) return;
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['SET', `scamshield:revoked:${tokenHash}`, 'revoked', 'EX', 86400],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    // Non-fatal if Redis unreachable
  }
}

/**
 * Checks whether a session token has been revoked across distributed serverless instances.
 */
export async function isSessionRevoked(token: string): Promise<boolean> {
  if (!token) return true;
  const tokenHash = hashSessionToken(token);

  cleanupLocalCaches();
  if (localRevokedTokens.has(tokenHash)) {
    return true;
  }

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) return false;
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['GET', `scamshield:revoked:${tokenHash}`],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return Boolean(data?.[0]?.result);
    }
  } catch {
    // Graceful fallback
  }
  return false;
}

/**
 * Check if a privileged account or client IP is temporarily locked out due to excessive failed attempts.
 */
export async function checkAccountLockout(
  identifier: string
): Promise<{ locked: boolean; retryAfterSeconds: number }> {
  const cleanIdent = (identifier || '').toLowerCase().trim();
  if (!cleanIdent) return { locked: false, retryAfterSeconds: 0 };

  cleanupLocalCaches();
  const local = localFailedAttempts.get(cleanIdent);
  if (local && Date.now() < local.lockedUntil) {
    const remaining = Math.ceil((local.lockedUntil - Date.now()) / 1000);
    return { locked: true, retryAfterSeconds: remaining };
  }

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) {
    return { locked: false, retryAfterSeconds: 0 };
  }
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['TTL', `scamshield:auth:lock:${cleanIdent}`],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const ttl = data?.[0]?.result;
      if (typeof ttl === 'number' && ttl > 0) {
        return { locked: true, retryAfterSeconds: ttl };
      }
    }
  } catch {
    // Fall back to local ledger
  }

  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Record a failed authentication attempt on a privileged account.
 * Throttles brute-force guessing by enforcing a 15-minute lockout after 5 consecutive failures across all instances.
 */
export async function recordFailedAuthAttempt(
  identifier: string
): Promise<{ locked: boolean; attempts: number; retryAfterSeconds: number }> {
  const cleanIdent = (identifier || '').toLowerCase().trim();
  if (!cleanIdent) return { locked: false, attempts: 0, retryAfterSeconds: 0 };

  cleanupLocalCaches();
  const now = Date.now();
  let localAttempts = 1;
  const existing = localFailedAttempts.get(cleanIdent);

  if (existing && now < existing.firstSeen + PRIVILEGED_LOCKOUT_SECONDS * 1000) {
    localAttempts = existing.count + 1;
  }

  const isLocalLocked = localAttempts >= MAX_PRIVILEGED_FAILED_ATTEMPTS;
  const lockedUntil = isLocalLocked ? now + PRIVILEGED_LOCKOUT_SECONDS * 1000 : 0;

  localFailedAttempts.set(cleanIdent, {
    count: localAttempts,
    lockedUntil,
    firstSeen: existing ? existing.firstSeen : now,
  });

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) {
    return {
      locked: isLocalLocked,
      attempts: localAttempts,
      retryAfterSeconds: isLocalLocked ? PRIVILEGED_LOCKOUT_SECONDS : 0,
    };
  }

  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const failKey = `scamshield:auth:fail:${cleanIdent}`;
    const lockKey = `scamshield:auth:lock:${cleanIdent}`;

    // Atomic Lua: Increment failed count, set TTL on 1st fail, and if >= 5 set lock key
    const luaScript = `
      local c = redis.call('INCR', KEYS[1])
      if c == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      if c >= tonumber(ARGV[2]) then
        redis.call('SET', KEYS[2], 'locked', 'EX', ARGV[1])
      end
      return c
    `;

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['EVAL', luaScript, 2, failKey, lockKey, String(PRIVILEGED_LOCKOUT_SECONDS), String(MAX_PRIVILEGED_FAILED_ATTEMPTS)],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const count = data?.[0]?.result;
      if (typeof count === 'number') {
        const locked = count >= MAX_PRIVILEGED_FAILED_ATTEMPTS;
        return {
          locked,
          attempts: count,
          retryAfterSeconds: locked ? PRIVILEGED_LOCKOUT_SECONDS : 0,
        };
      }
    }
  } catch {
    // Fall back to local ledger result
  }

  return {
    locked: isLocalLocked,
    attempts: localAttempts,
    retryAfterSeconds: isLocalLocked ? PRIVILEGED_LOCKOUT_SECONDS : 0,
  };
}

/**
 * Reset failed attempts on a successful privileged login.
 */
export async function clearFailedAuthAttempts(identifier: string): Promise<void> {
  const cleanIdent = (identifier || '').toLowerCase().trim();
  if (!cleanIdent) return;

  cleanupLocalCaches();
  localFailedAttempts.delete(cleanIdent);

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) return;
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['DEL', `scamshield:auth:fail:${cleanIdent}`],
        ['DEL', `scamshield:auth:lock:${cleanIdent}`],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    // Non-fatal
  }
}

/**
 * Cryptographically Signed Guest Quota Cookie Helper
 * Ensures multiple serverless instances cannot be bypassed by client manipulating cookies
 */
export function signGuestQuotaCookie(count: number, firstSeen = Date.now(), nonce = crypto.randomBytes(8).toString('hex')): string {
  const secret = getAuthSecret();
  const data = `${count}:${firstSeen}:${nonce}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${data}.${sig}`;
}

export function verifyGuestQuotaCookie(rawCookie: string | null | undefined): { valid: boolean; count: number; firstSeen: number } {
  if (!rawCookie || typeof rawCookie !== 'string') {
    return { valid: false, count: 0, firstSeen: Date.now() };
  }

  const parts = rawCookie.split('.');
  if (parts.length !== 2) {
    return { valid: false, count: 0, firstSeen: Date.now() };
  }

  const [data, signature] = parts;
  const secret = getAuthSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, count: 0, firstSeen: Date.now() };
  }

  const [countStr, firstSeenStr] = data.split(':');
  const count = parseInt(countStr, 10);
  const firstSeen = parseInt(firstSeenStr, 10);

  if (isNaN(count) || count < 0) {
    return { valid: false, count: 0, firstSeen: Date.now() };
  }

  return { valid: true, count, firstSeen: isNaN(firstSeen) ? Date.now() : firstSeen };
}

/**
 * WebAuthn Challenge Generation & Verification
 */
export function generatePasskeyChallenge(): { challenge: string; token: string } {
  const challenge = crypto.randomBytes(32).toString('base64url');
  const secret = getAuthSecret();
  const exp = Date.now() + 5 * 60 * 1000; // 5 minute validity
  const data = `${challenge}:${exp}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return { challenge, token: `${data}.${sig}` };
}

export function verifyPasskeyChallengeToken(token: string | null | undefined, expectedChallenge: string): boolean {
  if (!token || !expectedChallenge) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [data, sig] = parts;
  const secret = getAuthSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  const [challenge, expStr] = data.split(':');
  const exp = parseInt(expStr, 10);
  if (Date.now() > exp) return false;

  return challenge === expectedChallenge;
}

/**
 * Generates a stable, privacy-preserving cryptographic hash of a client IP address.
 * Avoids persisting plain IPv4/IPv6 addresses in logs or distributed datastores.
 */
export function getPrivacyHashedIp(clientIp: string): string {
  const secret = getAuthSecret();
  return crypto.createHmac('sha256', secret).update(`scamshield-quota:${clientIp}`).digest('hex').slice(0, 32);
}

// In-memory fallback spent challenge cache with automatic TTL cleanup
const localSpentChallenges = new Map<string, number>();

function cleanupLocalSpentChallenges() {
  const now = Date.now();
  for (const [chal, exp] of localSpentChallenges.entries()) {
    if (now > exp) {
      localSpentChallenges.delete(chal);
    }
  }
}

/**
 * Attempts to atomically consume a passkey challenge in Upstash Redis via SET key consumed EX 300 NX.
 * Returns true if fresh challenge consumed (SET succeeded), false if already consumed (key exists),
 * or null if Redis is not configured.
 */
export async function consumeDistributedChallenge(challenge: string): Promise<boolean | null> {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !token) {
    return null;
  }
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['SET', `scamshield:challenge:${challenge}`, 'consumed', 'EX', 300, 'NX'],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      // Upstash REST returns [{ result: "OK" }] if key was set, or [{ result: null }] if already existed
      return data?.[0]?.result === 'OK';
    }
  } catch {
    // Redis connection error
  }
  return null;
}

/**
 * Atomically consumes a passkey challenge to guarantee single-use.
 * Rejects replay attacks even if original raw cookie and assertion are re-sent.
 */
export async function consumePasskeyChallenge(
  challenge: string,
  isPrivileged: boolean = false
): Promise<{ success: boolean; error?: string; mode: 'distributed' | 'instance_memory' }> {
  if (!challenge || typeof challenge !== 'string') {
    return { success: false, error: 'INVALID_CHALLENGE', mode: 'instance_memory' };
  }

  // Layer 1: Distributed atomic SET NX EX 300 via Redis
  const distributedResult = await consumeDistributedChallenge(challenge);

  if (distributedResult !== null) {
    if (!distributedResult) {
      return {
        success: false,
        error: 'CHALLENGE_ALREADY_CONSUMED',
        mode: 'distributed',
      };
    }
    // Record in local cache as well
    cleanupLocalSpentChallenges();
    localSpentChallenges.set(challenge, Date.now() + 300_000);
    return { success: true, mode: 'distributed' };
  }

  // Layer 2: In-memory fallback spent challenge ledger
  cleanupLocalSpentChallenges();
  if (localSpentChallenges.has(challenge)) {
    return {
      success: false,
      error: 'CHALLENGE_ALREADY_CONSUMED',
      mode: 'instance_memory',
    };
  }

  // Fail closed if privileged authentication explicitly requires distributed lock in configuration
  if (isPrivileged && process.env.REQUIRE_DISTRIBUTED_AUTH?.trim().toLowerCase() === 'true') {
    return {
      success: false,
      error: 'DISTRIBUTED_STORE_REQUIRED_FOR_PRIVILEGED_AUTH',
      mode: 'instance_memory',
    };
  }

  localSpentChallenges.set(challenge, Date.now() + 300_000);
  return { success: true, mode: 'instance_memory' };
}

/**
 * Checks whether distributed datastore credentials (Upstash Redis or Vercel KV) are present.
 */
export function isDistributedStoreConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return Boolean(url && url.trim().length > 0 && token && token.trim().length > 0);
}

/**
 * Distributed KV / Upstash Redis Store Client (REST-based)
 * Safely checks if UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN exist.
 * Uses an atomic Lua script to execute INCR and EXPIRE in a single Redis transaction.
 */
export async function incrementDistributedCounter(key: string, ttlSeconds = 86400 * 30): Promise<number | null> {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !token) {
    return null; // Distributed store not configured; fall back to signed cookie + instance memory
  }
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    // Atomic Lua script: INCR and EXPIRE executed in a single atomic transaction
    const luaScript = "local c = redis.call('INCR', KEYS[1]); if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return c;";

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['EVAL', luaScript, 1, key, String(ttlSeconds)],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const results = await res.json();
      const count = results?.[0]?.result;
      if (typeof count === 'number') {
        return count;
      }
    }
  } catch (err) {
    // Graceful fallback if Redis is unreachable or times out
  }
  return null;
}
