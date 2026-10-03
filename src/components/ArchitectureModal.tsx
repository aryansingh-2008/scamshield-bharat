'use client';

import React, { useEffect } from 'react';
import { X, Cpu, ShieldCheck, Lock, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function ArchitectureModal({ isOpen, onClose, lang }: ArchitectureModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  const pipelineStages = [
    {
      num: '01',
      title: 'Untrusted User Input',
      titleHi: 'उपयोगकर्ता इनपुट',
      desc: 'Accepts raw text, image screenshot, or web URL. Encapsulated in strict untrusted data boundaries.',
      descHi: 'कच्चा टेक्स्ट, स्क्रीनशॉट या यूआरएल प्राप्त करना। इसे अविश्वसनीय डेटा माना जाता है।',
      security: 'Size validation (5MB max), MIME check, SSRF IP blocking.',
    },
    {
      num: '02',
      title: 'Lightweight PII Redaction',
      titleHi: 'निजी डेटा मास्किंग (PII Redaction)',
      desc: 'Scans and masks phone numbers, emails, bank accounts, card numbers, OTP patterns, and UPI IDs.',
      descHi: 'फोन नंबर, ईमेल, बैंक खाता, कार्ड नंबर और ओटीपी को हटाना/मास्क करना।',
      security: 'Sensitive credentials never leave the memory or reach external APIs.',
    },
    {
      num: '03',
      title: 'Deterministic Risk & Claim Engine',
      titleHi: 'निश्चित नियम आधारित रिस्क इंजन',
      desc: '20 domain-calibrated rules detect guaranteed returns, urgency, threats, APK solicitations, and fake KYC.',
      descHi: '20 विशेष नियम गारंटीड रिटर्न, धमकी, रिमोट ऐप आदि की सटीक पहचान करते हैं।',
      security: 'Immune to prompt injection. Operates offline without external dependencies.',
    },
    {
      num: '04',
      title: 'Trusted Regulatory Evidence Layer',
      titleHi: 'आधिकारिक नियामक प्रमाण कोष',
      desc: 'Curated knowledge base of SEBI, RBI, CERT-In, and National Cybercrime portal advisories.',
      descHi: 'सेबी, आरबीआई, और सर्ट-इन की आधिकारिक चेतावनियों से मिलान।',
      security: 'Zero hallucinated URLs; all citations reference verified government/exchange portals.',
    },
    {
      num: '05',
      title: 'AI Plain-Language Synthesis (Optional)',
      titleHi: 'एआई द्वारा सरल भाषा में अनुवाद',
      desc: 'LLM generates natural conversational Hindi & English briefings with strict JSON schema constraints.',
      descHi: 'सरल हिंदी और अंग्रेजी में आम निवेशकों के लिए व्याख्या तैयार करना।',
      security: 'Prompt-injection defense boundary + Zod schema validation fallback.',
    },
    {
      num: '06',
      title: 'Evidence-First Investor Safety Report',
      titleHi: 'प्रमाण-आधारित सुरक्षा रिपोर्ट',
      desc: 'Delivers Risk Status, Detected Claims, Official Evidence, Uncertainty separation, and 5-step Safe Actions.',
      descHi: 'जोखिम स्थिति, दावे, सरकारी नियम, अनिश्चितता और 5 सुरक्षित कदम।',
      security: 'No fake probabilities. Strict contrast and accessible rendering.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="arch-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-md border border-console-700 bg-white p-6 sm:p-7 space-y-5 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-console-700/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#F0F5FA] border border-console-700 text-safety-brand-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 id="arch-modal-title" className="text-base sm:text-lg font-bold text-console-100 font-sans">
                {t.archTitle}
              </h3>
              <p className="text-xs text-console-400">
                Hybrid Deterministic + Evidence-Grounded Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-console-700 text-console-400 hover:text-console-100 hover:bg-console-850 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pipeline Diagram */}
        <div className="space-y-3">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.num}
              className="p-4 rounded-xl border border-console-700 bg-console-850/40 hover:border-console-400 transition-all flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex items-center gap-2 sm:flex-col sm:items-center shrink-0">
                <span className="w-8 h-8 rounded-lg bg-[#F0F5FA] border border-console-700 flex items-center justify-center text-xs font-mono font-bold text-safety-brand-primary">
                  {stage.num}
                </span>
                {idx < pipelineStages.length - 1 && (
                  <div className="hidden sm:block w-0.5 h-6 bg-console-700 my-1" />
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <h4 className="font-bold text-sm text-console-100 flex items-center gap-2">
                  <span>{lang === 'hi' ? stage.titleHi : stage.title}</span>
                </h4>
                <p className="text-xs text-console-300 leading-relaxed">
                  {lang === 'hi' ? stage.descHi : stage.desc}
                </p>
                <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                  🔒 Security: {stage.security}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-console-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-safety-brand-primary hover:bg-safety-brand-secondary text-white font-semibold text-xs transition-colors border border-safety-brand-primary"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
}
