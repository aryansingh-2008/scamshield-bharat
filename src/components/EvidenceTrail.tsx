'use client';

import React from 'react';
import { ExtractedClaim, EvidenceRecord, CouldNotVerifyItem, RiskLevel } from '@/types';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  ArrowDown,
} from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface EvidenceTrailProps {
  claims: ExtractedClaim[];
  evidence: EvidenceRecord[];
  couldNotVerify: CouldNotVerifyItem[];
  overallStatus?: RiskLevel;
  lang: 'en' | 'hi';
}

export default function EvidenceTrail({
  claims,
  evidence,
  couldNotVerify: _couldNotVerify,
  overallStatus,
  lang,
}: EvidenceTrailProps) {
  const t = TRANSLATIONS[lang];

  if (!claims || claims.length === 0) return null;

  // Helper to map claim category to matching evidence record
  const getMatchingEvidence = (claim: ExtractedClaim): EvidenceRecord | undefined => {
    switch (claim.category) {
      case 'GUARANTEED_RETURN':
      case 'HIGH_PROFIT':
        return evidence.find((e) => e.topic === 'guaranteed_returns') || evidence[0];
      case 'REGULATORY_APPROVAL':
        return evidence.find((e) => e.topic === 'unregistered_intermediary') || evidence[0];
      case 'EXCLUSIVE_COMMUNITY':
        return evidence.find((e) => e.topic === 'unregistered_social_media') || evidence[0];
      case 'ACCOUNT_STATUS':
      case 'URGENT_ACTION':
        return evidence.find((e) => e.topic === 'fake_kyc_expiry') || evidence[0];
      case 'SOFTWARE_INSTALL':
        return evidence.find((e) => e.topic === 'remote_access_apk') || evidence[0];
      case 'PAYMENT_REQUEST':
        return evidence.find((e) => e.topic === 'third_party_payment') || evidence[0];
      default:
        return evidence[0];
    }
  };

  const getStatusBadge = (status: ExtractedClaim['status']) => {
    switch (status) {
      case 'RISK_SIGNAL':
      case 'UNSUPPORTED':
      case 'FALSE_CLAIM':
        return {
          label: lang === 'hi' ? 'उच्च जोखिम' : 'High Risk',
          badgeClass: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
          boxClass: 'bg-[#FEF3F2] border-[#FECDCA] text-[#17202A]',
          icon: AlertCircle,
        };
      case 'VERIFIED':
        return {
          label: lang === 'hi' ? 'सत्यापित' : 'Verified',
          badgeClass: 'bg-[#F0FDF4] text-[#087A5B] border-[#BBF7D0]',
          boxClass: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#17202A]',
          icon: CheckCircle2,
        };
      default:
        return {
          label: lang === 'hi' ? 'सावधानी' : 'Caution',
          badgeClass: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
          boxClass: 'bg-[#FFFAEB] border-[#FEDF89] text-[#17202A]',
          icon: AlertTriangle,
        };
    }
  };

  const getOverallBadge = () => {
    switch (overallStatus) {
      case 'HIGH_CONCERN':
        return {
          title: lang === 'hi' ? 'अत्यधिक जोखिम' : 'High Risk',
          subtitle: lang === 'hi' ? 'कई खतरे मिले' : 'Multiple red flags detected',
          badgeClass: 'bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]',
          icon: ShieldAlert,
        };
      case 'NEEDS_VERIFICATION':
        return {
          title: lang === 'hi' ? 'सत्यापन आवश्यक' : 'Needs Verification',
          subtitle: lang === 'hi' ? 'स्वतंत्र पुष्टि आवश्यक' : 'Independent check advised',
          badgeClass: 'bg-[#FFFAEB] border-[#FEDF89] text-[#B54708]',
          icon: HelpCircle,
        };
      case 'LOW_CONCERN':
        return {
          title: lang === 'hi' ? 'कम जोखिम' : 'Low Concern',
          subtitle: lang === 'hi' ? 'कोई सामान्य खतरा नहीं मिला' : 'No typical red flags',
          badgeClass: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#087A5B]',
          icon: ShieldCheck,
        };
      default:
        return {
          title: lang === 'hi' ? 'अधूरी जानकारी' : 'Unable to Assess',
          subtitle: lang === 'hi' ? 'सीमित संदर्भ उपलब्ध' : 'Insufficient context',
          badgeClass: 'bg-[#F2F5F8] border-[#D8DEE5] text-console-300',
          icon: HelpCircle,
        };
    }
  };

  const overallBadge = getOverallBadge();
  const OverallIcon = overallBadge.icon;

  // Exact 5-column CSS grid definition matching target specification:
  // # (48px) | Claim (~23%) | Source (~26%) | Explanation (~35%) | Risk (~12% / 120px)
  const gridTemplateClasses = 'grid-cols-[48px_minmax(0,2.2fr)_minmax(0,2.6fr)_minmax(0,3.4fr)_minmax(0,120px)]';

  return (
    <div className="rounded-xl border border-[#D8DEE5] bg-white p-4 sm:p-6 space-y-5 shadow-xs">
      {/* 1. Header with Title on Left and Overall Risk Badge on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8DEE5] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-safety-brand-primary text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0 shadow-2xs">
              STAGE 02
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#17202A] font-sans tracking-tight">
              {t.evidenceTrailTitle}
            </h3>
          </div>
          <p className="text-xs text-[#667085] mt-1 font-sans leading-relaxed">
            {t.evidenceTrailSubtitle}
          </p>
        </div>

        {overallStatus && (
          <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 shrink-0 shadow-2xs ${overallBadge.badgeClass}`}>
            <OverallIcon className="w-4 h-4 shrink-0" />
            <div className="text-left leading-tight">
              <span className="font-bold text-xs font-sans block">{overallBadge.title}</span>
              <span className="text-[10px] font-sans opacity-90 block">{overallBadge.subtitle}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Structured Investigation Matrix (Desktop & Mobile) */}
      <div className="space-y-3">
        {/* Table Column Headers (Desktop: EXACT same 5-column grid as data rows) */}
        <div className={`hidden md:grid ${gridTemplateClasses} gap-3 sm:gap-4 px-4 py-2.5 bg-[#F2F5F8] border border-[#D8DEE5] rounded-lg text-[11px] font-mono font-bold text-[#667085] uppercase tracking-wider items-center`}>
          <div className="min-w-0 text-center">{t.evidenceColNum}</div>
          <div className="min-w-0">{t.evidenceColClaim}</div>
          <div className="min-w-0">{t.evidenceColSource}</div>
          <div className="min-w-0">{t.evidenceColExplanation}</div>
          <div className="min-w-0 text-center">{t.evidenceColRisk}</div>
        </div>

        {/* Claim Rows */}
        {claims.map((claim, index) => {
          const matchedEvid = getMatchingEvidence(claim);
          const statusConfig = getStatusBadge(claim.status);
          const StatusIcon = statusConfig.icon;

          return (
            <React.Fragment key={claim.id || index}>
              {/* Desktop Matrix Row (EXACT same 5-column grid as header, min-w-0 on all children, natural wrapping) */}
              <div className={`hidden md:grid ${gridTemplateClasses} gap-3 sm:gap-4 items-start p-3.5 rounded-lg border border-[#D8DEE5] bg-white hover:border-[#164E78]/40 transition-colors shadow-2xs`}>
                {/* 1. # Index (48px) */}
                <div className="min-w-0 flex items-start justify-center pt-0.5">
                  <span className="w-8 h-8 rounded-md bg-[#F2F5F8] border border-[#D8DEE5] flex items-center justify-center font-mono font-bold text-xs text-[#17202A]">
                    {index + 1}
                  </span>
                </div>

                {/* 2. User Claim (~23%) */}
                <div className="min-w-0 flex flex-col justify-start">
                  <div className="p-3 rounded-lg bg-[#F2F5F8] border border-[#D8DEE5] text-xs font-mono text-[#17202A] leading-relaxed break-words whitespace-normal">
                    &ldquo;{claim.text}&rdquo;
                  </div>
                </div>

                {/* 3. Trusted Official Source (~26%) */}
                <div className="min-w-0 flex items-start gap-2.5">
                  {matchedEvid ? (
                    <>
                      <div className="p-2 rounded-lg bg-[#EEF4F9] text-[#164E78] border border-[#D8DEE5] shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <strong className="text-xs text-[#164E78] font-bold font-sans block leading-snug break-words whitespace-normal">
                          {lang === 'hi' ? matchedEvid.titleHi : matchedEvid.title}
                        </strong>
                        <a
                          href={matchedEvid.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#155E8A] hover:underline font-mono inline-flex items-center gap-1 break-all"
                        >
                          <span>{matchedEvid.sourceName}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-[#667085] font-mono">
                      Regulatory Advisory
                    </span>
                  )}
                </div>

                {/* 4. Regulatory Status & Explanation (~34%) */}
                <div className="min-w-0 flex flex-col justify-start">
                  <div className={`p-3 rounded-lg text-xs font-sans leading-relaxed border break-words whitespace-normal ${statusConfig.boxClass}`}>
                    {lang === 'hi' ? (claim.hindiExplanation || claim.explanation) : claim.explanation}
                  </div>
                </div>

                {/* 5. Risk Badge (~12% / 120px) */}
                <div className="min-w-0 flex items-start justify-center pt-0.5">
                  <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono border whitespace-nowrap shadow-2xs ${statusConfig.badgeClass}`}>
                    <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>
              </div>

              {/* Mobile Card Stack (< md screens, 320px - 767px) */}
              <div className="md:hidden block rounded-lg border border-[#D8DEE5] bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#D8DEE5] pb-2">
                  <span className="font-mono text-xs font-bold text-[#17202A]">
                    #{index + 1}: {claim.category.replace(/_/g, ' ')}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${statusConfig.badgeClass}`}>
                    <StatusIcon className="w-3 h-3 shrink-0" />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#667085] block">
                    {t.evidenceColClaim}
                  </span>
                  <div className="p-2.5 rounded bg-[#F2F5F8] border border-[#D8DEE5] text-xs font-mono text-[#17202A] break-words">
                    &ldquo;{claim.text}&rdquo;
                  </div>
                </div>

                <div className="flex justify-center py-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-[#667085]" />
                </div>

                {matchedEvid && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#667085] block">
                      {t.evidenceColSource}
                    </span>
                    <div className="p-2.5 rounded bg-[#EEF4F9]/60 border border-[#D8DEE5] text-xs space-y-1">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-[#164E78] shrink-0 mt-0.5" />
                        <strong className="text-[#164E78] font-sans block text-xs break-words">
                          {lang === 'hi' ? matchedEvid.titleHi : matchedEvid.title}
                        </strong>
                      </div>
                      <div className="pl-6">
                        <a
                          href={matchedEvid.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#155E8A] font-mono inline-flex items-center gap-0.5"
                        >
                          <span>{matchedEvid.sourceName}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#667085] block">
                    {t.evidenceColExplanation}
                  </span>
                  <div className={`p-2.5 rounded-lg text-xs font-sans leading-relaxed border break-words ${statusConfig.boxClass}`}>
                    {lang === 'hi' ? (claim.hindiExplanation || claim.explanation) : claim.explanation}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 3. Key Takeaways Panel (Subtle Blue-Tinted Information Panel) */}
      <div className="rounded-xl border border-[#C5D7E5] border-l-4 border-l-[#164E78] bg-[#F0F6FA] p-4 sm:p-5 space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-white text-[#164E78] border border-[#C5D7E5] shrink-0 shadow-2xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#17202A] font-sans">
            {t.keyTakeawaysTitle}
          </h4>
        </div>
        <ul className="space-y-1.5 text-xs text-[#475467] font-sans list-disc pl-5 leading-relaxed">
          <li>{t.keyTakeaway1}</li>
          <li>{t.keyTakeaway2}</li>
          <li>{t.keyTakeaway3}</li>
        </ul>
      </div>
    </div>
  );
}
