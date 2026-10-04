'use client';

import React from 'react';
import { CouldNotVerifyItem } from '@/types';
import { HelpCircle, CheckSquare } from 'lucide-react';

interface UncertaintyCardProps {
  items: CouldNotVerifyItem[];
  lang: 'en' | 'hi';
}

export default function UncertaintyCard({ items, lang }: UncertaintyCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-console-700 bg-white p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-console-700">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md bg-[#004A87] text-white font-mono font-bold text-xs tracking-wider uppercase shrink-0 shadow-2xs">
            STAGE 04
          </span>
          <div>
            <h4 className="font-bold text-base sm:text-lg text-console-100 font-sans tracking-tight">
              {lang === 'hi'
                ? 'स्वतंत्र रूप से सत्यापित नहीं हो सका'
                : 'What ScamShield Could Not Verify Independently'}
            </h4>
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-[#667085]">
          MANUAL VERIFICATION REQUIRED
        </span>
      </div>

      <p className="text-xs text-console-400 leading-relaxed font-sans">
        {lang === 'hi'
          ? 'प्रमाण न मिलने का मतलब स्वतः "सुरक्षित" होना नहीं है। नीचे दी गई बातों की सीधे अधिकृत माध्यम से पुष्टि करें:'
          : 'Absence of public evidence does not mean a message is safe. The following aspects require direct personal verification:'}
      </p>

      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded bg-console-850/40 border border-console-700/60 space-y-2 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="font-semibold text-console-100 font-mono text-[11px]">
                {item.claim}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white text-console-400 border border-console-700">
                MANUAL VERIFICATION REQUIRED
              </span>
            </div>

            <p className="text-console-300 font-sans leading-relaxed">
              <strong className="text-console-400 font-mono text-[10px] uppercase block">
                {lang === 'hi' ? 'कारण:' : 'Limitation Reason:'}
              </strong>
              {lang === 'hi' ? item.reasonHi : item.reason}
            </p>

            <div className="flex items-start gap-2 pt-1 text-console-100 bg-[#F0F5FA] p-2.5 rounded border border-console-700">
              <CheckSquare className="w-3.5 h-3.5 shrink-0 text-safety-brand-primary mt-0.5" />
              <span className="font-sans text-xs text-console-200">
                <strong className="text-console-100 font-semibold">
                  {lang === 'hi' ? 'सुरक्षित सत्यापन विधि: ' : 'How to Verify Safely: '}
                </strong>
                {lang === 'hi'
                  ? item.howToVerifyIndependentlyHi
                  : item.howToVerifyIndependently}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
