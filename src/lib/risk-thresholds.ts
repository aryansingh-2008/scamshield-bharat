/**
 * ScamShield Bharat — Central Risk Classification & Threshold Configuration
 *
 * Configurable thresholds for the Smart Risk Warning Popup System:
 * - Low Risk:    0 to 30
 * - Medium Risk: 31 to 59
 * - High Risk:   60 to 100
 *
 * All risk boundaries and classification logic are defined in this single central file.
 */

export interface RiskThresholdConfig {
  lowMax: number;    // Upper bound for Low Risk (0 - 30)
  mediumMax: number; // Upper bound for Medium Risk (31 - 59)
  highMax: number;   // Upper bound for High Risk (60 - 100)
}

export const RISK_THRESHOLDS: RiskThresholdConfig = {
  lowMax: 30,
  mediumMax: 59,
  highMax: 100,
};

export type SmartRiskCategory = 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';

export interface SmartRiskClassification {
  score: number;
  category: SmartRiskCategory;
  label: string;
  labelHi: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  recommendedAction: string;
  recommendedActionHi: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  bannerGradient: string;
  canDirectOpen: boolean;
  requiresConfirmation: boolean;
  isBlocked: boolean;
}

/**
 * Classifies an incoming risk score into one of three strict tiers:
 * 0-30:   Low Risk
 * 31-59:  Medium Risk
 * 60-100: High Risk
 *
 * Handles missing, undefined, NaN, or out-of-range scores safely.
 */
export function classifyRiskScore(rawScore: number | undefined | null): SmartRiskClassification {
  // Safe normalization: ensure score is an integer between 0 and 100
  let score = 0;
  if (typeof rawScore === 'number' && !isNaN(rawScore)) {
    score = Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  // 1. Low Risk (0 – 30)
  if (score <= RISK_THRESHOLDS.lowMax) {
    return {
      score,
      category: 'LOW_RISK',
      label: 'Low Risk',
      labelHi: 'न्यूनतम जोखिम (Low Risk)',
      title: 'Low Risk Detected',
      titleHi: 'न्यूनतम जोखिम की पहचान (Low Risk Detected)',
      message:
        'No major suspicious indicators were detected. However, this does not guarantee that the content is completely safe.',
      messageHi:
        'कोई बड़ा संदिग्ध संकेतक नहीं मिला। हालांकि, यह गारंटी नहीं देता कि सामग्री पूरी तरह सुरक्षित है।',
      recommendedAction:
        'You may continue. Always maintain standard digital hygiene and verify unknown contacts.',
      recommendedActionHi:
        'आप आगे बढ़ सकते हैं। हमेशा बुनियादी डिजिटल सावधानी रखें और अनजान संपर्कों की पुष्टि करें।',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      borderClass: 'border-emerald-500',
      bgClass: 'bg-emerald-50/70',
      textClass: 'text-emerald-950',
      bannerGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
      canDirectOpen: true,
      requiresConfirmation: false,
      isBlocked: false,
    };
  }

  // 2. Medium Risk (31 – 59)
  if (score <= RISK_THRESHOLDS.mediumMax) {
    return {
      score,
      category: 'MEDIUM_RISK',
      label: 'Medium Risk',
      labelHi: 'मध्यम जोखिम (Medium Risk)',
      title: 'Caution — Potentially Suspicious Content',
      titleHi: 'सावधानी — संभावित संदिग्ध सामग्री (Caution)',
      message:
        'This content contains suspicious indicators. Verify the sender and destination before proceeding.',
      messageHi:
        'इस सामग्री में संदिग्ध संकेतक पाए गए हैं। आगे बढ़ने से पहले प्रेषक और लिंक की पुष्टि अवश्य करें।',
      recommendedAction:
        'Review the detailed analysis carefully. Do not enter financial credentials, passwords, or OTPs.',
      recommendedActionHi:
        'विस्तृत विश्लेषण की सावधानीपूर्वक समीक्षा करें। वित्तीय विवरण, पासवर्ड या OTP दर्ज न करें।',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      borderClass: 'border-amber-500',
      bgClass: 'bg-amber-50/70',
      textClass: 'text-amber-950',
      bannerGradient: 'from-amber-500 via-orange-500 to-amber-600',
      canDirectOpen: false,
      requiresConfirmation: true,
      isBlocked: false,
    };
  }

  // 3. High Risk (60 – 100)
  return {
    score,
    category: 'HIGH_RISK',
    label: 'High Risk',
    labelHi: 'अत्यधिक जोखिम (High Risk)',
    title: 'High Risk Detected!',
    titleHi: 'अत्यधिक जोखिम की पहचान (High Risk Detected!)',
    message:
      'Our security analysis identified multiple suspicious indicators. Opening this content may expose you to phishing, financial fraud, or data theft.',
    messageHi:
      'हमारे सुरक्षा विश्लेषण में कई संदिग्ध संकेतक मिले हैं। इसे खोलने से आप फ़िशिंग, वित्तीय धोखाधड़ी या डेटा चोरी के शिकार हो सकते हैं।',
    recommendedAction:
      'Do NOT open any links or install APKs. Return to safety immediately and report suspicious content to 1930.',
    recommendedActionHi:
      'किसी भी लिंक को न खोलें और न ही APK इंस्टॉल करें। तुरंत सुरक्षा की ओर लौटें और 1930 पर रिपोर्ट करें।',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    borderClass: 'border-red-600',
    bgClass: 'bg-red-50/80',
    textClass: 'text-red-950',
    bannerGradient: 'from-red-600 via-rose-600 to-red-700',
    canDirectOpen: false,
    requiresConfirmation: true,
    isBlocked: true,
  };
}
