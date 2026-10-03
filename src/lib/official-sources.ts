export interface OfficialSource {
  id: string;
  name: string;
  nameHi: string;
  url: string;
  category: 'regulator' | 'cybercrime' | 'grievance' | 'organizer' | 'cybersecurity' | 'financial_scheme';
  purpose: string;
  purposeHi: string;
  sourceType: 'official_regulator' | 'cybercrime_portal' | 'law_enforcement' | 'exchange_advisory' | 'organizer';
  verifiedAt: string;
  status: 'VERIFIED' | 'VERIFIED_BY_ORGANIZER' | 'SOURCE_PROVIDED_BY_OFFICIAL_MATERIAL_LIVE_UNVERIFIED';
}

export const OFFICIAL_SOURCES: Record<string, OfficialSource> = {
  SANGYAN_WEBSITE: {
    id: 'SANGYAN_WEBSITE',
    name: 'SANGYAN Official Website',
    nameHi: 'संज्ञान आधिकारिक वेबसाइट',
    url: 'https://sangyan.sntciitbhu.co.in/',
    category: 'organizer',
    purpose: 'Hackathon information / organizer context',
    purposeHi: 'हैकाथॉन संदर्भ एवं आयोजक जानकारी',
    sourceType: 'organizer',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED_BY_ORGANIZER',
  },
  SANGYAN_DISCORD: {
    id: 'SANGYAN_DISCORD',
    name: 'SANGYAN Official Discord',
    nameHi: 'संज्ञान आधिकारिक डिस्कॉर्ड',
    url: 'https://discord.gg/Q69UG3cWq',
    category: 'organizer',
    purpose: 'Official community / participant charter support link',
    purposeHi: 'आधिकारिक कम्युनिटी / प्रतिभागी सपोर्ट लिंक',
    sourceType: 'organizer',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED_BY_ORGANIZER',
  },
  SEBI_INTERMEDIARIES: {
    id: 'SEBI_INTERMEDIARIES',
    name: 'SEBI Recognised Intermediaries Registry',
    nameHi: 'सेबी मान्यता प्राप्त मध्यस्थ (Intermediaries) डायरेक्टरी',
    url: 'https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognised=yes',
    category: 'regulator',
    purpose: 'Intermediary registration verification (verify registered broker, IA, RA license numbers)',
    purposeHi: 'सेबी रजिस्टर्ड ब्रोकर या सलाहकार के लाइसेंस नंबर का आधिकारिक सत्यापन',
    sourceType: 'official_regulator',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED',
  },
  SEBI_INVESTOR_SPOT_SCAM: {
    id: 'SEBI_INVESTOR_SPOT_SCAM',
    name: 'SEBI Investor Portal — Spot Any Scam',
    nameHi: 'सेबी निवेशक पोर्टल — धोखाधड़ी की पहचान',
    url: 'https://investor.sebi.gov.in/spot-any-scam.html',
    category: 'regulator',
    purpose: 'Official guidance on spotting fraudulent return promises, fake tipsters, and pressure tactics',
    purposeHi: 'गारंटीड रिटर्न, फर्जी टिप्स और जल्दबाजी के दबाव की पहचान पर सेबी गाइड',
    sourceType: 'official_regulator',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED',
  },
  SEBI_FAKE_APP_ADVISORY: {
    id: 'SEBI_FAKE_APP_ADVISORY',
    name: 'SEBI Fake Trading App Scam Landscape Advisory',
    nameHi: 'सेबी फर्जी ट्रेडिंग ऐप एडवाइजरी (Landscape Report)',
    url: 'https://investor.sebi.gov.in/pdf/Fake%20trading%20app%20scam%20Landscape.pdf',
    category: 'regulator',
    purpose: 'Evidence on fake trading apps, social-media tipping groups, third-party UPI mule accounts, and sideloaded APKs',
    purposeHi: 'फर्जी ट्रेडिंग ऐप, टेलीग्राम ग्रुप्स और म्यूल खातों पर आधिकारिक सेबी रिपोर्ट',
    sourceType: 'official_regulator',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED',
  },
  SEBI_SCORES: {
    id: 'SEBI_SCORES',
    name: 'SEBI SCORES 2.0 Grievance Redressal Portal',
    nameHi: 'सेबी स्कोर्स (SCORES 2.0) शिकायत निवारण पोर्टल',
    url: 'https://scores.sebi.gov.in/scores-home',
    category: 'grievance',
    purpose: 'Official investor grievance redressal portal (for lodging complaints against registered entities)',
    purposeHi: 'सेबी रजिस्टर्ड इकाइयों के खिलाफ आधिकारिक शिकायत दर्ज करने का पोर्टल',
    sourceType: 'official_regulator',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED',
  },
  CYBERCRIME_PORTAL: {
    id: 'CYBERCRIME_PORTAL',
    name: 'National Cyber Crime Reporting Portal (MHA)',
    nameHi: 'राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल (गृह मंत्रालय)',
    url: 'https://www.cybercrime.gov.in/',
    category: 'cybercrime',
    purpose: 'Official cyber-fraud reporting portal for lodging financial crime complaints',
    purposeHi: 'ऑनलाइन वित्तीय धोखाधड़ी की आधिकारिक पुलिस शिकायत दर्ज करने का पोर्टल',
    sourceType: 'cybercrime_portal',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED',
  },
  CERT_IN: {
    id: 'CERT_IN',
    name: 'Indian Computer Emergency Response Team (CERT-In)',
    nameHi: 'सर्ट-इन (CERT-In) साइबर सुरक्षा केंद्र',
    url: 'https://www.cert-in.org.in/',
    category: 'cybersecurity',
    purpose: 'National cybersecurity vulnerability tracking and malicious APK advisories',
    purposeHi: 'मालवेयर, फर्जी APK और साइबर सुरक्षा चेतावनियों का आधिकारिक राष्ट्रीय केंद्र',
    sourceType: 'cybercrime_portal',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED',
  },
  RBI_SACHET: {
    id: 'RBI_SACHET',
    name: 'Reserve Bank of India (RBI Sachet Portal)',
    nameHi: 'आरबीआई सचेत (Sachet) पोर्टल',
    url: 'https://sachet.rbi.org.in/',
    category: 'financial_scheme',
    purpose: 'RBI-referenced reporting and verification channel for unauthorized deposit collection schemes',
    purposeHi: 'अवैध जमा योजनाओं और वित्तीय धोखाधड़ी की सूचना देने का आरबीआई पोर्टल',
    sourceType: 'official_regulator',
    verifiedAt: '2026-10-03',
    status: 'VERIFIED',
  },
};

export const CYBERCRIME_HELPLINE = {
  number: '1930',
  name: 'National Financial Cyber Fraud Helpline (1930)',
  nameHi: 'राष्ट्रीय वित्तीय साइबर धोखाधड़ी हेल्पलाइन (1930)',
  purpose: 'Immediate financial cyber-fraud assistance to freeze stolen funds within the Golden Hour',
  purposeHi: 'धोखाधड़ी होने पर तुरंत संदिग्ध खाते को फ्रीज कराने के लिए 24x7 हेल्पलाइन',
  authority: 'Ministry of Home Affairs (I4C)',
};
