import { describe, it, expect } from 'vitest';
import { classifyRiskScore, RISK_THRESHOLDS } from '../src/lib/risk-thresholds';

describe('Smart Risk Warning Thresholds & Classification System', () => {
  it('correctly classifies score 0 as Low Risk (Safe to open)', () => {
    const res = classifyRiskScore(0);
    expect(res.category).toBe('LOW_RISK');
    expect(res.score).toBe(0);
    expect(res.title).toBe('Low Risk Detected');
    expect(res.canDirectOpen).toBe(true);
    expect(res.isBlocked).toBe(false);
  });

  it('correctly classifies score 30 as Low Risk boundary', () => {
    const res = classifyRiskScore(30);
    expect(res.category).toBe('LOW_RISK');
    expect(res.score).toBe(30);
    expect(res.canDirectOpen).toBe(true);
    expect(res.isBlocked).toBe(false);
  });

  it('correctly classifies score 31 as Medium Risk boundary', () => {
    const res = classifyRiskScore(31);
    expect(res.category).toBe('MEDIUM_RISK');
    expect(res.score).toBe(31);
    expect(res.title).toBe('Caution — Potentially Suspicious Content');
    expect(res.canDirectOpen).toBe(false);
    expect(res.requiresConfirmation).toBe(true);
    expect(res.isBlocked).toBe(false);
  });

  it('correctly classifies score 59 as Medium Risk boundary', () => {
    const res = classifyRiskScore(59);
    expect(res.category).toBe('MEDIUM_RISK');
    expect(res.score).toBe(59);
    expect(res.canDirectOpen).toBe(false);
    expect(res.requiresConfirmation).toBe(true);
  });

  it('correctly classifies score 60 as High Risk boundary (Blocked)', () => {
    const res = classifyRiskScore(60);
    expect(res.category).toBe('HIGH_RISK');
    expect(res.score).toBe(60);
    expect(res.title).toBe('High Risk Detected!');
    expect(res.canDirectOpen).toBe(false);
    expect(res.isBlocked).toBe(true);
  });

  it('correctly classifies score 99 and 100 as High Risk', () => {
    const res99 = classifyRiskScore(99);
    expect(res99.category).toBe('HIGH_RISK');
    expect(res99.isBlocked).toBe(true);

    const res100 = classifyRiskScore(100);
    expect(res100.category).toBe('HIGH_RISK');
    expect(res100.isBlocked).toBe(true);
  });

  it('safely handles missing, undefined, and NaN values without crashing', () => {
    const resUndef = classifyRiskScore(undefined);
    expect(resUndef.category).toBe('LOW_RISK');
    expect(resUndef.score).toBe(0);

    const resNull = classifyRiskScore(null);
    expect(resNull.category).toBe('LOW_RISK');
    expect(resNull.score).toBe(0);

    const resNaN = classifyRiskScore(NaN);
    expect(resNaN.category).toBe('LOW_RISK');
    expect(resNaN.score).toBe(0);
  });

  it('clamps negative numbers to 0 and numbers over 100 to 100', () => {
    const resNeg = classifyRiskScore(-15);
    expect(resNeg.score).toBe(0);
    expect(resNeg.category).toBe('LOW_RISK');

    const resOver = classifyRiskScore(150);
    expect(resOver.score).toBe(100);
    expect(resOver.category).toBe('HIGH_RISK');
  });

  it('exposes configurable threshold constants in central location', () => {
    expect(RISK_THRESHOLDS.lowMax).toBe(30);
    expect(RISK_THRESHOLDS.mediumMax).toBe(59);
    expect(RISK_THRESHOLDS.highMax).toBe(100);
  });
});
