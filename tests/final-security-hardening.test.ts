import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Allow testing server-only modules in Vitest Node runner
vi.mock('server-only', () => ({}));

import {
  hashCitizenPassword,
  verifyCitizenPassword,
  verifyCitizenPasswordWithMigration,
  createCitizenAccountAsync,
  updateCitizenAccountAsync,
  verifyCitizenLoginAsync,
  getCitizenAccountAsync,
  resetCitizenStoreForTesting,
  OWASP_RECOMMENDED_PBKDF2_ITERATIONS,
  LEGACY_PBKDF2_ITERATIONS,
  RESERVED_EXECUTIVE_IDENTIFIERS,
} from '../src/lib/server-citizen-auth';
import {
  verifyPrivilegedAdminSession,
  isCompromisedPasskey,
  resetCustomAdminPasskeyForTesting,
} from '../src/lib/server-admin-auth';
import {
  generatePasskeyChallenge,
  verifyPasskeyChallengeToken,
  consumePasskeyChallenge,
  clearLocalAuthCaches,
} from '../src/lib/server-auth';
import { extractTextFromScreenshot, setMockOcrHandlerForTesting, analyzeFinancialContent } from '../src/lib/ai-analyzer';
import { redactPII } from '../src/lib/pii-redactor';
import { validateImageUpload } from '../src/lib/file-security';

