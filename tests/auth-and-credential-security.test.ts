import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Allow testing server-only module in Vitest Node runner
vi.mock('server-only', () => ({}));
import * as authConstants from '../src/lib/auth-constants';
import {
  signSessionToken,
  verifySessionToken,
  verifySessionTokenAsync,
  revokeDistributedSession,
  signGuestQuotaCookie,
  verifyGuestQuotaCookie,
  generatePasskeyChallenge,
  verifyPasskeyChallengeToken,
  getPrivacyHashedIp,
  isDistributedStoreConfigured,
  ADMIN_SESSION_TTL_SECONDS,
  CITIZEN_SESSION_TTL_SECONDS,
  recordFailedAuthAttempt,
  checkAccountLockout,
  clearFailedAuthAttempts,
  clearLocalAuthCaches,
} from '../src/lib/server-auth';
import {
  verifyServerPresidentPasskey,
  verifyServerAdminPasskey,
  verifyServerPresidentCredentials,
  verifyServerAdminCredentials,
  authenticatePrivilegedCredentials,
  validatePrivilegedPasskeyStrength,
  isPinOnlyCandidate,
  verifyPrivilegedAdminSession,
  MIN_PASSKEY_LENGTH_LEGACY,
  MIN_PASSKEY_LENGTH_STRONG,
} from '../src/lib/server-admin-auth';

