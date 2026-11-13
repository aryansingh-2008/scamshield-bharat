'use client';

import React, { useEffect } from 'react';
import { X, Scale, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function TermsModal({ isOpen, onClose, lang }: TermsModalProps) {
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
      aria-labelledby="terms-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5 text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="terms-modal-title" className="text-base sm:text-lg font-extrabold text-slate-900 font-sans">
                {isHindi ? 'सेवा की शर्तें एवं कानूनी अस्वीकरण' : 'Terms of Service & Statutory Disclaimers'}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {isHindi
                  ? 'भारतीय विनियामक व आईटी अधिनियम 2000 दिशा-निर्देश'
                  : 'Compliant with IT Act 2000, DPDP Act 2023 & SEBI Regulations'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Sections */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          
          {/* Section 1: Non-Govt Declaration */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isHindi
                  ? '1. स्वतंत्र गैर-सरकारी पहल (Non-Governmental Entity Declaration)'
                  : '1. Independent Civic Initiative (Non-Governmental Declaration)'}
              </span>
            </div>
            <p className="text-[11.5px] text-amber-900/90 leading-relaxed">
              {isHindi
                ? 'स्कैमशील्ड भारत एक स्वतंत्र नागरिक शैक्षणिक और साइबर-सुरक्षा शोध पहल है। यह भारत सरकार, सेबी (SEBI), भारतीय रिज़र्व बैंक (RBI) या किसी भी सांविधिक निकाय का आधिकारिक पोर्टल नहीं है और न ही इनसे संबद्ध है। इसका उद्देश्य भारतीय नागरिकों को वित्तीय साइबर अपराधों के प्रति जागरूक करना है।'
                : 'ScamShield Bharat is an independent public-education and cyber resilience initiative. It is NOT an official agency, subsidiary, or affiliate of the Government of India, SEBI, RBI, or any statutory authority. It complies strictly with the Emblems and Names (Prevention of Improper Use) Act, 1950.'}
            </p>
          </div>

          {/* Section 2: Non-Advisory Scope */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <FileText className="w-4 h-4 text-[#004A87] shrink-0" />
              <span>
                {isHindi
                  ? '2. गैर-सलाहकारी दायरा (SEBI Regulations 2013 Compliance)'
                  : '2. Non-Advisory Nature (SEBI Regulations Compliance)'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              {isHindi
                ? 'यह प्लेटफ़ॉर्म सेबी के तहत पंजीकृत निवेश सलाहकार (RIA) या रिसर्च एनालिस्ट (RA) नहीं है। यह किसी भी स्टॉक, म्यूचुअल फंड, क्रिप्टो या वित्तीय उत्पाद में निवेश या लेन-देन की सलाह नहीं देता। परिणाम केवल पैटर्न-आधारित शैक्षणिक संकेतक हैं।'
                : 'ScamShield Bharat is not registered as an Investment Adviser (RIA) or Research Analyst (RA) under SEBI regulations. It does not provide financial advice, stock recommendations, or trading directives. All risk scores are automated educational heuristics.'}
            </p>
          </div>

          {/* Section 3: Limitation of Liability */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Scale className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {isHindi
                  ? '3. कानूनी दायित्व की सीमा (Limitation of Liability)'
                  : '3. Limitation of Developer Liability (IT Act Section 79)'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              {isHindi
                ? 'सूचना प्रौद्योगिकी अधिनियम 2000 के तहत, डेवलपर्स और प्लेटफ़ॉर्म संचालक किसी भी मौद्रिक नुकसान, साइबर धोखाधड़ी, या उपयोगकर्ता द्वारा लिए गए स्वतंत्र वित्तीय निर्णयों के लिए कानूनी या आर्थिक रूप से उत्तरदायी नहीं होंगे। उपयोगकर्ता सभी लेन-देन से पहले आधिकारिक विनियामकों से पुष्टि करने हेतु स्वयं उत्तरदायी हैं।'
                : 'Under Section 79 of the Information Technology Act, 2000, developers and maintainers assume zero legal, financial, or compensatory liability for monetary losses, third-party fraud, or actions taken based on automated indicators. Users bear full responsibility for verifying credentials via official registries.'}
            </p>
          </div>

          {/* Section 4: Privacy & Zero Retention */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isHindi
                  ? '4. डेटा गोपनीयता व शून्य डेटा संग्रह (DPDP Act 2023)'
                  : '4. Zero Data Retention & Privacy (DPDP Act 2023)'}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              {isHindi
                ? 'जांच हेतु सबमिट किए गए संदेशों और लिंक्स का विश्लेषण केवल मेमोरी (RAM) में अस्थायी रूप से किया जाता है। कोई भी कच्चा संदेश, पासवर्ड, ओटीपी या व्यक्तिगत डेटा किसी स्थायी डेटाबेस में संग्रहीत नहीं किया जाता है।'
                : 'All submissions are processed ephemerally in-memory during analysis and discarded immediately. No raw messages, screenshots, or credentials are stored in any persistent database.'}
            </p>
          </div>

          {/* Section 5: Grievance Officer */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
              <Mail className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                {isHindi
                  ? '5. शिकायत निवारण एवं संपर्क (Grievance Redressal - IT Rules 2021)'
                  : '5. Grievance Redressal & Contact (IT Rules 2021)'}
              </span>
            </div>
            <p className="text-[11.5px] text-blue-900 leading-relaxed">
              {isHindi
                ? 'आईटी नियम 2021 के तहत, किसी भी विनियामक प्रश्न, तकनीकी रिपोर्ट या सुधार के लिए संपर्क करें: '
                : 'Under Rule 3(2) of the IT Rules 2021, for feedback, false-positive reports, or statutory queries, contact: '}
              <a
                href="mailto:contact@scamshieldbharat.live"
                className="font-mono font-bold text-[#004A87] hover:underline"
              >
                contact@scamshieldbharat.live
              </a>
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-mono">
            Version 1.0 • Last Updated: Nov 2026
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {isHindi ? 'स्वीकार व बंद करें' : 'Understood & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
