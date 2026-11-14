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
  jti?: string; // Unique 16-byte Cryptographic JWT Token ID
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

// Identity-Aware & Origin-Aware Throttling Limits
export const ORIGIN_FAILED_ATTEMPTS_LIMIT = 5; // A single origin IP is locked after 5 failed attempts
export const GLOBAL_DISTINCT_ORIGINS_LIMIT = 5; // Global account lock requires failed attempts from 5 distinct origins
export const PRIVILEGED_LOCKOUT_SECONDS = 15 * 60; // 15 minutes lockout duration

// In-memory revocation and brute-force tracking caches (for instance-level fallback)
const localRevokedTokens = new Map<string, number>();
const localIpFailures = new Map<string, { count: number; lockedUntil: number; firstSeen: number }>();
const localAccountIpFailures = new Map<string, { count: number; lockedUntil: number; firstSeen: number }>();
const localGlobalAccountOrigins = new Map<string, { origins: Set<string>; lockedUntil: number; firstSeen: number }>();
const localSpentChallenges = new Map<string, number>();

export function clearLocalAuthCaches(): void {
  localRevokedTokens.clear();
  localIpFailures.clear();
  localAccountIpFailures.clear();
  localGlobalAccountOrigins.clear();
  localSpentChallenges.clear();
}

function cleanupLocalCaches() {
  const now = Date.now();
  for (const [hash, exp] of localRevokedTokens.entries()) {
    if (now > exp) localRevokedTokens.delete(hash);
  }
  for (const [key, state] of localIpFailures.entries()) {
    if (now > state.lockedUntil && now > state.firstSeen + PRIVILEGED_LOCKOUT_SECONDS * 1000) {
      localIpFailures.delete(key);
    }
  }
  for (const [key, state] of localAccountIpFailures.entries()) {
    if (now > state.lockedUntil && now > state.firstSeen + PRIVILEGED_LOCKOUT_SECONDS * 1000) {
      localAccountIpFailures.delete(key);
    }
  }
  for (const [key, state] of localGlobalAccountOrigins.entries()) {
    if (now > state.lockedUntil && now > state.firstSeen + PRIVILEGED_LOCKOUT_SECONDS * 1000) {
      localGlobalAccountOrigins.delete(key);
    }
  }
  for (const [chal, exp] of localSpentChallenges.entries()) {
    if (now > exp) {
      localSpentChallenges.delete(chal);
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
 * Injects 16 cryptographically random bytes (128-bit entropy) for unique token identity (jti).
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
    jti: crypto.randomBytes(16).toString('hex'),
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
 * Checks distributed revocation status across serverless instances via Upstash Redis.
 * Returns:
 * - 'REVOKED' if token hash is found in revocation ledger
 * - 'NOT_REVOKED' if confirmed fresh by distributed store
 * - 'DISTRIBUTED_STORE_UNAVAILABLE' if Redis is offline/unreachable or unconfigured
 */
export async function checkDistributedRevocationStatus(
  token: string
): Promise<'REVOKED' | 'NOT_REVOKED' | 'DISTRIBUTED_STORE_UNAVAILABLE'> {
  if (!token) return 'REVOKED';
  const tokenHash = hashSessionToken(token);

  cleanupLocalCaches();
  if (localRevokedTokens.has(tokenHash)) {
    return 'REVOKED';
  }

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) {
    return 'DISTRIBUTED_STORE_UNAVAILABLE';
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
        ['GET', `scamshield:revoked:${tokenHash}`],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const isRevoked = Boolean(data?.[0]?.result);
      return isRevoked ? 'REVOKED' : 'NOT_REVOKED';
    }
  } catch {
    // Redis unreachable or timed out
  }

  return 'DISTRIBUTED_STORE_UNAVAILABLE';
}

/**
 * Asynchronous verification of session token including distributed Redis revocation checks.
 *
 * CRITICAL FAIL-CLOSED ENFORCEMENT:
 * - If user.role === 'admin' and REQUIRE_DISTRIBUTED_AUTH=true, Redis unavailability
 *   strictly FAILS CLOSED with error 'DISTRIBUTED_STORE_REQUIRED'.
 * - Non-privileged users gracefully fall back to local token signature validity.
 */
export async function verifySessionTokenAsync(token: string | null | undefined): Promise<SessionVerificationResult> {
  const syncResult = verifySessionToken(token);
  if (!syncResult.valid || !token) {
    return syncResult;
  }

  const isPrivileged = syncResult.user?.role === 'admin';
  const requireDistributed = process.env.REQUIRE_DISTRIBUTED_AUTH?.trim().toLowerCase() === 'true';

  const revocationStatus = await checkDistributedRevocationStatus(token);

  if (revocationStatus === 'REVOKED') {
    return { valid: false, user: null, error: 'REVOKED_TOKEN' };
  }

  if (revocationStatus === 'DISTRIBUTED_STORE_UNAVAILABLE' && isPrivileged && requireDistributed) {
    return { valid: false, user: null, error: 'DISTRIBUTED_STORE_REQUIRED' };
  }

  return syncResult;
}

/**
 * Invalidate/Revoke a session across distributed serverless instances upon logout.
 * Calculates remaining token TTL and stores revocation in Redis for at least the remaining lifetime.
 */
export async function revokeDistributedSession(token: string | null | undefined): Promise<void> {
  if (!token || typeof token !== 'string') return;

  const tokenHash = hashSessionToken(token);
  const parts = token.split('.');
  let remainingTtl = CITIZEN_SESSION_TTL_SECONDS; // Default 7 days fallback

  if (parts.length === 3) {
    try {
      const payloadJson = base64UrlDecode(parts[1]);
      const payload = JSON.parse(payloadJson);
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && typeof payload.exp === 'number') {
        remainingTtl = Math.max(payload.exp - now, 60);
      }
    } catch {
      // Fall back to default duration
    }
  }

  cleanupLocalCaches();
  localRevokedTokens.set(tokenHash, Date.now() + remainingTtl * 1000);

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
        ['SET', `scamshield:revoked:${tokenHash}`, 'revoked', 'EX', remainingTtl],
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
  const status = await checkDistributedRevocationStatus(token);
  return status === 'REVOKED';
}

