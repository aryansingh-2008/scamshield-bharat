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
  riskScore?: number;
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
  riskScore,
  stats,
}: RiskStatusHeroProps) {
  const t = TRANSLATIONS[lang];

  const score =
    riskScore !== undefined
      ? riskScore
      : status === 'HIGH_CONCERN'
      ? 92
      : status === 'NEEDS_VERIFICATION'
      ? 52
      : status === 'LOW_CONCERN'
      ? 8
      : 0;

  const getStatusConfig = () => {
    switch (status) {
      case 'HIGH_CONCERN':
        return {
          badge: t.statusHighConcern,
          icon: ShieldAlert,
          bgClass: 'bg-[#FFF5F5] border-[#FECDCA]',
          iconBoxClass: 'bg-red-100 text-[#B42318] border-red-200',
          badgeClass: 'bg-[#B42318] text-white border-[#912018]',
          pillBg: 'bg-[#B42318] text-white border-[#912018]',
          meterColor: 'from-[#D92D20] via-[#E11D48] to-[#991B1B]',
          scoreTextColor: 'text-[#B42318]',
          scoreLabel: lang === 'hi' ? 'अत्यधिक जोखिम (Scam Likely)' : 'High Concern (Scam Likely)',
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
          pillBg: 'bg-[#B54708] text-white border-[#8D3606]',
          meterColor: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
          scoreTextColor: 'text-[#B54708]',
          scoreLabel: lang === 'hi' ? 'मध्यम जोखिम (Verify First)' : 'Moderate (Verify First)',
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
          pillBg: 'bg-[#087A5B] text-white border-[#065F46]',
          meterColor: 'from-[#10B981] via-[#059669] to-[#047857]',
          scoreTextColor: 'text-[#087A5B]',
          scoreLabel: lang === 'hi' ? 'न्यूनतम जोखिम (Standard)' : 'Low Concern (Standard)',
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
          pillBg: 'bg-[#164E78] text-white border-[#0F3B5C]',
          meterColor: 'from-slate-400 to-slate-500',
          scoreTextColor: 'text-[#164E78]',
          scoreLabel: lang === 'hi' ? 'सीमित संदर्भ' : 'Limited Context',
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

            {/* Risk Percentage Pill */}
            {status !== 'UNABLE_TO_ASSESS' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-black border shadow-2xs ${config.pillBg}`}>
                <span className="text-[10px] uppercase font-sans font-semibold tracking-wider opacity-90">
                  {lang === 'hi' ? 'जोखिम:' : 'Risk:'}
                </span>
                <span>{score}%</span>
              </span>
            )}

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
              textToRead={
                score > 0
                  ? (lang === 'hi'
                      ? `${config.badge}. जोखिम स्तर ${score} प्रतिशत. ${activeHeadline}. ${activeExplanation}`
                      : `${config.badge}. Risk score ${score} percent. ${activeHeadline}. ${activeExplanation}`)
                  : `${config.badge}. ${activeHeadline}. ${activeExplanation}`
              }
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

        {/* Visual Risk Score Percentage Meter */}
        {status !== 'UNABLE_TO_ASSESS' && (
          <div className="mt-3.5 pt-3.5 border-t border-black/8 bg-white/70 rounded-xl p-3.5 border border-black/5 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    status === 'HIGH_CONCERN'
                      ? 'bg-[#B42318] animate-pulse'
                      : status === 'NEEDS_VERIFICATION'
                      ? 'bg-[#B54708]'
                      : 'bg-[#087A5B]'
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold text-[#17202A] tracking-tight">
                  {lang === 'hi' ? 'धोखाधड़ी का जोखिम प्रतिशत (Scam Probability)' : 'Scam Risk Probability Gauge'}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    status === 'HIGH_CONCERN'
                      ? 'bg-red-50 text-[#B42318] border-red-200'
                      : status === 'NEEDS_VERIFICATION'
                      ? 'bg-amber-50 text-[#B54708] border-amber-200'
                      : 'bg-emerald-50 text-[#087A5B] border-emerald-200'
                  }`}
                >
                  {config.scoreLabel}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 ml-auto">
                <span className="text-xs font-medium text-slate-500">
                  {lang === 'hi' ? 'आकलित जोखिम:' : 'Calculated Risk:'}
                </span>
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${config.scoreTextColor}`}>
                  {score}%
                </span>
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="relative w-full h-3 sm:h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${config.meterColor}`}
                style={{ width: `${Math.max(score, 4)}%` }}
              />
            </div>

            {/* Scale Guide */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-0.5">
              <span className="text-[#087A5B] font-semibold flex items-center gap-1">
                <span>0%</span>
                <span className="font-sans">({lang === 'hi' ? 'कम जोखिम / सुरक्षित' : 'Low / Safe'})</span>
              </span>
              <span className="text-[#B54708] font-semibold flex items-center gap-1">
                <span>50%</span>
                <span className="font-sans">({lang === 'hi' ? 'मध्यम जोखिम / संदेहास्पद' : 'Moderate / Verify'})</span>
              </span>
              <span className="text-[#B42318] font-semibold flex items-center gap-1">
                <span>100%</span>
                <span className="font-sans">({lang === 'hi' ? 'अत्यधिक खतरा / स्कैम' : 'Critical / Scam'})</span>
              </span>
            </div>
          </div>
        )}
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
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-[#B42318] font-sans block leading-tight">
                  {stats.signalsCount}
                </span>
                {score > 0 && (
                  <span className="text-[11px] font-mono font-bold text-[#B42318] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                    {score}%
                  </span>
                )}
              </div>
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
