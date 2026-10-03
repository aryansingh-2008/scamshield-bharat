'use client';

import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import PrivacyNotice from '@/components/PrivacyNotice';
import MessageInput from '@/components/MessageInput';
import ImageUploader from '@/components/ImageUploader';
import UrlInput from '@/components/UrlInput';
import DemoScenarioSelector from '@/components/DemoScenarioSelector';
import AnalysisProgress from '@/components/AnalysisProgress';
import RiskStatusHero from '@/components/RiskStatusHero';
import RiskSignalCard from '@/components/RiskSignalCard';
import EvidenceCard from '@/components/EvidenceCard';
import EvidenceTrail from '@/components/EvidenceTrail';
import UncertaintyCard from '@/components/UncertaintyCard';
import SafeNextSteps from '@/components/SafeNextSteps';
import ArchitectureModal from '@/components/ArchitectureModal';
import SecurityModal from '@/components/SecurityModal';
import Footer from '@/components/Footer';
import { TRANSLATIONS } from '@/lib/translations';
import { AnalysisResponse } from '@/types';
import {
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Link2,
  PlayCircle,
  RotateCcw,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [activeTab, setActiveTab] = useState<'text' | 'screenshot' | 'url' | 'demo'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const inputSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const switchTab = (tab: 'text' | 'screenshot' | 'url' | 'demo') => {
    setActiveTab(tab);
    setErrorMessage(null);
  };

  const scrollToInput = (tab: 'text' | 'screenshot' | 'url' | 'demo') => {
    switchTab(tab);
    setAnalysisResult(null);
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Unified analysis dispatch helper without artificial delays
  const executeAnalysis = async (
    requestOptions: {
      url: string;
      body?: BodyInit;
      headers?: HeadersInit;
    },
    defaultErrorMessage: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(requestOptions.url, {
        method: 'POST',
        headers: requestOptions.headers,
        body: requestOptions.body,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || defaultErrorMessage);
      }

      setAnalysisResult(data);
      setIsLoading(false);

      requestAnimationFrame(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || defaultErrorMessage);
    }
  };

  const handleAnalyzeText = (content: string) => {
    executeAnalysis(
      {
        url: '/api/analyze',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          inputMode: 'text',
        }),
      },
      'Failed to complete analysis. Please try again.'
    );
  };

  const handleAnalyzeUrl = (url: string) => {
    executeAnalysis(
      {
        url: '/api/analyze',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: url,
          inputMode: 'url',
        }),
      },
      'Unable to verify URL. Please check the address.'
    );
  };

  const handleAnalyzeScreenshot = (file: File, contextText?: string) => {
    const formData = new FormData();
    formData.append('screenshot', file);
    if (contextText) formData.append('context', contextText);

    executeAnalysis(
      {
        url: '/api/analyze',
        body: formData,
      },
      'Screenshot analysis failed. Please try again.'
    );
  };

  const handleSelectDemo = (demoId: string) => {
    executeAnalysis(
      {
        url: '/api/analyze',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: demoId,
          inputMode: 'demo',
          demoId,
        }),
      },
      'Failed to load demo scenario.'
    );
  };

  const handleResetCheck = () => {
    setAnalysisResult(null);
    setErrorMessage(null);
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-console-950 text-console-100 selection:bg-safety-brand-primary/30">
      {/* Header */}
      <Header
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenArch={() => setIsArchOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onNavigateHome={handleResetCheck}
        onTriggerDemo={() => scrollToInput('demo')}
      />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-5">
        {/* =======================================================
            SCREEN 1: LANDING HERO
            ======================================================= */}
        {!analysisResult && !isLoading && (
          <section className="text-center space-y-2 pt-0 sm:pt-1 animate-in fade-in duration-300">
            {/* Direct Action Headline */}
            <h1 className="text-2xl sm:text-3.5xl font-extrabold text-console-100 tracking-tight max-w-2xl mx-auto leading-tight">
              {t.heroHeadline}
            </h1>

            {/* Supporting Line */}
            <p className="text-xs sm:text-sm text-console-300 max-w-xl mx-auto leading-relaxed font-sans">
              {t.heroSubheadline}
            </p>
          </section>
        )}

        {/* =======================================================
            SCREEN 2: CHECK INPUT CONSOLE
            ======================================================= */}
        {!analysisResult && !isLoading && (
          <section ref={inputSectionRef} className="space-y-3 max-w-4xl mx-auto w-full">
            <div className="rounded-xl border border-console-700 bg-white p-4 sm:p-6 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-console-700 pb-3.5">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EEF4F9] text-safety-brand-primary border border-console-700/80 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-console-100 font-sans tracking-tight">
                      {t.inputTitle}
                    </h2>
                    <p className="text-xs text-console-400 mt-0.5 font-sans leading-relaxed">
                      {t.inputSubtitle}
                    </p>
                  </div>
                </div>

                {/* Clean Input Source Selector */}
                {/* Mobile 2x2 Selector (< sm) */}
                <div className="grid grid-cols-2 gap-1.5 w-full sm:hidden bg-console-850 p-1.5 rounded-lg border border-console-700">
                  <button
                    onClick={() => switchTab('text')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'text'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.tabMessage}</span>
                  </button>

                  <button
                    onClick={() => switchTab('screenshot')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'screenshot'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{t.tabScreenshot}</span>
                  </button>

                  <button
                    onClick={() => switchTab('url')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'url'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{t.tabLink}</span>
                  </button>

                  <button
                    onClick={() => switchTab('demo')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'demo'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-safety-brand-primary" />
                    <span>{t.tabDemo}</span>
                  </button>
                </div>

                {/* Desktop Inline Selector (>= sm) */}
                <div className="hidden sm:flex items-center bg-console-850 p-1 rounded-lg border border-console-700 shrink-0">
                  <button
                    onClick={() => switchTab('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'text'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.tabMessage}</span>
                  </button>

                  <button
                    onClick={() => switchTab('screenshot')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'screenshot'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{t.tabScreenshot}</span>
                  </button>

                  <button
                    onClick={() => switchTab('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'url'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{t.tabLink}</span>
                  </button>

                  <button
                    onClick={() => switchTab('demo')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'demo'
                        ? 'bg-white text-safety-brand-primary shadow-xs font-semibold border border-console-700'
                        : 'text-console-400 hover:text-console-100'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-safety-brand-primary" />
                    <span>{t.tabDemo}</span>
                  </button>
                </div>
              </div>

              {/* Active Tab Component */}
              <div>
                {activeTab === 'text' && (
                  <MessageInput
                    lang={lang}
                    onAnalyze={handleAnalyzeText}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === 'screenshot' && (
                  <ImageUploader
                    lang={lang}
                    onAnalyzeScreenshot={handleAnalyzeScreenshot}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === 'url' && (
                  <UrlInput
                    lang={lang}
                    onAnalyzeUrl={handleAnalyzeUrl}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === 'demo' && (
                  <DemoScenarioSelector
                    lang={lang}
                    onSelectDemo={handleSelectDemo}
                    isLoading={isLoading}
                  />
                )}
              </div>

              {/* Error Display */}
              {errorMessage && (
                <div className="p-3.5 rounded-md bg-safety-high-bg border border-safety-high-border text-safety-high-text text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-safety-high-accent shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Privacy Notice */}
              <PrivacyNotice lang={lang} />
            </div>
          </section>
        )}

        {/* =======================================================
            SCREEN 3: ANALYSIS EXPERIENCE (SCANNING)
            ======================================================= */}
        {isLoading && (
          <section className="py-8 animate-in fade-in duration-300">
            <AnalysisProgress lang={lang} />
          </section>
        )}

        {/* =======================================================
            SCREEN 4 & 5: INVESTIGATION WORKBENCH (RESULTS)
            ======================================================= */}
        {analysisResult && !isLoading && (
          <section ref={resultsSectionRef} className="space-y-6 animate-in fade-in duration-300">
            {/* Top Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-white border border-console-700 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs font-mono font-bold text-console-100">
                  REPORT: {analysisResult.id}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-console-850 text-console-400 border border-console-700">
                  INPUT: {analysisResult.inputMode.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-console-400">
                  {analysisResult.timestamp}
                </span>
              </div>

              <button
                onClick={handleResetCheck}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-console-700 hover:border-safety-brand-primary text-console-300 hover:text-console-100 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.btnNewCheck}</span>
              </button>
            </div>

            {/* STAGE 1: SUSPICIOUS CONTENT INSPECTION BOX */}
            <div className="p-4 sm:p-5 rounded-xl border border-console-700 bg-white space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-console-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-safety-brand-primary text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0 shadow-2xs">
                    STAGE 01
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#17202A] font-sans tracking-tight">
                    {lang === 'hi' ? 'प्राप्त सामग्री की जांच (Submitted Content Inspection)' : 'Submitted Content Inspection'}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5">
                  {analysisResult.piiRedacted && (
                    <span className="text-xs font-mono text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                      <Lock className="w-3 h-3 text-emerald-600" /> PII Masked
                    </span>
                  )}
                  <span className="text-xs font-mono font-medium text-[#667085]">
                    IN-MEMORY SCAN
                  </span>
                </div>
              </div>

              {analysisResult.redactedInputPreview && (
                <div className="p-3.5 rounded-lg bg-[#F2F5F8] border border-console-700 text-xs font-mono text-[#17202A] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {analysisResult.redactedInputPreview}
                </div>
              )}
            </div>

            {/* EXECUTIVE RISK VERDICT HERO & METRICS */}
            <RiskStatusHero
              status={analysisResult.status}
              headline={analysisResult.headlineSummary}
              headlineHi={analysisResult.headlineSummaryHi}
              explanation={analysisResult.detailedExplanation}
              explanationHi={analysisResult.detailedExplanationHi}
              piiRedacted={analysisResult.piiRedacted}
              isDemo={analysisResult.isDemoAnalysis}
              lang={lang}
              stats={{
                claimsCount: analysisResult.claims?.length || 0,
                signalsCount: analysisResult.riskSignals?.length || 0,
                evidenceCount: analysisResult.evidence?.length || 0,
                unverifiedCount: analysisResult.couldNotVerify?.length || 0,
              }}
            />

            {/* STAGE 2: EVIDENCE TRAIL (SIGNATURE CROSS-EXAMINATION MATRIX) */}
            {analysisResult.claims && analysisResult.claims.length > 0 && (
              <EvidenceTrail
                claims={analysisResult.claims}
                evidence={analysisResult.evidence || []}
                couldNotVerify={analysisResult.couldNotVerify || []}
                overallStatus={analysisResult.status}
                lang={lang}
              />
            )}

            {/* STAGE 3: DETECTED RISK SIGNALS */}
            {analysisResult.riskSignals && analysisResult.riskSignals.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="border-b border-console-700 pb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-safety-brand-primary text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0 shadow-2xs">
                      STAGE 03
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#17202A] font-sans tracking-tight">
                      {t.riskSignalsTitle}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                    {analysisResult.riskSignals.length} DETECTED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.riskSignals.map((signal) => (
                    <RiskSignalCard key={signal.id} signal={signal} lang={lang} />
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 4: OFFICIAL VERIFIED EVIDENCE TRAIL */}
            {analysisResult.evidence && analysisResult.evidence.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="border-b border-console-700 pb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-safety-brand-primary text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0 shadow-2xs">
                      STAGE 04
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#17202A] font-sans tracking-tight">
                      {t.verifiedSectionTitle}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#F0FDF4] text-[#087A5B] border border-[#BBF7D0]">
                    {analysisResult.evidence.length} SOURCES
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.evidence.map((evid) => (
                    <EvidenceCard key={evid.id} evidence={evid} lang={lang} />
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 6: EPISTEMIC UNCERTAINTY (WHAT COULD NOT BE VERIFIED) */}
            <UncertaintyCard items={analysisResult.couldNotVerify} lang={lang} />

            {/* STAGE 7: INCIDENT RESPONSE PROTOCOL (SAFE NEXT STEPS) */}
            <SafeNextSteps steps={analysisResult.safeNextSteps} lang={lang} />

            {/* Bottom Reset Callout */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleResetCheck}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold text-xs sm:text-sm bg-safety-brand-primary text-white hover:bg-safety-brand-secondary border border-safety-brand-primary shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-safety-brand-primary"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.btnNewCheck}</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Modals */}
      <ArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
        lang={lang}
      />

      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        lang={lang}
      />
    </div>
  );
}
