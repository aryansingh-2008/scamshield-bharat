import {
  RiskLevel,
  RiskSignal,
  ExtractedClaim,
  VerifiedInformation,
  CouldNotVerifyItem,
  SafeActionStep,
  AnalysisResponse,
} from '@/types';
import { OFFICIAL_EVIDENCE_DATABASE } from './evidence-db';
import { OFFICIAL_SOURCES } from './official-sources';
import { redactPII } from './pii-redactor';
import { validateAndParseUrl } from './url-security';

function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>?/gm, '').replace(/javascript:/gi, '').trim();
}

interface SignalDetectorRule {
  type: RiskSignal['type'];
  title: string;
  titleHi: string;
  severity: RiskSignal['severity'];
  patterns: RegExp[];
  reason: string;
  reasonHi: string;
  evidenceIds: string[];
  recommendedAction: string;
  recommendedActionHi: string;
  claimCategory?: ExtractedClaim['category'];
}

const RISK_DETECTOR_RULES: SignalDetectorRule[] = [
  {
    type: 'GUARANTEED_RETURN',
    title: 'Guaranteed or Fixed Returns Claim',
    titleHi: 'गारंटीड / निश्चित मुनाफे का झूठा वादा',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:guarantee|guarantees|guaranteed|assured|assures|fixed|sure[\s-]shot|100%\s*safe|risk[\s-]free|zero[\s-]risk)\b.*?\b(?:return|returns|profit|income|payout|gain|gains|yield|verified)\b/i,
      /\b(?:guarantee|guarantees|promise|promises|assure|assures)\s*(?:\d+%\s*(?:monthly|weekly|daily|annual|return|yield))\b/i,
      /\b(?:\d{1,3}%)\s*(?:monthly|monthly return|daily|per day|per month|return|returns|yield|profit|gains)\b/i,
      /\b(?:double|triple)\s*(?:your\s*money|investment|funds)\s*in\s*\d+\s*(?:days|weeks|months)\b/i,
      /(?:गारंटीड|पक्का|निश्चित|100%|शत-प्रतिशत)\s*(?:रिटर्न|मुनाफा|लाभ|फायदा|कमाई)/i,
      /\b100%\s*safe\b/i,
    ],
    reason:
      'Legitimate financial markets and SEBI-registered entities never guarantee fixed equity/derivative returns. Guaranteed high returns are a classic hallmark of Ponzi schemes and unauthorized tipping scams.',
    reasonHi:
      'भारतीय शेयर बाजार में सेबी द्वारा किसी भी प्रकार के गारंटीड या निश्चित मुनाफे का दावा पूरी तरह गैर-कानूनी है। यह पोंजी स्कीम और पम्प-एंड-डंप फ्रॉड का मुख्य संकेत है।',
    evidenceIds: ['EVID-SEBI-GUARANTEED-RETURNS'],
    recommendedAction: 'Do not transfer any money. Refuse any scheme promising fixed monthly returns.',
    recommendedActionHi: 'पैसे ट्रांसफर न करें। गारंटीड रिटर्न के किसी भी झांसे में न आएं।',
    claimCategory: 'GUARANTEED_RETURN',
  },
  {
    type: 'UNREALISTIC_RETURN',
    title: 'Unrealistic Astronomical Returns',
    titleHi: 'अवास्तविक व अत्यधिक मुनाफे का प्रलोभन',
    severity: 'HIGH',
    patterns: [
      /\b(?:\d{2,3}%\s*(?:daily|weekly|per week|per day))\b/i,
      /\b(?:\d{1,3}x)\s*(?:profit|profits|return|returns|gain|gains)\b/i,
      /\b(?:turn\s*₹?\d+\s*into\s*₹?\d+)\b/i,
      /(?:\d+\s*गुना|\d+\s*गुना\s*(?:मुनाफा|लाभ|फायदा|रिटर्न))/i,
    ],
    reason:
      'Astronomical returns (e.g. 30%+ monthly or 10x gains) are mathematically unsustainable and designed to lure victims into transferring capital.',
    reasonHi:
      'अत्यधिक मुनाफा (जैसे हफ्ते में 50% या 10 गुना लाभ) का वादा निवेशकों को फंसाने के लिए किया जाता है।',
    evidenceIds: ['EVID-SEBI-GUARANTEED-RETURNS'],
    recommendedAction: 'Understand that high returns always carry high risk; impossible yields signify fraud.',
    recommendedActionHi: 'समझें कि असंभव मुनाफे का वादा सिर्फ धोखाधड़ी में ही किया जाता है।',
    claimCategory: 'HIGH_PROFIT',
  },
  {
    type: 'URGENCY',
    title: 'Artificial Urgency / Scarcity Pressure',
    titleHi: 'जल्दीबाजी और सीमित समय का मानसिक दबाव',
    severity: 'HIGH',
    patterns: [
      /\b(?:only\s*\d+\s*seats?\s*left|limited\s*(?:slots?|seats?|time\s*offer))\b/i,
      /\b(?:expires?\s*(?:tonight|today|in\s*\d+\s*(?:mins|minutes|hours))|last\s*chance|act\s*now|hurry\s*up)\b/i,
      /\b(?:offer\s*valid\s*till|closing\s*soon|within\s*\d+\s*hours)\b/i,
      /(?:केवल\s*\d+\s*सीटें?\s*बाकी|जल्दी\s*करें|आज\s*ही\s*अंतिम\s*मौका)/i,
    ],
    reason:
      'Scammers intentionally create time scarcity to force victims into acting impulsively before they have time to independently verify claims.',
    reasonHi:
      'धोखेबाज जानबूझकर समय की कमी दिखाकर जल्दबाजी में फैसला लेने का दबाव बनाते हैं ताकि आप किसी से जांच न कर सकें।',
    evidenceIds: ['EVID-SEBI-SOCIAL-MEDIA-GROUPS'],
    recommendedAction: 'Slow down. Legitimate investments never require panic decisions within minutes.',
    recommendedActionHi: 'ठहरें और सोचें। कोई भी असली निवेश मिनटों में फैसला लेने के लिए मजबूर नहीं करता।',
    claimCategory: 'URGENT_ACTION',
  },
  {
    type: 'FEAR_THREAT',
    title: 'Coercive Fear or Account Suspension Threat',
    titleHi: 'खाता बंद होने या कानूनी कार्रवाई की धमकी',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:account\s*will\s*be\s*(?:suspended|blocked|frozen|terminated|deactivated))\b/i,
      /\b(?:trading\s*account\s*(?:suspended|blocked|closed))\b/i,
      /\b(?:legal\s*action|police\s*complaint|arrest\s*warrant|court\s*order|cbi|ed\s*notice)\b/i,
      /\b(?:penalty\s*of\s*₹?\d+|electricity\s*will\s*be\s*cut)\b/i,
      /(?:खाता\s*(?:ब्लॉक|बंद|सस्पेंड)\s*हो\s*जाएगा)/i,
    ],
    reason:
      'Threatening imminent account blocking or legal consequences is a psychological extortion tactic used to bypass rational caution.',
    reasonHi:
      'खाता बंद होने या पुलिस कार्रवाई का डर दिखाकर लोगों को बिना सोचे समझे पैसे या निजी डेटा देने पर मजबूर किया जाता है।',
    evidenceIds: ['EVID-RBI-FAKE-KYC-FRAUD'],
    recommendedAction: 'Do not panic. Contact your bank or broker via their verified official website or mobile app only.',
    recommendedActionHi: 'घबराएं नहीं। अपने बैंक या ब्रोकर के अधिकृत ऐप या फोन नंबर पर ही संपर्क करें।',
    claimCategory: 'ACCOUNT_STATUS',
  },
  {
    type: 'REGULATORY_CLAIM',
    title: 'Unverified Regulatory Endorsement (SEBI/RBI)',
    titleHi: 'सेबी/आरबीआई का अनधिकृत या झूठा नाम',
    severity: 'HIGH',
    patterns: [
      /\b(?:sebi\s*(?:approved|certified|registered|verified|guaranteed))\b/i,
      /\b(?:rbi\s*(?:approved|certified|authorized|guaranteed))\b/i,
      /\b(?:govt\s*approved|government\s*certified)\b/i,
      /(?:सेबी\s*द्वारा\s*(?:मान्यता\s*प्राप्त|अप्रूव्ड))/i,
    ],
    reason:
      'Scammers falsely affix "SEBI Approved" or "RBI Certified" in social media text to project fake legitimacy. SEBI does not endorse or approve specific trading tips or high-yield schemes.',
    reasonHi:
      'मैसेज में केवल "SEBI Approved" लिख देना फर्जी हो सकता है। सेबी किसी स्कीम के मुनाफे को अप्रूव नहीं करता।',
    evidenceIds: ['EVID-SEBI-INTERMEDIARY-REGISTRATION', 'EVID-SEBI-GUARANTEED-RETURNS'],
    recommendedAction: 'Verify the entity’s SEBI Registration Number directly on the official sebi.gov.in registry.',
    recommendedActionHi: 'सेबी की आधिकारिक वेबसाइट sebi.gov.in पर जाकर रजिस्ट्रेशन नंबर की पुष्टि करें।',
    claimCategory: 'REGULATORY_APPROVAL',
  },
  {
    type: 'TELEGRAM_REDIRECT',
    title: 'Redirection to Telegram Group / Channel',
    titleHi: 'टेलीग्राम ग्रुप या प्राइवेट चैनल में जुड़ने का आमंत्रण',
    severity: 'HIGH',
    patterns: [
      /\b(?:join\s*(?:our|the)?\s*telegram\s*(?:group|channel|vip|link)?|t\.me\/[a-zA-Z0-9_]+)\b/i,
      /\b(?:telegram\s*(?:vip|premium|trading\s*room|community))\b/i,
      /(?:टेलीग्राम\s*(?:ग्रुप|चैनल))/i,
    ],
    reason:
      'Telegram channels are heavily exploited by pump-and-dump syndicates and fake investment operations because admins can remain anonymous and delete chat histories.',
    reasonHi:
      'टेलीग्राम ग्रुप्स में एडमिन अनजान रहते हैं और लोगों को फर्जी स्क्रीनशॉट दिखाकर जालसाजी में फंसाते हैं।',
    evidenceIds: ['EVID-SEBI-SOCIAL-MEDIA-GROUPS'],
    recommendedAction: 'Never execute financial trades or send money based on anonymous Telegram channel instructions.',
    recommendedActionHi: 'टेलीग्राम ग्रुप में दी गई सलाह पर कभी भी पैसे न लगाएं।',
    claimCategory: 'EXCLUSIVE_COMMUNITY',
  },
  {
    type: 'WHATSAPP_REDIRECT',
    title: 'Redirection to Unofficial WhatsApp Community',
    titleHi: 'अनधिकृत व्हाट्सएप ग्रुप में जोड़ने का प्रयास',
    severity: 'MEDIUM',
    patterns: [
      /\b(?:join\s*(?:our|the)?\s*whatsapp\s*(?:group|community|link)?|wa\.me\/[0-9]+)\b/i,
      /\b(?:whatsapp\s*group\s*link|chat\.whatsapp\.com\/[a-zA-Z0-9]+)\b/i,
      /\b(?:connect|message|chat|contact|talk)\s*(?:with\s*us\s*)?(?:on|via|through)?\s*whatsapp\b/i,
      /\bwhatsapp\b/i,
      /(?:व्हाट्सएप\s*(?:ग्रुप|कम्युनिटी|पर\s*संपर्क))/i,
    ],
    reason:
      'Unsolicited additions to WhatsApp investment clubs often feature paid shills posting fake profit screenshots to induce FOMO (Fear Of Missing Out).',
    reasonHi:
      'व्हाट्सएप ग्रुप्स में नकली मुनाफे के स्क्रीनशॉट डालकर निवेशकों को गुमराह किया जाता है।',
    evidenceIds: ['EVID-SEBI-SOCIAL-MEDIA-GROUPS'],
    recommendedAction: 'Leave suspicious WhatsApp stock groups. Report the group admin on WhatsApp.',
    recommendedActionHi: 'अज्ञात व्हाट्सएप ग्रुप से बाहर निकलें और एडमिन को रिपोर्ट करें।',
    claimCategory: 'EXCLUSIVE_COMMUNITY',
  },
  {
    type: 'FAKE_KYC_CLAIM',
    title: 'Phishing KYC Update / Verification Demand',
    titleHi: 'फर्जी केवाईसी नवीनीकरण / लिंक सत्यापन की मांग',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:kyc\s*(?:will\s*expire|expired|suspended|pending|incomplete|update|verification|status|link|verify\s*now))\b/i,
      /\b(?:update\s*(?:your\s*)?(?:e-?)?kyc\s*(?:via|using|at|link|immediately|now)?)\b/i,
      /\b(?:urgent\s*(?:e-?)?kyc|kyc\s*update\s*link)\b/i,
      /\b(?:pan\s*card\s*(?:blocked|link\s*required|verification\s*failed|e-?kyc))\b/i,
      /(?:केवाईसी\s*(?:अपडेट|एक्सपायर|सत्यापन|लिंक))/i,
    ],
    reason:
      'Phishing messages claim KYC expiry to trick users into entering netbanking credentials, PAN numbers, and OTPs on lookalike fake web pages.',
    reasonHi:
      'केवाईसी बंद होने का डर दिखाकर फर्जी वेबसाइट पर आपकी बैंक आईडी और पासवर्ड चुराने की कोशिश की जाती है।',
    evidenceIds: ['EVID-RBI-FAKE-KYC-FRAUD'],
    recommendedAction: 'Never click on SMS links for KYC. Update KYC only through your official banking portal or physical branch.',
    recommendedActionHi: 'केवाईसी के लिए SMS में आए किसी लिंक पर क्लिक न करें। केवल बैंक ऐप या शाखा से ही करें।',
    claimCategory: 'ACCOUNT_STATUS',
  },
  {
    type: 'REMOTE_ACCESS',
    title: 'Remote Device Control Software Solicitation',
    titleHi: 'रिमोट एक्सेस सॉफ्टवेयर (स्क्रीन शेयरिंग ऐप) डाउनलोड कराने का प्रयास',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:anydesk|teamviewer|quicksupport|rustdesk|screen\s*share|remote\s*(?:support|access|assistance))\b/i,
      /\b(?:install\s*(?:remote\s*app|support\s*software))\b/i,
      /(?:रिमोट\s*(?:सपोर्ट|एक्सेस|स्क्रीन\s*शेयर))/i,
    ],
    reason:
      'Remote access tools allow fraudsters to directly see your mobile/computer screen, read incoming bank OTPs, and initiate unauthorized money transfers.',
    reasonHi:
      'AnyDesk या QuickSupport जैसे ऐप से जालसाज आपके फोन की स्क्रीन देखकर चुपके से बैंक से पैसे उड़ा लेते हैं।',
    evidenceIds: ['EVID-CERTIN-MALICIOUS-APKS'],
    recommendedAction: 'Never install remote screen-sharing tools on instructions from an unverified caller.',
    recommendedActionHi: 'किसी के कहने पर AnyDesk या स्क्रीन शेयरिंग ऐप कभी भी इंस्टॉल न करें।',
    claimCategory: 'SOFTWARE_INSTALL',
  },
  {
    type: 'APK_INSTALLATION',
    title: 'Sideloaded / Unverified APK Installation',
    titleHi: 'अज्ञात APK फाइल या थर्ड-पार्टी ऐप डाउनलोड करने का दबाव',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:install|download|sideload)\b.*?\bapk\b/i,
      /\bapk\b/i,
      /\b(?:install\s*custom\s*app|download\s*support\s*app)\b/i,
      /(?:एपीके\s*(?:फाइल|ऐप|डाउनलोड))/i,
    ],
    reason:
      'Sideloaded Android APKs bypass Google Play Protect security scans and commonly contain keyloggers, SMS forwarders, and banking trojans.',
    reasonHi:
      'वेबसाइट या मैसेज से डाउनलोड की गई APK फाइल में मालवेयर हो सकता है जो आपके सारे पासवर्ड चुरा लेता है।',
    evidenceIds: ['EVID-CERTIN-MALICIOUS-APKS'],
    recommendedAction: 'Only install financial applications from the official Google Play Store or Apple App Store.',
    recommendedActionHi: 'हमेशा केवल Google Play Store या Apple App Store से ही आधिकारिक ऐप इंस्टॉल करें।',
    claimCategory: 'SOFTWARE_INSTALL',
  },
  {
    type: 'MONEY_TRANSFER',
    title: 'Upfront Capital Deposit / Processing Fee Request',
    titleHi: 'शुरुआती फीस या डायरेक्ट पैसे जमा करने का दबाव',
    severity: 'HIGH',
    patterns: [
      /\b(?:deposit\s*₹?\s*[\d,]+|transfer\s*₹?\s*[\d,]+|pay\s*₹?\s*[\d,]+|initial\s*investment\s*of\s*₹?\s*[\d,]+)\b/i,
      /\b(?:send\s*money\s*to\s*activate|recharge\s*wallet\s*with\s*₹?\s*[\d,]+)\b/i,
      /\b(?:₹\s*[\d,]+\s*(?:deposit|fees|charge|today))\b/i,
      /(?:पैसे\s*(?:जमा|ट्रांसफर|डिपॉजिट)\s*करें)/i,
    ],
    reason:
      'Demanding upfront deposits or registration fees before revealing full terms is the primary extraction phase of financial fraud.',
    reasonHi:
      'किसी भी अनजानी योजना में शुरुआत में पैसे जमा करने की मांग धोखाधड़ी का प्राथमिक लक्षण है।',
    evidenceIds: ['EVID-I4C-MULE-ACCOUNT-PAYMENT', 'EVID-SEBI-GUARANTEED-RETURNS'],
    recommendedAction: 'Do not send funds. Verify if the receiving account is an authorized institutional clearing account.',
    recommendedActionHi: 'पैसे न भेजें। सुनिश्चित करें कि खाता किसी अधिकृत संस्था का ही है।',
    claimCategory: 'PAYMENT_REQUEST',
  },
  {
    type: 'OTP_REQUEST',
    title: 'Confidential OTP / One-Time Code Solicitation',
    titleHi: 'ओटीपी (OTP) या सत्यापन कोड मांगने का प्रयास',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:share|send|tell|provide|disclose|enter)\b.*?\b(?:otp|one[\s-]time\s*password|verification\s*code|6[\s-]digit\s*code)\b/i,
      /\b(?:otp|one[\s-]time\s*password)\s*(?:is|code|verification)\b/i,
      /(?:ओटीपी\s*(?:बताएं|शेयर\s*करें|दें))/i,
    ],
    reason:
      'OTPs are strictly confidential two-factor authorization codes. Financial institutions and regulators will never request your OTP.',
    reasonHi:
      'ओटीपी आपका निजी सुरक्षा कोड है। बैंक या कोई भी असली संस्था कभी भी फोन या चैट पर ओटीपी नहीं मांगती।',
    evidenceIds: ['EVID-RBI-FAKE-KYC-FRAUD'],
    recommendedAction: 'Never disclose OTP to anyone under any circumstance, even if they claim to be from your bank.',
    recommendedActionHi: 'किसी को भी अपना ओटीपी कभी न बताएं, चाहे सामने वाला खुद को बैंक अधिकारी ही क्यों न कहे।',
    claimCategory: 'PAYMENT_REQUEST',
  },
  {
    type: 'PIN_REQUEST',
    title: 'UPI PIN / Card PIN Harvesting Attempt',
    titleHi: 'यूपीआई पिन या एटीएम पिन दर्ज कराने का प्रयास',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:enter\s*(?:your\s*)?(?:upi\s*)?pin\s*to\s*(?:receive|credit|claim|get)\s*money)\b/i,
      /\b(?:share\s*(?:atm|upi|transaction)\s*pin)\b/i,
      /\b(?:enter|share)\b.*?\b(?:upi\s*pin|atm\s*pin)\b/i,
      /(?:पिन\s*(?:दर्ज\s*करें|डालें)\s*पैसे\s*पाने\s*के\s*लिए)/i,
    ],
    reason:
      'UPI PIN is ONLY entered to deduct money from your account. You NEVER need to enter a UPI PIN to receive funds or cashback.',
    reasonHi:
      'पैसे प्राप्त करने के लिए कभी भी यूपीआई पिन की आवश्यकता नहीं होती। पिन केवल पैसे भेजने के लिए होता है।',
    evidenceIds: ['EVID-I4C-MULE-ACCOUNT-PAYMENT'],
    recommendedAction: 'Reject any transaction requesting PIN to receive money. PIN is solely for sending funds.',
    recommendedActionHi: 'पैसे लेने के लिए कभी पिन न डालें। पिन डालने से आपके खाते से पैसे कट जाएंगे।',
    claimCategory: 'PAYMENT_REQUEST',
  },
  {
    type: 'PASSWORD_REQUEST',
    title: 'Account Password / Login Credentials Solicitation',
    titleHi: 'लॉगिन पासवर्ड या गोपनीय क्रेडेंशियल की मांग',
    severity: 'CRITICAL',
    patterns: [
      /\b(?:share\s*(?:your\s*)?(?:login\s*)?password|send\s*password|provide\s*trading\s*password)\b/i,
      /(?:पासवर्ड\s*(?:शेयर\s*करें|बताएं))/i,
    ],
    reason:
      'Asking for trading account passwords or netbanking credentials allows full takeover of your financial portfolio.',
    reasonHi:
      'पासवर्ड शेयर करने से धोखेबाज आपके डिमैट और बैंक खाते का पूरा नियंत्रण हासिल कर लेते हैं।',
    evidenceIds: ['EVID-SEBI-INTERMEDIARY-REGISTRATION'],
    recommendedAction: 'Keep passwords secret. Change passwords immediately if inadvertently shared.',
    recommendedActionHi: 'पासवर्ड किसी को न दें। यदि अनजाने में दे दिया हो, तो तुरंत पासवर्ड बदलें।',
    claimCategory: 'ACCOUNT_STATUS',
  },
  {
    type: 'SUSPICIOUS_DOMAIN',
    title: 'Suspicious Domain / Masked Shortened Link',
    titleHi: 'संदिग्ध वेब लिंक या छुपाया गया यूआरएल',
    severity: 'HIGH',
    patterns: [
      /\b(?:https?:\/\/[^\s]+(?:\.xyz|\.top|\.work|\.icu|\.click|\.vip|\.club|\.buzz)[^\s]*)\b/i,
      /\b(?:https?:\/\/(?:bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|shorturl\.at)\/[^\s]+)\b/i,
    ],
    reason:
      'Obfuscated or non-standard top-level domains are standard delivery mechanisms for credential phishing and fake portal clones.',
    reasonHi:
      'अनजान और छोटे किए गए लिंक्स का उपयोग फर्जी वेबसाइटों पर ले जाकर धोखाधड़ी करने के लिए होता है।',
    evidenceIds: ['EVID-RBI-FAKE-KYC-FRAUD'],
    recommendedAction: 'Do not click untrusted links. Always type official URLs manually into your browser address bar.',
    recommendedActionHi: 'अज्ञात लिंक पर क्लिक न करें। हमेशा आधिकारिक वेबसाइट का पता खुद टाइप करें।',
    claimCategory: 'URGENT_ACTION',
  },
  {
    type: 'IMPERSONATION',
    title: 'Entity / Official Impersonation Pattern',
    titleHi: 'अधिकारी या प्रतिष्ठित बैंक/ब्रोकर की नकल',
    severity: 'HIGH',
    patterns: [
      /\b(?:representative\s*will\s*guide|official\s*(?:customer\s*support|desk|manager))\b/i,
      /\b(?:our\s*agent\s*will\s*(?:call|connect|help\s*you\s*install))\b/i,
      /\b(?:deputy\s*director|senior\s*manager\s*from\s*(?:sebi|rbi|cyber\s*crime))\b/i,
      /\b(?:portfolio\s*manager|fund\s*manager|investment\s*adviser|research\s*analyst|account\s*manager)\b/i,
      /(?:हमारा\s*प्रतिनिधि\s*आपकी\s*मदद\s*करेगा|पोर्टफोलियो\s*मैनेजर)/i,
    ],
    reason:
      'Scammers pose as friendly support agents or senior regulatory officers to win trust and guide victims through fraudulent operations.',
    reasonHi:
      'धोखेबाज खुद को बैंक या सेबी का प्रतिनिधि बताकर विश्वास जीतते हैं और गलत ऐप डाउनलोड कराते हैं।',
    evidenceIds: ['EVID-SEBI-INTERMEDIARY-REGISTRATION'],
    recommendedAction: 'Independently contact the institution via official customer care numbers listed on their registered portal.',
    recommendedActionHi: 'संबंधित बैंक या ब्रोकर की आधिकारिक वेबसाइट से नंबर लेकर खुद बात करें।',
    claimCategory: 'REGULATORY_APPROVAL',
  },
  {
    type: 'INVESTMENT_PRESSURE',
    title: 'Non-Advisory Guardrail: Investment Advice Request',
    titleHi: 'गैर-सलाहकार सुरक्षा नीति: स्टॉक टिप या निवेश सिफारिश की मांग',
    severity: 'MEDIUM',
    patterns: [
      /\b(?:which|what)\s*(?:stock|share|crypto|coin|equity|mutual\s*fund)\s*(?:should\s*i\s*(?:buy|invest|pick)|to\s*(?:buy|purchase)|is\s*best)\b/i,
      /\b(?:should\s*i\s*(?:buy|sell|hold)\s*[a-zA-Z0-9_\s]{1,25}(?:today|tomorrow|now)?)\b/i,
      /\b(?:predict|prediction|target\s*price|price\s*target)\s*(?:of|for)?\s*[a-zA-Z0-9_\s]{1,25}\b/i,
      /\b(?:best\s*broker|which\s*broker|recommend\s*(?:a\s*)?broker|open\s*demat\s*(?:account\s*)?with)\b/i,
      /\b(?:tell\s*me\s*when\s*to\s*(?:buy|sell|exit|enter))\b/i,
      /\b(?:(?:give|send|share)\s*(?:me\s*)?)?(?:stock|trading|intraday|f&o|option|market|equity)\s*(?:trading\s*)?tips\b/i,
      /(?:कौन\s*सा\s*शेयर\s*(?:खरीदें|लें|खरीदूं)|क्या\s*मुझे\s*.*?\s*(?:खरीदना|बेचना)\s*चाहिए|स्टॉक\s*टिप्स\s*दो|शेयर\s*की\s*कीमत\s*बताओ|बेस्ट\s*ब्रोकर)/i,
    ],
    reason:
      'ScamShield Bharat is an investor scam resilience assistant, NOT a SEBI-registered Investment Adviser (RIA). We strictly do not recommend stocks, predict prices, or promote brokers. Under SEBI regulations, only registered Investment Advisers or Research Analysts may provide individual security advice.',
    reasonHi:
      'स्कैमशील्ड भारत केवल वित्तीय धोखाधड़ी से बचाव का सुरक्षा मंच है। हम कोई स्टॉक टिप, शेयर खरीदने/बेचने की सलाह या ब्रोकर प्रमोशन नहीं देते। सेबी नियमावली के तहत केवल पंजीकृत सलाहकार (RIA) ही निवेश सलाह दे सकते हैं।',
    evidenceIds: ['EVID-SEBI-INTERMEDIARY-REGISTRATION'],
    recommendedAction: 'Consult a verified SEBI-registered Investment Adviser (RIA). Check registration on sebi.gov.in.',
    recommendedActionHi: 'केवल सेबी-पंजीकृत सलाहकार से परामर्श लें और sebi.gov.in पर पुष्टि करें।',
    claimCategory: 'REGULATORY_APPROVAL',
  },
  {
    type: 'THIRD_PARTY_PAYMENT',
    title: 'Unofficial Pre-IPO / Syndicate Allocation Solicitation',
    titleHi: 'अनधिकृत प्री-आईपीओ या सिंडिकेट पूल में निवेश की मांग',
    severity: 'HIGH',
    patterns: [
      /\b(?:pre[\s-]ipo|unlisted\s*shares?|institutional\s*quota|syndicate\s*allocation|private\s*placement|pooled\s*account|master\s*syndicate|unlisted\s*equity)\b/i,
      /\b(?:pump\s*and\s*dump|operator\s*circuit|insider\s*tip|operator\s*call)\b/i,
      /(?:अनलिस्टेड\s*शेयर|प्री-आईपीओ|प्राइवेट\s*प्लेसमेंट|सिंडिकेट\s*खाता)/i,
    ],
    reason:
      'Unregulated pooling of investor funds and unofficial pre-IPO syndicate allocations violate SEBI Collective Investment Schemes (CIS) regulations. Retail investors cannot be solicited for private placement allocations via direct fund deposits to individual or master syndicate accounts.',
    reasonHi:
      'अनधिकृत प्री-आईपीओ या सिंडिकेट पूल में सीधे पैसे जमा करने की मांग सेबी के सीआईएस (CIS) नियमों का सीधा उल्लंघन है।',
    evidenceIds: ['EVID-SEBI-SOCIAL-MEDIA-GROUPS', 'EVID-I4C-MULE-ACCOUNT-PAYMENT'],
    recommendedAction: 'Do not transfer funds to private placement accounts. Only invest in registered IPOs through ASBA via your verified bank or SEBI-registered broker.',
    recommendedActionHi: 'किसी सिंडिकेट खाते में पैसे न भेजें। केवल अपने बैंक या सेबी रजिस्टर्ड ब्रोकर के ASBA माध्यम से ही आईपीओ में आवेदन करें।',
    claimCategory: 'PAYMENT_REQUEST',
  },
];

