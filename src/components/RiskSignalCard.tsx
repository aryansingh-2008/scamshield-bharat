'use client';

import React from 'react';
import { RiskSignal } from '@/types';
import { AlertOctagon, AlertTriangle, Info, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

interface RiskSignalCardProps {
  signal: RiskSignal;
  lang: 'en' | 'hi';
}

export default function RiskSignalCard({ signal, lang }: RiskSignalCardProps) {
  const getSeverityConfig = () => {
    switch (signal.severity) {
      case 'CRITICAL':
        return {
          icon: AlertOctagon,
          badge: 'CRITICAL RISK SIGNAL',
          badgeHi: 'अति गंभीर खतरा संकेत',
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
          containerClass: 'border-l-4 border-l-red-600 border-y border-r border-console-700 bg-white',
        };
      case 'HIGH':
        return {
          icon: AlertTriangle,
          badge: 'HIGH SEVERITY SIGNAL',
          badgeHi: 'गंभीर खतरा संकेत',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          containerClass: 'border-l-4 border-l-amber-500 border-y border-r border-console-700 bg-white',
        };
      case 'MEDIUM':
        return {
          icon: Info,
          badge: 'MEDIUM RISK SIGNAL',
          badgeHi: 'मध्यम जोखिम संकेत',
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          containerClass: 'border-l-4 border-l-slate-400 border-y border-r border-console-700 bg-white',
        };
      default:
        return {
          icon: ShieldCheck,
          badge: 'LOW RISK SIGNAL',
          badgeHi: 'निम्न जोखिम संकेत',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          containerClass: 'border-l-4 border-l-emerald-600 border-y border-r border-console-700 bg-white',
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-md ${config.containerClass} space-y-3 shadow-xs`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-console-300 shrink-0" />
          <h4 className="font-bold text-sm text-console-100 font-sans">
            {lang === 'hi' ? signal.titleHi : signal.title}
          </h4>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${config.badgeClass}`}>
          {lang === 'hi' ? config.badgeHi : config.badge}
        </span>
      </div>

      <p className="text-xs text-console-300 leading-relaxed font-sans">
        {lang === 'hi' ? signal.reasonHi : signal.reason}
      </p>

      {signal.detectedText && (
        <div className="text-[11px] text-console-100 font-mono bg-console-850 p-2 rounded border border-console-700">
          <span className="text-console-400 font-sans font-bold text-[10px] uppercase block mb-0.5">
            {lang === 'hi' ? 'पहचाना गया ट्रिगर टेक्स्ट:' : 'Matched Trigger:'}
          </span>
          <span className="text-safety-brand-primary">&ldquo;{signal.detectedText}&rdquo;</span>
        </div>
      )}

      {/* Recommended Defensive Action */}
      <div className="flex items-start gap-2 pt-1 text-xs text-safety-brand-primary bg-safety-brand-subtle p-2.5 rounded border border-safety-brand-primary/25">
        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-safety-brand-primary mt-0.5" />
        <span>
          <strong className="text-safety-brand-primary font-semibold">
            {lang === 'hi' ? 'सुरक्षा उपाय: ' : 'Recommended Action: '}
          </strong>
          {lang === 'hi' ? signal.recommendedActionHi : signal.recommendedAction}
        </span>
      </div>
    </div>
  );
}
