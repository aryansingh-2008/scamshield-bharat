'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Search,
  ExternalLink,
  Flag,
  Info,
  PhoneCall,
  ArrowLeft,
  Ban,
  Check,
} from 'lucide-react';
import { AnalysisResponse, RiskSignal, ExtractedClaim } from '@/types';
import { classifyRiskScore, SmartRiskClassification } from '@/lib/risk-thresholds';

interface SmartRiskWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack: () => void;
  lang: 'en' | 'hi';
  analysisResult: AnalysisResponse;
}

export default function SmartRiskWarningModal({
  isOpen,
  onClose,
  onGoBack,
  lang,
  analysisResult,
}: SmartRiskWarningModalProps) {
  const isHindi = lang === 'hi';
  const [isDetailedExpanded, setIsDetailedExpanded] = useState(false);
  const [showReportingDrawer, setShowReportingDrawer] = useState(false);

  // Classify risk using the central configurable threshold engine
  const classification: SmartRiskClassification = classifyRiskScore(
    analysisResult.riskScore ??
      (analysisResult.status === 'HIGH_CONCERN'
        ? 92
        : analysisResult.status === 'NEEDS_VERIFICATION'
        ? 52
        : 8)
  );

  const score = classification.score;
  const isLowRisk = classification.category === 'LOW_RISK';
  const isMediumRisk = classification.category === 'MEDIUM_RISK';
  const isHighRisk = classification.category === 'HIGH_RISK';

  // Keyboard accessibility: Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset internal states on open
  useEffect(() => {
    if (isOpen) {
      setIsDetailedExpanded(false);
      setShowReportingDrawer(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract signals or use standard indicators matching reference mockup
  const riskSignals = analysisResult.riskSignals || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-risk-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-[420px] w-full overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col my-auto text-slate-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Logo & Close Button */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md border-2 border-[#16A34A] flex items-center justify-center text-[#16A34A]">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight text-slate-900">
              ScamShield <span className="text-[#D97706]">Bharat</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scrollable Container */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* ======================================================== */}
          {/* 1. TOP BANNER BOX (EXACT REFERENCE DESIGN PER TIER)       */}
          {/* ======================================================== */}

          {/* LOW RISK BANNER (0–30) */}
          {isLowRisk && (
            <div className="p-5 rounded-2xl bg-[#E8F8EE] border border-emerald-200/60 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-xs mb-2.5">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h2
                id="smart-risk-modal-title"
                className="text-xl font-extrabold text-[#14532D] tracking-tight"
              >
                {isHindi ? 'न्यूनतम जोखिम (Low Risk Detected)' : 'Low Risk Detected'}
              </h2>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-[#D1FAE5] text-[#14532D] text-xs font-bold font-mono">
                Risk Score: <span className="ml-1 font-black text-[13px]">{score} / 100</span>
              </div>
            </div>
          )}

          {/* MEDIUM RISK BANNER (31–59) */}
          {isMediumRisk && (
            <div className="p-5 rounded-2xl bg-[#FEF3C7] border border-amber-200/60 text-center flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center text-[#D97706] mb-1.5">
                <AlertTriangle className="w-11 h-11 stroke-[2.2] fill-[#FDE68A] text-[#D97706]" />
              </div>
              <h2
                id="smart-risk-modal-title"
                className="text-[17px] font-black text-[#78350F] tracking-tight leading-snug"
              >
                {isHindi ? 'सावधानी — संभावित संदिग्ध सामग्री' : 'Caution — Potentially\nSuspicious Content'}
              </h2>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-[#FDE68A] text-[#78350F] text-xs font-bold font-mono">
                Risk Score: <span className="ml-1 font-black text-[13px]">{score} / 100</span>
              </div>
            </div>
          )}

          {/* HIGH RISK BANNER (60–100) */}
          {isHighRisk && (
            <div className="p-5 rounded-2xl bg-[#FEE2E2] border border-red-200/60 text-center flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center text-[#DC2626] mb-1.5">
                <div
                  className="w-10 h-10 bg-[#DC2626] text-white flex items-center justify-center shadow-xs"
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                  <span className="text-2xl font-black font-sans leading-none">!</span>
                </div>
              </div>
              <h2
                id="smart-risk-modal-title"
                className="text-xl font-black text-[#991B1B] tracking-tight"
              >
                {isHindi ? 'अत्यधिक जोखिम (High Risk Detected!)' : 'High Risk Detected!'}
              </h2>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-[#FECACA] text-[#991B1B] text-xs font-bold font-mono">
                Risk Score: <span className="ml-1 font-black text-[13px]">{score} / 100</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. BODY MESSAGE TEXT                                     */}
          {/* ======================================================== */}
          <div className="text-center px-2 space-y-1">
            {isLowRisk && (
              <>
                <p className="font-extrabold text-slate-900 text-xs sm:text-[13px]">
                  {isHindi
                    ? 'कोई बड़ा संदिग्ध संकेतक नहीं मिला।'
                    : 'No major suspicious indicators were detected.'}
                </p>
                <p className="text-slate-500 text-[11.5px] leading-relaxed">
                  {isHindi
                    ? 'हालांकि, यह गारंटी नहीं देता कि सामग्री पूरी तरह सुरक्षित है।'
                    : 'However, this does not guarantee that the content is completely safe.'}
                </p>
              </>
            )}

            {isMediumRisk && (
              <>
                <p className="font-extrabold text-slate-900 text-xs sm:text-[13px]">
                  {isHindi
                    ? 'इस सामग्री में संदिग्ध संकेतक पाए गए हैं।'
                    : 'This content contains suspicious indicators.'}
                </p>
                <p className="text-slate-500 text-[11.5px] leading-relaxed">
                  {isHindi
                    ? 'आगे बढ़ने से पहले प्रेषक और लिंक की पुष्टि अवश्य करें।'
                    : 'Verify the sender and destination before proceeding.'}
                </p>
              </>
            )}

            {isHighRisk && (
              <p className="text-slate-700 font-medium text-[12px] leading-relaxed">
                {isHindi
                  ? 'हमारे सुरक्षा विश्लेषण में कई संदिग्ध संकेतक मिले हैं। इसे खोलने से आप फ़िशिंग, वित्तीय धोखाधड़ी या डेटा चोरी के शिकार हो सकते हैं।'
                  : 'Our security analysis identified multiple suspicious indicators. Opening this content may expose you to phishing, financial fraud, or data theft.'}
              </p>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. INNER CONTENT BOX (INDICATORS / ANALYSIS SUMMARY)     */}
          {/* ======================================================== */}

          {/* LOW RISK: ANALYSIS SUMMARY */}
          {isLowRisk && (
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[12px]">
                <BarChart2 className="w-4 h-4 text-[#16A34A]" />
                <span>{isHindi ? 'विश्लेषण सारांश' : 'Analysis Summary'}</span>
              </div>

              <div className="space-y-1.5 text-slate-700 text-[11.5px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{isHindi ? 'कोई फ़िशिंग पैटर्न नहीं मिला' : 'No known phishing patterns'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{isHindi ? 'डोमेन वैध प्रतीत होता है' : 'Domain appears legitimate'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{isHindi ? 'कोई उच्च-जोखिम कीवर्ड नहीं मिला' : 'No high-risk keywords detected'}</span>
                </div>
              </div>
            </div>
          )}

          {/* MEDIUM RISK: DETECTED INDICATORS */}
          {isMediumRisk && (
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-amber-200/70 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 text-[12px]">
                <Search className="w-4 h-4 text-[#D97706]" />
                <span>{isHindi ? 'पहचाने गए संकेतक' : 'Detected Indicators'}</span>
              </div>

              <div className="space-y-2 text-slate-800 text-[11.5px]">
                {riskSignals.length > 0 ? (
                  riskSignals.slice(0, 3).map((sig: RiskSignal) => (
                    <div key={sig.id} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5 fill-[#FDE68A]" />
                      <div>
                        <div className="font-bold text-slate-900">{isHindi ? sig.titleHi || sig.title : sig.title}</div>
                        <div className="text-slate-600 text-[11px]">{isHindi ? sig.reasonHi || sig.reason : sig.reason}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5 fill-[#FDE68A]" />
                      <span>{isHindi ? 'संदिग्ध कीवर्ड्स (उदा. "सत्यापित करें", "KYC")' : 'Suspicious keywords detected (e.g., "verify", "update", "KYC")'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5 fill-[#FDE68A]" />
                      <span>{isHindi ? 'अपरिचित या नव-पंजीकृत डोमेन' : 'Unfamiliar or newly registered domain'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5 fill-[#FDE68A]" />
                      <span>{isHindi ? 'व्यक्तिगत या वित्तीय जानकारी का अनुरोध' : 'Requests for personal or financial information'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* View Detailed Analysis Accordion Toggle */}
              <button
                type="button"
                onClick={() => setIsDetailedExpanded(!isDetailedExpanded)}
                className="w-full pt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span>{isHindi ? 'विस्तृत विश्लेषण देखें' : 'View Detailed Analysis'}</span>
                {isDetailedExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isDetailedExpanded && (
                <div className="pt-2 border-t border-amber-200 text-[11px] text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                  <div className="font-bold text-slate-900">{isHindi ? 'विश्लेषण विवरण:' : 'Analysis Context:'}</div>
                  <p className="text-slate-600 leading-relaxed">
                    {analysisResult.headlineSummary || 'Independent verification advised before submitting personal data.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HIGH RISK: DETECTED INDICATORS */}
          {isHighRisk && (
            <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-red-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-950 text-[12px]">
                <div className="w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-black">
                  !
                </div>
                <span>{isHindi ? 'पहचाने गए गंभीर संकेतक' : 'Detected Indicators'}</span>
              </div>

              <div className="space-y-2 text-slate-800 text-[11.5px]">
                {riskSignals.length > 0 ? (
                  riskSignals.slice(0, 4).map((sig: RiskSignal) => (
                    <div key={sig.id} className="flex items-start gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold">
                        !
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{isHindi ? sig.titleHi || sig.title : sig.title}</div>
                        <div className="text-slate-600 text-[11px] leading-snug">{isHindi ? sig.reasonHi || sig.reason : sig.reason}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0 text-[9px] font-bold">!</div>
                      <span>Phishing / malicious URL pattern detected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0 text-[9px] font-bold">!</div>
                      <span>Asks for sensitive information (e.g., OTP, PIN, KYC)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0 text-[9px] font-bold">!</div>
                      <span>Matches with known scam/fraud patterns</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0 text-[9px] font-bold">!</div>
                      <span>High similarity with reported scam messages</span>
                    </div>
                  </>
                )}
              </div>

              {/* View Detailed Analysis Accordion Toggle */}
              <button
                type="button"
                onClick={() => setIsDetailedExpanded(!isDetailedExpanded)}
                className="w-full pt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span>{isHindi ? 'विस्तृत विश्लेषण देखें' : 'View Detailed Analysis'}</span>
                {isDetailedExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isDetailedExpanded && (
                <div className="pt-2 border-t border-red-200 text-[11px] text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                  <div className="font-bold text-slate-900">{isHindi ? 'धोखाधड़ी विश्लेषण निष्कर्ष:' : 'Forensic Verdict:'}</div>
                  <p className="text-slate-600 leading-relaxed">
                    {analysisResult.headlineSummary || 'High threat social engineering detected.'}
                  </p>
                  {analysisResult.claims && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {analysisResult.claims
                        .flatMap((c: ExtractedClaim) => c.flaggedPhrases || [])
                        .slice(0, 6)
                        .map((phrase: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-mono font-bold">
                            &ldquo;{phrase}&rdquo;
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reporting Drawer for High Risk */}
          {showReportingDrawer && (
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 text-xs animate-in fade-in duration-150 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  National Cyber Crime Helpline
                </span>
                <button onClick={() => setShowReportingDrawer(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-300">Toll-free 24x7 Citizen Helpline</span>
                <a href="tel:1930" className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs">
                  Call 1930
                </a>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-300">Portal: cybercrime.gov.in</span>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded bg-[#004A87] hover:bg-[#003B6D] text-white font-bold text-xs inline-flex items-center gap-1">
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. ACTION BUTTONS (EXACT REFERENCE DESIGN PER TIER)      */}
          {/* ======================================================== */}

          {/* LOW RISK ACTION BUTTONS */}
          {isLowRisk && (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isHindi ? 'जारी रखें' : 'Continue'}</span>
              </button>

              <button
                type="button"
                onClick={onGoBack}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs transition-colors shadow-2xs"
              >
                {isHindi ? 'वापस जाएं' : 'Go Back'}
              </button>
            </div>
          )}

          {/* MEDIUM RISK ACTION BUTTONS */}
          {isMediumRisk && (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isHindi ? 'सावधानी से आगे बढ़ें' : 'Continue with Caution'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onGoBack}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs transition-colors shadow-2xs"
                >
                  {isHindi ? 'वापस जाएं' : 'Go Back'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailedExpanded(!isDetailedExpanded)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Info className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isHindi ? 'विवरण देखें' : 'View Details'}</span>
                </button>
              </div>
            </div>
          )}

          {/* HIGH RISK ACTION BUTTONS */}
          {isHighRisk && (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled
                title="Direct opening of this high-risk content is blocked for safety"
                className="w-full py-3 px-4 rounded-xl bg-[#B91C1C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-not-allowed opacity-95"
              >
                <Ban className="w-4 h-4 stroke-[2.5]" />
                <span>{isHindi ? 'लिंक खोलना ब्लॉक है' : 'Open Link — Blocked'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onGoBack}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isHindi ? 'सुरक्षा की ओर लौटें' : 'Go Back to Safety'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportingDrawer(!showReportingDrawer)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#FFF5F5] hover:bg-[#FEE2E2] border border-red-300 text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'रिपोर्ट करें' : 'Report'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