describe('Privileged Credential & Server-Side Security Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    clearLocalAuthCaches();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Eradication of Client-Side Secrets', () => {
    it('must not export any privileged passkey or PIN from auth-constants', () => {
      const exports = Object.keys(authConstants);
      expect(exports).not.toContain('MASTER_ADMIN_PASSKEY');
      expect(exports).not.toContain('MASTER_ADMIN_PIN');
      expect(exports).not.toContain('PRESIDENT_PASSKEY');
      expect(exports).not.toContain('PRESIDENT_PIN');
      expect(exports).not.toContain('verifyAdminPasskey');
      expect(exports).not.toContain('getAdminUserForPasskey');
    });

    it('must export only non-sensitive public metadata and helpers', () => {
      expect(authConstants.PRESIDENT_USER.name).toBe('Arti (President)');
      expect(authConstants.MASTER_ADMIN_USER.name).toBe('Aryan Singh (Chief Admin)');
      expect(typeof authConstants.generateCitizenId).toBe('function');
      const citizenId = authConstants.generateCitizenId();
      expect(citizenId).toMatch(/^SSB-\d{4}-\d{5,6}$/);
    });
  });

  describe('2. Passkey Length Standards & Validation Rules', () => {
    it('must strictly reject passkeys below 12 characters', () => {
      expect(validatePrivilegedPasskeyStrength('short').valid).toBe(false);
      expect(validatePrivilegedPasskeyStrength('12345678901').valid).toBe(false); // 11 chars
      expect(validatePrivilegedPasskeyStrength('').valid).toBe(false);
    });

    it('must accept legacy configured passkeys between 12 and 31 characters but flag them as not strong', () => {
      const legacyKey = 'LegacyAdminKey2026!'; // 19 chars
      const result = validatePrivilegedPasskeyStrength(legacyKey);
      expect(result.valid).toBe(true);
      expect(result.isStrong).toBe(false);
      expect(result.reasons?.length).toBeGreaterThan(0);
    });

    it('must validate high-entropy 32+ character passkeys as strong', () => {
      // 32+ characters with uppercase, lowercase, numbers, and symbols
      const strongKey = 'SSB_Master_Admin_2026_xK9#vL2$pQ8*mZ1@wR4!';
      expect(strongKey.length).toBeGreaterThanOrEqual(MIN_PASSKEY_LENGTH_STRONG);

      const result = validatePrivilegedPasskeyStrength(strongKey);
      expect(result.valid).toBe(true);
      expect(result.isStrong).toBe(true);
      expect(result.reasons).toBeUndefined();
    });
  });

  describe('3. PIN Security & Standalone PIN Rejection', () => {
    it('must identify standalone numeric PIN candidates correctly', () => {
      expect(isPinOnlyCandidate('123456')).toBe(true);
      expect(isPinOnlyCandidate('948201')).toBe(true);
      expect(isPinOnlyCandidate('1234')).toBe(true);
      expect(isPinOnlyCandidate('12345678')).toBe(true);

      // Not PIN only
      expect(isPinOnlyCandidate('Passkey123!')).toBe(false);
      expect(isPinOnlyCandidate('123456a')).toBe(false);
      expect(isPinOnlyCandidate('1234567890')).toBe(false);
    });

    it('must NEVER allow a standalone 6-digit PIN to authenticate as Master Admin or President', () => {
      process.env.MASTER_ADMIN_PASSKEY = 'SSB_Master_Admin_2026_xK9#vL2$pQ8*mZ1@wR4!';
      process.env.MASTER_ADMIN_PIN = '948201';
      process.env.PRESIDENT_PASSKEY = 'SSB_President_Arti_2026_qW7$mB3#kP9*vT1@xL5!';
      process.env.PRESIDENT_PIN = '538192';

      // Passkey works
      expect(verifyServerAdminPasskey('SSB_Master_Admin_2026_xK9#vL2$pQ8*mZ1@wR4!')).toBe(true);
      expect(verifyServerPresidentPasskey('SSB_President_Arti_2026_qW7$mB3#kP9*vT1@xL5!')).toBe(true);

      // Standalone PIN is strictly rejected by passkey functions and default credentials verification
      expect(verifyServerAdminPasskey('948201')).toBe(false);
      expect(verifyServerPresidentPasskey('538192')).toBe(false);
      expect(verifyServerAdminCredentials('948201')).toBe(false);
      expect(verifyServerPresidentCredentials('538192')).toBe(false);

      // authenticatePrivilegedCredentials rejects with SOLE_PIN_DISALLOWED
      const adminPinAuth = authenticatePrivilegedCredentials('admin', '948201');
      expect(adminPinAuth.valid).toBe(false);
      expect(adminPinAuth.code).toBe('SOLE_PIN_DISALLOWED');

      const presPinAuth = authenticatePrivilegedCredentials('arti', '538192');
      expect(presPinAuth.valid).toBe(false);
      expect(presPinAuth.code).toBe('SOLE_PIN_DISALLOWED');
    });

    it('must enforce identity-aware throttling: attacker IP locked out without locking legitimate IP', async () => {
      const targetIdent = 'ssb-admin-0001';
      const attackerIp = '198.51.100.99';
      const legitimateIp = '203.0.113.88';

      await clearFailedAuthAttempts(targetIdent, attackerIp);
      await clearFailedAuthAttempts(targetIdent, legitimateIp);

      // Attacker attempts 5 wrong passwords from attackerIp
      for (let i = 1; i <= 5; i++) {
        const attempt = await recordFailedAuthAttempt(targetIdent, attackerIp);
        if (i === 5) {
          expect(attempt.locked).toBe(true);
        }
      }

      // Attacker IP is locked out
      const attackerLockout = await checkAccountLockout(targetIdent, attackerIp);
      expect(attackerLockout.locked).toBe(true);
      expect(attackerLockout.scope).toBe('origin');

      // Further attempts from the locked attacker IP must not increment or trigger global lock
      const postLockAttempt = await recordFailedAuthAttempt(targetIdent, attackerIp);
      expect(postLockAttempt.locked).toBe(true);
      expect(postLockAttempt.scope).toBe('origin');

      // Legitimate user on legitimateIp is NOT locked out
      const legitimateLockout = await checkAccountLockout(targetIdent, legitimateIp);
      expect(legitimateLockout.locked).toBe(false);

      // Successful login from legitimate user resets account failures
      await clearFailedAuthAttempts(targetIdent, legitimateIp);
    });

    it('must require at least 5 distinct origins to trigger a global account lockout', async () => {
      const targetIdent = `ssb-target-global-${Date.now()}`;
      await clearFailedAuthAttempts(targetIdent);

      // 4 distinct attacker IPs each attempt and fail once
      for (let i = 1; i <= 4; i++) {
        const ip = `198.51.100.${10 + i}`;
        const attempt = await recordFailedAuthAttempt(targetIdent, ip);
        expect(attempt.locked).toBe(false);
      }

      // Check account lockout from a 5th untried legitimate IP: not locked yet
      const untriedIp = '203.0.113.50';
      const checkBefore5 = await checkAccountLockout(targetIdent, untriedIp);
      expect(checkBefore5.locked).toBe(false);

      // 5th distinct IP fails
      const fifthIp = '198.51.100.15';
      const fifthAttempt = await recordFailedAuthAttempt(targetIdent, fifthIp);
      expect(fifthAttempt.locked).toBe(true);
      expect(fifthAttempt.scope).toBe('account');

      // Now global account lockout is active for all origins
      const checkAfter5 = await checkAccountLockout(targetIdent, untriedIp);
      expect(checkAfter5.locked).toBe(true);
      expect(checkAfter5.scope).toBe('account');

      // Reset
      await clearFailedAuthAttempts(targetIdent, untriedIp);
      const afterClear = await checkAccountLockout(targetIdent, untriedIp);
      expect(afterClear.locked).toBe(false);
    });
  });

  describe('4. Role Separation & Authorization', () => {
    beforeEach(() => {
      process.env.MASTER_ADMIN_PASSKEY = 'SSB_Master_Admin_2026_xK9#vL2$pQ8*mZ1@wR4!';
      process.env.PRESIDENT_PASSKEY = 'SSB_President_Arti_2026_qW7$mB3#kP9*vT1@xL5!';
    });

    it('must prevent President credentials from authenticating as Master Admin', () => {
      const auth = authenticatePrivilegedCredentials('admin', 'SSB_President_Arti_2026_qW7$mB3#kP9*vT1@xL5!');
      expect(auth.valid).toBe(false);
      expect(auth.code).toBe('INVALID_ADMIN_CREDENTIAL');
    });

    it('must prevent Master Admin credentials from authenticating as President', () => {
      const auth = authenticatePrivilegedCredentials('arti', 'SSB_Master_Admin_2026_xK9#vL2$pQ8*mZ1@wR4!');
      expect(auth.valid).toBe(false);
      expect(auth.code).toBe('INVALID_PRESIDENT_CREDENTIAL');
    });

    it('must independently authorize server administrative sessions and gate Chief-Admin-Only actions', () => {
      // 1. Missing session
      expect(verifyPrivilegedAdminSession(null).authorized).toBe(false);

      // 2. Non-admin role (e.g. investor/citizen)
      const citizenSession = {
        uid: 'SSB-2026-784210',
        name: 'Citizen Vikram',
        emailOrPhone: 'vikram@example.com',
        role: 'investor' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const citizenCheck = verifyPrivilegedAdminSession(citizenSession);
      expect(citizenCheck.authorized).toBe(false);
      expect(citizenCheck.code).toBe('FORBIDDEN_ROLE');

      // 3. Forged UID claiming admin role
      const forgedSession = {
        uid: 'SSB-FORGED-9999',
        name: 'Attacker',
        emailOrPhone: 'attacker@evil.com',
        role: 'admin' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const forgedCheck = verifyPrivilegedAdminSession(forgedSession);
      expect(forgedCheck.authorized).toBe(false);
      expect(forgedCheck.code).toBe('INVALID_ADMIN_IDENTITY');

      // 4. Chief Admin Session has full authority
      const chiefAdminSession = {
        uid: authConstants.MASTER_ADMIN_USER.uid,
        name: authConstants.MASTER_ADMIN_USER.name,
        emailOrPhone: authConstants.MASTER_ADMIN_USER.emailOrPhone,
        role: 'admin' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      expect(verifyPrivilegedAdminSession(chiefAdminSession, 'any_admin').authorized).toBe(true);
      expect(verifyPrivilegedAdminSession(chiefAdminSession, 'chief_admin').authorized).toBe(true);
      expect(verifyPrivilegedAdminSession(chiefAdminSession, 'president').authorized).toBe(false);

      // 5. President Session cannot execute Chief-Admin-Only actions
      const presidentSession = {
        uid: authConstants.PRESIDENT_USER.uid,
        name: authConstants.PRESIDENT_USER.name,
        emailOrPhone: authConstants.PRESIDENT_USER.emailOrPhone,
        role: 'admin' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      expect(verifyPrivilegedAdminSession(presidentSession, 'any_admin').authorized).toBe(true);
      expect(verifyPrivilegedAdminSession(presidentSession, 'president').authorized).toBe(true);
      expect(verifyPrivilegedAdminSession(presidentSession, 'chief_admin').authorized).toBe(false);
      expect(verifyPrivilegedAdminSession(presidentSession, 'chief_admin').code).toBe('REQUIRES_CHIEF_ADMIN');
    });
  });

  describe('5. Session Security, Lifetimes & Distributed Revocation', () => {
    it('must enforce a strict 2-hour TTL for administrative sessions and 7 days for citizen sessions', () => {
      const adminToken = signSessionToken({
        uid: authConstants.MASTER_ADMIN_USER.uid,
        name: authConstants.MASTER_ADMIN_USER.name,
        emailOrPhone: authConstants.MASTER_ADMIN_USER.emailOrPhone,
        role: 'admin',
        verified: true,
      });

      const citizenToken = signSessionToken({
        uid: 'SSB-2026-CITIZEN',
        name: 'Normal Citizen',
        emailOrPhone: 'citizen@example.com',
        role: 'investor',
        verified: true,
      });

      const adminPayload = verifySessionToken(adminToken).user!;
      const citizenPayload = verifySessionToken(citizenToken).user!;

      const adminDuration = adminPayload.exp - adminPayload.iat;
      const citizenDuration = citizenPayload.exp - citizenPayload.iat;

      expect(adminDuration).toBe(ADMIN_SESSION_TTL_SECONDS); // 7200 seconds (2 hours)
      expect(citizenDuration).toBe(CITIZEN_SESSION_TTL_SECONDS); // 604800 seconds (7 days)

      // Verify signed 16-byte (32-char hex) unique jti
      expect(adminPayload.jti).toBeDefined();
      expect(adminPayload.jti?.length).toBe(32); // 16 bytes = 32 hex chars
      expect(citizenPayload.jti).toBeDefined();
      expect(citizenPayload.jti?.length).toBe(32);
      expect(adminPayload.jti).not.toBe(citizenPayload.jti);
    });

    it('must invalidate sessions upon logout revocation across simulated instances', async () => {
      // Simulate Instance A: User logs in and receives token
      const token = signSessionToken({
        uid: authConstants.MASTER_ADMIN_USER.uid,
        name: authConstants.MASTER_ADMIN_USER.name,
        emailOrPhone: authConstants.MASTER_ADMIN_USER.emailOrPhone,
        role: 'admin',
        verified: true,
      });

      expect(verifySessionToken(token).valid).toBe(true);

      // Simulate Instance B: User calls logout -> revokes session
      await revokeDistributedSession(token);

      // Simulate Instance C: Replay of token is strictly rejected
      const resSync = verifySessionToken(token);
      expect(resSync.valid).toBe(false);
      expect(resSync.error).toBe('REVOKED_TOKEN');

      const resAsync = await verifySessionTokenAsync(token);
      expect(resAsync.valid).toBe(false);
      expect(resAsync.error).toBe('REVOKED_TOKEN');
    });

    it('must fail closed for privileged session when REQUIRE_DISTRIBUTED_AUTH=true and Redis is offline', async () => {
      process.env.REQUIRE_DISTRIBUTED_AUTH = 'true';
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const adminToken = signSessionToken({
        uid: authConstants.MASTER_ADMIN_USER.uid,
        name: authConstants.MASTER_ADMIN_USER.name,
        emailOrPhone: authConstants.MASTER_ADMIN_USER.emailOrPhone,
        role: 'admin',
        verified: true,
      });

      const citizenToken = signSessionToken({
        uid: 'SSB-2026-CITIZEN',
        name: 'Normal Citizen',
        emailOrPhone: 'citizen@example.com',
        role: 'investor',
        verified: true,
      });

      // Privileged admin session fails closed with DISTRIBUTED_STORE_REQUIRED
      const adminRes = await verifySessionTokenAsync(adminToken);
      expect(adminRes.valid).toBe(false);
      expect(adminRes.error).toBe('DISTRIBUTED_STORE_REQUIRED');

      // Citizen session gracefully validates locally without failure
      const citizenRes = await verifySessionTokenAsync(citizenToken);
      expect(citizenRes.valid).toBe(true);
      expect(citizenRes.user?.role).toBe('investor');
    });

    it('must reject tampered token signatures', () => {
      const user = {
        uid: 'SSB-2026-TEST02',
        name: 'Test Citizen',
        emailOrPhone: 'citizen@test.live',
        role: 'investor' as const,
        verified: true,
      };

      const token = signSessionToken(user, 3600);
      const [header, payload, sig] = token.split('.');
      const forgedSig = sig.slice(0, -4) + 'AAAA';
      const tamperedToken = `${header}.${payload}.${forgedSig}`;

      const res = verifySessionToken(tamperedToken);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('INVALID_SIGNATURE');
    });

    it('must reject tampered token payload (privilege escalation attempt)', () => {
      const user = {
        uid: 'SSB-2026-TEST03',
        name: 'Normal User',
        emailOrPhone: 'user@test.live',
        role: 'guest' as const,
        verified: false,
      };

      const token = signSessionToken(user, 3600);
      const [header, payload, sig] = token.split('.');

      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
      decoded.role = 'admin';
      const forgedPayload = Buffer.from(JSON.stringify(decoded)).toString('base64').replace(/=/g, '');
      const tamperedToken = `${header}.${forgedPayload}.${sig}`;

      const res = verifySessionToken(tamperedToken);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('INVALID_SIGNATURE');
    });

    it('must reject expired tokens', () => {
      const user = {
        uid: 'SSB-2026-EXPIRED',
        name: 'Expired User',
        emailOrPhone: 'expired@test.live',
        role: 'investor' as const,
        verified: true,
      };

      const token = signSessionToken(user, -10);
      const res = verifySessionToken(token);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('EXPIRED_TOKEN');
    });
  });

  describe('6. Guest Quota Tamper-Proof Cookie Verification', () => {
    it('must correctly sign and verify guest quota cookies', () => {
      const cookie = signGuestQuotaCookie(3);
      const res = verifyGuestQuotaCookie(cookie);
      expect(res.valid).toBe(true);
      expect(res.count).toBe(3);
    });

    it('must reject client tampering with scan count', () => {
      const cookie = signGuestQuotaCookie(4);
      const [data, sig] = cookie.split('.');
      const [count, firstSeen, nonce] = data.split(':');

      const tamperedData = `0:${firstSeen}:${nonce}`;
      const forgedCookie = `${tamperedData}.${sig}`;

      const res = verifyGuestQuotaCookie(forgedCookie);
      expect(res.valid).toBe(false);
      expect(res.count).toBe(0);
    });
  });

  describe('7. WebAuthn Challenge Single-Use Integrity', () => {
    it('must generate valid cryptographic challenge and token', () => {
      const { challenge, token } = generatePasskeyChallenge();
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(20);
      expect(verifyPasskeyChallengeToken(token, challenge)).toBe(true);
    });

    it('must reject challenge token with mismatched challenge value', () => {
      const { token } = generatePasskeyChallenge();
      expect(verifyPasskeyChallengeToken(token, 'attacker-chosen-challenge-value')).toBe(false);
    });
  });

  describe('8. Privacy Hashed IP & Distributed Store Config', () => {
    it('must produce deterministic, irreversible privacy hashes for IP addresses', () => {
      const hash1 = getPrivacyHashedIp('203.0.113.195');
      const hash2 = getPrivacyHashedIp('203.0.113.195');
      const hashOther = getPrivacyHashedIp('198.51.100.44');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashOther);
      expect(hash1).not.toContain('203.0.113.195');
      expect(hash1.length).toBe(32);
    });

    it('must correctly report whether distributed store credentials exist', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;

      expect(isDistributedStoreConfigured()).toBe(false);

      process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock_token';
      expect(isDistributedStoreConfigured()).toBe(true);
    });
  });
});
