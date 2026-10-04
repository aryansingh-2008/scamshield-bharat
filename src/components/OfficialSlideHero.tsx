'use client';

import React from 'react';
import { AlertOctagon, FileCheck2, ShieldCheck, Users } from 'lucide-react';

interface OfficialSlideHeroProps {
  lang: 'en' | 'hi';
}

export default function OfficialSlideHero({ lang }: OfficialSlideHeroProps) {
  const isHindi = lang === 'hi';

  const pillars = [
    {
      icon: AlertOctagon,
      title: isHindi ? 'खतरे पहचानें' : 'Detect',
      desc: isHindi
        ? 'धोखाधड़ी के शुरुआती संकेतों को तुरंत पकड़ें'
        : 'Identify scam patterns early before you act',
      badgeColor: 'text-red-600 bg-red-50 border-red-200',
    },
    {
      icon: FileCheck2,
      title: isHindi ? 'आधिकारिक पुष्टि' : 'Verify',
      desc: isHindi
        ? 'सेबी, आरबीआई और सीईआरटी-इन से मिलान करें'
        : 'Cross-check against SEBI, RBI, CERT-In sources',
      badgeColor: 'text-[#164E78] bg-[#EEF4F9] border-[#164E78]/20',
    },
    {
      icon: ShieldCheck,
      title: isHindi ? 'सरल व्याख्या' : 'Explain',
      desc: isHindi
        ? 'बिना कानूनी उलझन के सरल भाषा में समझें'
        : 'Get clear, easy-to-understand explanations',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: Users,
      title: isHindi ? 'सुरक्षित कदम' : 'Protect',
      desc: isHindi
        ? 'पैसे बचाने के सही कदम और 1930 सायबर हेल्पलाइन'
        : 'Know safe next steps & 1930 reporting pathways',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    },
  ];

  const officialSources = [
    {
      name: isHindi ? 'सेबी (SEBI)' : 'SEBI',
      full: isHindi ? 'भारतीय प्रतिभूति और विनिमय बोर्ड' : 'Securities & Exchange Board of India',
    },
    {
      name: isHindi ? 'आरबीआई (RBI)' : 'RBI Sachet',
      full: isHindi ? 'भारतीय रिजर्व बैंक सचेत पोर्टल' : 'Reserve Bank of India Sachet Portal',
    },
    {
      name: isHindi ? 'सीईआरटी-इन' : 'CERT-In',
      full: isHindi ? 'भारतीय कंप्यूटर आपातकालीन प्रतिक्रिया दल' : 'Indian Computer Emergency Response Team',
    },
    {
      name: isHindi ? '1930 सायबर सेल' : 'Cyber Crime 1930',
      full: isHindi ? 'राष्ट्रीय सायबर अपराध रिपोर्टिंग पोर्टल' : 'National Cyber Crime Reporting Portal',
    },
  ];

  return (
    <section className="space-y-4 pt-1 sm:pt-2 animate-in fade-in duration-300">
      {/* Top National Mission Badge */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEF4F9] border border-[#164E78]/25 text-[#164E78] text-xs font-semibold tracking-wide shadow-xs">
          <span>🇮🇳</span>
          <span>
            {isHindi
              ? 'सुरक्षित नागरिक | पारदर्शी बाजार | सशक्त भारत'
              : 'Safer Citizens | Transparent Markets | Stronger Bharat'}
          </span>
        </div>
      </div>

      {/* Main Headline & Subtitle matching Slide 1 */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <h1 className="text-2.5xl sm:text-4xl font-extrabold text-[#0B1E2D] tracking-tight leading-tight">
          {isHindi
            ? 'कदम उठाने से पहले दावे की जांच करें।'
            : 'Check the claim before you act.'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
          {isHindi
            ? 'संदिग्ध वित्तीय संदेशों, व्हाट्सएप/टेलीग्राम ऑफर्स और निवेश दावों का आधिकारिक विनियामक साक्ष्यों से मिलान करें।'
            : 'Verify suspicious financial messages, WhatsApp forwards, and investment claims against official regulatory evidence.'}
        </p>
      </div>

      {/* 4 Feature Pillars matching Slide 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-4xl mx-auto pt-1">
        {pillars.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-[#164E78]/40 transition-colors flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${item.badgeColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                  {item.title}
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 font-sans leading-snug">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Official Sources Cross-Check Bar */}
      <div className="max-w-4xl mx-auto rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs text-slate-600">
        <div className="font-semibold text-slate-900 shrink-0 flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isHindi ? 'आधिकारिक नियामक स्रोत:' : 'Official Regulatory Sources:'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          {officialSources.map((src, i) => (
            <div
              key={i}
              className="px-2 py-1 rounded-md bg-white border border-slate-200 text-center text-[11px] font-medium text-slate-800"
              title={src.full}
            >
              {src.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
