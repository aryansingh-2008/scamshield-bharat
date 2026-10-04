'use client';

import React from 'react';
import { ShieldCheck, Settings, Lock, PlayCircle, Globe } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface HeaderProps {
  lang: 'en' | 'hi';
  onToggleLang: () => void;
  onOpenArch: () => void;
  onOpenSecurity: () => void;
  onNavigateHome: () => void;
  onTriggerDemo?: () => void;
}

export default function Header({
  lang,
  onToggleLang,
  onOpenArch,
  onOpenSecurity,
  onNavigateHome,
  onTriggerDemo,
}: HeaderProps) {
  const isHindi = lang === 'hi';
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative overflow-hidden">
        {/* Left Brand Identity with Previous Approved Strong Brand Block */}
        <div className="relative flex items-center h-full min-w-0">
          {/* Angled background accent shape */}
          <div
            className="hidden sm:block absolute inset-y-0 -left-6 w-[calc(100%+38px)] bg-[#EEF4F9] border-r border-slate-200/80 -z-10"
            style={{
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%)',
            }}
          />

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none focus:ring-2 focus:ring-[#004A87] rounded-lg p-1 pr-2 sm:pr-8 min-w-0"
            aria-label="ScamShield Bharat Home"
          >
            {/* Solid Deep Institutional Blue Shield Block (Previous Approved Logo) */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#004A87] flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight font-sans truncate">
                  {t.brandName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-[#004A87] text-white rounded tracking-wider shrink-0">
                  SAFETY CONSOLE
                </span>
              </div>
              <p className="hidden md:block text-[11px] sm:text-xs text-slate-500 font-sans leading-tight mt-0.5 truncate">
                {isHindi
                  ? 'प्रमाण-आधारित वित्तीय धोखाधड़ी जांच सहायक'
                  : 'Evidence-First Financial Verification Assistant'}
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Demo Trigger in Header */}
          {onTriggerDemo && (
            <button
              onClick={onTriggerDemo}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              title="Open Live Demo Scenarios"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#004A87] shrink-0" />
              <span className="hidden xs:inline">{t.navDemo}</span>
            </button>
          )}

          {/* Architecture / How It Works Button */}
          <button
            onClick={onOpenArch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            title="View Pipeline Architecture"
            aria-label="View Pipeline Architecture"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden md:inline">{t.navHowItWorks}</span>
          </button>

          {/* Security & Privacy Button */}
          <button
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            title="Security & Privacy Principles"
            aria-label="Security & Privacy Principles"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden md:inline">{t.navSecurity}</span>
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 transition-colors focus:ring-2 focus:ring-[#004A87] shrink-0 shadow-2xs"
            aria-label="Toggle language between English and Hindi"
          >
            <span
              className={
                lang === 'en'
                  ? 'text-[#004A87] font-bold underline underline-offset-4'
                  : 'text-slate-400'
              }
            >
              EN
            </span>
            <span className="text-slate-300">|</span>
            <span
              className={
                lang === 'hi'
                  ? 'text-[#004A87] font-bold underline underline-offset-4'
                  : 'text-slate-400'
              }
            >
              हिंदी
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
