'use client';

import React from 'react';
import { DEMO_SCENARIOS } from '@/lib/demo-scenarios';
import { TrendingUp, ShieldAlert, Smartphone, ArrowRight } from 'lucide-react';

interface DemoScenarioSelectorProps {
  lang: 'en' | 'hi';
  onSelectDemo: (demoId: string) => void;
  isLoading: boolean;
}

export default function DemoScenarioSelector({
  lang,
  onSelectDemo,
  isLoading,
}: DemoScenarioSelectorProps) {
  const getIcon = (id: string) => {
    if (id.includes('guaranteed')) return <TrendingUp className="w-4 h-4 text-safety-warning-accent" />;
    if (id.includes('kyc')) return <ShieldAlert className="w-4 h-4 text-safety-high-accent" />;
    return <Smartphone className="w-4 h-4 text-safety-brand-accent" />;
  };

  return (
    <div className="space-y-3">
      <div className="pb-1">
        <p className="text-xs text-console-300 font-medium">
          {lang === 'hi'
            ? 'पूर्ण सत्यापन पाइपलाइन को तुरंत परखने के लिए नीचे दिए गए 3 वास्तविक परिदृश्यों में से एक चुनें (100% सटीक और तत्काल):'
            : 'Select one of 3 deterministic real-world scam scenarios to test full verification pipeline instantly:'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DEMO_SCENARIOS.map((demo) => (
          <button
            key={demo.id}
            type="button"
            onClick={() => onSelectDemo(demo.id)}
            disabled={isLoading}
            className="group relative flex flex-col justify-between p-4 rounded-md border border-console-700 bg-white hover:border-console-600 hover:shadow-xs text-left transition-all focus:outline-none focus:ring-2 focus:ring-safety-brand-primary disabled:opacity-50 shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-console-850 text-console-400 border border-console-700">
                  {demo.tag}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-safety-high-bg text-safety-high-accent border border-safety-high-border">
                  HIGH CONCERN
                </span>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <div className="p-1.5 rounded bg-console-850 border border-console-700 shrink-0 mt-0.5">
                  {getIcon(demo.id)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-console-100 group-hover:text-console-50 transition-colors font-sans">
                    {lang === 'hi' ? demo.titleHi : demo.title}
                  </h4>
                  <p className="text-xs text-console-400 mt-1 leading-relaxed line-clamp-2 font-sans">
                    {lang === 'hi' ? demo.shortDescHi : demo.shortDesc}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-console-700 flex items-center justify-between text-xs font-semibold text-console-400 group-hover:text-console-100">
              <span className="font-mono text-[11px] uppercase">
                {lang === 'hi' ? 'विश्लेषण चलाएं' : 'Run Scenario'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
