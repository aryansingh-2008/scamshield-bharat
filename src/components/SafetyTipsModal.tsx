'use client';

import React, { useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, PhoneCall, ExternalLink } from 'lucide-react';

interface SafetyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function SafetyTipsModal({ isOpen, onClose, lang }: SafetyTipsModalProps) {
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

  const safetyTips = [
    {
      icon: '🚫',
      title: isHindi ? 'गारंटीड रिटर्न का झांसा पहचानें' : 'Never Trust Guaranteed Returns',
      desc: isHindi
        ? 'सेबी के नियमानुसार कोई भी पंजीकृत ब्रोकर या सलाहकार निश्चित मुनाफे का वादा नहीं कर सकता। 100% या 30% मासिक गारंटीड रिटर्न हमेशा धोखाधड़ी होते हैं।'
        : 'SEBI strictly prohibits promising fixed or guaranteed returns in stock markets. Any offer promising 30% monthly profit is an illegal scheme.',
      badge: 'SEBI Advisory',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      icon: '📱',
      title: isHindi ? 'अज्ञात APK या ऐप डाउनलोड न करें' : 'Never Install Apps via WhatsApp / Telegram',
      desc: isHindi
        ? 'धोखेबाज रिमोट एक्सेस ऐप्स (जैसे AnyDesk, फर्जी ट्रेडिंग APK) डाउनलोड करवाकर फोन का नियंत्रण ले लेते हैं। हमेशा केवल Google Play Store से ही ऐप डाउनलोड करें।'
        : 'Scammers send malicious APK links pretending to be VIP institutional trading apps. Never sideload apps from messaging channels.',
      badge: 'CERT-In Advisory',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      icon: '🏦',
      title: isHindi ? 'बैंक कभी SMS/WhatsApp पर KYC लिंक नहीं भेजते' : 'Banks Never Send KYC Links via SMS',
      desc: isHindi
        ? 'आरबीआई के स्पष्ट निर्देश हैं कि बैंक कभी भी खाता चालू रखने या KYC अपडेट के लिए लिंक पर क्लिक करने को नहीं कहते। किसी अनजान लिंक पर OTP या पासवर्ड न डालें।'
        : 'RBI clarifies banks never send SMS or WhatsApp messages asking you to update KYC via links to avoid account blocking.',
      badge: 'RBI Sachet',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      icon: '🔍',
      title: isHindi ? 'सलाहकार की सेबी पंजीकरण संख्या जांचें' : 'Verify SEBI Registration Number',
      desc: isHindi
        ? 'किसी भी टेलीग्राम चैनल या अनधिकृत समूह को पैसे देने से पहले सेबी की आधिकारिक वेबसाइट पर उनका रजिस्ट्रेशन नंबर (INA / INH) अवश्य सत्यापित करें।'
        : "Before paying any investment fee or joining a VIP group, always verify the advisor's registration on SEBI's intermediary registry.",
      badge: 'SEBI Registry',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      icon: '📞',
      title: isHindi ? 'धोखाधड़ी होने पर 1930 पर तुरंत कॉल करें' : 'Golden Hour Rule — Call 1930 Immediately',
      desc: isHindi
        ? 'यदि आपके खाते से अनाधिकृत लेन-देन हुआ है, तो पहले 2 घंटों (Golden Hour) के भीतर 1930 पर कॉल करें ताकि पुलिस संदिग्ध खाते को फ्रीज कर सके।'
        : 'If you have lost money to a scammer, report within the Golden Hour by calling 1930 or visiting cybercrime.gov.in to freeze stolen funds.',
      badge: 'MHA Helpline',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-tips-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              🛡️
            </div>
            <div>
              <h3 id="safety-tips-title" className="text-lg font-extrabold text-[#0A1C2A] font-sans">
                {isHindi ? 'नागरिक वित्तीय सुरक्षा सुझाव' : 'Citizen Financial Safety Tips'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHindi ? 'धोखाधड़ी से बचाव के लिए 5 मुख्य स्वर्णिम नियम' : '5 Golden Rules to Protect Yourself from Online Scams'}
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

        {/* Tips List */}
        <div className="space-y-3">
          {safetyTips.map((tip, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tip.icon}</span>
                  <h4 className="font-bold text-sm text-[#0A1C2A] font-sans">{tip.title}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tip.badgeColor} shrink-0`}>
                  {tip.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-7">{tip.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
            <PhoneCall className="w-4 h-4" />
            <span>{isHindi ? 'साइबर हेल्पलाइन: 1930' : 'National Helpline: 1930'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#004A87] hover:bg-[#003B6D] text-white font-bold text-xs transition-colors shadow-xs"
          >
            {isHindi ? 'समझ आ गया' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
