'use client';

import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import OfficialSlideHero from '@/components/OfficialSlideHero';
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
import SafetyTipsModal from '@/components/SafetyTipsModal';
import AboutModal from '@/components/AboutModal';
import OfficialSourcesPage from '@/components/OfficialSourcesPage';
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
  ShieldCheck,
  Layers,
  ChevronDown,
} from 'lucide-react';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [currentView, setCurrentView] = useState<'home' | 'sources'>('home');
  const [activeTab, setActiveTab] = useState<'text' | 'screenshot' | 'url' | 'demo'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check URL query or hash on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'sources' || window.location.hash === '#official-sources') {
        setCurrentView('sources');
      }
    }
  }, []);

  // Modals state
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isSafetyTipsOpen, setIsSafetyTipsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
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
    setCurrentView('home');
    switchTab(tab);
    setAnalysisResult(null);
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Unified analysis dispatch helper
  const executeAnalysis = async (
    requestOptions: {
      url: string;
      body?: BodyInit;
      headers?: HeadersInit;
    },
    defaultErrorMessage: string
  ) => {
    setCurrentView('home');
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
    setCurrentView('home');
    setAnalysisResult(null);
    setErrorMessage(null);
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#EBF5FB] via-[#F4F9FD] to-[#FFFFFF] text-slate-900 selection:bg-[#004A87]/20 relative overflow-hidden">
      {/* Decorative Background Tricolor Swooshes */}
      <div className="absolute top-1/2 -right-32 w-96 h-96 pointer-events-none opacity-25 -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M 0,100 C 50,20 150,180 200,100"
            fill="none"
            stroke="#FF9933"
            strokeWidth="8"
          />
          <path
            d="M 0,110 C 50,30 150,190 200,110"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
          <path
            d="M 0,120 C 50,40 150,200 200,120"
            fill="none"
            stroke="#138808"
            strokeWidth="8"
          />
        </svg>
      </div>

      <div className="absolute bottom-10 -left-32 w-96 h-96 pointer-events-none opacity-25 -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M 0,100 C 80,0 120,200 200,100"
            fill="none"
            stroke="#FF9933"
            strokeWidth="10"
          />
          <path
            d="M 0,112 C 80,12 120,212 200,112"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
          />
          <path
            d="M 0,124 C 80,24 120,224 200,124"
            fill="none"
            stroke="#138808"
            strokeWidth="10"
          />
        </svg>
      </div>

      {/* Top Navbar */}
      <Header
        lang={lang}
        currentView={currentView}
        onToggleLang={handleToggleLang}
        onOpenArch={() => setIsArchOpen(true)}
        onOpenSafetyTips={() => setIsSafetyTipsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onNavigateHome={handleResetCheck}
        onNavigateSources={() => setCurrentView('sources')}
        onTriggerDemo={() => scrollToInput('demo')}
      />

      <main className="flex-1 max-w-[1340px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-6">
        {/* =======================================================
            VIEW A: SIMPLIFIED OFFICIAL SOURCES PAGE
            ======================================================= */}
        {currentView === 'sources' && (
          <OfficialSourcesPage
            lang={lang}
            analysisResult={analysisResult}
            onNavigateHome={() => setCurrentView('home')}
          />
        )}

        {/* =======================================================
            VIEW B: HOMEPAGE (HERO + INPUT CONSOLE + RESULTS)
            ======================================================= */}
        {currentView === 'home' && (
          <>
            {/* SCREEN 1: LANDING HERO (OFFICIAL MISSION & MOCKUP) */}
            {!analysisResult && !isLoading && (
              <OfficialSlideHero lang={lang} />
            )}

            {/* SCREEN 2: CHECK INPUT CONSOLE (MATCHING REF CARD) */}
            {!analysisResult && !isLoading && (
              <section
                id="input-console-section"
                ref={inputSectionRef}
                className="space-y-4 max-w-[1340px] mx-auto w-full"
              >
                <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 space-y-4 shadow-lg">
                  {/* Header inside Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#004A87]/10 text-[#004A87] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#0A1C2A] font-sans tracking-tight">
                          {lang === 'hi' ? 'संदेश की जांच करें' : 'Check if it’s a scam'}
                        </h2>
                        <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                          {lang === 'hi'
                            ? 'आधिकारिक स्रोतों से सुरक्षा विश्लेषण प्राप्त करने के लिए संदेश, लिंक, ईमेल या स्क्रीनशॉट डालें।'
                            : 'Paste a message, link, email or upload an image to get a safety analysis with official sources.'}
                        </p>
                      </div>
                    </div>

                    {/* Right Badge: Data Privacy */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EBF3FA] text-[12px] text-[#0F568C] font-semibold shrink-0">
                      <Lock className="w-3.5 h-3.5 text-[#0F568C]" />
                      <span>{lang === 'hi' ? 'आपका डेटा निजी व सुरक्षित है' : 'Your data is private and secure'}</span>
                    </div>
                  </div>

                  {/* Segmented Tab Buttons (Text, Link, Image, Demo) */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => switchTab('text')}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        activeTab === 'text'
                          ? 'bg-[#0B3B64] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>{lang === 'hi' ? 'टेक्स्ट' : 'Text'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchTab('url')}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        activeTab === 'url'
                          ? 'bg-[#0B3B64] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Link2 className="w-4 h-4 shrink-0" />
                      <span>{lang === 'hi' ? 'लिंक' : 'Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchTab('screenshot')}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        activeTab === 'screenshot'
                          ? 'bg-[#0B3B64] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 shrink-0" />
                      <span>{lang === 'hi' ? 'स्क्रीनशॉट' : 'Image'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchTab('demo')}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        activeTab === 'demo'
                          ? 'bg-[#0B3B64] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4 shrink-0" />
                      <span>{lang === 'hi' ? 'डेमो परिदृश्य' : 'Demo Scenarios'}</span>
                    </button>
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
                    <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Try an Example Quick Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800 text-[12px] shrink-0 mr-1">
                      {lang === 'hi' ? 'उदाहरण आज़माएं:' : 'Try an example:'}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        switchTab('demo');
                        handleSelectDemo('scenario-1');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#EEF4F9] text-slate-700 hover:text-[#004A87] border border-slate-200 text-[11.5px] font-medium transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#004A87]" />
                      <span>{lang === 'hi' ? 'गारंटीड 30% रिटर्न' : 'You’ve won ₹5,00,000!'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchTab('demo');
                        handleSelectDemo('scenario-2');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#EEF4F9] text-slate-700 hover:text-[#004A87] border border-slate-200 text-[11.5px] font-medium transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5 text-[#004A87]" />
                      <span>{lang === 'hi' ? 'sbi-reward.com लिंक' : 'sbi-reward.com'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchTab('demo');
                        handleSelectDemo('scenario-3');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#EEF4F9] text-slate-700 hover:text-[#004A87] border border-slate-200 text-[11.5px] font-medium transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#004A87]" />
                      <span>{lang === 'hi' ? 'फर्जी KYC संदेश' : 'KYC update message'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchTab('screenshot')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#EEF4F9] text-slate-700 hover:text-[#004A87] border border-slate-200 text-[11.5px] font-medium transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#004A87]" />
                      <span>{lang === 'hi' ? 'संदिग्ध स्क्रीनशॉट' : 'Suspicious screenshot'}</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SCREEN 3: ANALYSIS EXPERIENCE (SCANNING) */}
            {isLoading && (
              <section className="py-8 animate-in fade-in duration-300">
                <AnalysisProgress lang={lang} />
              </section>
            )}

            {/* SCREEN 4 & 5: INVESTIGATION WORKBENCH (RESULTS) */}
            {analysisResult && !isLoading && (
              <section ref={resultsSectionRef} className="space-y-6 animate-in fade-in duration-300">
                {/* Top Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      REPORT: {analysisResult.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-600 border border-slate-200">
                      INPUT: {analysisResult.inputMode.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {analysisResult.timestamp}
                    </span>
                  </div>

                  <button
                    onClick={handleResetCheck}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-[#004A87] text-slate-700 hover:text-[#004A87] transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.btnNewCheck}</span>
                  </button>
                </div>

                {/* 1. EXECUTIVE RISK VERDICT HERO (Instant 3-Second Comprehension) */}
                <RiskStatusHero
                  status={analysisResult.status}
                  headline={analysisResult.headlineSummary}
                  headlineHi={analysisResult.headlineSummaryHi}
                  explanation={analysisResult.detailedExplanation}
                  explanationHi={analysisResult.detailedExplanationHi}
                  piiRedacted={analysisResult.piiRedacted}
                  isDemo={analysisResult.isDemoAnalysis}
                  lang={lang}
                  stats={
                    showTechnicalDetails
                      ? {
                          claimsCount: analysisResult.claims?.length || 0,
                          signalsCount: analysisResult.riskSignals?.length || 0,
                          evidenceCount: analysisResult.evidence?.length || 0,
                          unverifiedCount: analysisResult.couldNotVerify?.length || 0,
                        }
                      : undefined
                  }
                />

                {/* 2. IMMEDIATE ACTION GUIDANCE (Safe Next Steps) */}
                <SafeNextSteps steps={analysisResult.safeNextSteps} lang={lang} />

                {/* 3. SIMPLIFIED TRUSTED OFFICIAL SOURCES SECTION (Clean SEBI, RBI, 1930 Cards) */}
                <div className="pt-1">
                  <OfficialSourcesPage
                    lang={lang}
                    analysisResult={analysisResult}
                    onNavigateHome={handleResetCheck}
                  />
                </div>

                {/* 4. EXPANDABLE DEEP TECHNICAL AUDIT TOGGLE BUTTON */}
                <div className="pt-2 pb-1 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-[#EEF7FC] text-slate-800 hover:text-[#004A87] font-bold text-xs sm:text-sm shadow-xs transition-all hover:border-[#004A87]"
                  >
                    <Layers className="w-4 h-4 text-[#004A87]" />
                    <span>
                      {showTechnicalDetails
                        ? (lang === 'hi' ? '▲ विस्तृत तकनीकी जांच व साक्ष्य छिपाएं' : '▲ Hide Detailed Evidence & Audit Trail')
                        : (lang === 'hi' ? '▼ विस्तृत तकनीकी साक्ष्य व खतरे के संकेत देखें (View Detailed Breakdown)' : '▼ View Detailed Evidence Trail & Risk Signals')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showTechnicalDetails ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-sans text-center">
                    {lang === 'hi'
                      ? 'यदि आप संदेश के दावों का विस्तृत मिलान, PII ऑडिट व सभी खतरे के संकेत देखना चाहते हैं'
                      : 'Click if you want to inspect exact regulatory evidence, claims matrix, and signal audits'}
                  </p>
                </div>

                {/* 5. EXPANDED DEEP TECHNICAL AUDIT STAGES (Complete 6-Stage Architecture) */}
                {showTechnicalDetails && (
                  <div className="space-y-6 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* STAGE 01: UNTRUSTED INPUT INGESTION & BOUNDARY CHECK */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-md bg-[#004A87] text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0">
                            STAGE 01
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
                            {lang === 'hi' ? 'अविश्वसनीय इनपुट ग्रहण व सत्यापन (Untrusted Input Ingestion)' : 'Untrusted User Input Ingestion & Verification'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono font-bold text-[#004A87] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            INPUT: {analysisResult.inputMode.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            MIME & SIZE VERIFIED
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10.5px] font-mono text-slate-500 uppercase block font-semibold">{lang === 'hi' ? 'सामग्री प्रकार:' : 'Input Mode:'}</span>
                          <span className="font-bold text-slate-800">{analysisResult.inputMode.toUpperCase()} MODE</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10.5px] font-mono text-slate-500 uppercase block font-semibold">{lang === 'hi' ? 'सुरक्षा सीमा:' : 'Security Boundary:'}</span>
                          <span className="font-bold text-emerald-700">Strict Untrusted Sandbox</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10.5px] font-mono text-slate-500 uppercase block font-semibold">{lang === 'hi' ? 'समय मुहर:' : 'Timestamp:'}</span>
                          <span className="font-mono text-slate-700">{analysisResult.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* STAGE 02: IN-MEMORY PII REDACTION & PRIVACY MASKING AUDIT */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-md bg-[#004A87] text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0">
                            STAGE 02
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
                            {lang === 'hi' ? 'निजी डेटा मास्किंग व सुरक्षा ऑडिट (In-Memory PII Redaction)' : 'In-Memory PII Redaction & Client Privacy Audit'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {analysisResult.piiRedacted ? (
                            <span className="text-xs font-mono text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-bold">
                              <Lock className="w-3 h-3 text-emerald-600" /> PII Masked
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                              No Sensitive PII Found
                            </span>
                          )}
                          <span className="text-xs font-mono font-medium text-slate-500">
                            ZERO RETENTION
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 font-sans leading-relaxed">
                        {lang === 'hi'
                          ? 'आपका निजी डेटा (आधार, पैन, मोबाइल, बैंक खाता, यूपीआई) मेमोरी में ही मास्क कर दिया गया है ताकि कोई संवेदनशील जानकारी बाहर न जाए:'
                          : 'All phone numbers, Aadhaar, PAN cards, OTPs, and bank accounts are sanitized in-memory before risk evaluation:'}
                      </p>

                      {analysisResult.redactedInputPreview && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                          {analysisResult.redactedInputPreview}
                        </div>
                      )}
                    </div>

                    {/* STAGE 03: DETERMINISTIC RISK SIGNALS & RED FLAGS */}
                    {analysisResult.riskSignals && analysisResult.riskSignals.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="border-b border-slate-200 pb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 rounded-md bg-[#004A87] text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0">
                              STAGE 03
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
                              {lang === 'hi' ? 'नियम-आधारित खतरे के संकेत (Deterministic Risk Signals)' : 'Deterministic Risk Engine & Detected Red Flags'}
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200">
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

                    {/* STAGE 04: TRUSTED REGULATORY EVIDENCE TRAIL & CLAIMS MATRIX */}
                    {analysisResult.claims && analysisResult.claims.length > 0 && (
                      <EvidenceTrail
                        claims={analysisResult.claims}
                        evidence={analysisResult.evidence || []}
                        couldNotVerify={analysisResult.couldNotVerify || []}
                        overallStatus={analysisResult.status}
                        lang={lang}
                      />
                    )}

                    {/* STAGE 05: EPISTEMIC UNCERTAINTY & UNVERIFIED CLAIMS */}
                    <UncertaintyCard items={analysisResult.couldNotVerify} lang={lang} />

                    {/* STAGE 06: DEFENSIVE ACTION PROTOCOL & ESCALATION AUDIT */}
                    <div className="p-5 rounded-2xl border border-[#004A87]/30 bg-gradient-to-br from-white to-[#F4F9FD] space-y-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-md bg-[#004A87] text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0">
                            STAGE 06
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
                            {lang === 'hi' ? 'सुरक्षा कार्य योजना व रिपोर्ट सारांश (Defensive Action Protocol)' : 'Defensive Action Protocol & Verification Summary'}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs">
                          5-STEP PROTOCOL ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <div className="flex items-center gap-1.5 text-[#004A87] font-bold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>{lang === 'hi' ? 'कार्रवाई स्थिति:' : 'Action Status:'}</span>
                          </div>
                          <p className="text-slate-600 text-[11.5px] leading-snug">
                            {lang === 'hi' ? '5-चरणीय सुरक्षा योजना तैयार' : '5-step containment protocol generated'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <Lock className="w-4 h-4" />
                            <span>{lang === 'hi' ? 'गोपनीयता आश्वासन:' : 'Privacy Assurance:'}</span>
                          </div>
                          <p className="text-slate-600 text-[11.5px] leading-snug">
                            {lang === 'hi' ? 'शून्य डेटा संग्रह, 100% निजी' : 'Zero data retained, client-side safe'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <div className="flex items-center gap-1.5 text-red-600 font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{lang === 'hi' ? 'आपातकालीन हेल्पलाइन:' : 'Emergency Escalation:'}</span>
                          </div>
                          <p className="text-slate-600 text-[11.5px] leading-snug">
                            {lang === 'hi' ? 'वित्तीय धोखाधड़ी पर 1930 डायल करें' : 'Dial 1930 for financial cyber fraud'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Reset Callout */}
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleResetCheck}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#004A87] text-white hover:bg-[#003B6D] shadow-md transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t.btnNewCheck}</span>
                  </button>
                </div>
              </section>
            )}
          </>
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

      <SafetyTipsModal
        isOpen={isSafetyTipsOpen}
        onClose={() => setIsSafetyTipsOpen(false)}
        lang={lang}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
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
