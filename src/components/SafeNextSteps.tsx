'use client';

import React from 'react';
import { SafeActionStep } from '@/types';
import { Octagon, ShieldCheck, Lock, PhoneCall, RefreshCw, ExternalLink } from 'lucide-react';

interface SafeNextStepsProps {
  steps: SafeActionStep[];
  lang: 'en' | 'hi';
}

export default function SafeNextSteps({ steps, lang }: SafeNextStepsProps) {
  const getCategoryConfig = (cat: SafeActionStep['category'], stepNum: number) => {
    switch (cat) {
      case 'STOP':
        return {
          icon: Octagon,
          title: lang === 'hi' ? 'चरण 01: रुकें (STOP)' : '01. STOP TRANSACTION',
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
          borderClass: 'border-l-4 border-l-red-600 border-y border-r border-console-700 bg-white',
        };
      case 'PROTECT':
        return {
          icon: Lock,
          title: lang === 'hi' ? 'चरण 02: सुरक्षित करें (PROTECT)' : '02. PROTECT ACCOUNTS',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          borderClass: 'border-l-4 border-l-amber-600 border-y border-r border-console-700 bg-white',
        };
      case 'VERIFY':
        return {
          icon: ShieldCheck,
          title: lang === 'hi' ? 'चरण 03: जांचें (VERIFY)' : '03. VERIFY REGISTRY',
          badgeClass: 'bg-[#F0F5FA] text-[#164E78] border-console-700',
          borderClass: 'border-l-4 border-l-safety-brand-primary border-y border-r border-console-700 bg-white',
        };
      case 'REPORT':
        return {
          icon: PhoneCall,
          title: lang === 'hi' ? 'चरण 04: रिपोर्ट करें (REPORT)' : '04. REPORT FRAUD',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          borderClass: 'border-l-4 border-l-emerald-600 border-y border-r border-console-700 bg-white',
        };
      case 'RECOVER':
        return {
          icon: RefreshCw,
          title: lang === 'hi' ? 'चरण 05: पुनर्प्राप्ति (RECOVER)' : '05. RECOVERY ACTIONS',
          badgeClass: 'bg-console-850 text-console-300 border-console-700',
          borderClass: 'border-l-4 border-l-console-400 border-y border-r border-console-700 bg-white',
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-console-700 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md bg-safety-brand-primary text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0 shadow-2xs">
            STAGE 06
          </span>
          <h3 className="text-base sm:text-lg font-bold text-[#17202A] font-sans tracking-tight">
            {lang === 'hi' ? 'सुरक्षित अगले कदम (Defensive Action Checklist)' : 'Safe Next Steps: Immediate Protective Protocol'}
          </h3>
        </div>
        <span className="text-xs font-mono font-medium text-[#667085]">
          INCIDENT RESPONSE PROTOCOL
        </span>
      </div>

      <p className="text-xs text-console-400 font-sans leading-relaxed">
        {lang === 'hi'
          ? 'बिना घबराए इन 5 स्पष्ट सुरक्षा चरणों का क्रमवार पालन करें:'
          : 'Follow this sequential 5-step containment checklist to protect your accounts and funds:'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {steps.map((step) => {
          const config = getCategoryConfig(step.category, step.step);
          const Icon = config.icon;

          return (
            <div
              key={step.step}
              className={`p-4 rounded-md ${config.borderClass} space-y-2.5 flex flex-col justify-between shadow-sm`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${config.badgeClass}`}>
                    {config.title}
                  </span>

                  <Icon className="w-4 h-4 text-console-400" />
                </div>

                <h4 className="font-bold text-sm text-console-100 font-sans">
                  {lang === 'hi' ? step.titleHi : step.title}
                </h4>

                <p className="text-xs text-console-300 leading-relaxed font-sans">
                  {lang === 'hi' ? step.descriptionHi : step.description}
                </p>
              </div>

              {/* Action buttons (Helpline, Portal links) */}
              {(step.contactNumber || step.officialUrl) && (
                <div className="pt-2.5 border-t border-console-700/60 flex flex-wrap items-center gap-2 text-xs">
                  {step.contactNumber && (
                    <a
                      href={`tel:${step.contactNumber}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors shadow-sm"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'hi' ? `तुरंत कॉल करें: ${step.contactNumber}` : `Call Helpline: ${step.contactNumber}`}
                      </span>
                    </a>
                  )}

                  {step.officialUrl && (
                    <a
                      href={step.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-console-850 text-console-200 hover:text-console-100 hover:bg-console-700/50 font-medium transition-colors border border-console-700"
                    >
                      <span>{lang === 'hi' ? 'आधिकारिक पोर्टल खोलें' : 'Open Official Portal'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-safety-brand-primary" />
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