/**
 * Check if a privileged account or client IP is temporarily locked out due to excessive failed attempts.
 * Prevents account Denial-of-Service attacks by isolating malicious client IPs while preserving legitimate access.
 */
export async function checkAccountLockout(
  identifier: string,
  clientIp: string = '127.0.0.1'
): Promise<{ locked: boolean; retryAfterSeconds: number; scope?: 'origin' | 'account' }> {
  const cleanIdent = (identifier || '').toLowerCase().trim();
  const hashedIp = getPrivacyHashedIp(clientIp);
  const now = Date.now();

  cleanupLocalCaches();

  // 1. Check local in-memory locks (fallback)
  const localIpLock = localIpFailures.get(hashedIp);
  if (localIpLock && now < localIpLock.lockedUntil) {
    const remaining = Math.ceil((localIpLock.lockedUntil - now) / 1000);
    return { locked: true, retryAfterSeconds: remaining, scope: 'origin' };
  }

  const localAcctIpLock = cleanIdent ? localAccountIpFailures.get(`${cleanIdent}:${hashedIp}`) : null;
  if (localAcctIpLock && now < localAcctIpLock.lockedUntil) {
    const remaining = Math.ceil((localAcctIpLock.lockedUntil - now) / 1000);
    return { locked: true, retryAfterSeconds: remaining, scope: 'origin' };
  }

  const localGlobalLock = cleanIdent ? localGlobalAccountOrigins.get(cleanIdent) : null;
  if (localGlobalLock && now < localGlobalLock.lockedUntil) {
    const remaining = Math.ceil((localGlobalLock.lockedUntil - now) / 1000);
    return { locked: true, retryAfterSeconds: remaining, scope: 'account' };
  }

  // 2. Check distributed Redis locks
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) {
    return { locked: false, retryAfterSeconds: 0 };
  }
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const ipLockKey = `scamshield:auth:lock:ip:${hashedIp}`;
    const acctIpLockKey = cleanIdent ? `scamshield:auth:lock:acct_ip:${cleanIdent}:${hashedIp}` : null;
    const globalLockKey = cleanIdent ? `scamshield:auth:lock:global:${cleanIdent}` : null;

    const commands: any[] = [['TTL', ipLockKey]];
    if (acctIpLockKey) commands.push(['TTL', acctIpLockKey]);
    if (globalLockKey) commands.push(['TTL', globalLockKey]);

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const ipTtl = data?.[0]?.result;
      if (typeof ipTtl === 'number' && ipTtl > 0) {
        return { locked: true, retryAfterSeconds: ipTtl, scope: 'origin' };
      }

      if (acctIpLockKey) {
        const acctIpTtl = data?.[1]?.result;
        if (typeof acctIpTtl === 'number' && acctIpTtl > 0) {
          return { locked: true, retryAfterSeconds: acctIpTtl, scope: 'origin' };
        }
      }

      if (globalLockKey) {
        const globalIdx = acctIpLockKey ? 2 : 1;
        const globalTtl = data?.[globalIdx]?.result;
        if (typeof globalTtl === 'number' && globalTtl > 0) {
          return { locked: true, retryAfterSeconds: globalTtl, scope: 'account' };
        }
      }
    }
  } catch {
    // Fall back to local ledger
  }

  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Record a failed authentication attempt with Identity-Aware & Origin-Aware Throttling.
 *
 * Attack-Resistance Design:
 * 1. Attacker attempting brute-force from IP X locks out IP X after 5 failures.
 * 2. Once an IP is locked, further attempts from that IP are immediately dropped and CANNOT increment global counters.
 * 3. Legitimate user logging in from distinct IP Y is NOT locked out by IP X's failures.
 * 4. Global account lock requires distributed failures across 5 distinct origins (Sets of hashed IPs).
 * 5. All counters updated atomically in Upstash Redis via a single Lua script.
 */