describe('Final Security Hardening Audit Suite (OWASP, Chief Admin Binding, WebAuthn & Image Privacy)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    clearLocalAuthCaches();
    resetCustomAdminPasskeyForTesting();
    resetCitizenStoreForTesting();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    clearLocalAuthCaches();
    resetCustomAdminPasskeyForTesting();
    setMockOcrHandlerForTesting(null);
  });

  // ========================================================
  // AREA 1: IMAGE PRIVACY & OCR EXTRACTION AUDIT
  // ========================================================
  describe('Area 1: Image Privacy & OCR PII Redaction Pipeline', () => {
    it('verifies that extracted OCR text is sanitized and redacted before downstream analysis', async () => {
      const syntheticScamWithPII =
        'URGENT NOTICE: Transfer ₹5,000 to SBI officer at 9876543210 or user@okhdfcbank to prevent immediate power disconnection.';

      setMockOcrHandlerForTesting(async () => syntheticScamWithPII);

      const fakeBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      const ocrResult = await extractTextFromScreenshot(fakeBuffer, 'image/png');
      expect(ocrResult.isOcrSuccess).toBe(true);

      // Verify PII Redaction executes on the extracted text
      const pii = redactPII(ocrResult.extractedText);
      expect(pii.piiDetected).toBe(true);
      expect(pii.redactedText).toContain('[PHONE NUMBER REDACTED]');
      expect(pii.redactedText).toContain('[UPI ID REDACTED]');
      expect(pii.redactedText).not.toContain('9876543210');
      expect(pii.redactedText).not.toContain('user@okhdfcbank');

      // Verify Risk Engine analysis handles the content
      const analysis = await analyzeFinancialContent(ocrResult.extractedText, 'screenshot');
      expect(analysis.piiRedacted).toBe(true);
      expect(analysis.riskSignals.length).toBeGreaterThan(0);
    });

    it('rejects empty or unreadable images and handles failures gracefully without false positives', async () => {
      setMockOcrHandlerForTesting(async () => '');

      const emptyBuffer = new ArrayBuffer(0);
      const res = await extractTextFromScreenshot(emptyBuffer, 'image/png');
      expect(res.isOcrSuccess).toBe(false);
      expect(res.extractedText).toBe('');
    });
  });

  // ========================================================
  // AREA 2: PASSWORD HASHING (OWASP 600K WORK FACTOR & MIGRATION)
  // ========================================================
  describe('Area 2: OWASP Password Hashing & Transparent Migration', () => {
    it('hashes passwords using OWASP recommended 600,000 iterations by default', () => {
      const { salt, hash, iterations } = hashCitizenPassword('StrongPassword@2026');
      expect(iterations).toBe(OWASP_RECOMMENDED_PBKDF2_ITERATIONS);
      expect(salt.length).toBe(32); // 16 bytes hex
      expect(hash.length).toBe(64); // 32 bytes hex SHA-256
      expect(verifyCitizenPassword('StrongPassword@2026', salt, hash)).toBe(true);
      expect(verifyCitizenPassword('wrongpass', salt, hash)).toBe(false);
    });

    it('seamlessly authenticates legacy 100,000 iteration accounts and detects need for rehash', () => {
      // Create a legacy hash with 100,000 iterations
      const legacy = hashCitizenPassword('LegacyPassword@2025', undefined, LEGACY_PBKDF2_ITERATIONS);
      expect(legacy.iterations).toBe(100000);

      // Verify with migration checker
      const check = verifyCitizenPasswordWithMigration(
        'LegacyPassword@2025',
        legacy.salt,
        legacy.hash,
        LEGACY_PBKDF2_ITERATIONS
      );
      expect(check.valid).toBe(true);
      expect(check.needsRehash).toBe(true); // Flagged for transparent upgrade!
    });

    it('transparently migrates legacy account to 600,000 iterations on successful login', async () => {
      // 1. Manually seed account with legacy 100,000 iteration hash
      const legacy = hashCitizenPassword('MySecretPass@123', undefined, LEGACY_PBKDF2_ITERATIONS);
      const created = await createCitizenAccountAsync({
        identifier: '9870011223',
        password: 'TemporaryPass123',
      });
      const account = created.citizen!;
      account.passwordHash = legacy.hash;
      account.salt = legacy.salt;
      account.iterations = LEGACY_PBKDF2_ITERATIONS;

      // 2. Perform login with valid password
      const loginRes = await verifyCitizenLoginAsync('9870011223', 'MySecretPass@123');
      expect(loginRes.success).toBe(true);

      // 3. Verify that stored account in datastore was transparently upgraded to 600,000 iterations!
      const updatedAccount = await getCitizenAccountAsync('9870011223');
      expect(updatedAccount?.iterations).toBe(OWASP_RECOMMENDED_PBKDF2_ITERATIONS);
      expect(updatedAccount?.passwordHash).not.toBe(legacy.hash); // Hash updated to 600k work factor!

      // 4. Verify subsequent login succeeds with upgraded 600k hash
      const nextLogin = await verifyCitizenLoginAsync('9870011223', 'MySecretPass@123');
      expect(nextLogin.success).toBe(true);
    });
  });

  // ========================================================
  // AREA 3: CHIEF ADMIN IDENTITY BINDING & ANTI-ESCALATION
  // ========================================================
  describe('Area 3: Chief Admin Identity Binding & Anti-Escalation', () => {
    it('prohibits public registration from claiming reserved administrative identifiers', async () => {
      for (const reserved of RESERVED_EXECUTIVE_IDENTIFIERS) {
        const res = await createCitizenAccountAsync({
          identifier: reserved,
          password: 'AttemptPassword@123',
          name: 'Imposter',
        });
        expect(res.success).toBe(false);
        expect(res.code).toBe('RESERVED_IDENTIFIER');
      }
    });

    it('prohibits public registration from self-assigning admin role', async () => {
      const res = await createCitizenAccountAsync({
        identifier: '9812345678',
        password: 'ValidPassword@123',
        name: 'Normal User',
        role: 'admin' as any, // Attacker attempts to pass admin role in payload
      });
      expect(res.success).toBe(true);
      // System forces investor role
      expect(res.citizen?.role).toBe('investor');
    });

    it('strictly protects Chief Admin account (SSB-ADMIN-0001) from unauthorized mutation or demotion', async () => {
      const attempt = await updateCitizenAccountAsync({
        uid: 'SSB-ADMIN-0001',
        role: 'investor', // Attempted demotion
        password: 'HackedPassword@123',
      });
      expect(attempt.success).toBe(false);
      expect(attempt.error).toContain('immutable and protected');
    });

    it('rejects ordinary citizen session attempting administrative operations (Citizen-to-Admin Escalation)', () => {
      const citizenSession = {
        uid: 'SSB-2026-999999',
        name: 'Ordinary Citizen',
        emailOrPhone: 'citizen@example.com',
        role: 'investor' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const check = verifyPrivilegedAdminSession(citizenSession, 'any_admin');
      expect(check.authorized).toBe(false);
      expect(check.code).toBe('FORBIDDEN_ROLE');
    });

    it('rejects non-chief admin session attempting Chief-Admin-Only actions (Admin-to-Chief-Admin Escalation)', () => {
      const regularAdminSession = {
        uid: 'SSB-PRESIDENT-0001',
        name: 'President User',
        emailOrPhone: 'president@scamshieldbharat.live',
        role: 'admin' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Allowed for general admin operations
      expect(verifyPrivilegedAdminSession(regularAdminSession, 'any_admin').authorized).toBe(true);

      // FORBIDDEN for Chief Admin exclusive operations
      const escalationAttempt = verifyPrivilegedAdminSession(regularAdminSession, 'chief_admin');
      expect(escalationAttempt.authorized).toBe(false);
      expect(escalationAttempt.code).toBe('REQUIRES_CHIEF_ADMIN');
    });
  });

  // ========================================================
  // AREA 4: WEBAUTHN CEREMONY & ANTI-REPLAY
  // ========================================================
  describe('Area 4: WebAuthn Challenge Lifecycle & Anti-Replay Validation', () => {
    it('issues cryptographically signed challenge token bound to 5-minute expiry', () => {
      const { challenge, token } = generatePasskeyChallenge();
      expect(challenge).toBeDefined();
      expect(verifyPasskeyChallengeToken(token, challenge)).toBe(true);
    });

    it('rejects expired challenge tokens', () => {
      const { challenge } = generatePasskeyChallenge();
      const pastExp = Date.now() - 1000; // 1 second in the past
      const fakeToken = `${challenge}:${pastExp}.fakesignature`;
      expect(verifyPasskeyChallengeToken(fakeToken, challenge)).toBe(false);
    });

    it('rejects forged challenge tokens with invalid HMAC signatures', () => {
      const { challenge, token } = generatePasskeyChallenge();
      const parts = token.split('.');
      const forgedToken = `${parts[0]}.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`;
      expect(verifyPasskeyChallengeToken(forgedToken, challenge)).toBe(false);
    });

    it('enforces single-use challenge consumption and rejects replay attacks', async () => {
      const { challenge } = generatePasskeyChallenge();

      // First use: Valid
      const firstConsumption = await consumePasskeyChallenge(challenge, false);
      expect(firstConsumption.success).toBe(true);

      // Immediate Replay: Rejected
      const replayAttempt = await consumePasskeyChallenge(challenge, false);
      expect(replayAttempt.success).toBe(false);
      expect(replayAttempt.error).toBe('CHALLENGE_ALREADY_CONSUMED');
    });
  });
});
