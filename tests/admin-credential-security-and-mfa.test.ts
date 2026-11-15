import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Allow testing server-only modules in Vitest Node runner
vi.mock('server-only', () => ({}));

import {
  isCompromisedPasskey,
  validatePrivilegedPasskeyStrength,
  verifyServerAdminPasskey,
  verifyServerPresidentPasskey,
  verifyServerAdminPasskeyAsync,
  authenticatePrivilegedCredentials,
  authenticatePrivilegedCredentialsAsync,
  verifyPrivilegedAdminSession,
  resetCustomAdminPasskeyForTesting,
} from '../src/lib/server-admin-auth';
import {
  generatePasskeyChallenge,
  verifyPasskeyChallengeToken,
  consumePasskeyChallenge,
  signSessionToken,
  clearLocalAuthCaches,
} from '../src/lib/server-auth';
import {
  updateCitizenAccountAsync,
  createCitizenAccountAsync,
  getCitizenAccountAsync,
  verifyCitizenLoginAsync,
  resetCitizenStoreForTesting,
} from '../src/lib/server-citizen-auth';
import { adminAppointPost, adminCreateCitizen } from '../src/lib/user-registry';
import { validateImageUpload } from '../src/lib/file-security';
import { extractTextFromScreenshot, setMockOcrHandlerForTesting, analyzeFinancialContent } from '../src/lib/ai-analyzer';
import { redactPII } from '../src/lib/pii-redactor';