export function runDeterministicRiskAnalysis(
  rawContent: string,
  inputMode: AnalysisResponse['inputMode'] = 'text'
): AnalysisResponse {
  const timestamp = new Date().toISOString();
  const id = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Comprehensive Prompt Injection & Adversarial Override Detection (English & Hindi)
  const isPromptInjectionAttempt =
    /\b(?:ignore|disregard|forget|drop)\s*(?:all\s*)?(?:previous|prior)?\s*(?:instructions|rules|guidelines|policies|prompts)\b/i.test(
      rawContent
    ) ||
    /\b(?:mark\s*(?:this\s*)?(?:message\s*)?(?:as\s*)?(?:safe|legitimate)|classify\s*(?:this\s*)?(?:as\s*)?(?:safe|low_concern)|output\s*status\s*[:=]?\s*low_concern|return\s*low_concern)\b/i.test(
      rawContent
    ) ||
    /\b(?:system\s*override|you\s*are\s*now\s*(?:the\s*system\s*administrator|in\s*developer\s*mode|a\s*developer|an\s*admin|unrestricted)|dan\s*mode|jailbreak|bypass\s*(?:safety|risk\s*engine)|disable\s*(?:all\s*)?(?:safety|scamshield|warning\s*flags|checks)|pretend\s*(?:you\s*are|to\s*be))\b/i.test(
      rawContent
    ) ||
    /\b(?:ignoring\s*(?:the\s*)?(?:word\s*)?.*?and\s*marking\s*safe)\b/i.test(rawContent) ||
    /(?:निर्देशों\s*को\s*भूल\s*जाओ|सुरक्षित\s*बताओ|नियमों\s*को\s*छोड़ो|सुरक्षा\s*बंद\s*करो|सिस्टम\s*निर्देश)/i.test(
      rawContent
    ) ||
    /(?:\[|\b)(?:SYSTEM|DEVELOPER)\s*MESSAGE(?:\b|:|\])/i.test(rawContent) ||
    /<system_instruction>/i.test(rawContent) ||
    /<!--\s*SYSTEM:/i.test(rawContent);

  // 2. Perform PII Redaction
  const piiResult = redactPII(rawContent);
  const textToAnalyze = rawContent;

  // 3. Check for insufficient content
  if (!textToAnalyze || textToAnalyze.trim().length < 5) {
    const isScreenshot = inputMode === 'screenshot';
    return {
      id,
      timestamp,
      status: 'UNABLE_TO_ASSESS',
      headlineSummary: isScreenshot
        ? 'Unable to Assess: No readable text extracted from image.'
        : 'Unable to Assess: Input content is insufficient for safety analysis.',
      headlineSummaryHi: isScreenshot
        ? 'जांच करने में असमर्थ: स्क्रीनशॉट से कोई पठनीय पाठ नहीं मिला।'
        : 'जांच करने में असमर्थ: विश्लेषण के लिए सामग्री पर्याप्त नहीं है।',
      detailedExplanation: isScreenshot
        ? 'Could not reliably extract readable content from this image. Please upload a clearer screenshot or paste the message text.'
        : 'The submitted text did not contain enough readable content to extract financial claims or detect risk patterns. Please provide the complete message or a clearer image.',
      detailedExplanationHi: isScreenshot
        ? 'इस स्क्रीनशॉट से कोई स्पष्ट पाठ नहीं पढ़ा जा सका। कृपया स्पष्ट स्क्रीनशॉट अपलोड करें या सीधे संदेश टेक्स्ट दर्ज करें।'
        : 'भेजे गए संदेश में वित्तीय दावों की जांच के लिए पर्याप्त जानकारी नहीं मिली। कृपया पूरा संदेश या स्पष्ट स्क्रीनशॉट भेजें।',
      claims: [],
      riskSignals: [],
      evidence: [],
      verifiedInformation: [],
      couldNotVerify: [
        {
          claim: 'Complete context',
          reason: isScreenshot ? 'No readable text was detected in the uploaded screenshot.' : 'Input content was too short or empty.',
          reasonHi: isScreenshot ? 'अपलोड किए गए स्क्रीनशॉट में कोई स्पष्ट टेक्स्ट नहीं मिला।' : 'संदेश बहुत छोटा या खाली था।',
          howToVerifyIndependently: 'Provide the full original text message or direct web link.',
          howToVerifyIndependentlyHi: 'पूरा मूल संदेश या सीधा वेब लिंक दर्ज करें।',
        },
      ],
      safeNextSteps: [
        {
          step: 1,
          category: 'STOP',
          title: 'Provide Complete Context',
          titleHi: 'पूरा संदेश दर्ज करें',
          description: isScreenshot
            ? 'Upload a clearer screenshot or type the key message text into the message box.'
            : 'Paste the entire message including sender info or link to analyze risks thoroughly.',
          descriptionHi: isScreenshot
            ? 'स्पष्ट स्क्रीनशॉट अपलोड करें या मुख्य संदेश टेक्स्ट सीधे दर्ज करें।'
            : 'पूरी जानकारी के साथ संदेश पेस्ट करें ताकि सही विश्लेषण हो सके।',
          actionType: 'info',
        },
      ],
      piiRedacted: piiResult.piiDetected,
      redactedInputPreview: piiResult.redactedText.substring(0, 200),
      inputMode,
      disclaimer:
        'ScamShield Bharat provides evidence-backed risk analysis for educational safety purposes. It is not an investment advisor or legal determination.',
      disclaimerHi:
        'स्कैमशील्ड भारत शैक्षिक सुरक्षा विश्लेषण प्रदान करता है। यह कोई निवेश सलाह या कानूनी फैसला नहीं है।',
    };
  }

  // 4. Detect Risk Signals & Extract Claims
  const detectedSignals: RiskSignal[] = [];
  const extractedClaims: ExtractedClaim[] = [];
  const matchedEvidenceIds = new Set<string>();

  // If prompt injection was attempted, flag it immediately as a critical manipulation signal
  if (isPromptInjectionAttempt) {
    detectedSignals.push({
      id: `sig_prompt_inject_${Date.now()}`,
      type: 'UNVERIFIED_IDENTITY',
      title: 'Adversarial Prompt Override Attempt Detected',
      titleHi: 'संदेश में सिस्टम को गुमराह करने वाले निर्देश पाए गए',
      severity: 'CRITICAL',
      reason:
        'The submitted text contains explicit override instructions designed to manipulate automated safety evaluators.',
      reasonHi:
        'इस संदेश में सुरक्षा जांच को चकमा देने वाले विशेष निर्देश पाए गए हैं। यह अत्यधिक संदिग्ध है।',
      evidenceIds: ['EVID-SEBI-SOCIAL-MEDIA-GROUPS'],
      recommendedAction: 'Treat this message as extremely untrusted. Do not interact with the sender.',
      recommendedActionHi: 'इस संदेश पर बिल्कुल भी भरोसा न करें और भेजने वाले से संपर्क काट दें।',
    });
    matchedEvidenceIds.add('EVID-SEBI-SOCIAL-MEDIA-GROUPS');
  }

  // Analyze against rules
  for (const rule of RISK_DETECTOR_RULES) {
    for (const pattern of rule.patterns) {
      const match = textToAnalyze.match(pattern);
      if (match) {
        const signalId = `sig_${rule.type}_${detectedSignals.length + 1}`;
        detectedSignals.push({
          id: signalId,
          type: rule.type,
          title: rule.title,
          titleHi: rule.titleHi,
          severity: rule.severity,
          reason: rule.reason,
          reasonHi: rule.reasonHi,
          detectedText: match[0],
          evidenceIds: rule.evidenceIds,
          recommendedAction: rule.recommendedAction,
          recommendedActionHi: rule.recommendedActionHi,
        });

        rule.evidenceIds.forEach((eid) => matchedEvidenceIds.add(eid));

        // Create a matching extracted claim
        if (rule.claimCategory) {
          extractedClaims.push({
            id: `claim_${extractedClaims.length + 1}`,
            text: match[0],
            category: rule.claimCategory,
            status: 'RISK_SIGNAL',
            explanation: rule.reason,
            hindiExplanation: rule.reasonHi,
            flaggedPhrases: [match[0]],
          });
        }
        break;
      }
    }
  }

  // Check URL if applicable
  if (inputMode === 'url' || /https?:\/\/[^\s]+/i.test(textToAnalyze)) {
    const urlMatch = textToAnalyze.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      const parsedUrl = validateAndParseUrl(urlMatch[0]);
      if (parsedUrl.isShortener) {
        detectedSignals.push({
          id: `sig_shortener_${Date.now()}`,
          type: 'SUSPICIOUS_DOMAIN',
          title: 'URL Shortener Used to Mask Destination',
          titleHi: 'असली वेबसाइट छुपाने के लिए शॉर्ट लिंक का उपयोग',
          severity: 'HIGH',
          reason:
            'The link uses a URL shortener which hides the true server destination and prevents browser security previews.',
          reasonHi: 'यह लिंक असली वेबसाइट का पता छुपाता है, जिससे धोखाधड़ी की संभावना बढ़ जाती है।',
          detectedText: urlMatch[0],
          evidenceIds: ['EVID-RBI-FAKE-KYC-FRAUD'],
          recommendedAction: 'Do not open shortened links received from unverified sources.',
          recommendedActionHi: 'अनजान स्रोतों से आए शॉर्ट लिंक पर क्लिक न करें।',
        });
        matchedEvidenceIds.add('EVID-RBI-FAKE-KYC-FRAUD');
      }
    }
  }

  // 5. Correlate Evidence
  const evidence = OFFICIAL_EVIDENCE_DATABASE.filter((e) => matchedEvidenceIds.has(e.id));

  if (evidence.length === 0 && detectedSignals.length > 0) {
    const defaultEvid = OFFICIAL_EVIDENCE_DATABASE[0];
    if (defaultEvid) evidence.push(defaultEvid);
  }

  // 6. Formulate Could Not Verify items
  const couldNotVerify: CouldNotVerifyItem[] = [];
  if (textToAnalyze.toLowerCase().includes('sebi') || textToAnalyze.toLowerCase().includes('approved')) {
    couldNotVerify.push({
      claim: 'Entity SEBI Registration & Legitimacy',
      reason: 'No valid searchable registration number (e.g. INA/INH) was linked in the message.',
      reasonHi: 'संदेश में कोई मान्य सेबी रजिस्ट्रेशन नंबर (जैसे INA/INH) नहीं मिला।',
      howToVerifyIndependently:
        'Search the firm or advisor name on the official SEBI Recognised Intermediaries Registry.',
      howToVerifyIndependentlyHi: 'सेबी की मान्यता प्राप्त मध्यस्थ डायरेक्टरी पर जाकर संस्था का नाम जांचें।',
    });
  }
  if (textToAnalyze.toLowerCase().includes('kyc') || textToAnalyze.toLowerCase().includes('account')) {
    couldNotVerify.push({
      claim: 'Bank Account / Trading Account Suspension State',
      reason: 'Third-party messages cannot accurately reflect internal bank server statuses.',
      reasonHi: 'कोई भी मैसेज आपके बैंक खाते की असली स्थिति की पुष्टि नहीं कर सकता।',
      howToVerifyIndependently:
        'Open your official mobile banking app directly or call your branch phone number.',
      howToVerifyIndependentlyHi: 'सीधे अपने बैंक के आधिकारिक ऐप में लॉगिन करें या शाखा में बात करें।',
    });
  }

  // 7. Determine Risk Status (Section 6)
  const criticalCount = detectedSignals.filter((s) => s.severity === 'CRITICAL').length;
  const highCount = detectedSignals.filter((s) => s.severity === 'HIGH').length;
  const mediumCount = detectedSignals.filter((s) => s.severity === 'MEDIUM').length;

  let status: RiskLevel = 'LOW_CONCERN';
  if (criticalCount > 0 || highCount >= 2 || (highCount >= 1 && mediumCount >= 1)) {
    status = 'HIGH_CONCERN';
  } else if (highCount === 1 || mediumCount >= 1) {
    status = 'NEEDS_VERIFICATION';
  } else {
    status = 'LOW_CONCERN';
  }

  // 8. Verified Information
  const verifiedInformation: VerifiedInformation[] = [];
  if (status === 'HIGH_CONCERN') {
    verifiedInformation.push({
      topic: 'SEBI Guaranteed Return Regulations',
      statement:
        'SEBI regulations strictly prohibit any registered entity from offering guaranteed returns on market-linked securities.',
      statementHi:
        'सेबी के नियमानुसार शेयर बाजार में किसी भी रजिस्टर्ड इकाई द्वारा गारंटीड रिटर्न देना पूरी तरह प्रतिबंधित है।',
      sourceName: OFFICIAL_SOURCES.SEBI_INVESTOR_SPOT_SCAM.name,
      sourceUrl: OFFICIAL_SOURCES.SEBI_INVESTOR_SPOT_SCAM.url,
    });
  }

  // 9. Build Safe Next Steps
  const safeNextSteps: SafeActionStep[] = [
    {
      step: 1,
      category: 'STOP',
      title: 'Pause Before Transferring Money',
      titleHi: 'पैसे भेजने से पहले रुकें और विचार करें',
      description:
        'Do not send money, deposit capital, or click verification links. Take 15 minutes to evaluate without pressure.',
      descriptionHi:
        'कोई भी पैसा ट्रांसफर न करें और न ही किसी लिंक पर क्लिक करें। जल्दबाजी में कोई कदम न उठाएं।',
      actionType: 'warning',
    },
    {
      step: 2,
      category: 'PROTECT',
      title: 'Never Share OTP, PIN, or Screen Access',
      titleHi: 'ओटीपी, यूपीआई पिन या स्क्रीन शेयर कभी न करें',
      description:
        'No bank or regulatory officer will ever ask for your OTP, PIN, netbanking password, or remote access apps (AnyDesk/QuickSupport).',
      descriptionHi:
        'बैंक या कोई भी सरकारी संस्था आपसे कभी भी फोन पर ओटीपी, पासवर्ड या स्क्रीन शेयरिंग ऐप डाउनलोड करने को नहीं कहती।',
      actionType: 'critical',
    },
    {
      step: 3,
      category: 'VERIFY',
      title: 'Check Official Registries Independently',
      titleHi: 'आधिकारिक वेबसाइट पर जाकर खुद जांचें',
      description:
        'Verify registered intermediaries directly on sebi.gov.in or sachet.rbi.org.in. Never use contact numbers inside the message.',
      descriptionHi:
        'सेबी (sebi.gov.in) या आरबीआई (sachet.rbi.org.in) पर जाकर सीधे पुष्टि करें। मैसेज में दिए नंबर पर कॉल न करें।',
      officialUrl: OFFICIAL_SOURCES.SEBI_INTERMEDIARIES.url,
      actionType: 'info',
    },
    {
      step: 4,
      category: 'REPORT',
      title: 'Report Financial Cyber Fraud (Helpline 1930)',
      titleHi: 'साइबर हेल्पलाइन 1930 पर तुरंत शिकायत दर्ज करें',
      description:
        'If you shared sensitive info or lost funds, immediately call the National Cybercrime Helpline 1930 or register at cybercrime.gov.in.',
      descriptionHi:
        'यदि आपके साथ धोखाधड़ी हुई है, तो तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर शिकायत दर्ज करें।',
      contactNumber: '1930',
      officialUrl: OFFICIAL_SOURCES.CYBERCRIME_PORTAL.url,
      actionType: 'action',
    },
    {
      step: 5,
      category: 'RECOVER',
      title: 'Immediate Safe Recovery Protocol',
      titleHi: 'सुरक्षित रिकवरी के तत्काल कदम',
      description:
        'Block compromised debit/credit cards via your banking app, change internet banking passwords, and notify your relationship manager.',
      descriptionHi:
        'अपने बैंक ऐप से कार्ड तुरंत ब्लॉक करें, नेट बैंकिंग का पासवर्ड बदलें और अपने बैंक को सूचित करें।',
      actionType: 'action',
    },
  ];

  // 10. Generate plain-language summaries
  let headlineSummary = '';
  let headlineSummaryHi = '';
  let detailedExplanation = '';
  let detailedExplanationHi = '';

  const isNonAdvisoryRequest = detectedSignals.some((s) =>
    s.title.includes('Non-Advisory Guardrail')
  );

  if (isNonAdvisoryRequest && criticalCount === 0) {
    status = 'NEEDS_VERIFICATION';
    headlineSummary = 'Non-Advisory Notice: ScamShield Bharat does not provide stock tips or price predictions.';
    headlineSummaryHi = 'गैर-सलाहकार सुरक्षा नीति: स्कैमशील्ड भारत स्टॉक टिप्स या निवेश की सिफारिशें नहीं देता है।';
    detailedExplanation =
      'ScamShield Bharat is an evidence-first financial scam verification assistant, not a SEBI-registered Investment Adviser. We strictly do not recommend stocks, predict price movements, or endorse brokers. Under SEBI (Investment Advisers) Regulations, 2013, individual security recommendations may only be provided by SEBI-registered professionals. Please consult the official SEBI Intermediary Registry to find registered advisors.';
    detailedExplanationHi =
      'स्कैमशील्ड भारत केवल धोखाधड़ी और संदेहास्पद संदेशों की जांच के लिए बनाया गया सुरक्षा प्लेटफॉर्म है। हम कोई स्टॉक टिप, शेयर खरीदने/बेचने की सलाह या ब्रोकर प्रमोशन नहीं देते। सेबी नियमावली के अनुसार व्यक्तिगत निवेश सलाह केवल सेबी-पंजीकृत सलाहकार (RIA) ही दे सकते हैं।';
  } else if (status === 'HIGH_CONCERN') {
    headlineSummary = `High Concern: ${detectedSignals.length} risk signals detected including high-risk pressure or financial solicitation.`;
    headlineSummaryHi = `अत्यधिक जोखिम (High Concern): इस संदेश में ${detectedSignals.length} गंभीर खतरे के संकेत मिले हैं।`;
    detailedExplanation =
      'This message exhibits multiple high-risk indicators commonly associated with financial fraud, such as promises of guaranteed returns, artificial urgency, threats of account suspension, or requests for direct funds/software installation. Exercise extreme caution and do not transfer money or share credentials.';
    detailedExplanationHi =
      'इस संदेश में वित्तीय धोखाधड़ी से जुड़े कई गंभीर लक्षण पाए गए हैं, जैसे गारंटीड मुनाफे का लालच, समय का दबाव, खाता बंद होने की धमकी या ऐप डाउनलोड कराने का प्रयास। कृपया कोई पैसा न भेजें और न ही कोई जानकारी साझा करें।';
  } else if (status === 'NEEDS_VERIFICATION') {
    headlineSummary = 'Needs Verification: Contains claims that could not be independently confirmed.';
    headlineSummaryHi = 'सत्यापन आवश्यक (Needs Verification): इसमें ऐसे दावे हैं जिनकी स्वतंत्र पुष्टि नहीं हो सकी।';
    detailedExplanation =
      'While no overt critical extortion was identified, the message contains unverified claims, third-party redirects, or regulatory mentions that require manual verification through official portals before taking any action.';
    detailedExplanationHi =
      'संदेश में दिए गए दावों या लिंक्स की आधिकारिक स्रोतों से स्वतंत्र पुष्टि नहीं हो पाई है। कोई भी कदम उठाने से पहले आधिकारिक पोर्टल पर जांच अवश्य करें।';
  } else {
    headlineSummary = 'Low Concern: No typical high-risk scam indicators detected in this content.';
    headlineSummaryHi = 'कम जोखिम (Low Concern): इस संदेश में कोई सामान्य धोखाधड़ी के संकेत नहीं मिले।';
    detailedExplanation =
      'The analyzed content did not trigger standard scam markers (such as guaranteed yields, threats, or credential requests). However, always ensure you independently confirm sender authenticity before executing financial transactions.';
    detailedExplanationHi =
      'इस सामग्री में कोई खतरनाक संकेत नहीं मिला। फिर भी किसी भी वित्तीय लेन-देन से पहले भेजने वाले की पहचान की पुष्टि अवश्य करें।';
  }

  return {
    id,
    timestamp,
    status,
    headlineSummary,
    headlineSummaryHi,
    detailedExplanation,
    detailedExplanationHi,
    claims: extractedClaims,
    riskSignals: detectedSignals,
    evidence,
    verifiedInformation,
    couldNotVerify,
    safeNextSteps,
    piiRedacted: piiResult.piiDetected,
    redactedInputPreview: stripHtml(piiResult.redactedText).substring(0, 300),
    inputMode,
    disclaimer:
      'ScamShield Bharat provides evidence-backed risk analysis for educational safety purposes. It is not an investment advisor or legal determination.',
    disclaimerHi:
      'स्कैमशील्ड भारत शैक्षिक सुरक्षा विश्लेषण प्रदान करता है। यह कोई निवेश सलाह या कानूनी फैसला नहीं है।',
  };
}
