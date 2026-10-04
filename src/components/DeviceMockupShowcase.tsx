'use client';

import React from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

export default function DeviceMockupShowcase({ lang }: { lang: 'en' | 'hi' }) {
  const isHindi = lang === 'hi';

  return (
    <div className="relative w-full max-w-[540px] mx-auto flex items-center justify-center pt-2 pb-6">
      {/* 3D LAPTOP MOCKUP */}
      <div className="relative w-full max-w-[460px] sm:max-w-[490px] drop-shadow-2xl">
        {/* Laptop Screen Bezel */}
        <div className="bg-[#1C2333] rounded-t-2xl p-2.5 sm:p-3 pb-0 border border-slate-700 shadow-2xl">
          {/* Top Camera Dot */}
          <div className="flex items-center justify-center pb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-600"></div>
          </div>

          {/* Screen Content */}
          <div className="bg-[#F8FAFD] rounded-t-lg p-3 sm:p-4 space-y-2.5 overflow-hidden border border-slate-200">
            {/* Inner Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#004A87] flex items-center justify-center text-white text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-extrabold text-xs text-[#0B2545] font-sans">
                  ScamShield Bharat
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                <span className="px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-700 font-sans">
                  {isHindi ? 'हिंदी ▾' : 'English ▾'}
                </span>
              </div>
            </div>

            {/* Inner Card (Check if it's a scam) */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-[#004A87]/10 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#004A87]" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-900 leading-none">
                      {isHindi ? 'संदेश की जांच करें' : 'Check if it’s a scam'}
                    </h4>
                    <p className="text-[8px] text-slate-400 mt-0.5">
                      Paste a message, link, email or upload an image...
                    </p>
                  </div>
                </div>

                <span className="text-[8px] text-[#004A87] bg-[#EBF3FA] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 shrink-0">
                  <Lock className="w-2 h-2" /> PII Masked
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 text-[8.5px]">
                <span className="px-2.5 py-0.5 rounded-md bg-[#0B3B64] text-white font-semibold">
                  Text
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Link
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Image
                </span>
              </div>

              {/* Textbox */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[9.5px] font-mono text-slate-700 leading-tight min-h-[48px]">
                &quot;Guaranteed 30% monthly return. Deposit ₹50,000 today...&quot;
              </div>

              {/* Button */}
              <div className="w-full py-1.5 rounded-lg bg-[#004A87] text-white text-center text-[10px] font-bold shadow-xs flex items-center justify-center gap-1">
                <span>{isHindi ? 'सुरक्षा जांचें →' : 'Analyze for Scams →'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Aluminum Body Base */}
        <div className="relative h-3 bg-gradient-to-b from-[#C8D1DC] via-[#B4BFCB] to-[#9AA8B7] rounded-b-xl shadow-xl -mx-4">
          <div className="w-20 h-1 bg-[#6A7888] mx-auto rounded-b-md"></div>
        </div>
      </div>

      {/* 3D SMARTPHONE MOCKUP (Overlapping Bottom Right) */}
      <div className="absolute -bottom-2 right-2 sm:right-4 w-32 sm:w-40 bg-[#0F172A] rounded-2xl p-1.5 shadow-2xl border-2 border-slate-700 z-20">
        {/* Speaker / Dynamic Island */}
        <div className="w-10 h-1.5 bg-slate-800 rounded-full mx-auto mb-1"></div>

        {/* Screen */}
        <div className="bg-white rounded-xl p-2 space-y-1.5 border border-slate-200 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#004A87] flex items-center justify-center">
                <ShieldCheck className="w-2 h-2 text-white" />
              </div>
              <span className="text-[8px] font-extrabold text-slate-900">ScamShield</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          </div>

          <p className="text-[7px] text-slate-400 leading-tight">
            Paste a message, link, email or upload an image...
          </p>

          <div className="flex gap-1 text-[7px]">
            <span className="px-1.5 py-0.5 rounded bg-[#0B3B64] text-white font-bold">Text</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Image</span>
          </div>

          <div className="h-9 w-full bg-slate-50 rounded border border-slate-200 p-1 text-[7px] font-mono text-slate-700 overflow-hidden leading-tight">
            &quot;30% return? Deposit ₹50,000&quot;
          </div>

          <div className="h-4 w-full bg-[#004A87] rounded flex items-center justify-center text-white text-[7.5px] font-bold shadow-xs">
            Analyze for Scams →
          </div>
        </div>
      </div>
    </div>
  );
}
