import { DemoScenario } from '@/types';
import { runDeterministicRiskAnalysis } from './risk-engine';

const DEMO_1_CONTENT = `[Telegram Forward: VIP Institutional Wealth Club | Today at 09:45 AM]
SEBI approved investment opportunity with institutional trading desk.
Guaranteed 30% monthly fixed return on invested capital.
Only 20 seats left in this institutional batch.
Join our official Telegram group now: https://t.me/sebi_vip_wealth
Deposit ₹50,000 today to activate your daily payout account.`;

const DEMO_2_CONTENT = `[SMS Alert: DM-KKYCHLP | Received Today at 10:12 AM]
URGENT: Your Demat & Trading KYC will expire tonight.
Your trading account will be suspended and all open positions blocked within 24 hours.
Verify immediately using this link: https://kyc-update-portal.xyz/verify-trading-account`;

const DEMO_3_CONTENT = `[Support Desk Ticket #98214: Trading Desk Help]
Dear User, your account requires immediate security verification.
Please install this remote support APK to resolve pending withdrawal.
Our representative will guide you through the process and screen verification.
Download Link: https://support-resolution-desk.net/QuickSupport_Security.apk`;

const demo1Result = runDeterministicRiskAnalysis(DEMO_1_CONTENT, 'demo');
demo1Result.isDemoAnalysis = true;

const demo2Result = runDeterministicRiskAnalysis(DEMO_2_CONTENT, 'demo');
demo2Result.isDemoAnalysis = true;

const demo3Result = runDeterministicRiskAnalysis(DEMO_3_CONTENT, 'demo');
demo3Result.isDemoAnalysis = true;

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo-1-guaranteed-return',
    tag: 'SCAM DEMO 1',
    title: 'Guaranteed 30% Return + Telegram',
    titleHi: 'गारंटीड 30% रिटर्न + टेलीग्राम ग्रुप',
    shortDesc: 'Promised high returns with artificial scarcity & Telegram redirect',
    shortDescHi: '30% मासिक मुनाफे का झूठा वादा और टेलीग्राम पर पैसे मांगने का दबाव',
    sampleContent: DEMO_1_CONTENT,
    expectedStatus: 'HIGH_CONCERN',
    keySignals: ['GUARANTEED_RETURN', 'URGENCY', 'REGULATORY_CLAIM', 'TELEGRAM_REDIRECT', 'MONEY_TRANSFER'],
    analysisResult: demo1Result,
  },
  {
    id: 'demo-2-fake-kyc-expiry',
    tag: 'SCAM DEMO 2',
    title: 'Fake KYC Expiry & Suspension Threat',
    titleHi: 'फर्जी केवाईसी एक्सपायरी और खाता सस्पेंड करने की धमकी',
    shortDesc: 'Threat of account suspension with phishing link to capture credentials',
    shortDescHi: 'खाता बंद होने का डर दिखाकर फर्जी लिंक पर क्लिक कराने की कोशिश',
    sampleContent: DEMO_2_CONTENT,
    expectedStatus: 'HIGH_CONCERN',
    keySignals: ['FAKE_KYC_CLAIM', 'FEAR_THREAT', 'URGENCY', 'SUSPICIOUS_DOMAIN'],
    analysisResult: demo2Result,
  },
  {
    id: 'demo-3-remote-access-apk',
    tag: 'SCAM DEMO 3',
    title: 'Remote Support APK Installation',
    titleHi: 'रिमोट सपोर्ट APK डाउनलोड और स्क्रीन शेयरिंग',
    shortDesc: 'Impersonation of support staff requesting APK install to control phone',
    shortDescHi: 'कस्टमर केयर बनकर रिमोट एक्सेस ऐप व APK इंस्टॉल कराने का प्रयास',
    sampleContent: DEMO_3_CONTENT,
    expectedStatus: 'HIGH_CONCERN',
    keySignals: ['REMOTE_ACCESS', 'APK_INSTALLATION', 'IMPERSONATION'],
    analysisResult: demo3Result,
  },
];

export function getDemoScenarioById(id: string): DemoScenario | undefined {
  if (!id) return undefined;
  const cleanId = id.toLowerCase().trim();
  return DEMO_SCENARIOS.find(
    (d) =>
      d.id === cleanId ||
      cleanId.includes(d.id) ||
      d.id.includes(cleanId) ||
      (cleanId.includes('guaranteed') && d.id.includes('guaranteed')) ||
      (cleanId.includes('kyc') && d.id.includes('kyc')) ||
      (cleanId.includes('apk') && d.id.includes('apk'))
  );
}
