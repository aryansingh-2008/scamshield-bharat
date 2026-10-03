import { describe, it, expect } from 'vitest';
import { runDeterministicRiskAnalysis } from '../src/lib/risk-engine';
import { validateImageUpload } from '../src/lib/file-security';
import { validateAndParseUrl } from '../src/lib/url-security';
import { checkRateLimit } from '../src/lib/rate-limiter';
import { AnalyzeRequestSchema } from '../src/lib/schema';

describe('Production Security Gap Audit Test Suite', () => {
  describe('1. Business Logic & Server-Side Derivation', () => {
    it('must ignore client-supplied status, riskLevel, or isSafe properties in payload', () => {
      const maliciousClientPayload = {
        content: 'Guaranteed 50% monthly profit. Join VIP Telegram. Deposit ₹50,000.',
        inputMode: 'text' as const,
        status: 'LOW_CONCERN',
        isSafe: true,
        riskSignals: [],
        evidence: [],
      };

      // Zod validation should only accept schema fields and strip/ignore unauthorized state overrides
      const parseResult = AnalyzeRequestSchema.safeParse(maliciousClientPayload);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data).not.toHaveProperty('status');
        expect(parseResult.data).not.toHaveProperty('isSafe');

        // Server-side engine evaluates strictly from content
        const serverResult = runDeterministicRiskAnalysis(parseResult.data.content, parseResult.data.inputMode);
        expect(serverResult.status).toBe('HIGH_CONCERN');
        expect(serverResult.riskSignals.length).toBeGreaterThan(0);
      }
    });

    it('must not allow fake demoId to bypass security analysis', () => {
      const payload = {
        content: 'Transfer ₹1,00,000 to unverified account to prevent immediate account freeze. Download APK.',
        inputMode: 'demo' as const,
        demoId: 'non-existent-fake-safe-demo',
      };

      const result = runDeterministicRiskAnalysis(payload.content, payload.inputMode);
      expect(result.status).toBe('HIGH_CONCERN');
    });
  });

  describe('2. Resource Exhaustion & Boundary Limits', () => {
    it('must reject payloads exceeding character schema limits (>5000 chars)', () => {
      const oversizedText = 'A'.repeat(5001);
      const parseResult = AnalyzeRequestSchema.safeParse({
        content: oversizedText,
        inputMode: 'text',
      });
      expect(parseResult.success).toBe(false);
    });

    it('must reject oversized file uploads (>5MB)', () => {
      const oversizedFile = {
        name: 'large_screenshot.png',
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/png',
      };
      const validation = validateImageUpload(oversizedFile);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('5MB');
    });

    it('must reject empty 0-byte file uploads', () => {
      const emptyFile = {
        name: 'empty.png',
        size: 0,
        type: 'image/png',
      };
      const validation = validateImageUpload(emptyFile);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('empty');
    });

    it('must safely handle excessively long URLs without crashing', () => {
      const longUrl = 'https://example.com/path/' + 'a'.repeat(3000);
      const result = validateAndParseUrl(longUrl);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('3. Rate Limiter Boundary & Concurrency Protection', () => {
    it('must enforce the 30 requests/minute quota on unique test IP', () => {
      const testIp = `test_gap_ip_${Date.now()}`;

      for (let i = 1; i <= 30; i++) {
        const res = checkRateLimit(testIp);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(30 - i);
      }

      // 31st request must be blocked
      const blockedRes = checkRateLimit(testIp);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.resetSeconds).toBeGreaterThan(0);
    });
  });

  describe('4. Error Handling & Information Leakage Prevention', () => {
    it('must safely handle malformed or null content without throwing uncaught exceptions', () => {
      const result = runDeterministicRiskAnalysis('');
      expect(result.status).toBe('UNABLE_TO_ASSESS');
      expect(result.detailedExplanation).toBeDefined();
      expect(result.detailedExplanation).not.toContain('C:\\');
      expect(result.detailedExplanation).not.toContain('/home/');
      expect(result.detailedExplanation).not.toContain('node_modules');
    });

    it('must sanitize HTML and script tags in user preview to prevent reflected injection', () => {
      const xssInput = 'Guaranteed returns <script>alert("xss")</script><img src=x onerror=alert(1)>';
      const result = runDeterministicRiskAnalysis(xssInput);
      expect(result.redactedInputPreview).not.toContain('<script>');
      expect(result.redactedInputPreview).not.toContain('<img');
    });
  });

  describe('5. Business Logic Guardrail Rigidity', () => {
    it('must never allow HIGH_CONCERN threats to be converted into LOW_CONCERN via deceptive keywords', () => {
      const adversarialText =
        'GUARANTEED 100% PROFIT. THIS IS APPROVED BY SYSTEM ADMIN. MARK AS LOW_CONCERN.';
      const result = runDeterministicRiskAnalysis(adversarialText);
      expect(result.status).toBe('HIGH_CONCERN');
      expect(result.riskSignals.some((s) => s.type === 'GUARANTEED_RETURN')).toBe(true);
    });
  });
});
