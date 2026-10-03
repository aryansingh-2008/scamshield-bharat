import { describe, it, expect } from 'vitest';
import { runDeterministicRiskAnalysis } from '../src/lib/risk-engine';
import { DEMO_SCENARIOS } from '../src/lib/demo-scenarios';

describe('ScamShield Risk Engine Unit Tests', () => {
  it('should detect GUARANTEED_RETURN and flag HIGH_CONCERN for 30% monthly return promises', () => {
    const input = 'Join our exclusive club. Guaranteed 30% monthly returns. Deposit ₹50,000 today.';
    const result = runDeterministicRiskAnalysis(input);

    expect(result.status).toBe('HIGH_CONCERN');
    const signalTypes = result.riskSignals.map((s) => s.type);
    expect(signalTypes).toContain('GUARANTEED_RETURN');
    expect(signalTypes).toContain('MONEY_TRANSFER');
    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it('should detect FAKE_KYC_CLAIM and FEAR_THREAT for account suspension SMS', () => {
    const input = 'Your KYC will expire tonight. Your trading account will be suspended. Verify immediately.';
    const result = runDeterministicRiskAnalysis(input);

    expect(result.status).toBe('HIGH_CONCERN');
    const signalTypes = result.riskSignals.map((s) => s.type);
    expect(signalTypes).toContain('FAKE_KYC_CLAIM');
    expect(signalTypes).toContain('FEAR_THREAT');
    expect(signalTypes).toContain('URGENCY');
  });

  it('should detect REMOTE_ACCESS and APK_INSTALLATION for support app requests', () => {
    const input = 'Your account requires verification. Install this remote support APK. Our representative will guide you.';
    const result = runDeterministicRiskAnalysis(input);

    expect(result.status).toBe('HIGH_CONCERN');
    const signalTypes = result.riskSignals.map((s) => s.type);
    expect(signalTypes).toContain('REMOTE_ACCESS');
    expect(signalTypes).toContain('APK_INSTALLATION');
    expect(signalTypes).toContain('IMPERSONATION');
  });

  it('should detect OTP_REQUEST and PIN_REQUEST with CRITICAL severity', () => {
    const input = 'Please enter your UPI PIN to receive money and share the 6-digit OTP with customer service.';
    const result = runDeterministicRiskAnalysis(input);

    expect(result.status).toBe('HIGH_CONCERN');
    const signalTypes = result.riskSignals.map((s) => s.type);
    expect(signalTypes).toContain('OTP_REQUEST');
    expect(signalTypes).toContain('PIN_REQUEST');
  });

  it('should evaluate clean neutral educational content as LOW_CONCERN', () => {
    const input = 'Mutual funds are subject to market risks. Read all scheme related documents carefully before investing.';
    const result = runDeterministicRiskAnalysis(input);

    expect(result.status).toBe('LOW_CONCERN');
    expect(result.riskSignals.length).toBe(0);
  });

  it('should return UNABLE_TO_ASSESS for empty or insufficient input', () => {
    const input = 'hi';
    const result = runDeterministicRiskAnalysis(input);

    expect(result.status).toBe('UNABLE_TO_ASSESS');
    expect(result.couldNotVerify.length).toBeGreaterThan(0);
  });

  it('should verify all 3 deterministic demo scenarios have valid HIGH_CONCERN and evidence', () => {
    expect(DEMO_SCENARIOS.length).toBe(3);

    for (const demo of DEMO_SCENARIOS) {
      expect(demo.expectedStatus).toBe('HIGH_CONCERN');
      expect(demo.analysisResult.status).toBe('HIGH_CONCERN');
      expect(demo.analysisResult.safeNextSteps.length).toBe(5);
      expect(demo.analysisResult.evidence.length).toBeGreaterThan(0);
    }
  });
});
