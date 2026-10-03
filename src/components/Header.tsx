'use client';

import React from 'react';
import { ShieldCheck, Settings, Lock, PlayCircle } from 'lucide-react';
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
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-console-700 bg-white shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative overflow-hidden">
        {/* Left Brand Identity with Option 5 Strong Brand Block */}
        <div className="relative flex items-center h-full">
          {/* Angled background shape */}
          <div
            className="absolute inset-y-0 -left-6 w-[calc(100%+38px)] bg-[#EEF4F9] border-r border-console-700/60 -z-10"
            style={{
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%)',
            }}
          />

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left group focus:outline-none focus:ring-2 focus:ring-safety-brand-primary rounded-lg p-1 pr-6 sm:pr-8"
            aria-label="ScamShield Bharat Home"
          >
            {/* Solid Deep Institutional Blue Shield Block */}
            <div className="w-10 h-10 rounded-xl bg-safety-brand-primary flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-console-100 tracking-tight font-sans">
                  {t.brandName}
                </span>
                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-safety-brand-primary text-white rounded tracking-wider">
                  SAFETY CONSOLE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-console-400 font-sans leading-tight mt-0.5">
                {lang === 'hi'
                  ? 'प्रमाण-आधारित वित्तीय धोखाधड़ी जांच सहायक'
                  : 'Evidence-First Financial Verification Assistant'}
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Demo Trigger in Header */}
          {onTriggerDemo && (
            <button
              onClick={onTriggerDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-console-100 bg-white hover:bg-console-850 rounded-lg border border-console-700 transition-colors shadow-xs"
              title="Open Live Demo Scenarios"
            >
              <PlayCircle className="w-3.5 h-3.5 text-safety-brand-primary" />
              <span>{t.navDemo}</span>
            </button>
          )}

          {/* Architecture Button */}
          <button
            onClick={onOpenArch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-console-300 hover:text-console-100 hover:bg-console-850 rounded-lg border border-console-700 transition-colors"
            title="View Pipeline Architecture"
          >
            <Settings className="w-3.5 h-3.5 text-console-400" />
            <span className="hidden sm:inline">{t.navHowItWorks}</span>
          </button>

          {/* Security Button */}
          <button
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-console-300 hover:text-console-100 hover:bg-console-850 rounded-lg border border-console-700 transition-colors"
            title="Security & Privacy Principles"
          >
            <Lock className="w-3.5 h-3.5 text-safety-safe-accent" />
            <span className="hidden sm:inline">{t.navSecurity}</span>
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-console-700 bg-white text-console-300 hover:border-console-600 transition-colors focus:ring-2 focus:ring-safety-brand-primary"
            aria-label="Toggle language between English and Hindi"
          >
            <span
              className={
                lang === 'en'
                  ? 'text-console-100 font-bold underline underline-offset-4'
                  : 'text-console-400'
              }
            >
              EN
            </span>
            <span className="text-console-600">|</span>
            <span
              className={
                lang === 'hi'
                  ? 'text-console-100 font-bold underline underline-offset-4'
                  : 'text-console-400'
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
