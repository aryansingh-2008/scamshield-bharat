'use client';

import React from 'react';
import { ShieldCheck, Lock, Menu, FileText, Link2, ImageIcon, PlayCircle, MessageSquare } from 'lucide-react';

export default function DeviceMockupShowcase({ lang }: { lang: 'en' | 'hi' }) {
  const isHindi = lang === 'hi';

  const scrollToInput = () => {
    const el = document.getElementById('input-console-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      onClick={scrollToInput}
      className="relative w-full max-w-[340px] sm:max-w-[480px] lg:max-w-[540px] mx-auto flex items-center justify-center pt-2 pb-6 cursor-pointer group"
      title="Click to check your message in the safety console"
    >
      {/* 3D LAPTOP MOCKUP */}
      <div className="relative w-full max-w-[270px] xs:max-w-[320px] sm:max-w-[440px] drop-shadow-2xl transition-transform group-hover:scale-[1.01]">
        {/* Laptop Screen Bezel */}
        <div className="bg-[#181F2E] rounded-t-2xl p-2 sm:p-3 pb-0 border border-slate-700 shadow-2xl">
          {/* Top Camera Dot */}
          <div className="flex items-center justify-center pb-1 sm:pb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-slate-600"></div>
          </div>

          {/* Screen Content (Actual Desktop Website UI) */}
          <div className="bg-[#F8FAFD] rounded-t-lg p-2.5 sm:p-3.5 space-y-2 overflow-hidden border border-slate-200">
            {/* Real Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#004A87] flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold shadow-2xs">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="font-extrabold text-[10.5px] sm:text-xs text-[#0B2545] font-sans truncate">
                  ScamShield Bharat
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[7px] font-mono font-bold bg-[#004A87] text-white rounded">
                  SAFETY CONSOLE
                </span>
              </div>
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                <span className="hidden xs:inline text-slate-500">How it Works</span>
                <span className="hidden xs:inline text-slate-500">•</span>
                <span className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[#004A87] font-bold text-[8px]">
                  {isHindi ? 'हिंदी' : 'EN | हिंदी'}
                </span>
              </div>
            </div>

            {/* Real Input Console Card */}
            <div className="bg-white rounded-xl p-2 sm:p-3 border border-slate-200 shadow-xs space-y-1.5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-[#004A87]/10 flex items-center justify-center">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#004A87]" />
                  </div>
                  <div>
                    <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-none">
                      {isHindi ? 'संदेश की जांच करें' : 'Check if it’s a scam'}
                    </h4>
                    <p className="text-[7px] sm:text-[8px] text-slate-400 mt-0.5 hidden xs:block">
                      Paste a message, link or upload an image...
                    </p>
                  </div>
                </div>

                <span className="text-[7px] sm:text-[8px] text-[#004A87] bg-[#EBF3FA] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 shrink-0">
                  <Lock className="w-2 h-2 text-[#004A87]" />
                  <span>Private</span>
                </span>
              </div>

              {/* 4 Tabs */}
              <div className="flex gap-1 text-[7.5px] sm:text-[8.5px]">
                <span className="px-2 py-0.5 rounded-md bg-[#0B3B64] text-white font-bold flex items-center gap-0.5">
                  <FileText className="w-2 h-2" /> Text
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-0.5">
                  <Link2 className="w-2 h-2" /> Link
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-0.5">
                  <ImageIcon className="w-2 h-2" /> Image
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 items-center gap-0.5">
                  <PlayCircle className="w-2 h-2" /> Demo
                </span>
              </div>

              {/* Split Textarea + Action Button Row */}
              <div className="flex gap-1.5 items-stretch">
                <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50/70 border border-slate-200 text-[8px] sm:text-[9.5px] font-mono text-slate-700 leading-tight flex-1 relative flex flex-col justify-between min-h-[44px]">
                  <span>&quot;Guaranteed 30% monthly return. Deposit ₹50,000 today...&quot;</span>
                  <div className="flex items-center justify-between text-[6.5px] sm:text-[7.5px] text-slate-400 pt-1">
                    <span className="text-[#004A87] font-semibold">Sample Loaded</span>
                    <span>0/5000</span>
                  </div>
                </div>

                <div className="w-20 sm:w-24 rounded-lg bg-[#004A87] text-white p-1 flex flex-col items-center justify-center text-center font-bold text-[8px] sm:text-[9.5px] shadow-xs shrink-0">
                  <span>Analyze</span>
                  <span className="text-[7px] sm:text-[8px] font-normal opacity-90">for Scams →</span>
                </div>
              </div>

              {/* Quick Example Chips */}
              <div className="pt-0.5 hidden xs:flex items-center gap-1 text-[7px] sm:text-[8px] text-slate-500">
                <span className="font-bold text-slate-700">Try:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 truncate">
                  You’ve won ₹5,00,000!
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 hidden sm:inline truncate">
                  sbi-reward.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Aluminum Body Base */}
        <div className="relative h-2.5 sm:h-3 bg-gradient-to-b from-[#CBD5E1] via-[#94A3B8] to-[#64748B] rounded-b-xl shadow-xl -mx-3 sm:-mx-4">
          <div className="w-16 sm:w-20 h-1 bg-[#475569] mx-auto rounded-b-md"></div>
        </div>
      </div>

      {/* REALISTIC TALL SLIM SMARTPHONE MOCKUP (Actual Mobile UI) */}
      <div className="absolute -bottom-2 -right-1 sm:right-2 w-[115px] xs:w-[135px] sm:w-[155px] h-[235px] xs:h-[275px] sm:h-[310px] bg-[#0A0E1A] rounded-[24px] sm:rounded-[36px] p-[4px] sm:p-[6px] shadow-[0_16px_36px_rgba(0,0,0,0.4)] ring-1 ring-slate-700/80 border-2 border-slate-800 z-30 flex flex-col justify-between overflow-hidden transition-transform group-hover:scale-[1.02]">
        {/* Phone Screen Display */}
        <div className="w-full h-full bg-[#F8FAFD] rounded-[20px] sm:rounded-[28px] p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden shadow-inner border border-slate-100 relative">
          {/* Dynamic Island / Speaker Notch */}
          <div className="w-10 sm:w-12 h-2.5 sm:h-3 bg-black rounded-full mx-auto flex items-center justify-end px-1 sm:px-1.5 gap-1 shrink-0 mb-1">
            <div className="w-1 h-1 rounded-full bg-[#1e293b]"></div>
            <div className="w-1 h-1 rounded-full bg-[#0284c7]"></div>
          </div>

          {/* Real Phone Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 bg-white -mx-2 -mt-1 px-2 pt-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-[#004A87] flex items-center justify-center text-white">
                  <ShieldCheck className="w-2 h-2 text-white" />
                </div>
                <span className="text-[7.5px] sm:text-[8px] font-black text-[#0B2545] tracking-tight">ScamShield</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[6.5px] font-bold text-[#004A87] bg-blue-50 px-1 rounded">EN</span>
                <Menu className="w-2.5 h-2.5 text-slate-700" />
              </div>
            </div>

            {/* Mini Mobile Input Card */}
            <div className="bg-white rounded-lg p-1.5 border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <h5 className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-900 leading-none">
                  {isHindi ? 'संदेश की जांच' : 'Check Message'}
                </h5>
                <span className="text-[6px] text-emerald-700 bg-emerald-50 px-1 rounded font-mono">PII Safe</span>
              </div>

              {/* Segmented Tabs */}
              <div className="flex gap-0.5 pt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-[#0B3B64] text-white font-bold text-[6.5px] sm:text-[7px]">
                  Text
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[6.5px] sm:text-[7px]">
                  Link
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[6.5px] sm:text-[7px]">
                  Image
                </span>
              </div>

              {/* Textarea */}
              <div className="p-1 rounded bg-slate-50 border border-slate-200 text-[6.5px] sm:text-[7.5px] font-mono text-slate-700 leading-tight">
                <span>&quot;Guaranteed 30% return? Deposit ₹50,000&quot;</span>
                <span className="block text-right text-[5.5px] text-slate-400 mt-0.5">0/5000</span>
              </div>

              {/* Action Button */}
              <div className="w-full py-1 rounded bg-[#004A87] text-white text-center text-[7px] sm:text-[8px] font-bold shadow-xs flex items-center justify-center gap-0.5">
                <span>Analyze for Scams →</span>
              </div>
            </div>
          </div>

          {/* Quick example on mobile */}
          <div className="mt-1 p-1 rounded bg-white border border-slate-100 text-[6px] sm:text-[6.5px] text-slate-500">
            <span className="font-bold text-[#004A87]">Sample:</span> &quot;You’ve won ₹5,00,000 lottery&quot;
          </div>

          {/* Phone Home Indicator Bar */}
          <div className="w-10 sm:w-12 h-0.5 bg-slate-900/30 rounded-full mx-auto mt-1 shrink-0"></div>
        </div>
      </div>
    </div>
  );
}


