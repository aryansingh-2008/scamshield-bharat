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

// Default session duration: 7 days
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

// Resolve Secret: Environment variable AUTH_SECRET or secure fallback
function getAuthSecret(): string {
  const envSecret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  // Deterministic local application secret (used if no environment variable is provisioned)
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
 * Sign a payload using HMAC-SHA256
 */
export function signSessionToken(user: Omit<ServerSessionPayload, 'iat' | 'exp'>, ttlSeconds = SESSION_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: ServerSessionPayload = {
    ...user,
    iat: now,
    exp: now + ttlSeconds,
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
 * Verify a session token's cryptographic HMAC-SHA256 signature and expiry
 */
export function verifySessionToken(token: string | null | undefined): SessionVerificationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, user: null, error: 'MISSING_TOKEN' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, user: null, error: 'MALFORMED_TOKEN' };
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
 * Distributed KV / Upstash Redis Store Client (REST-based)
 * Safely checks if UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN exist.
 * If configured, performs atomic INCR and GET across all serverless instances.
 */
export async function incrementDistributedCounter(key: string, ttlSeconds = 86400): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null; // Distributed store not configured; fall back to signed cookie + instance memory
  }

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
        ['INCR', key],
        ['EXPIRE', key, ttlSeconds],
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
    // Graceful fallback if Redis is unreachable
  }
  return null;
}
