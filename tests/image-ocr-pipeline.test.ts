import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  extractTextFromScreenshot,
  setMockOcrHandlerForTesting,
  analyzeFinancialContent,
} from '../src/lib/ai-analyzer';
import { validateImageUpload } from '../src/lib/file-security';
import { redactPII } from '../src/lib/pii-redactor';

describe('Image OCR and Multimodal Scam Detection Pipeline Suite', () => {
  afterEach(() => {
    setMockOcrHandlerForTesting(null);
  });

  describe('1. Image Validation & MIME Type Security', () => {
    it('validates supported image types (JPEG, PNG, WebP) within size limit', () => {
      const validPng = validateImageUpload({
        name: 'suspicious-message.png',
        size: 1024 * 500, // 500 KB
        type: 'image/png',
      });
      expect(validPng.isValid).toBe(true);

      const validJpg = validateImageUpload({
        name: 'bill-photo.jpg',
        size: 1024 * 1024 * 2, // 2 MB
        type: 'image/jpeg',
      });
      expect(validJpg.isValid).toBe(true);
    });

    it('rejects dangerous files disguised as images', () => {
      const dangerousApk = validateImageUpload({
        name: 'malware.apk',
        size: 1024 * 100,
        type: 'application/vnd.android.package-archive',
      });
      expect(dangerousApk.isValid).toBe(false);
      expect(dangerousApk.error).toContain('cannot be uploaded');

      const dangerousExe = validateImageUpload({
        name: 'trojan.exe',
        size: 1024 * 100,
        type: 'application/x-msdownload',
      });
      expect(dangerousExe.isValid).toBe(false);
    });

    it('rejects empty or oversized files', () => {
      const emptyFile = validateImageUpload({
        name: 'empty.png',
        size: 0,
        type: 'image/png',
      });
      expect(emptyFile.isValid).toBe(false);
      expect(emptyFile.error).toContain('empty');

      const oversizedFile = validateImageUpload({
        name: 'large.png',
        size: 10 * 1024 * 1024, // 10MB > 5MB limit
        type: 'image/png',
      });
      expect(oversizedFile.isValid).toBe(false);
      expect(oversizedFile.error).toContain('exceeds the 5MB size limit');
    });
  });

  describe('2. Screenshot Buffer Extraction and OCR Pipeline', () => {
    it('rejects empty buffers before calling OCR engine', async () => {
      const emptyBuffer = new ArrayBuffer(0);
      const res = await extractTextFromScreenshot(emptyBuffer, 'image/png');
      expect(res.isOcrSuccess).toBe(false);
      expect(res.extractedText).toBe('');
    });

    it('extracts text from screenshot buffer via OCR handler', async () => {
      const scamNotice =
        'URGENT NOTICE: Dear customer, your SBI YONO account will be blocked today due to pending PAN KYC. Update immediately at http://sbi-kyc-update-portal.top/login to avoid suspension.';

      setMockOcrHandlerForTesting(async (_buffer, mimeType) => {
        expect(mimeType).toBe('image/png');
        return scamNotice;
      });

      const fakeBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      const ocrResult = await extractTextFromScreenshot(fakeBuffer, 'image/png');

      expect(ocrResult.isOcrSuccess).toBe(true);
      expect(ocrResult.extractedText).toBe(scamNotice);
    });

    it('passes extracted OCR text through PII redaction and detects high risk scams', async () => {
      const scamNotice =
        'URGENT NOTICE: Dear Ashwini, install AnyDesk to verify your pending electricity KYC. Share your 6-digit OTP immediately and pay ₹ 4,800 to officer at 9876543210 or bit.ly/power-bill to avoid disconnection tonight.';

      setMockOcrHandlerForTesting(async () => scamNotice);

      const fakeBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      const ocrResult = await extractTextFromScreenshot(fakeBuffer, 'image/png');

      // 1. Redact PII
      const redacted = redactPII(ocrResult.extractedText);
      expect(redacted.piiDetected).toBe(true);
      expect(redacted.redactedText).toContain('[PHONE NUMBER REDACTED]');

      // 2. Risk Engine Analysis
      const analysis = await analyzeFinancialContent(ocrResult.extractedText, 'screenshot');
      expect(analysis.riskScore).toBeGreaterThanOrEqual(60);
      expect(analysis.status).toBeDefined();
      expect(analysis.headlineSummary).toBeDefined();
      expect(analysis.riskSignals.length).toBeGreaterThan(0);
    });

    it('reports failure when image has no legible text without reporting false success', async () => {
      setMockOcrHandlerForTesting(async () => '');

      const fakeBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      const ocrResult = await extractTextFromScreenshot(fakeBuffer, 'image/png');

      expect(ocrResult.isOcrSuccess).toBe(false);
      expect(ocrResult.extractedText).toBe('');
    });
  });
});
