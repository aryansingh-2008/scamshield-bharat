import { describe, it, expect } from 'vitest';
import { analyzeFinancialContent } from '../src/lib/ai-analyzer';
import { DEMO_SCENARIOS } from '../src/lib/demo-scenarios';

describe('ScamShield End-to-End User Journey Tests', () => {
  it('E2E: Should execute full analysis pipeline for Demo 1 (Guaranteed Return Scam)', async () => {
    const demo1 = DEMO_SCENARIOS[0];
    const result = await analyzeFinancialContent(demo1.sampleContent, 'demo', demo1.id);

    // 1. Status Verification
    expect(result.status).toBe('HIGH_CONCERN');

    // 2. Extracted Claims
    expect(result.claims.length).toBeGreaterThan(0);
    const guaranteedClaim = result.claims.find((c) => c.category === 'GUARANTEED_RETURN');
    expect(guaranteedClaim).toBeDefined();

    // 3. Risk Signals
    expect(result.riskSignals.length).toBeGreaterThanOrEqual(3);
    const signalTypes = result.riskSignals.map((s) => s.type);
    expect(signalTypes).toContain('GUARANTEED_RETURN');
    expect(signalTypes).toContain('TELEGRAM_REDIRECT');

    // 4. Official Regulatory Evidence
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence.some((e) => e.sourceType === 'official_regulator')).toBe(true);

    // 5. Safe Next Steps (STOP, PROTECT, VERIFY, REPORT, RECOVER)
    expect(result.safeNextSteps.length).toBe(5);
    const categories = result.safeNextSteps.map((s) => s.category);
    expect(categories).toEqual(['STOP', 'PROTECT', 'VERIFY', 'REPORT', 'RECOVER']);

    // 6. Bilingual Translations
    expect(result.headlineSummaryHi).toBeDefined();
    expect(result.detailedExplanationHi).toBeDefined();
  });

  it('E2E: Should execute full analysis pipeline for Demo 2 (Fake KYC Expiry Phishing)', async () => {
    const demo2 = DEMO_SCENARIOS[1];
    const result = await analyzeFinancialContent(demo2.sampleContent, 'demo', demo2.id);

    expect(result.status).toBe('HIGH_CONCERN');
    const signals = result.riskSignals.map((s) => s.type);
    expect(signals).toContain('FAKE_KYC_CLAIM');
    expect(signals).toContain('FEAR_THREAT');
  });

  it('E2E: Should execute full analysis pipeline for Demo 3 (Remote Support APK Scam)', async () => {
    const demo3 = DEMO_SCENARIOS[2];
    const result = await analyzeFinancialContent(demo3.sampleContent, 'demo', demo3.id);

    expect(result.status).toBe('HIGH_CONCERN');
    const signals = result.riskSignals.map((s) => s.type);
    expect(signals).toContain('REMOTE_ACCESS');
    expect(signals).toContain('APK_INSTALLATION');
  });
});
