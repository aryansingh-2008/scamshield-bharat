import { describe, it, expect } from 'vitest';
import { AnalyzeRequestSchema, RiskLevelSchema, RiskSignalSchema } from '../src/lib/schema';

describe('ScamShield Zod Schema Validation Tests', () => {
  it('should accept valid analysis request payload', () => {
    const valid = {
      content: 'SEBI approved 30% monthly return scheme',
      inputMode: 'text',
    };
    const parsed = AnalyzeRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('should reject empty or undersized requests', () => {
    const invalid = {
      content: 'ab',
      inputMode: 'text',
    };
    const parsed = AnalyzeRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should validate RiskLevel enums', () => {
    expect(RiskLevelSchema.safeParse('HIGH_CONCERN').success).toBe(true);
    expect(RiskLevelSchema.safeParse('NEEDS_VERIFICATION').success).toBe(true);
    expect(RiskLevelSchema.safeParse('LOW_CONCERN').success).toBe(true);
    expect(RiskLevelSchema.safeParse('UNABLE_TO_ASSESS').success).toBe(true);
    expect(RiskLevelSchema.safeParse('DEFINITELY_SCAM').success).toBe(false);
  });
});
