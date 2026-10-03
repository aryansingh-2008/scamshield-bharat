import { EvidenceRecord } from '@/types';
import { OFFICIAL_SOURCES } from './official-sources';

export const OFFICIAL_EVIDENCE_DATABASE: EvidenceRecord[] = [
  {
    id: 'EVID-SEBI-GUARANTEED-RETURNS',
    topic: 'guaranteed_returns',
    title: 'SEBI Advisory on Promised High/Guaranteed Returns',
    titleHi: 'सेबी की निश्चित/गारंटीड रिटर्न योजनाओं पर चेतावनी',
    summary:
      'SEBI mandates that no registered intermediary or entity in the Indian securities market is permitted to offer guaranteed or fixed high monthly returns on equity or derivative investments. Any scheme guaranteeing 20-50% monthly returns is illegal and unauthorized.',
    summaryHi:
      'सेबी (SEBI) के नियमानुसार भारतीय शेयर बाजार में कोई भी रजिस्टर्ड संस्था या व्यक्ति गारंटीड या भारी मासिक मुनाफे का वादा नहीं कर सकता। 20-50% महीने का रिटर्न देने का दावा पूरी तरह गैर-कानूनी और अनधिकृत है।',
    sourceName: OFFICIAL_SOURCES.SEBI_INVESTOR_SPOT_SCAM.name,
    sourceUrl: OFFICIAL_SOURCES.SEBI_INVESTOR_SPOT_SCAM.url,
    sourceType: 'official_regulator',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'EVID-SEBI-SOCIAL-MEDIA-GROUPS',
    topic: 'unregistered_social_media',
    title: 'SEBI Advisory on Social Media Investment Groups & Fake Apps',
    titleHi: 'टेलीग्राम और व्हाट्सएप निवेश ग्रुप्स पर सेबी का आधिकारिक अलर्ट',
    summary:
      'SEBI warns investors against joining unauthorized Telegram channels and WhatsApp groups offering exclusive institutional trading tips, pre-IPO allocations, or VIP trading rooms managed by unregistered operators.',
    summaryHi:
      'सेबी ने निवेशकों को अनधिकृत टेलीग्राम और व्हाट्सएप ग्रुप्स से बचने की सख्त हिदायत दी है, जहाँ वीआईपी ट्रेडिंग रूम्स या भारी मुनाफे का लालच देकर पैसे ट्रांसफर करवाए जाते हैं।',
    sourceName: OFFICIAL_SOURCES.SEBI_FAKE_APP_ADVISORY.name,
    sourceUrl: OFFICIAL_SOURCES.SEBI_FAKE_APP_ADVISORY.url,
    sourceType: 'official_regulator',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'EVID-RBI-FAKE-KYC-FRAUD',
    topic: 'fake_kyc_expiry',
    title: 'RBI Cautionary Notice on KYC Update & Account Suspension SMS',
    titleHi: 'आरबीआई चेतावनी: फर्जी केवाईसी अपडेट और खाता ब्लॉक होने के संदेश',
    summary:
      'The Reserve Bank of India (RBI) clarifies that banks and registered financial institutions never send SMS or WhatsApp messages threatening immediate suspension of accounts within 24 hours with third-party verification links or phone numbers.',
    summaryHi:
      'भारतीय रिज़र्व बैंक (RBI) के अनुसार कोई भी बैंक या वित्तीय संस्थान 24 घंटे में खाता बंद करने की धमकी देकर अनधिकृत लिंक पर केवाईसी अपडेट करने को नहीं कहता।',
    sourceName: OFFICIAL_SOURCES.RBI_SACHET.name,
    sourceUrl: OFFICIAL_SOURCES.RBI_SACHET.url,
    sourceType: 'official_regulator',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'EVID-CERTIN-MALICIOUS-APKS',
    topic: 'remote_access_apk',
    title: 'CERT-In Advisory on Fraudulent Support and Trading APKs',
    titleHi: 'सर्ट-इन (CERT-In) एडवाइजरी: फर्जी ट्रेडिंग और रिमोट एक्सेस ऐप (APK)',
    summary:
      'CERT-In warns against downloading APK files outside official app stores (Google Play/Apple App Store). Malicious APKs disguised as customer support or trading apps harvest SMS OTPs, keystrokes, and permit unauthorized remote device control.',
    summaryHi:
      'CERT-In की चेतावनी: गूगल प्ले स्टोर के बाहर किसी अनजान लिंक से APK फाइल या सपोर्ट ऐप डाउनलोड न करें। ये आपके फोन का पूरा कंट्रोल और ओटीपी चुरा लेते हैं।',
    sourceName: OFFICIAL_SOURCES.CERT_IN.name,
    sourceUrl: OFFICIAL_SOURCES.CERT_IN.url,
    sourceType: 'cybercrime_portal',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'EVID-I4C-MULE-ACCOUNT-PAYMENT',
    topic: 'third_party_payment',
    title: 'MHA / I4C Alert on Personal UPI IDs and Third-Party Beneficiaries',
    titleHi: 'गृह मंत्रालय (I4C) अलर्ट: व्यक्तिगत UPI आईडी या तीसरे पक्ष के खातों में भुगतान',
    summary:
      'Legitimate SEBI-registered brokers and investment platforms only collect funds via verified client bank accounts into designated Clearing Corporation / Broker settlement accounts, never to personal UPI handles or individual savings bank accounts.',
    summaryHi:
      'असली सेबी रजिस्टर्ड ब्रोकर केवल अधिकृत सेटलमेंट खातों में फंड लेते हैं। किसी व्यक्ति के पर्सनल UPI या बचत खाते में पैसे ट्रांसफर करने की मांग सीधा फ्रॉड का संकेत है।',
    sourceName: OFFICIAL_SOURCES.CYBERCRIME_PORTAL.name,
    sourceUrl: OFFICIAL_SOURCES.CYBERCRIME_PORTAL.url,
    sourceType: 'cybercrime_portal',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'EVID-SEBI-INTERMEDIARY-REGISTRATION',
    topic: 'unregistered_intermediary',
    title: 'SEBI Mandatory Registration Verification Protocol',
    titleHi: 'सेबी अनिवार्य पंजीकरण और पहचान सत्यापन नियम',
    summary:
      'Any individual or entity claiming to be an Investment Adviser (IA) or Research Analyst (RA) must possess a valid SEBI registration number (e.g., INA/INH series). Always verify the registration on the official SEBI Intermediary registry before trusting claims.',
    summaryHi:
      'कोई भी संस्था जो निवेश सलाह देती है, उसके पास सेबी का वैध रजिस्ट्रेशन नंबर (जैसे INA/INH) होना अनिवार्य है। सेबी की मान्यता प्राप्त मध्यस्थ डायरेक्टरी पर जाकर पुष्टि करें।',
    sourceName: OFFICIAL_SOURCES.SEBI_INTERMEDIARIES.name,
    sourceUrl: OFFICIAL_SOURCES.SEBI_INTERMEDIARIES.url,
    sourceType: 'official_regulator',
    lastReviewed: '2026-10-03',
  },
  {
    id: 'EVID-CYBERCRIME-1930-HELPLINE',
    topic: 'immediate_recovery',
    title: 'National Financial Cyber Fraud Reporting Protocol (1930)',
    titleHi: 'राष्ट्रीय साइबर वित्तीय अपराध हेल्पलाइन (1930) प्रोटोकॉल',
    summary:
      'In case of unauthorized transactions, immediate reporting to the National Cybercrime Helpline 1930 or cybercrime.gov.in within the "Golden Hour" enables banks to freeze illicit money trails before extraction.',
    summaryHi:
      'यदि धोखाधड़ी में पैसे कट गए हों, तो तुरंत राष्ट्रीय हेल्पलाइन 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें ताकि बैंक संदिग्ध खाते को तुरंत फ्रीज कर सके।',
    sourceName: OFFICIAL_SOURCES.CYBERCRIME_PORTAL.name,
    sourceUrl: OFFICIAL_SOURCES.CYBERCRIME_PORTAL.url,
    sourceType: 'law_enforcement',
    lastReviewed: '2026-10-03',
  },
];
