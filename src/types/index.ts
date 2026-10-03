export type RiskLevel =
  | 'HIGH_CONCERN'
  | 'NEEDS_VERIFICATION'
  | 'LOW_CONCERN'
  | 'UNABLE_TO_ASSESS';

export type SignalSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskSignalType =
  | 'GUARANTEED_RETURN'
  | 'UNREALISTIC_RETURN'
  | 'URGENCY'
  | 'FEAR_THREAT'
  | 'IMPERSONATION'
  | 'REGULATORY_CLAIM'
  | 'OTP_REQUEST'
  | 'PASSWORD_REQUEST'
  | 'PIN_REQUEST'
  | 'MONEY_TRANSFER'
  | 'THIRD_PARTY_PAYMENT'
  | 'REMOTE_ACCESS'
  | 'APK_INSTALLATION'
  | 'SUSPICIOUS_DOMAIN'
  | 'TELEGRAM_REDIRECT'
  | 'WHATSAPP_REDIRECT'
  | 'INVESTMENT_PRESSURE'
  | 'REFERRAL_PRESSURE'
  | 'FAKE_KYC_CLAIM'
  | 'UNVERIFIED_IDENTITY';

export type ClaimCategory =
  | 'GUARANTEED_RETURN'
  | 'REGULATORY_APPROVAL'
  | 'ACCOUNT_STATUS'
  | 'URGENT_ACTION'
  | 'PAYMENT_REQUEST'
  | 'SOFTWARE_INSTALL'
  | 'EXCLUSIVE_COMMUNITY'
  | 'HIGH_PROFIT';

export type ClaimStatus =
  | 'VERIFIED'
  | 'UNSUPPORTED'
  | 'RISK_SIGNAL'
  | 'UNVERIFIED'
  | 'FALSE_CLAIM';

export interface ExtractedClaim {
  id: string;
  text: string;
  category: ClaimCategory;
  status: ClaimStatus;
  explanation: string;
  hindiExplanation: string;
  flaggedPhrases?: string[];
}

export interface RiskSignal {
  id: string;
  type: RiskSignalType;
  title: string;
  titleHi: string;
  severity: SignalSeverity;
  reason: string;
  reasonHi: string;
  detectedText?: string;
  evidenceIds: string[];
  recommendedAction: string;
  recommendedActionHi: string;
}

export interface EvidenceRecord {
  id: string;
  topic: string;
  title: string;
  titleHi: string;
  summary: string;
  summaryHi: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: 'official_regulator' | 'cybercrime_portal' | 'law_enforcement' | 'exchange_advisory';
  lastReviewed: string;
}

export interface VerifiedInformation {
  topic: string;
  statement: string;
  statementHi: string;
  sourceName: string;
  sourceUrl: string;
}

export interface CouldNotVerifyItem {
  claim: string;
  reason: string;
  reasonHi: string;
  howToVerifyIndependently: string;
  howToVerifyIndependentlyHi: string;
}

export interface SafeActionStep {
  step: number;
  category: 'STOP' | 'VERIFY' | 'PROTECT' | 'REPORT' | 'RECOVER';
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  contactNumber?: string;
  officialUrl?: string;
  actionType: 'warning' | 'info' | 'critical' | 'action';
}

export interface AnalysisResponse {
  id: string;
  timestamp: string;
  status: RiskLevel;
  headlineSummary: string;
  headlineSummaryHi: string;
  detailedExplanation: string;
  detailedExplanationHi: string;
  claims: ExtractedClaim[];
  riskSignals: RiskSignal[];
  evidence: EvidenceRecord[];
  verifiedInformation: VerifiedInformation[];
  couldNotVerify: CouldNotVerifyItem[];
  safeNextSteps: SafeActionStep[];
  piiRedacted: boolean;
  redactedInputPreview?: string;
  inputMode: 'text' | 'screenshot' | 'url' | 'demo';
  isDemoAnalysis?: boolean;
  disclaimer: string;
  disclaimerHi: string;
}

export interface DemoScenario {
  id: string;
  tag: string;
  title: string;
  titleHi: string;
  shortDesc: string;
  shortDescHi: string;
  sampleContent: string;
  expectedStatus: RiskLevel;
  keySignals: RiskSignalType[];
  analysisResult: AnalysisResponse;
}
