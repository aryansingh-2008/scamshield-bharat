'use client';

import React, { useEffect } from 'react';
import { X, ShieldCheck, Lock, EyeOff, Globe, Server, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function SecurityModal({ isOpen, onClose, lang }: SecurityModalProps) {
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

  const securityPillars = [
    {
      title: 'Input Safety & Untrusted Data Boundary',
      titleHi: 'इनपुट सुरक्षा और अविश्वसनीय डेटा सीमा',
      icon: EyeOff,
      desc: 'All user-provided messages, screenshots, and text strings are strictly treated as untrusted data. The analysis engine never executes raw input or allows submitted prompts to override safety instructions.',
      descHi: 'सभी मैसेज और स्क्रीनशॉट को अविश्वसनीय माना जाता है। कोई भी कोड या प्रॉम्ट सिस्टम को ओवरराइड नहीं कर सकता।',
    },
    {
      title: 'Zero Credential & PII Collection',
      titleHi: 'शून्य क्रेडेंशियल व निजी डेटा संग्रह',
      icon: Lock,
      desc: 'ScamShield Bharat never asks for or stores passwords, OTPs, PINs, card numbers, Aadhaar, PAN, or demat logins. Built-in regex filters redact mobile numbers and account IDs before analysis.',
      descHi: 'हम कभी भी पासवर्ड, ओटीपी, यूपीआई पिन या बैंक लॉगिन नहीं मांगते। निजी जानकारी विश्लेषण से पहले ही मास्क कर दी जाती है।',
    },
    {
      title: 'SSRF & Restricted URL Safety',
      titleHi: 'एसएसआरएफ (SSRF) और सुरक्षित यूआरएल नियंत्रण',
      icon: Globe,
      desc: 'URL analysis enforces strict domain whitelists and blocks loopback (127.0.0.1), private IP ranges (RFC 1918), hex/octal encoded IPs, and internal cloud metadata endpoints (169.254.169.254).',
      descHi: 'प्राइवेट आईपी और लोकलहोस्ट पर किसी भी प्रकार के अनुरोध को रोककर नेटवर्क सुरक्षा सुनिश्चित की जाती है।',
    },
    {
      title: 'AI Safety & Zod Schema Validation',
      titleHi: 'एआई सुरक्षा एवं सख्त स्कीमा सत्यापन',
      icon: Server,
      desc: 'All model responses are strictly parsed against Zod schemas. If the model output fails schema validation, the system falls back safely to deterministic rules with zero user impact.',
      descHi: 'सभी उत्तरों की सख्त जांच होती है ताकि गलत या असत्यापित जानकारी कभी प्रदर्शित न हो।',
    },
    {
      title: 'Ephemeral Processing (No Raw Data Retention)',
      titleHi: 'अस्थायी प्रसंस्करण (डेटा सुरक्षित निष्कासन)',
      icon: ShieldCheck,
      desc: 'Content is evaluated in-memory during the verification lifecycle and discarded. No raw scam text or screenshots are saved to permanent public storage.',
      descHi: 'संदेश की जांच केवल मेमोरी में की जाती है और रिपोर्ट बनने के बाद डेटा को तुरंत नष्ट कर दिया जाता है।',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md border border-console-700 bg-white p-6 sm:p-7 space-y-5 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-console-700/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="security-modal-title" className="text-base sm:text-lg font-bold text-console-100 font-sans">
                {t.secTitle}
              </h3>
              <p className="text-xs text-console-400">
                Security-by-Design & Investor Privacy Guarantees
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

        {/* Pillars */}
        <div className="space-y-3">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-console-700 bg-console-850/40 space-y-1.5"
              >
                <div className="flex items-center gap-2 text-console-100 font-bold text-sm">
                  <Icon className="w-4 h-4 text-safety-brand-primary shrink-0" />
                  <span>{lang === 'hi' ? pillar.titleHi : pillar.title}</span>
                </div>
                <p className="text-xs text-console-300 leading-relaxed pl-6">
                  {lang === 'hi' ? pillar.descHi : pillar.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-console-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-safety-brand-primary hover:bg-safety-brand-secondary text-white font-semibold text-xs transition-colors border border-safety-brand-primary"
          >
            Close Security Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