export async function recordFailedAuthAttempt(
  identifier: string,
  clientIp: string = '127.0.0.1'
): Promise<{ locked: boolean; attempts: number; retryAfterSeconds: number; scope?: 'origin' | 'account' }> {
  const cleanIdent = (identifier || '').toLowerCase().trim();
  const hashedIp = getPrivacyHashedIp(clientIp);
  const now = Date.now();

  cleanupLocalCaches();

  // Check if IP or Account+IP is already locked in local memory: if so, do NOT increment any counters
  const existingIpLock = localIpFailures.get(hashedIp);
  if (existingIpLock && now < existingIpLock.lockedUntil) {
    const remaining = Math.ceil((existingIpLock.lockedUntil - now) / 1000);
    return { locked: true, attempts: ORIGIN_FAILED_ATTEMPTS_LIMIT, retryAfterSeconds: remaining, scope: 'origin' };
  }

  if (cleanIdent) {
    const acctIpKey = `${cleanIdent}:${hashedIp}`;
    const existingAcctIpLock = localAccountIpFailures.get(acctIpKey);
    if (existingAcctIpLock && now < existingAcctIpLock.lockedUntil) {
      const remaining = Math.ceil((existingAcctIpLock.lockedUntil - now) / 1000);
      return { locked: true, attempts: ORIGIN_FAILED_ATTEMPTS_LIMIT, retryAfterSeconds: remaining, scope: 'origin' };
    }
  }

  // Update local memory state
  const ipState = localIpFailures.get(hashedIp) || { count: 0, lockedUntil: 0, firstSeen: now };
  const newIpCount = ipState.count + 1;
  const isIpLocked = newIpCount >= ORIGIN_FAILED_ATTEMPTS_LIMIT;
  localIpFailures.set(hashedIp, {
    count: newIpCount,
    lockedUntil: isIpLocked ? now + PRIVILEGED_LOCKOUT_SECONDS * 1000 : 0,
    firstSeen: ipState.firstSeen,
  });

  let newAcctIpCount = 1;
  if (cleanIdent) {
    const acctIpKey = `${cleanIdent}:${hashedIp}`;
    const acctIpState = localAccountIpFailures.get(acctIpKey) || { count: 0, lockedUntil: 0, firstSeen: now };
    newAcctIpCount = acctIpState.count + 1;
    const isAcctIpLocked = newAcctIpCount >= ORIGIN_FAILED_ATTEMPTS_LIMIT;
    localAccountIpFailures.set(acctIpKey, {
      count: newAcctIpCount,
      lockedUntil: isAcctIpLocked ? now + PRIVILEGED_LOCKOUT_SECONDS * 1000 : 0,
      firstSeen: acctIpState.firstSeen,
    });

    // Add to distinct origins set for account
    const globalState = localGlobalAccountOrigins.get(cleanIdent) || {
      origins: new Set<string>(),
      lockedUntil: 0,
      firstSeen: now,
    };
    globalState.origins.add(hashedIp);
    const isGlobalLocked = globalState.origins.size >= GLOBAL_DISTINCT_ORIGINS_LIMIT;
    if (isGlobalLocked) {
      globalState.lockedUntil = now + PRIVILEGED_LOCKOUT_SECONDS * 1000;
    }
    localGlobalAccountOrigins.set(cleanIdent, globalState);

    if (isGlobalLocked) {
      return {
        locked: true,
        attempts: globalState.origins.size,
        retryAfterSeconds: PRIVILEGED_LOCKOUT_SECONDS,
        scope: 'account',
      };
    }
  }

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) {
    const locked = isIpLocked || newAcctIpCount >= ORIGIN_FAILED_ATTEMPTS_LIMIT;
    return {
      locked,
      attempts: Math.max(newIpCount, newAcctIpCount),
      retryAfterSeconds: locked ? PRIVILEGED_LOCKOUT_SECONDS : 0,
      scope: 'origin',
    };
  }

  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const ipFailKey = `scamshield:auth:fail:ip:${hashedIp}`;
    const ipLockKey = `scamshield:auth:lock:ip:${hashedIp}`;
    const acctIpFailKey = `scamshield:auth:fail:acct_ip:${cleanIdent}:${hashedIp}`;
    const acctIpLockKey = `scamshield:auth:lock:acct_ip:${cleanIdent}:${hashedIp}`;
    const globalOriginsKey = `scamshield:auth:origins:${cleanIdent}`;
    const globalLockKey = `scamshield:auth:lock:global:${cleanIdent}`;

    // Atomic Lua Script:
    // 1. Check if IP or Account+IP is already locked; if so, exit without incrementing global origins!
    // 2. Increment Origin fail counter; lock if >= originThresh
    // 3. Increment Account+IP fail counter; lock if >= originThresh
    // 4. Add distinct origin to Account Origins Set
    // 5. Global lock ONLY if distinct origins >= distinctOriginThresh
    const luaScript = `
      local ttl = tonumber(ARGV[1])
      local originThresh = tonumber(ARGV[2])
      local distinctOriginThresh = tonumber(ARGV[3])
      local clientHashedIp = ARGV[4]

      if redis.call('EXISTS', KEYS[2]) == 1 or redis.call('EXISTS', KEYS[4]) == 1 then
        local remTtl = redis.call('TTL', KEYS[2])
        if remTtl <= 0 then remTtl = redis.call('TTL', KEYS[4]) end
        return { originThresh, originThresh, 0, 1, remTtl }
      end

      local ipC = redis.call('INCR', KEYS[1])
      if ipC == 1 then redis.call('EXPIRE', KEYS[1], ttl) end
      if ipC >= originThresh then redis.call('SET', KEYS[2], 'locked', 'EX', ttl) end

      local acctIpC = redis.call('INCR', KEYS[3])
      if acctIpC == 1 then redis.call('EXPIRE', KEYS[3], ttl) end
      if acctIpC >= originThresh then redis.call('SET', KEYS[4], 'locked', 'EX', ttl) end

      redis.call('SADD', KEYS[5], clientHashedIp)
      if redis.call('TTL', KEYS[5]) <= 0 then redis.call('EXPIRE', KEYS[5], ttl) end
      local distinctCount = redis.call('SCARD', KEYS[5])

      if distinctCount >= distinctOriginThresh then
        redis.call('SET', KEYS[6], 'locked', 'EX', ttl)
      end

      local isOriginLocked = (ipC >= originThresh or acctIpC >= originThresh) and 1 or 0
      local isGlobalLocked = (distinctCount >= distinctOriginThresh) and 1 or 0
      local isLocked = (isOriginLocked == 1 or isGlobalLocked == 1) and 1 or 0

      return { ipC, acctIpC, distinctCount, isLocked, ttl }
    `;

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        [
          'EVAL',
          luaScript,
          6,
          ipFailKey,
          ipLockKey,
          acctIpFailKey,
          acctIpLockKey,
          globalOriginsKey,
          globalLockKey,
          String(PRIVILEGED_LOCKOUT_SECONDS),
          String(ORIGIN_FAILED_ATTEMPTS_LIMIT),
          String(GLOBAL_DISTINCT_ORIGINS_LIMIT),
          hashedIp,
        ],
      ]),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const results = data?.[0]?.result;
      if (Array.isArray(results) && results.length >= 4) {
        const ipC = Number(results[0]);
        const acctIpC = Number(results[1]);
        const distinctOrigins = Number(results[2]);
        const isLocked = Number(results[3]) === 1;
        const remTtl = Number(results[4]) || PRIVILEGED_LOCKOUT_SECONDS;

        const isGlobal = distinctOrigins >= GLOBAL_DISTINCT_ORIGINS_LIMIT;

        return {
          locked: isLocked,
          attempts: Math.max(ipC, acctIpC),
          retryAfterSeconds: isLocked ? remTtl : 0,
          scope: isGlobal ? 'account' : isLocked ? 'origin' : undefined,
        };
      }
    }
  } catch {
    // Fall back to local ledger
  }

  const locked = isIpLocked || newAcctIpCount >= ORIGIN_FAILED_ATTEMPTS_LIMIT;
  return {
    locked,
    attempts: Math.max(newIpCount, newAcctIpCount),
    retryAfterSeconds: locked ? PRIVILEGED_LOCKOUT_SECONDS : 0,
    scope: 'origin',
  };
}

