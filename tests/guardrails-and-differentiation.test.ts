import { describe, it, expect } from 'vitest';
import { runDeterministicRiskAnalysis } from '../src/lib/risk-engine';

describe('Guardrails & Rejection-Risk Audit Tests', () => {
  describe('Non-Advisory Guardrail Enforcement', () => {
    const nonAdvisoryQueries = [
      'Which stock should I buy?',
      'Should I buy Tata Motors tomorrow?',
      'Predict Nifty 50 price tomorrow',
      'Which is the best broker to open demat account?',
      'Tell me when to buy shares for maximum profit',
      'Give me intraday trading tips',
      'क्या मुझे रिलायंस का शेयर खरीदना चाहिए?',
    ];

    nonAdvisoryQueries.forEach((query) => {
      it(`must redirect advisory query "${query}" to safety guidance without giving tips`, () => {
        const result = runDeterministicRiskAnalysis(query);

        // Must not claim it is completely safe or low concern
        expect(result.status).toBe('NEEDS_VERIFICATION');

        // Headline must reflect Non-Advisory policy
        expect(result.headlineSummary).toContain('Non-Advisory');

        // Must educate user about SEBI Investment Advisers regulations
        expect(result.detailedExplanation).toContain('SEBI');
        expect(result.detailedExplanation).toContain('Investment Adviser');

        // Risk signal must be present
        const nonAdvisorySignal = result.riskSignals.find((s) =>
          s.title.includes('Non-Advisory Guardrail')
        );
        expect(nonAdvisorySignal).toBeDefined();

        // Must have verified SEBI intermediary registry link
        expect(result.safeNextSteps.some((s) => s.officialUrl?.includes('sebi.gov.in'))).toBe(true);
      });
    });
  });

  describe('Subtle Non-Canned Scam Message (No obvious words)', () => {
    it('should detect high risk in sophisticated pre-IPO syndicate message without words "scam", "guaranteed", or "OTP"', () => {
      const subtleScamText =
        'Exclusive pre-IPO allocation quota: We secured unlisted allotment for XYZ Tech ahead of official exchange listing. Deposit ₹75,000 into our master syndicate account before cutoff. Connect with our portfolio manager on WhatsApp.';

      // Verify absence of obvious keywords
      expect(subtleScamText.toLowerCase()).not.toContain('scam');
      expect(subtleScamText.toLowerCase()).not.toContain('guaranteed');
      expect(subtleScamText.toLowerCase()).not.toContain('otp');

      const result = runDeterministicRiskAnalysis(subtleScamText);

      // Must flag HIGH_CONCERN
      expect(result.status).toBe('HIGH_CONCERN');

      // Must detect the subtle signals
      const signalTypes = result.riskSignals.map((s) => s.type);
      expect(signalTypes).toContain('THIRD_PARTY_PAYMENT'); // pre-IPO syndicate allocation
      expect(signalTypes).toContain('MONEY_TRANSFER'); // Deposit ₹75,000
      expect(signalTypes).toContain('WHATSAPP_REDIRECT'); // WhatsApp
      expect(signalTypes).toContain('IMPERSONATION'); // portfolio manager

      // Must provide official evidence
      expect(result.evidence.length).toBeGreaterThan(0);

      // Must include emergency helpline 1930
      expect(result.safeNextSteps.some((s) => s.contactNumber === '1930')).toBe(true);
    });
  });

  describe('Epistemic Honesty & Uncertainty Distinction', () => {
    it('should distinguish unverified claims from "False" and provide independent verification instructions', () => {
      const message = 'SEBI approved advisor offering high profits. Update KYC.';
      const result = runDeterministicRiskAnalysis(message);

      expect(result.couldNotVerify.length).toBeGreaterThan(0);
      result.couldNotVerify.forEach((item) => {
        expect(item.claim).toBeDefined();
        expect(item.reason).toBeDefined();
        expect(item.howToVerifyIndependently).toBeDefined();
        // Must never say the claim is definitively "false" without evidence
        expect(item.reason.toLowerCase()).not.toContain('is definitively false');
      });
    });
  });
});
