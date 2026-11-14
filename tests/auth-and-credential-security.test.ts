import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Allow testing server-only module in Vitest Node runner
vi.mock('server-only', () => ({}));
import * as authConstants from '../src/lib/auth-constants';
import {
  signSessionToken,
  verifySessionToken,
  signGuestQuotaCookie,
  verifyGuestQuotaCookie,
  generatePasskeyChallenge,
  verifyPasskeyChallengeToken,
  getPrivacyHashedIp,
  isDistributedStoreConfigured,
} from '../src/lib/server-auth';
import {
  verifyServerPresidentCredentials,
  verifyServerAdminCredentials,
  authenticatePrivilegedCredentials,
} from '../src/lib/server-admin-auth';

describe('Privileged Credential & Server-Side Security Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
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

  describe('2. Server-Only Privileged Credential Verification', () => {
    it('must fail closed when server environment variables are missing', () => {
      delete process.env.MASTER_ADMIN_PASSKEY;
      delete process.env.MASTER_ADMIN_PIN;
      delete process.env.PRESIDENT_PASSKEY;
      delete process.env.PRESIDENT_PIN;

      expect(verifyServerAdminCredentials('SomeSecret123!')).toBe(false);
      expect(verifyServerPresidentCredentials('SomeSecret123!')).toBe(false);

      const authResult = authenticatePrivilegedCredentials('admin', 'SomeSecret123!');
      expect(authResult.valid).toBe(false);
      expect(authResult.user).toBeNull();
    });

    it('must reject all legacy compromised credentials even when server is configured', () => {
      process.env.MASTER_ADMIN_PASSKEY = 'SecureRotatedKey2026!AdminX';
      process.env.MASTER_ADMIN_PIN = '948201';
      process.env.PRESIDENT_PASSKEY = 'SecureRotatedKey2026!PresY';
      process.env.PRESIDENT_PIN = '538192';

      const legacyCreds = [
        '[REDACTED_MOCK_PASSKEY]',
        '789012',
        '[REDACTED_MOCK_PASSKEY]',
        '654321',
      ];

      for (const cred of legacyCreds) {
        expect(verifyServerAdminCredentials(cred)).toBe(false);
        expect(verifyServerPresidentCredentials(cred)).toBe(false);
        expect(authenticatePrivilegedCredentials('admin', cred).valid).toBe(false);
        expect(authenticatePrivilegedCredentials('arti', cred).valid).toBe(false);
      }
    });

    it('must accept newly configured rotated credentials and verify role mapping', () => {
      process.env.MASTER_ADMIN_PASSKEY = 'SecureRotatedKey2026!AdminX';
      process.env.MASTER_ADMIN_PIN = '948201';
      process.env.PRESIDENT_PASSKEY = 'SecureRotatedKey2026!PresY';
      process.env.PRESIDENT_PIN = '538192';

      // Admin verification
      expect(verifyServerAdminCredentials('SecureRotatedKey2026!AdminX')).toBe(true);
      expect(verifyServerAdminCredentials('948201')).toBe(true);
      expect(verifyServerAdminCredentials('WrongPassword123!')).toBe(false);

      // President verification
      expect(verifyServerPresidentCredentials('SecureRotatedKey2026!PresY')).toBe(true);
      expect(verifyServerPresidentCredentials('538192')).toBe(true);
      expect(verifyServerPresidentCredentials('WrongPassword123!')).toBe(false);

      // Unified authentication
      const adminAuth = authenticatePrivilegedCredentials('admin', 'SecureRotatedKey2026!AdminX');
      expect(adminAuth.valid).toBe(true);
      expect(adminAuth.user?.uid).toBe(authConstants.MASTER_ADMIN_USER.uid);
      expect(adminAuth.user?.role).toBe('admin');

      const presAuth = authenticatePrivilegedCredentials('arti', 'SecureRotatedKey2026!PresY');
      expect(presAuth.valid).toBe(true);
      expect(presAuth.user?.uid).toBe(authConstants.PRESIDENT_USER.uid);
      expect(presAuth.user?.role).toBe('admin');
    });

    it('must enforce minimum entropy limits on configured credentials', () => {
      // Passkey too short (< 12 chars)
      process.env.MASTER_ADMIN_PASSKEY = 'shortKey';
      expect(verifyServerAdminCredentials('shortKey')).toBe(false);

      // PIN too short (< 6 chars)
      process.env.MASTER_ADMIN_PIN = '123';
      expect(verifyServerAdminCredentials('123')).toBe(false);
    });
  });

  describe('3. Session Token HMAC Integrity & Tampering Resistance', () => {
    it('must sign and verify valid session tokens', () => {
      const user = {
        uid: 'SSB-2026-TEST01',
        name: 'Test Citizen',
        emailOrPhone: 'citizen@test.live',
        role: 'investor' as const,
        verified: true,
      };

      const token = signSessionToken(user, 3600);
      const res = verifySessionToken(token);
      expect(res.valid).toBe(true);
      expect(res.user?.uid).toBe('SSB-2026-TEST01');
      expect(res.user?.role).toBe('investor');
    });

    it('must reject tampered token signatures', () => {
      const user = {
        uid: 'SSB-2026-TEST02',
        name: 'Test Citizen',
        emailOrPhone: 'citizen@test.live',
        role: 'investor' as const,
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
      };

      const token = signSessionToken(user, 3600);
      const [header, payload, sig] = token.split('.');

      // Decode payload, modify role to admin, and re-encode
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
      };

      // Set negative TTL so it is already expired
      const token = signSessionToken(user, -10);
      const res = verifySessionToken(token);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('EXPIRED_TOKEN');
    });
  });

  describe('4. Guest Quota Tamper-Proof Cookie Verification', () => {
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

      // Attempt to reset count from 4 to 0
      const tamperedData = `0:${firstSeen}:${nonce}`;
      const forgedCookie = `${tamperedData}.${sig}`;

      const res = verifyGuestQuotaCookie(forgedCookie);
      expect(res.valid).toBe(false);
      expect(res.count).toBe(0); // Safely returns 0 invalid
    });
  });

  describe('5. WebAuthn Challenge Single-Use Integrity', () => {
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

  describe('6. Privacy Hashed IP & Distributed Store Config', () => {
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
