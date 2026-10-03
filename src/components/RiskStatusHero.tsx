'use client';

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  Lock,
  FileText,
  Building2,
} from 'lucide-react';
import { RiskLevel } from '@/types';
import { TRANSLATIONS } from '@/lib/translations';
import AudioReader from './AudioReader';

interface RiskStatusHeroProps {
  status: RiskLevel;
  headline: string;
  headlineHi: string;
  explanation: string;
  explanationHi: string;
  piiRedacted: boolean;
  isDemo?: boolean;
  lang: 'en' | 'hi';
  stats?: {
    claimsCount: number;
    signalsCount: number;
    evidenceCount: number;
    unverifiedCount: number;
  };
}

export default function RiskStatusHero({
  status,
  headline,
  headlineHi,
  explanation,
  explanationHi,
  piiRedacted,
  isDemo,
  lang,
  stats,
}: RiskStatusHeroProps) {
  const t = TRANSLATIONS[lang];

  const getStatusConfig = () => {
    switch (status) {
      case 'HIGH_CONCERN':
        return {
          badge: t.statusHighConcern,
          icon: ShieldAlert,
          bgClass: 'bg-[#FFF5F5] border-[#FECDCA]',
          iconBoxClass: 'bg-red-100 text-[#B42318] border-red-200',
          badgeClass: 'bg-[#B42318] text-white border-[#912018]',
          metaTagClass: 'bg-white text-[#B42318] border-red-200',
          authorityTag: 'Potential Regulatory Impersonation Risk',
          authorityTagHi: 'संभावित नियामक प्रतिरूपण / अनधिकृत दावा',
        };
      case 'NEEDS_VERIFICATION':
        return {
          badge: t.statusNeedsVerification,
          icon: AlertTriangle,
          bgClass: 'bg-[#FFFAEB] border-[#FEDF89]',
          iconBoxClass: 'bg-amber-100 text-[#B54708] border-amber-200',
          badgeClass: 'bg-[#B54708] text-white border-[#8D3606]',
          metaTagClass: 'bg-white text-[#B54708] border-amber-200',
          authorityTag: 'Independent Registry Check Advised',
          authorityTagHi: 'स्वतंत्र रजिस्ट्री जांच आवश्यक',
        };
      case 'LOW_CONCERN':
        return {
          badge: t.statusLowConcern,
          icon: ShieldCheck,
          bgClass: 'bg-[#F0FDF4] border-[#BBF7D0]',
          iconBoxClass: 'bg-emerald-100 text-[#087A5B] border-emerald-200',
          badgeClass: 'bg-[#087A5B] text-white border-[#065F46]',
          metaTagClass: 'bg-white text-[#087A5B] border-emerald-200',
          authorityTag: 'Standard Educational Context',
          authorityTagHi: 'मानक शैक्षिक संदर्भ',
        };
      default:
        return {
          badge: t.statusUnableToAssess,
          icon: HelpCircle,
          bgClass: 'bg-[#F7F8FA] border-[#D8DEE5]',
          iconBoxClass: 'bg-[#EEF4F9] text-[#164E78] border-[#D8DEE5]',
          badgeClass: 'bg-[#164E78] text-white border-[#0F3B5C]',
          metaTagClass: 'bg-white text-[#164E78] border-[#D8DEE5]',
          authorityTag: 'Limited Context Available',
          authorityTagHi: 'सीमित संदर्भ उपलब्ध',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const activeHeadline = lang === 'hi' ? headlineHi : headline;
  const activeExplanation = lang === 'hi' ? explanationHi : explanation;

  return (
    <div className="space-y-3.5">
      {/* 1. Restrained Summary Top Card */}
      <div className={`rounded-xl border ${config.bgClass} p-5 sm:p-6 space-y-3.5 shadow-xs`}>
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-black/5">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`p-1.5 rounded-lg border shrink-0 ${config.iconBoxClass}`}>
              <Icon className="w-4 h-4" />
            </div>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border shadow-2xs ${config.badgeClass}`}>
              <span>{config.badge}</span>
            </span>

            <span className={`text-xs font-medium ${config.metaTagClass} px-2.5 py-1 rounded border shadow-2xs`}>
              {lang === 'hi' ? config.authorityTagHi : config.authorityTag}
            </span>

            {isDemo && (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-white text-console-300 border border-console-700 shadow-2xs">
                Deterministic Demo
              </span>
            )}

            {piiRedacted && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-200 shadow-2xs">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>PII Masked</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AudioReader
              textToRead={`${config.badge}. ${activeHeadline}. ${activeExplanation}`}
              lang={lang}
            />
          </div>
        </div>

        {/* Main Headline & Explanation */}
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold text-[#17202A] tracking-tight leading-snug font-sans">
            {activeHeadline}
          </h2>
          <p className="text-xs sm:text-sm text-[#475467] leading-relaxed font-sans">
            {activeExplanation}
          </p>
        </div>
      </div>

      {/* 2. Structured 4-Metric Grid (Clean Institutional White Cards) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Metric 1: Claims Extracted */}
          <div className="bg-white border border-[#D8DEE5] rounded-xl p-3.5 sm:p-4 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-[#EEF4F9] text-[#164E78] border border-[#D8DEE5] shrink-0 mt-0.5">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-[#667085] block font-sans truncate">
                {lang === 'hi' ? 'दावे मिले' : 'Claims Extracted'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#17202A] font-sans block leading-tight">
                {stats.claimsCount}
              </span>
              <span className="text-[10px] text-[#667085] font-sans block truncate">
                {lang === 'hi' ? 'कथनों का विश्लेषण' : 'Key statements analyzed'}
              </span>
            </div>
          </div>

          {/* Metric 2: Risk Signals */}
          <div className="bg-white border border-[#D8DEE5] rounded-xl p-3.5 sm:p-4 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA] shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-[#667085] block font-sans truncate">
                {lang === 'hi' ? 'खतरे के संकेत' : 'Risk Signals'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#B42318] font-sans block leading-tight">
                {stats.signalsCount}
              </span>
              <span className="text-[10px] text-[#667085] font-sans block truncate">
                {lang === 'hi' ? 'संभावित खतरे मिले' : 'Potential red flags found'}
              </span>
            </div>
          </div>

          {/* Metric 3: Sources for Verification */}
          <div className="bg-white border border-[#D8DEE5] rounded-xl p-3.5 sm:p-4 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-[#EEF4F9] text-[#164E78] border border-[#D8DEE5] shrink-0 mt-0.5">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-[#667085] block font-sans truncate">
                {lang === 'hi' ? 'सत्यापन स्रोत' : 'Sources for Verification'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#164E78] font-sans block leading-tight">
                {stats.evidenceCount}
              </span>
              <span className="text-[10px] text-[#667085] font-sans block truncate">
                {lang === 'hi' ? 'आधिकारिक स्रोत' : 'Official sources checked'}
              </span>
            </div>
          </div>

          {/* Metric 4: Uncertainty Points */}
          <div className="bg-white border border-[#D8DEE5] rounded-xl p-3.5 sm:p-4 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-[#667085] block font-sans truncate">
                {lang === 'hi' ? 'अपुष्ट बिंदु' : 'Uncertainty Points'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#B54708] font-sans block leading-tight">
                {stats.unverifiedCount}
              </span>
              <span className="text-[10px] text-[#667085] font-sans block truncate">
                {lang === 'hi' ? 'मानवीय निर्णय' : 'Needs human judgement'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
