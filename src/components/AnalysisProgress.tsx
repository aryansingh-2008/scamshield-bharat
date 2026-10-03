'use client';

import React from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';

interface AnalysisProgressProps {
  lang: 'en' | 'hi';
}

export default function AnalysisProgress({ lang }: AnalysisProgressProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="w-full max-w-lg mx-auto rounded-md border border-console-700 bg-white p-6 space-y-4 shadow-sm text-center">
      {/* Animated Shield Header */}
      <div className="flex items-center justify-center gap-2">
        <div className="p-2.5 rounded-md bg-safety-brand-subtle border border-safety-brand-primary/25 text-safety-brand-primary">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-safety-brand-primary block">
          AUTOMATED VERIFICATION PIPELINE
        </span>
        <h3 className="text-base sm:text-lg font-bold text-console-100 font-sans">
          {t.scanningTitle}
        </h3>
        <p className="text-xs text-console-400 font-sans leading-relaxed">
          {lang === 'hi'
            ? 'प्रमाण-आधारित सुरक्षा विश्लेषण और सेबी/आरबीआई रिकॉर्ड्स की जांच की जा रही है...'
            : 'Evaluating submitted content against deterministic risk detectors and official regulatory records...'}
        </p>
      </div>

      {/* Honest Indeterminate Activity Indicator */}
      <div className="p-3 rounded-md bg-console-850 border border-console-700 flex items-center justify-center gap-2.5 text-xs text-safety-brand-primary font-medium">
        <Loader2 className="w-4 h-4 text-safety-brand-primary animate-spin shrink-0" />
        <span>
          {lang === 'hi'
            ? 'सामग्री की जांच प्रगति पर है...'
            : 'Analysis in progress, awaiting server verification...'}
        </span>
      </div>
    </div>
  );
}
