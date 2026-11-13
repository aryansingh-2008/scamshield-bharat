'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Zap,
  Crown,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  Lock,
  Flame,
  Check,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import PaymentCheckoutModal, { PlanType } from './PaymentCheckoutModal';

interface CreditRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function CreditRechargeModal({
  isOpen,
  onClose,
  lang,
}: CreditRechargeModalProps) {
  const { credits, isUnlimited } = useAuth();
  const isHindi = lang === 'hi';

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanType>('pro');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCheckoutOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isCheckoutOpen]);

  if (!isOpen) return null;

  // Seamless Transition: When checkout is active, render ONLY the Payment Window (No double-modal stacking)
  if (isCheckoutOpen) {
    return (
      <PaymentCheckoutModal
        isOpen={true}
        onClose={() => setIsCheckoutOpen(false)}
        lang={lang}
        initialPlan={checkoutPlan}
        onPaymentSuccess={() => {
          setIsCheckoutOpen(false);
          onClose();
        }}
      />
    );
  }

  const handleOpenPayment = (plan: PlanType) => {
    setCheckoutPlan(plan);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recharge-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
        <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Coins className="w-5 h-5 text-white stroke-[2.2]" />
              </div>
              <div>
                <h3
                  id="recharge-modal-title"
                  className="text-base sm:text-lg font-extrabold text-slate-900 font-sans"
                >
                  {isHindi ? 'सुरक्षा क्रेडिट रीचार्ज एवं प्रो पास' : 'Safety Credits & Pro Passes'}
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  {isHindi
                    ? 'भारत का सबसे किफायती सैशे सुरक्षा मॉडल (Micro-Pricing for India)'
                    : 'Affordable Cyber Fraud Verification for Indian Citizens'}
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

          {/* Current Balance Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🪙</span>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isHindi ? 'वर्तमान क्रेडिट बैलेंस:' : 'Current Credit Balance:'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isUnlimited
                    ? isHindi
                      ? '👑 प्रो अनलिमिटेड पास सक्रिय'
                      : '👑 Pro Unlimited Pass Active'
                    : `${credits} ${isHindi ? 'स्कैन शेष' : 'scans remaining'}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                  isUnlimited
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : credits > 2
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                }`}
              >
                {isUnlimited ? '∞ UNLIMITED' : `${credits} CREDITS`}
              </span>
            </div>
          </div>

          {/* 3 Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Plan 1: Mini Sachet Pack ₹9 */}
            <div
              onClick={() => setSelectedPlan('sachet')}
              className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedPlan === 'sachet'
                  ? 'border-[#004A87] bg-blue-50/50 shadow-md ring-2 ring-[#004A87]/15'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-blue-100 text-[#004A87]">
                    <Zap className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {isHindi ? 'छोटा रीचार्ज' : 'Sachet Top-up'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {isHindi ? 'मिनी सैशे पैक' : 'Mini Sachet Pack'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHindi ? 'तुरंत 15 अतिरिक्त स्कैन' : '15 Extra Safety Scans'}
                </p>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">₹9</span>
                  <span className="text-[10px] text-slate-500">
                    {isHindi ? '/ केवल एक बार' : '/ one-time'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                  {isHindi ? 'मात्र 60 पैसे प्रति स्कैन' : 'Just 60 paise / scan'}
                </p>

                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isHindi ? '15 हाई-स्पीड डीप स्कैन' : '15 Instant Scans'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isHindi ? 'कोई एक्सपायरी नहीं' : 'No Expiry on Credits'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isHindi ? 'सेबी व 1930 मिलान' : 'SEBI & 1930 Checks'}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPayment('sachet');
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>
                  {isUnlimited
                    ? isHindi
                      ? '₹9 में +15 बैकअप स्कैन जोड़ें'
                      : 'Add +15 Reserve Scans (₹9)'
                    : isHindi
                    ? '₹9 में 15 स्कैन लें'
                    : 'Get 15 Scans for ₹9'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Plan 2: Monthly Pro Pass ₹19 (POPULAR) */}
            <div
              onClick={() => setSelectedPlan('pro')}
              className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedPlan === 'pro'
                  ? 'border-amber-500 bg-amber-50/40 shadow-lg ring-2 ring-amber-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                <span>
                  {isUnlimited
                    ? isHindi
                      ? 'वर्तमान में सक्रिय'
                      : 'Currently Active'
                    : isHindi
                    ? 'सबसे लोकप्रिय'
                    : 'Most Popular'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 pt-1">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <Crown className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {isUnlimited ? (isHindi ? 'सक्रिय प्रो' : 'ACTIVE PRO') : 'PRO PASS'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {isHindi ? 'मासिक प्रो पास' : 'Monthly Pro Pass'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHindi ? '30 दिन असीमित सुरक्षा' : '30 Days Unlimited Protection'}
                </p>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-amber-900">₹19</span>
                  <span className="text-[10px] text-slate-500">
                    {isHindi ? '/ महीना' : '/ month'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                  {isHindi ? 'अनलिमिटेड स्कैन + FIR रिपोर्ट' : 'Unlimited Scans + FIR Report'}
                </p>

                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-bold text-slate-800">
                      {isHindi ? 'असीमित (Unlimited) स्कैन' : 'Unlimited Safety Scans'}
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {isHindi
                        ? '1-Click पुलिस FIR कानूनी डॉसियर (PDF)'
                        : '1-Click Police FIR Dossier (PDF)'}
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isHindi ? 'डीप स्क्रीनशॉट व OCR स्कैन' : 'Deep Screenshot & OCR'}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPayment('pro');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>
                  {isUnlimited
                    ? isHindi
                      ? '₹19 में +30 दिन बढ़ाएं'
                      : 'Extend +30 Days for ₹19'
                    : isHindi
                    ? '₹19 में प्रो पास लें'
                    : 'Get Pro Pass for ₹19'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Plan 3: Annual Shield Pass ₹149 */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedPlan === 'annual'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-600/15'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {isHindi ? 'सर्वोत्तम बचत' : 'Best Value'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {isHindi ? 'वार्षिक सुरक्षा पास' : 'Annual Shield Pass'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHindi ? 'पूरे 1 साल की सुरक्षा' : '365 Days Full Coverage'}
                </p>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-900">₹149</span>
                  <span className="text-[10px] text-slate-500">
                    {isHindi ? '/ पूरे 1 साल' : '/ 365 days'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                  {isHindi ? 'सिर्फ ₹12 प्रति महीना' : 'Just ₹12 per month!'}
                </p>

                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isHindi ? 'पूरे 365 दिन असीमित स्कैन' : '365 Days Unlimited Scans'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isHindi ? '4 पारिवारिक सदस्य कवरेज' : '4 Family Members Covered'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isHindi ? 'प्राथमिकता AI विश्लेषण' : 'Priority Heuristic Engine'}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPayment('annual');
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>
                  {isUnlimited
                    ? isHindi
                      ? '₹149 में वार्षिक अपग्रेड करें'
                      : 'Upgrade to Annual (₹149)'
                    : isHindi
                    ? '₹149 में 1 साल लें'
                    : 'Get 1 Year for ₹149'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Direct Checkout Action */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {isHindi ? 'चयनित प्लान:' : 'Selected:'}{' '}
                  <span className="text-amber-400 font-extrabold">
                    {selectedPlan === 'sachet' &&
                      (isHindi ? 'मिनी सैशे पैक (₹9)' : 'Mini Sachet Pack (₹9)')}
                    {selectedPlan === 'pro' &&
                      (isHindi
                        ? isUnlimited
                          ? 'मासिक प्रो पास (+30 दिन विस्तार ₹19)'
                          : 'मासिक प्रो पास (₹19)'
                        : isUnlimited
                        ? 'Monthly Pro Pass (Extend +30 Days ₹19)'
                        : 'Monthly Pro Pass (₹19)')}
                    {selectedPlan === 'annual' &&
                      (isHindi
                        ? isUnlimited
                          ? 'वार्षिक पास (अपग्रेड ₹149)'
                          : 'वार्षिक पास (₹149)'
                        : isUnlimited
                        ? 'Annual Shield Pass (Upgrade ₹149)'
                        : 'Annual Shield Pass (₹149)')}
                  </span>
                </p>
                <p className="text-[11px] text-slate-300">
                  {isHindi
                    ? 'तत्काल UPI QR, Google Pay, PhonePe, कार्ड्स या नेट बैंकिंग से भुगतान'
                    : 'Instant UPI QR, GPay, PhonePe, Cards or Net Banking'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPayment(selectedPlan)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isHindi
                  ? selectedPlan === 'pro' && isUnlimited
                    ? '₹19 में प्रो पास +30 दिन बढ़ाएं'
                    : selectedPlan === 'annual' && isUnlimited
                    ? '₹149 में वार्षिक अपग्रेड करें'
                    : selectedPlan === 'sachet' && isUnlimited
                    ? '₹9 में +15 बैकअप स्कैन जोड़ें'
                    : `₹${selectedPlan === 'sachet' ? 9 : selectedPlan === 'pro' ? 19 : 149} सुरक्षित भुगतान करें`
                  : selectedPlan === 'pro' && isUnlimited
                  ? 'Extend Pro Pass (+30 Days) - Pay ₹19'
                  : selectedPlan === 'annual' && isUnlimited
                  ? 'Upgrade to Annual (365 Days) - Pay ₹149'
                  : selectedPlan === 'sachet' && isUnlimited
                  ? 'Add +15 Reserve Scans - Pay ₹9'
                  : `Pay ₹${selectedPlan === 'sachet' ? 9 : selectedPlan === 'pro' ? 19 : 149} Securely`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Security / Statutory Trust Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>DPDP Act 2023 Compliant • Instant UPI / Card Payment Window</span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
            >
              {isHindi ? 'बाद में देखें' : 'Maybe Later'}
            </button>
          </div>
        </div>
      </div>
  );
}
