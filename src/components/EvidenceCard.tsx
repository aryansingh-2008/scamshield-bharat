'use client';

import React from 'react';
import { EvidenceRecord } from '@/types';
import { ExternalLink, CheckCircle2, Building2, FileCheck2 } from 'lucide-react';

interface EvidenceCardProps {
  evidence: EvidenceRecord;
  lang: 'en' | 'hi';
}

export default function EvidenceCard({ evidence, lang }: EvidenceCardProps) {
  return (
    <div className="p-4 rounded-md border border-console-700 bg-white space-y-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-console-700 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-console-400 block">
              TRUSTED OFFICIAL SOURCE
            </span>
            <h4 className="font-bold text-sm text-console-100 font-sans">
              {evidence.sourceName}
            </h4>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>Official Reference</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <h5 className="text-xs font-bold text-console-100 font-sans">
          {lang === 'hi' ? evidence.titleHi : evidence.title}
        </h5>
        <p className="text-xs text-console-300 leading-relaxed font-sans">
          {lang === 'hi' ? evidence.summaryHi : evidence.summary}
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-console-700 text-xs">
        <span className="text-[11px] font-mono text-console-400">
          Source Review: {evidence.lastReviewed}
        </span>

        <a
          href={evidence.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-console-850 hover:bg-console-800 border border-console-700 hover:border-safety-brand-primary text-xs font-medium text-safety-brand-primary transition-colors"
        >
          <span>{lang === 'hi' ? 'आधिकारिक स्रोत देखें' : 'View Official Advisory'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