/**
 * Reset failed attempts on a successful privileged login.
 * Clears account-level and IP-level failure keys.
 */
export async function clearFailedAuthAttempts(
  identifier: string,
  clientIp: string = '127.0.0.1'
): Promise<void> {
  const cleanIdent = (identifier || '').toLowerCase().trim();
  const hashedIp = getPrivacyHashedIp(clientIp);

  cleanupLocalCaches();
  localIpFailures.delete(hashedIp);
  if (cleanIdent) {
    localAccountIpFailures.delete(`${cleanIdent}:${hashedIp}`);
    localGlobalAccountOrigins.delete(cleanIdent);
  }

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) return;
  const url = rawUrl.trim().replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const commands: any[] = [
      ['DEL', `scamshield:auth:fail:ip:${hashedIp}`],
      ['DEL', `scamshield:auth:lock:ip:${hashedIp}`],
    ];

    if (cleanIdent) {
      commands.push(
        ['DEL', `scamshield:auth:fail:acct_ip:${cleanIdent}:${hashedIp}`],
        ['DEL', `scamshield:auth:lock:acct_ip:${cleanIdent}:${hashedIp}`],
        ['DEL', `scamshield:auth:origins:${cleanIdent}`],
        ['DEL', `scamshield:auth:lock:global:${cleanIdent}`]
      );
    }

    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
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

/**
 * Attempts to atomically consume a passkey challenge in Upstash Redis via SET key consumed EX 300 NX.
 * Returns true if fresh challenge consumed (SET succeeded), false if already consumed (key exists),
 * or null if Redis is not configured.
 */
export async function consumeDistributedChallenge(challenge: string): Promise<boolean | null> {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) {
    return null;
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
    cleanupLocalCaches();
    localSpentChallenges.set(challenge, Date.now() + 300_000);
    return { success: true, mode: 'distributed' };
  }

  // Layer 2: In-memory fallback spent challenge ledger
  cleanupLocalCaches();
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
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!rawUrl || !redisToken) {
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
        Authorization: `Bearer ${redisToken}`,
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
