import { describe, it, expect, beforeEach, vi } from 'vitest';

// Allow testing server-only module in Vitest Node runner
vi.mock('server-only', () => ({}));

import { normalizeCitizenIdentifier } from '../src/lib/auth-constants';
import {
  hashCitizenPassword,
  verifyCitizenPassword,
  createCitizenAccountAsync,
  verifyCitizenLoginAsync,
  getCitizenAccountAsync,
  resetCitizenStoreForTesting,
} from '../src/lib/server-citizen-auth';

describe('Citizen UID Stability and Strict Authentication Suite', () => {
  beforeEach(() => {
    resetCitizenStoreForTesting();
  });

  describe('1. Canonical Indian Mobile & Identifier Normalization', () => {
    it('normalizes various Indian mobile formats to canonical 10-digit number', () => {
      const inputs = [
        '9876543210',
        '+91 98765 43210',
        '+91-98765-43210',
        '+919876543210',
        '919876543210',
        '09876543210',
        ' 9876543210 ',
      ];

      inputs.forEach((input) => {
        expect(normalizeCitizenIdentifier(input)).toBe('9876543210');
      });
    });

    it('normalizes email addresses to trimmed lowercase', () => {
      expect(normalizeCitizenIdentifier('  Citizen.User@Domain.Com  ')).toBe('citizen.user@domain.com');
    });

    it('normalizes Citizen UIDs to trimmed uppercase', () => {
      expect(normalizeCitizenIdentifier('  ssb-2026-892147  ')).toBe('SSB-2026-892147');
    });

    it('preserves and maps official administrative aliases to canonical roles', () => {
      expect(normalizeCitizenIdentifier('ADMIN')).toBe('admin');
      expect(normalizeCitizenIdentifier('Aryan')).toBe('admin');
      expect(normalizeCitizenIdentifier('Arti')).toBe('president');
      expect(normalizeCitizenIdentifier('President')).toBe('president');
    });
  });

  describe('2. Strict Case-Sensitive PBKDF2 Password Verification', () => {
    it('authenticates exact password match with PBKDF2 and random salt', () => {
      const { salt, hash } = hashCitizenPassword('Ashwini');
      expect(verifyCitizenPassword('Ashwini', salt, hash)).toBe(true);
    });

    it('strictly rejects case variation (Ashwini vs ashwini)', () => {
      const { salt, hash } = hashCitizenPassword('Ashwini');
      expect(verifyCitizenPassword('ashwini', salt, hash)).toBe(false);
      expect(verifyCitizenPassword('ASHWINI', salt, hash)).toBe(false);
    });

    it('strictly rejects incorrect or empty passwords', () => {
      const { salt, hash } = hashCitizenPassword('Secret@2026');
      expect(verifyCitizenPassword('Secret@2025', salt, hash)).toBe(false);
      expect(verifyCitizenPassword('', salt, hash)).toBe(false);
      expect(verifyCitizenPassword('   ', salt, hash)).toBe(false);
    });
  });

  describe('3. Account Creation, Immutable UID, and Login Invariance', () => {
    it('creates an account with a stable Citizen UID', async () => {
      const res = await createCitizenAccountAsync({
        identifier: '+91 98765 43210',
        password: 'AshwiniPassword123',
        name: 'Ashwini Sharma',
      });

      expect(res.success).toBe(true);
      expect(res.citizen).toBeDefined();
      expect(res.citizen?.uid).toMatch(/^SSB-2026-\d{6}$/);
      expect(res.citizen?.normalizedIdentifier).toBe('9876543210');
      expect(res.citizen?.credits).toBe(3);
    });

    it('prevents duplicate account creation for the same normalized mobile number', async () => {
      await createCitizenAccountAsync({
        identifier: '9876543210',
        password: 'PasswordOne123',
        name: 'First Signup',
      });

      const duplicateRes = await createCitizenAccountAsync({
        identifier: '+91 98765 43210',
        password: 'PasswordTwo456',
        name: 'Second Signup',
      });

      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.error).toContain('already exists');
    });

    it('preserves the exact same Citizen UID across multiple logins with different input formats', async () => {
      const created = await createCitizenAccountAsync({
        identifier: '+91 98765 43210',
        password: 'AshwiniSecurePass',
        name: 'Ashwini',
      });
      const originalUid = created.citizen!.uid;

      // Login attempt 1: with plain 10-digit number
      const login1 = await verifyCitizenLoginAsync('9876543210', 'AshwiniSecurePass');
      expect(login1.success).toBe(true);
      expect(login1.citizen?.uid).toBe(originalUid);

      // Login attempt 2: with +91 prefix
      const login2 = await verifyCitizenLoginAsync('+91 98765 43210', 'AshwiniSecurePass');
      expect(login2.success).toBe(true);
      expect(login2.citizen?.uid).toBe(originalUid);

      // Login attempt 3: with leading 0
      const login3 = await verifyCitizenLoginAsync('09876543210', 'AshwiniSecurePass');
      expect(login3.success).toBe(true);
      expect(login3.citizen?.uid).toBe(originalUid);

      // Login attempt 4: with UID itself
      const login4 = await verifyCitizenLoginAsync(originalUid, 'AshwiniSecurePass');
      expect(login4.success).toBe(true);
      expect(login4.citizen?.uid).toBe(originalUid);
    });

    it('rejects login with incorrect password case without modifying account state', async () => {
      await createCitizenAccountAsync({
        identifier: '9876543210',
        password: 'Ashwini',
        name: 'Ashwini',
      });

      // Wrong case
      const wrongCase = await verifyCitizenLoginAsync('9876543210', 'ashwini');
      expect(wrongCase.success).toBe(false);
      expect(wrongCase.error).toContain('Passwords are case-sensitive');

      // Correct case succeeds
      const rightCase = await verifyCitizenLoginAsync('9876543210', 'Ashwini');
      expect(rightCase.success).toBe(true);
    });

    it('never silently creates an account during login of an unregistered user', async () => {
      const unknownLogin = await verifyCitizenLoginAsync('9999988888', 'SomePassword123');
      expect(unknownLogin.success).toBe(false);

      const checkAccount = await getCitizenAccountAsync('9999988888');
      expect(checkAccount).toBeNull();
    });
  });
});
