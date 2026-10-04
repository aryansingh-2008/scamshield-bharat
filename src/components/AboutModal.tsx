'use client';

import React, { useEffect } from 'react';
import { X, ShieldCheck, Heart, Award, CheckCircle2, Lock } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function AboutModal({ isOpen, onClose, lang }: AboutModalProps) {
  const isHindi = lang === 'hi';

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#004A87] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="about-modal-title" className="text-lg font-extrabold text-[#0A1C2A] font-sans">
                {isHindi ? 'स्कैमशील्ड भारत के बारे में' : 'About ScamShield Bharat'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHindi ? 'नागरिक व निवेशक वित्तीय सुरक्षा सहायक' : 'Evidence-First Financial Safety Assistant'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            {isHindi
              ? 'स्कैमशील्ड भारत एक स्वतंत्र, गैर-व्यावसायिक सार्वजनिक सुरक्षा सहायक है, जिसे भारतीय नागरिकों और खुदरा निवेशकों को डिजिटल वित्तीय धोखाधड़ी से बचाने के लिए बनाया गया है।'
              : 'ScamShield Bharat is an independent, evidence-first public-service platform designed to protect Indian retail investors and citizens from digital financial fraud.'}
          </p>

          <div className="p-3.5 rounded-xl bg-[#EEF7FC] border border-[#B9DCF7] space-y-2">
            <h4 className="font-bold text-[#004A87] flex items-center gap-1.5 text-xs">
              <Award className="w-4 h-4" />
              <span>{isHindi ? 'हमारे मुख्य सिद्धांत:' : 'Our Core Guarantees:'}</span>
            </h4>
            <ul className="space-y-1.5 text-[11.5px] text-slate-700">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isHindi ? 'शून्य डेटा संग्रह — हम पासवर्ड या ओटीपी कभी नहीं मांगते।' : 'Zero Data Retention — We never ask for or store passwords or OTPs.'}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isHindi ? 'आधिकारिक विनियामक साक्ष्य — सेबी, आरबीआई व सर्ट-इन के नियमों पर आधारित।' : 'Verified Regulatory Evidence — Grounded in SEBI, RBI, and CERT-In advisories.'}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isHindi ? 'सरल द्विभाषी व्याख्या — हिंदी व अंग्रेजी दोनों में सुगम रिपोर्ट।' : 'Simple Bilingual Guidance — Clear explanations in Hindi and English.'}</span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">
              {isHindi ? 'विनियामक अस्वीकरण (Disclaimer):' : 'Educational Disclaimer:'}
            </p>
            <p>
              {isHindi
                ? 'यह उपकरण वित्तीय सलाहकार या स्टॉक ब्रोकर नहीं है। यह केवल सार्वजनिक शिक्षा और जागरूकता के लिए है।'
                : 'ScamShield Bharat is an educational safety tool and does not provide investment advice or act as a financial intermediary.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#004A87] hover:bg-[#003B6D] text-white font-bold text-xs transition-colors shadow-xs"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
