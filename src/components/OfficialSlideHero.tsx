'use client';

import React from 'react';
import { AlertTriangle, Search, FileText, ShieldCheck } from 'lucide-react';
import DeviceMockupShowcase from './DeviceMockupShowcase';

interface OfficialSlideHeroProps {
  lang: 'en' | 'hi';
}

export default function OfficialSlideHero({ lang }: OfficialSlideHeroProps) {
  const isHindi = lang === 'hi';

  const pillars = [
    {
      icon: AlertTriangle,
      title: isHindi ? 'खतरे पहचानें' : 'Detect Early',
      desc: isHindi
        ? 'धोखाधड़ी के शुरुआती संकेतों को तुरंत पकड़ें।'
        : 'Identify scam signals before you fall victim.',
      iconBg: 'bg-[#E5484D] text-white',
    },
    {
      icon: Search,
      title: isHindi ? 'आधिकारिक स्रोत' : 'Verify with Sources',
      desc: isHindi
        ? 'सेबी, आरबीआई व सीईआरटी-इन से मिलान करें।'
        : 'Grounded in SEBI, RBI, CERT-In and more.',
      iconBg: 'bg-[#0070F3] text-white',
    },
    {
      icon: FileText,
      title: isHindi ? 'सरल भाषा' : 'Clear Language',
      desc: isHindi
        ? 'हिंदी व अंग्रेजी में आसान व्याख्या।'
        : 'Simple, easy-to-understand explanations in Hindi & English.',
      iconBg: 'bg-[#10B981] text-white',
    },
    {
      icon: ShieldCheck,
      title: isHindi ? 'सुरक्षित कदम' : 'Safe Next Steps',
      desc: isHindi
        ? 'पैसे बचाने के कदम व 1930 हेल्पलाइन।'
        : 'Actionable guidance to stay protected.',
      iconBg: 'bg-[#F5A623] text-white',
    },
  ];

  return (
    <section className="relative space-y-6 pt-2 pb-2 animate-in fade-in duration-300">
      {/* 2-COLUMN SPLIT HERO CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center max-w-[1340px] mx-auto relative">
        {/* LEFT COLUMN: Mission Text + 4 Pillars Row */}
        <div className="lg:col-span-7 space-y-4 text-left">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E0EFFB] text-[#0F568C] text-[11px] font-extrabold tracking-wider uppercase border border-[#B9DCF7] shadow-2xs">
            <span>{isHindi ? 'सुरक्षित, धोखाधड़ी-मुक्त भारत के लिए' : 'FOR A SAFER, SCAM-FREE INDIA'}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[45px] font-black text-[#0A1C2A] tracking-tight leading-[1.12] font-sans">
            {isHindi ? (
              <>
                हर भारतीय के लिए <br />
                <span className="text-[#004A87]">एआई-संचालित</span> धोखाधड़ी विश्लेषण
              </>
            ) : (
              <>
                AI-Powered Scam Analysis <br />
                <span className="text-[#004A87]">for Every Indian</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 font-sans leading-relaxed max-w-xl">
            {isHindi
              ? 'धोखाधड़ी को तुरंत पहचानें, आधिकारिक विनियामक स्रोतों से पुष्टि करें, सरल भाषा में समझें और पैसे बचाने के सुरक्षित कदम उठाएं।'
              : 'Detect scams early, verify with official sources, get clear explanations in simple language, and take safe next steps.'}
          </p>

          {/* 4 HORIZONTAL FEATURE CARDS ROW (Exact 4-Column Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-2">
            {pillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start space-y-1.5 sm:space-y-2 min-w-0"
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${item.iconBg}`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[11px] sm:text-xs font-bold text-[#0A1C2A] font-sans tracking-tight truncate">
                      {item.title}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-sans leading-snug mt-0.5 sm:mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Device Mockups with Background Elements */}
        <div className="lg:col-span-5 relative flex flex-col items-center justify-center pt-2 lg:pt-0 overflow-visible">
          <DeviceMockupShowcase lang={lang} />
        </div>
      </div>

      {/* REGULATORY SOURCES STRIP (White Card Bar Matching Reference Image) */}
      <div
        id="official-sources-strip"
        className="max-w-[1340px] mx-auto rounded-2xl bg-white border border-slate-100 shadow-sm px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 overflow-hidden"
      >
        {/* Left: Official Logos / Emblems */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6">
          {/* SEBI Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 sm:w-9 h-5 sm:h-6 rounded bg-[#004A87] text-white flex items-center justify-center font-black text-[10px] sm:text-[11px] tracking-tighter shrink-0">
              SEBI
            </div>
            <div>
              <div className="text-[10.5px] sm:text-[11px] font-bold text-slate-900 leading-tight">SEBI</div>
              <div className="text-[9px] sm:text-[9.5px] text-slate-500 leading-tight">
                {isHindi ? 'भारतीय प्रतिभूति बोर्ड' : 'Securities & Exchange Board'}
              </div>
            </div>
          </div>

          {/* RBI Emblem */}
          <div className="flex items-center gap-2">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border border-amber-700/40 bg-amber-50 flex items-center justify-center text-amber-900 font-bold text-[8px] sm:text-[9px] shrink-0">
              🏛️
            </div>
            <div>
              <div className="text-[10.5px] sm:text-[11px] font-bold text-slate-900 leading-tight">
                {isHindi ? 'भारतीय रिज़र्व बैंक' : 'Reserve Bank of India'}
              </div>
              <div className="text-[9px] sm:text-[9.5px] text-slate-500 leading-tight">RBI Sachet & Alert List</div>
            </div>
          </div>

          {/* CERT-In Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 sm:w-8 h-4.5 sm:h-5 rounded bg-[#0070BA] text-white flex items-center justify-center font-bold text-[8px] sm:text-[9px] shrink-0">
              cert-in
            </div>
            <div>
              <div className="text-[10.5px] sm:text-[11px] font-bold text-slate-900 leading-tight">CERT-In</div>
              <div className="text-[9px] sm:text-[9.5px] text-slate-500 leading-tight">
                {isHindi ? 'कंप्यूटर आपातकालीन टीम' : 'Emergency Response Team'}
              </div>
            </div>
          </div>

          {/* PIB / Gov Emblem */}
          <div className="flex items-center gap-2">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded bg-red-600 text-white flex items-center justify-center font-bold text-[7.5px] sm:text-[8px] uppercase shrink-0">
              PIB
            </div>
            <div>
              <div className="text-[10.5px] sm:text-[11px] font-bold text-slate-900 leading-tight">PIB / Gov</div>
              <div className="text-[9px] sm:text-[9.5px] text-slate-500 leading-tight">
                {isHindi ? 'प्रेस सूचना ब्यूरो' : 'Fact Check / Gov Portal'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Slogan & Tricolor Indicator */}
        <div className="text-left sm:text-right shrink-0 flex flex-col sm:items-end gap-1 pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-wide font-sans">
            {isHindi
              ? 'सुरक्षित नागरिक | पारदर्शी बाजार | सशक्त भारत'
              : 'Safer Citizens | Transparent Markets | Stronger Bharat'}
          </span>
          <div className="h-1 w-full max-w-[280px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] rounded-full border border-slate-200/60"></div>
        </div>
      </div>
    </section>
  );
}
