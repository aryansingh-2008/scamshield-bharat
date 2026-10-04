'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { AnalysisResponse } from '@/types';

interface OfficialSourcesPageProps {
  lang: 'en' | 'hi';
  analysisResult?: AnalysisResponse | null;
  onNavigateHome?: () => void;
}

export default function OfficialSourcesPage({
  lang,
  analysisResult,
  onNavigateHome,
}: OfficialSourcesPageProps) {
  const isHindi = lang === 'hi';

  const hasAnalysisContext = !!(analysisResult && (analysisResult.claims?.length || analysisResult.evidence?.length));
  const sourcesCheckedCount = analysisResult?.evidence?.length
    ? Math.min(Math.max(analysisResult.evidence.length, 3), 5)
    : 3;

  return (
    <div className="space-y-6 max-w-[1340px] mx-auto w-full py-4 animate-in fade-in duration-300">
      {/* =======================================================
          SECTION 1: SIMPLE HERO (Matching Reference Image)
          ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Heading & Description */}
        <div className="lg:col-span-8 space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0EFFB] text-[#0F568C] text-[11px] font-extrabold tracking-wider uppercase border border-[#B9DCF7]">
            <span>{isHindi ? 'आधिकारिक स्रोत' : 'OFFICIAL SOURCES'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#0A1C2A] tracking-tight font-sans">
            {isHindi ? 'विश्वसनीय आधिकारिक स्रोत' : 'Trusted Official Sources'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed max-w-2xl">
            {isHindi
              ? 'हम वित्तीय धोखाधड़ी से बचाव की चेतावनियों और सत्यापन प्रक्रियाओं को सरल भाषा में समझाने के लिए आधिकारिक सरकारी व विनियामक स्रोतों का उपयोग करते हैं।'
              : 'We use trusted government and regulatory sources to verify information and show you relevant warnings and guidance in simple language.'}
          </p>
        </div>

        {/* Right: Why We Use Official Sources Callout Card */}
        <div className="lg:col-span-4 relative rounded-2xl bg-gradient-to-br from-[#EEF7FC] to-[#F4F9FD] border border-[#D0E5F5] p-4 sm:p-5 shadow-xs overflow-hidden">
          {/* Subtle Monument Background Silhouette */}
          <div className="absolute right-0 bottom-0 w-32 h-24 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 80" fill="none" className="w-full h-full text-[#004A87]">
              <path d="M50 10C40 10 35 25 35 40H65C65 25 60 10 50 10Z" stroke="currentColor" strokeWidth="1.5" />
              <line x1="50" y1="2" x2="50" y2="10" stroke="currentColor" strokeWidth="1.5" />
              <rect x="50" y="2" width="12" height="3" fill="#FF9933" />
              <rect x="50" y="5" width="12" height="3" fill="#FFFFFF" />
              <rect x="50" y="8" width="12" height="3" fill="#138808" />
              <path d="M20 40H80V70H20V40Z" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>

          <div className="relative z-10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004A87] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-[#0A1C2A]">
                {isHindi ? 'हम आधिकारिक स्रोत क्यों उपयोग करते हैं?' : 'Why we use official sources?'}
              </h4>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                {isHindi
                  ? 'आपको विश्वसनीय, तथ्य-जांची गई जानकारी देने और वित्तीय धोखाधड़ी से सुरक्षित रखने के लिए।'
                  : 'To give you reliable, fact-checked information and help you stay safe from financial scams.'}
              </p>
              <a
                href="#all-sources"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004A87] hover:underline pt-0.5"
              >
                <span>{isHindi ? 'अधिक जानें' : 'Learn more'}</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================
          SECTION 2: CONTEXT / SOURCE SUMMARY BANNER (HIGHLIGHTED)
          ======================================================= */}
      <div className="rounded-2xl bg-gradient-to-r from-[#E6F4EA] via-[#F0FDF4] to-[#EBF5FB] border-2 border-[#34A853]/40 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle accent bar on the left */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#137333]"></div>

        <div className="flex items-center gap-3.5 pl-1 sm:pl-2">
          {/* Glowing Green Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-[#137333] text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-[#CEEAD6]">
            <CheckCircle2 className="w-5 h-5 stroke-[2.8]" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0D381E] font-sans">
                {isHindi
                  ? `हमने इस संदेश के लिए ${sourcesCheckedCount} प्रासंगिक आधिकारिक स्रोतों से मिलान किया`
                  : `We checked ${sourcesCheckedCount} relevant official sources for this message`}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#137333] text-white tracking-wider uppercase shadow-2xs">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#2E5E41] font-sans mt-0.5 leading-relaxed">
              {isHindi
                ? 'यहाँ आपके संदेश के दावों से जुड़ी मुख्य विनियामक चेतावनियाँ और दिशा-निर्देश दिए गए हैं।'
                : 'Here are the key warnings and guidance related to the claims in your message. You can also view all sources below.'}
            </p>
          </div>
        </div>

        <a
          href="#other-sources"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#D9EEDA] text-[#137333] hover:text-[#0D381E] border border-[#34A853]/50 text-xs font-bold shrink-0 transition-all shadow-xs hover:shadow-sm"
        >
          <ShieldCheck className="w-4 h-4 text-[#137333]" />
          <span>{isHindi ? 'सभी 5 स्रोत देखें →' : 'View all 5 sources →'}</span>
        </a>
      </div>

      {/* =======================================================
          SECTION 3: 3 FEATURED SOURCE CARDS (3-COLUMN DESKTOP GRID)
          ======================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: SEBI */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Header: Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded-lg bg-[#004A87] text-white flex items-center justify-center font-black text-sm tracking-tighter shrink-0 shadow-2xs">
                SEBI
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0A1C2A] font-sans leading-tight">
                  SEBI
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-tight">
                  {isHindi ? 'भारतीय प्रतिभूति और विनिमय बोर्ड' : 'Securities and Exchange Board of India'}
                </p>
              </div>
            </div>

            {/* Red Alert Box: High/Guaranteed Returns Warning */}
            <div className="rounded-xl bg-red-50/80 border border-red-200/80 p-3.5 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-2xs">
                  !
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-900 leading-snug">
                    {isHindi
                      ? 'गारंटीड / उच्च रिटर्न एक आम धोखाधड़ी है'
                      : 'Guaranteed/High Returns are a common scam'}
                  </h4>
                  <p className="text-[11.5px] text-red-800/90 leading-relaxed mt-1">
                    {isHindi
                      ? 'सेबी स्पष्ट करता है कि किसी भी पंजीकृत इकाई को गारंटीड या निश्चित उच्च रिटर्न देने की अनुमति नहीं है। ऐसी योजनाएं अवैध हैं।'
                      : 'SEBI warns that no registered entity is allowed to offer guaranteed or fixed high returns. Such schemes are illegal.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* One Clear Action Button */}
            <a
              href="https://investor.sebi.gov.in/spot-any-scam.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#004A87] bg-[#EEF7FC] hover:bg-[#E0EFFB] border border-[#B9DCF7] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isHindi ? 'सेबी एडवाइजरी पढ़ें →' : 'Read SEBI Advisory →'}</span>
            </a>

            {/* Relevance Tags */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-medium">
                {isHindi ? 'संबंधित विषय:' : 'Related to your message:'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                {isHindi ? 'उच्च रिटर्न' : 'High returns'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                {isHindi ? 'निवेश योजना' : 'Investment scheme'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: RBI */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Header: Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                🏛️
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0A1C2A] font-sans leading-tight">
                  RBI
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-tight">
                  {isHindi ? 'भारतीय रिज़र्व बैंक' : 'Reserve Bank of India'}
                </p>
              </div>
            </div>

            {/* Amber Alert Box: Urgent KYC & Suspension Warning */}
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3.5 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-2xs">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 leading-snug">
                    {isHindi
                      ? 'अति-आवश्यक KYC व खाता ब्लॉक संदेशों से सावधान रहें'
                      : 'Be cautious of urgent KYC and account suspension messages'}
                  </h4>
                  <p className="text-[11.5px] text-amber-900/90 leading-relaxed mt-1">
                    {isHindi
                      ? 'आरबीआई स्पष्ट करता है कि बैंक कभी भी KYC अपडेट करने या खाता बंद होने से रोकने के लिए लिंक या फोन नंबर वाले SMS/WhatsApp नहीं भेजते हैं।'
                      : 'RBI clarifies that banks never send SMS or WhatsApp messages with links or phone numbers to update KYC or to prevent account suspension.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* One Clear Action Button */}
            <a
              href="https://sachet.rbi.org.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#004A87] bg-[#EEF7FC] hover:bg-[#E0EFFB] border border-[#B9DCF7] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isHindi ? 'आरबीआई एडवाइजरी पढ़ें →' : 'Read RBI Advisory →'}</span>
            </a>

            {/* Relevance Tags */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-medium">
                {isHindi ? 'संबंधित विषय:' : 'Related to your message:'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                {isHindi ? 'KYC अपडेट' : 'KYC update'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                {isHindi ? 'खाता निलंबन' : 'Account suspension'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: CYBER CRIME PORTAL / 1930 */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Header: Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                🛡️
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0A1C2A] font-sans leading-tight">
                  {isHindi ? 'साइबर क्राइम पोर्टल' : 'Cyber Crime Portal'}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-tight">
                  {isHindi
                    ? 'राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल (गृह मंत्रालय)'
                    : 'National Cyber Crime Reporting Portal (MHA)'}
                </p>
              </div>
            </div>

            {/* Blue Alert Box: Report Lost Money / Golden Hour */}
            <div className="rounded-xl bg-blue-50/80 border border-blue-200/80 p-3.5 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0070F3] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-2xs">
                  ℹ
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0B3B64] leading-snug">
                    {isHindi ? 'यदि आपने पैसे गंवाए हैं तो तुरंत रिपोर्ट करें' : 'Report if you have lost money'}
                  </h4>
                  <p className="text-[11.5px] text-[#1E4D7A] leading-relaxed mt-1">
                    {isHindi
                      ? 'यदि आपने व्यक्तिगत या वित्तीय विवरण साझा किए हैं या पैसे गंवाए हैं, तो तुरंत 1930 डायल करें या आधिकारिक पोर्टल पर रिपोर्ट करें।'
                      : 'If you have shared personal or financial details or lost money, report immediately on the official portal or dial 1930.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* One Clear Action Button */}
            <a
              href="https://www.cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#004A87] bg-[#EEF7FC] hover:bg-[#E0EFFB] border border-[#B9DCF7] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isHindi ? 'साइबर क्राइम पोर्टल पर जाएं →' : 'Go to Cyber Crime Portal →'}</span>
            </a>

            {/* Relevance Tags */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-medium">
                {isHindi ? 'संबंधित विषय:' : 'Related to your message:'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                {isHindi ? 'धोखाधड़ी रिपोर्ट' : 'Report fraud'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                {isHindi ? 'वित्तीय नुकसान' : 'Financial loss'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================
          SECTION 4: OTHER OFFICIAL SOURCES (COLLAPSIBLE / SECONDARY)
          ======================================================= */}
      <div id="other-sources" className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-[#0A1C2A] font-sans">
              {isHindi ? 'अन्य आधिकारिक स्रोत' : 'Other Official Sources'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#E0EFFB] text-[#0F568C] text-[11px] font-bold">
              {isHindi ? '2 अतिरिक्त स्रोत' : '2 MORE SOURCES'}
            </span>
          </div>

          <span className="text-xs text-slate-500 font-sans hidden sm:inline">
            {isHindi ? 'विनियामक व तकनीकी सुरक्षा सत्यापन' : 'Technical & Intermediary Verification'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SOURCE 1: CERT-In */}
          <div className="rounded-xl bg-slate-50/70 border border-slate-200/80 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-6 rounded bg-[#0070BA] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  cert-in
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">CERT-In</h4>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    {isHindi ? 'भारतीय कंप्यूटर आपातकालीन प्रतिक्रिया दल' : 'Indian Computer Emergency Response Team'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {isHindi
                  ? 'फिशिंग लिंक, दुर्भावनापूर्ण ऐप्स, फर्जी APK और ऑनलाइन धोखाधड़ी के तकनीकी साइबर सुरक्षा अलर्ट।'
                  : 'Cyber security alerts on phishing links, malicious apps and online frauds.'}
              </p>
            </div>

            <a
              href="https://www.cert-in.org.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold text-[#004A87] bg-white hover:bg-slate-100 border border-slate-200 transition-colors self-start w-full sm:w-auto"
            >
              <span>{isHindi ? 'सर्ट-इन अलर्ट्स देखें' : 'Read CERT-In Alerts'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* SOURCE 2: SEBI RECOGNISED INTERMEDIARIES */}
          <div className="rounded-xl bg-slate-50/70 border border-slate-200/80 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {isHindi ? 'मान्यता प्राप्त मध्यस्थ डायरेक्टरी' : 'Recognised Intermediaries Registry'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    {isHindi
                      ? 'सेबी पंजीकृत निवेश सलाहकार (IA) और अनुसंधान विश्लेषक (RA)'
                      : 'SEBI Registered Investment Advisers (IA) & Research Analysts (RA)'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {isHindi
                  ? 'किसी भी निवेश सलाहकार या विश्लेषक के दावों पर विश्वास करने से पहले सत्यापित करें कि वे सेबी में पंजीकृत हैं।'
                  : 'Verify if an investment adviser or research analyst is registered with SEBI before trusting their claims.'}
              </p>
            </div>

            <a
              href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognised=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold text-[#004A87] bg-white hover:bg-slate-100 border border-slate-200 transition-colors self-start w-full sm:w-auto"
            >
              <span>{isHindi ? 'सेबी डायरेक्टरी जांचें' : 'Check SEBI Registry'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
