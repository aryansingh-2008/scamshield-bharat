import { z } from 'zod';

export const RiskLevelSchema = z.enum([
  'HIGH_CONCERN',
  'NEEDS_VERIFICATION',
  'LOW_CONCERN',
  'UNABLE_TO_ASSESS',
]);

export const SignalSeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const RiskSignalTypeSchema = z.enum([
  'GUARANTEED_RETURN',
  'UNREALISTIC_RETURN',
  'URGENCY',
  'FEAR_THREAT',
  'IMPERSONATION',
  'REGULATORY_CLAIM',
  'OTP_REQUEST',
  'PASSWORD_REQUEST',
  'PIN_REQUEST',
  'MONEY_TRANSFER',
  'THIRD_PARTY_PAYMENT',
  'REMOTE_ACCESS',
  'APK_INSTALLATION',
  'SUSPICIOUS_DOMAIN',
  'TELEGRAM_REDIRECT',
  'WHATSAPP_REDIRECT',
  'INVESTMENT_PRESSURE',
  'REFERRAL_PRESSURE',
  'FAKE_KYC_CLAIM',
  'UNVERIFIED_IDENTITY',
]);

export const ExtractedClaimSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum([
    'GUARANTEED_RETURN',
    'REGULATORY_APPROVAL',
    'ACCOUNT_STATUS',
    'URGENT_ACTION',
    'PAYMENT_REQUEST',
    'SOFTWARE_INSTALL',
    'EXCLUSIVE_COMMUNITY',
    'HIGH_PROFIT',
  ]),
  status: z.enum(['VERIFIED', 'UNSUPPORTED', 'RISK_SIGNAL', 'UNVERIFIED', 'FALSE_CLAIM']),
  explanation: z.string(),
  hindiExplanation: z.string(),
  flaggedPhrases: z.array(z.string()).optional(),
});

export const RiskSignalSchema = z.object({
  id: z.string(),
  type: RiskSignalTypeSchema,
  title: z.string(),
  titleHi: z.string(),
  severity: SignalSeveritySchema,
  reason: z.string(),
  reasonHi: z.string(),
  detectedText: z.string().optional(),
  evidenceIds: z.array(z.string()),
  recommendedAction: z.string(),
  recommendedActionHi: z.string(),
});

export const EvidenceRecordSchema = z.object({
  id: z.string(),
  topic: z.string(),
  title: z.string(),
  titleHi: z.string(),
  summary: z.string(),
  summaryHi: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().url(),
  sourceType: z.enum([
    'official_regulator',
    'cybercrime_portal',
    'law_enforcement',
    'exchange_advisory',
  ]),
  lastReviewed: z.string(),
});

export const SafeActionStepSchema = z.object({
  step: z.number().int().positive(),
  category: z.enum(['STOP', 'VERIFY', 'PROTECT', 'REPORT', 'RECOVER']),
  title: z.string(),
  titleHi: z.string(),
  description: z.string(),
  descriptionHi: z.string(),
  contactNumber: z.string().optional(),
  officialUrl: z.string().optional(),
  actionType: z.enum(['warning', 'info', 'critical', 'action']),
});

export const AnalyzeRequestSchema = z.object({
  content: z.string().min(3, 'Message must be at least 3 characters').max(5000, 'Message cannot exceed 5000 characters'),
  inputMode: z.enum(['text', 'screenshot', 'url', 'demo']).default('text'),
  demoId: z.string().optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