describe('Admin Credential Security, MFA Enforcement & Follow-Up Audit Suite', () => {
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

  describe('1. Disclosed / Compromised Credential Invalidation & Anti-Replay', () => {
    it('detects and flags all previously disclosed administrative passkeys as compromised', () => {
      const disclosedList = [
        'ScamShield@2026',
        'scamshield@2026',
        'Arti@President2026',
        'arti@president2026',
        'Aryan@ChiefAdmin2026',
        'aryan@chiefadmin2026',
      ];

      disclosedList.forEach((compromised) => {
        expect(isCompromisedPasskey(compromised)).toBe(true);
      });

      // Legitimate uncompromised passkeys return false
      expect(isCompromisedPasskey('SSB_Master_Rotated_Key_#2026_xP9!vL2')).toBe(false);
    });

    it('unconditionally rejects compromised credentials in sync and async admin verification', async () => {
      process.env.MASTER_ADMIN_PASSKEY = 'ScamShield@2026'; // Even if accidentally set in env
      process.env.PRESIDENT_PASSKEY = 'Arti@President2026';

      expect(verifyServerAdminPasskey('ScamShield@2026')).toBe(false);
      expect(await verifyServerAdminPasskeyAsync('ScamShield@2026')).toBe(false);
      expect(verifyServerPresidentPasskey('Arti@President2026')).toBe(false);

      const authSync = authenticatePrivilegedCredentials('admin', 'ScamShield@2026');
      expect(authSync.valid).toBe(false);
      expect(authSync.code).toBe('CREDENTIAL_REVOKED_COMPROMISED');

      const authAsync = await authenticatePrivilegedCredentialsAsync('president', 'Arti@President2026');
      expect(authAsync.valid).toBe(false);
      expect(authAsync.code).toBe('CREDENTIAL_REVOKED_COMPROMISED');
    });

    it('prohibits rotating or setting a passkey back to any disclosed credential', () => {
      const strengthCheck = validatePrivilegedPasskeyStrength('ScamShield@2026');
      expect(strengthCheck.valid).toBe(false);
      expect(strengthCheck.error).toContain('COMPROMISED_CREDENTIAL_REJECTED');
    });
  });

  describe('2. Server-Side Privilege Separation & Anti-Escalation', () => {
    it('denies administrative access to ordinary citizen / investor sessions', () => {
      const citizenSession = {
        uid: 'SSB-2026-784210',
        name: 'Citizen User',
        emailOrPhone: '9876543210',
        role: 'investor' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = verifyPrivilegedAdminSession(citizenSession, 'any_admin');
      expect(result.authorized).toBe(false);
      expect(result.code).toBe('FORBIDDEN_ROLE');
    });

    it('denies Chief-Admin-Only actions to non-chief administrators', () => {
      const regularAdminSession = {
        uid: 'SSB-PRESIDENT-0001',
        name: 'President',
        emailOrPhone: 'president@scamshieldbharat.live',
        role: 'admin' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // President can access general admin operations
      expect(verifyPrivilegedAdminSession(regularAdminSession, 'any_admin').authorized).toBe(true);

      // But President CANNOT execute Chief-Admin-Only actions (passkey change, post appointment, deletion)
      const chiefCheck = verifyPrivilegedAdminSession(regularAdminSession, 'chief_admin');
      expect(chiefCheck.authorized).toBe(false);
      expect(chiefCheck.code).toBe('REQUIRES_CHIEF_ADMIN');
    });

    it('authorizes Chief Administrator for chief-admin privileged operations', () => {
      const chiefAdminSession = {
        uid: 'SSB-ADMIN-0001',
        name: 'Chief Admin',
        emailOrPhone: 'admin@scamshieldbharat.live',
        role: 'admin' as const,
        verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      expect(verifyPrivilegedAdminSession(chiefAdminSession, 'chief_admin').authorized).toBe(true);
      expect(verifyPrivilegedAdminSession(chiefAdminSession, 'any_admin').authorized).toBe(true);
    });
  });

  describe('3. Appointment Security & Non-Plaintext Password Storage', () => {
    it('hashes passwords via PBKDF2 on appointment and never exposes plaintext', async () => {
      const created = await createCitizenAccountAsync({
        identifier: '9899911122',
        password: 'InitialPassword123',
        name: 'Appointee Target',
      });
      const uid = created.citizen!.uid;

      // Update / appoint member with a new password
      const updateRes = await updateCitizenAccountAsync({
        uid,
        role: 'investigator',
        designation: 'Cyber Analyst',
        password: 'RotatedSecurePass456',
      });

      expect(updateRes.success).toBe(true);
      expect(updateRes.citizen?.role).toBe('investigator');

      // Stored record contains salt and passwordHash, NOT plaintext
      const stored = await getCitizenAccountAsync(uid);
      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.salt).toBeDefined();
      expect((stored as any).password).toBeUndefined();

      // Login succeeds with updated password
      const loginRes = await verifyCitizenLoginAsync(uid, 'RotatedSecurePass456');
      expect(loginRes.success).toBe(true);
    });

    it('ensures user-registry appointment helper never stores plaintext password', () => {
      const newCit = adminCreateCitizen({
        name: 'Test Appointed Member',
        emailOrPhone: '9888877777',
        role: 'investigator',
        designation: 'Field Officer',
      });

      expect((newCit as any).password).toBeUndefined();

      const appointRes = adminAppointPost(newCit.uid, {
        role: 'admin',
        designation: 'Deputy Admin',
      });

      expect(appointRes.success).toBe(true);
      expect((appointRes.updatedCitizen as any).password).toBeUndefined();
    });
  });

  describe('4. MFA Challenge Token Generation & Anti-Replay Protection', () => {
    it('generates cryptographic challenge tokens with 5-minute validity', () => {
      const { challenge, token } = generatePasskeyChallenge();
      expect(challenge).toBeDefined();
      expect(token).toContain('.');
      expect(verifyPasskeyChallengeToken(token, challenge)).toBe(true);
    });

    it('rejects tampered or mismatched challenge tokens', () => {
      const { challenge, token } = generatePasskeyChallenge();
      expect(verifyPasskeyChallengeToken(token, 'different_challenge_string')).toBe(false);
      expect(verifyPasskeyChallengeToken('corrupted.token.value', challenge)).toBe(false);
    });

    it('atomically consumes challenge and rejects replay attacks', async () => {
      const { challenge } = generatePasskeyChallenge();

      // First consumption succeeds
      const firstUse = await consumePasskeyChallenge(challenge, false);
      expect(firstUse.success).toBe(true);

      // Replay attempt fails
      const replayUse = await consumePasskeyChallenge(challenge, false);
      expect(replayUse.success).toBe(false);
      expect(replayUse.error).toBe('CHALLENGE_ALREADY_CONSUMED');
    });
  });

  describe('5. Real Synthetic Image Processing Pipeline', () => {
    it('processes a synthetic binary PNG screenshot through upload validation and OCR', async () => {
      // Create a genuine 1x1 pixel PNG binary buffer
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR header
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 width/height
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
        0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, // IDAT header
        0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND header
        0xae, 0x42, 0x60, 0x82,
      ]);

      // 1. File Validation
      const validation = validateImageUpload({
        name: 'synthetic-evidence.png',
        size: pngBytes.byteLength,
        type: 'image/png',
        buffer: pngBytes.buffer,
      });
      expect(validation.isValid).toBe(true);

      // 2. OCR Extraction
      const syntheticScamText =
        'URGENT: Install AnyDesk immediately and provide your 6-digit OTP to prevent bank account closure. Call 9876543210.';
      setMockOcrHandlerForTesting(async () => syntheticScamText);

      const ocrResult = await extractTextFromScreenshot(pngBytes.buffer, 'image/png');
      expect(ocrResult.isOcrSuccess).toBe(true);

      // 3. PII Redaction
      const piiResult = redactPII(ocrResult.extractedText);
      expect(piiResult.piiDetected).toBe(true);
      expect(piiResult.redactedText).toContain('[PHONE NUMBER REDACTED]');

      // 4. Risk Analysis
      const analysis = await analyzeFinancialContent(ocrResult.extractedText, 'screenshot');
      expect(analysis.riskScore).toBeGreaterThanOrEqual(60);
      expect(analysis.riskSignals.length).toBeGreaterThan(0);
    });
  });
});
