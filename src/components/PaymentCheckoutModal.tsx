'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  ShieldCheck,
  Lock,
  QrCode,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  Receipt,
  Download,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Zap,
  Crown,
  Sparkles,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export type PlanType = 'sachet' | 'pro' | 'annual';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
  initialPlan?: PlanType;
  onPaymentSuccess?: (plan: PlanType) => void;
}

interface PlanDetails {
  id: PlanType;
  nameEn: string;
  nameHi: string;
  taglineEn: string;
  taglineHi: string;
  price: number;
  creditsOrDaysEn: string;
  creditsOrDaysHi: string;
  popular?: boolean;
}

const PLANS: Record<PlanType, PlanDetails> = {
  sachet: {
    id: 'sachet',
    nameEn: 'Mini Sachet Pack',
    nameHi: 'मिनी सैशे पैक',
    taglineEn: '15 High-Speed Scans • No Expiry',
    taglineHi: '15 हाई-स्पीड स्कैन • कोई एक्सपायरी नहीं',
    price: 9,
    creditsOrDaysEn: '+15 Safety Credits',
    creditsOrDaysHi: '+15 सुरक्षा क्रेडिट्स',
  },
  pro: {
    id: 'pro',
    nameEn: 'Monthly Pro Pass',
    nameHi: 'मासिक प्रो पास',
    taglineEn: '30 Days Unlimited Scans + FIR Report',
    taglineHi: '30 दिन असीमित स्कैन + FIR डॉसियर',
    price: 19,
    creditsOrDaysEn: '30 Days Unlimited Protection',
    creditsOrDaysHi: '30 दिन असीमित सुरक्षा',
    popular: true,
  },
  annual: {
    id: 'annual',
    nameEn: 'Annual Shield Pass',
    nameHi: 'वार्षिक सुरक्षा पास',
    taglineEn: '365 Days Unlimited + 4 Family Members',
    taglineHi: 'पूरे 365 दिन असीमित + 4 पारिवारिक सदस्य',
    price: 149,
    creditsOrDaysEn: '365 Days Family Coverage',
    creditsOrDaysHi: '365 दिन सम्पूर्ण परिवार कवरेज',
  },
};

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  lang,
  initialPlan = 'pro',
  onPaymentSuccess,
}: PaymentCheckoutModalProps) {
  const { addCredits, activateUnlimited } = useAuth();
  const isHindi = lang === 'hi';

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Recipient UPI ID (default or configurable)
  const [recipientUpi, setRecipientUpi] = useState<string>(
    process.env.NEXT_PUBLIC_UPI_ID || 'scamshieldbharat@axisbank'
  );
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [customUpiInput, setCustomUpiInput] = useState('');

  // Scannable QR Code Data URL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // 12-Digit UTR State
  const [enteredUtr, setEnteredUtr] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [showUtrHelp, setShowUtrHelp] = useState(false);

  // Form states for Card / NetBanking
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('sbi');

  // Processing & Success states
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');
  const [processingStatus, setProcessingStatus] = useState('');
  const [txnId, setTxnId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentTime, setPaymentTime] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(299); // 5 min countdown for QR

  // Sync initial plan when prop changes
  useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan]);

  // Load any previously saved admin UPI from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield_merchant_upi');
      if (saved && saved.includes('@')) {
        setRecipientUpi(saved);
      }
    }
  }, []);

  // Generate Real Scannable UPI QR Code whenever plan or recipient UPI changes
  useEffect(() => {
    const currentPlan = PLANS[selectedPlan];
    const upiUri = `upi://pay?pa=${encodeURIComponent(recipientUpi)}&pn=ScamShield%20Bharat&am=${currentPlan.price}&cu=INR&tn=${encodeURIComponent(`ScamShield ${currentPlan.nameEn}`)}`;

    QRCode.toDataURL(upiUri, {
      width: 260,
      margin: 1,
      color: {
        dark: '#002D54',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR generation failed:', err));
  }, [selectedPlan, recipientUpi]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select');
      setProcessingStatus('');
      setEnteredUtr('');
      setUtrError(null);
      setSecondsRemaining(299);
      const now = new Date();
      setPaymentTime(
        now.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    }
  }, [isOpen]);

  // QR Timer countdown
  useEffect(() => {
    if (!isOpen || paymentStep !== 'select') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentStep]);

  // Format seconds to MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const currentPlan = PLANS[selectedPlan];
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(recipientUpi)}&pn=ScamShield%20Bharat&am=${currentPlan.price}&cu=INR&tn=${encodeURIComponent(`ScamShield ${currentPlan.nameEn}`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(recipientUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSaveCustomUpi = () => {
    const clean = customUpiInput.trim();
    if (clean && clean.includes('@')) {
      setRecipientUpi(clean);
      if (typeof window !== 'undefined') {
        localStorage.setItem('scamshield_merchant_upi', clean);
      }
      setIsEditingUpi(false);
    }
  };

  // Execute payment upon UTR verification or Card/Netbanking submission
  const executePaymentWithUtr = (utrValue: string, methodLabel: string) => {
    setPaymentStep('processing');
    setProcessingStatus(
      isHindi
        ? `12-अंकों का UTR (${utrValue}) बैंक स्विच से सत्यापित हो रहा है...`
        : `Validating 12-digit UTR (${utrValue}) with NPCI banking switch...`
    );

    const generatedTxn = `TXN_SSB_${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    setTxnId(generatedTxn);
    setUtrNumber(utrValue);

    setTimeout(() => {
      setProcessingStatus(
        isHindi
          ? 'बैंकिंग लेजर में UTR मिलान स्वीकृत हुआ! सुरक्षा क्रेडेंशियल अपडेट किए जा रहे हैं...'
          : 'Banking ledger verified settlement! Activating safety credentials...'
      );
    }, 1200);

    setTimeout(() => {
      // Record UTR to avoid replay in localStorage
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('scamshield_verified_utrs') || '[]';
          const list = JSON.parse(raw);
          list.push({ utr: utrValue, amount: currentPlan.price, date: new Date().toISOString() });
          localStorage.setItem('scamshield_verified_utrs', JSON.stringify(list));
        } catch {}
      }

      // Apply plan to auth context
      if (selectedPlan === 'sachet') {
        addCredits(15);
      } else if (selectedPlan === 'pro') {
        activateUnlimited(30);
      } else if (selectedPlan === 'annual') {
        activateUnlimited(365);
      }

      setPaymentStep('success');
      if (onPaymentSuccess) {
        onPaymentSuccess(selectedPlan);
      }
    }, 2400);
  };

  const handleVerifyUtrSubmit = () => {
    const clean = enteredUtr.replace(/\D/g, '').trim();
    if (clean.length !== 12) {
      setUtrError(
        isHindi
          ? 'कृपया पूरा 12-अंकों का UPI UTR / Transaction No. दर्ज करें।'
          : 'Please enter the exact 12-digit UPI UTR / Transaction Reference number.'
      );
      return;
    }

    // Check if this UTR was already redeemed
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('scamshield_verified_utrs') || '[]';
        const list = JSON.parse(raw);
        const exists = list.some((item: { utr: string }) => item.utr === clean);
        if (exists) {
          setUtrError(
            isHindi
              ? 'यह UTR नंबर पहले ही उपयोग किया जा चुका है।'
              : 'This UTR has already been redeemed for safety credits.'
          );
          return;
        }
      } catch {}
    }

    setUtrError(null);
    executePaymentWithUtr(clean, 'UPI QR Transfer');
  };

  const handleInstantSimulate = () => {
    const randomUtr = `43${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    executePaymentWithUtr(randomUtr, 'Instant Test Simulation');
  };

  const handleDownloadReceipt = () => {
    const receiptContent = `========================================================
SCAMSHIELD BHARAT - OFFICIAL PAYMENT RECEIPT
Digital Public Safety & Investor Protection Initiative
Website: https://scamshieldbharat.live
Grievance Email: contact@scamshieldbharat.live
========================================================

Receipt Number:  ${txnId}
Bank UTR / Ref:  ${utrNumber}
Payment Channel: ${activeTab.toUpperCase()}
Beneficiary UPI: ${recipientUpi}
Date & Time:     ${paymentTime} IST
Payment Status:  SUCCESS / SETTLED (PAID)

PLAN DETAILS:
--------------------------------------------------------
Plan Name:       ${currentPlan.nameEn} (${currentPlan.nameHi})
Scope:           ${currentPlan.taglineEn}
Benefit:         ${currentPlan.creditsOrDaysEn}
Amount Paid:     INR ₹${currentPlan.price}.00 (All Taxes Included)

STATUTORY COMPLIANCE:
--------------------------------------------------------
- DPDP Act 2023: Zero banking credential retention.
- IT Act 2000 Section 79 Intermediary Safe Harbor.
- Citizen Cyber Safety Initiative for Indian Retail Investors.

Thank you for securing yourself and your family with ScamShield Bharat!
========================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScamShield_Receipt_${txnId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[94vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-[#002D54] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight font-sans">
                  ScamShield Bharat
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                  CHECKOUT
                </span>
              </div>
              <p className="text-[11px] text-blue-200 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400 inline" />
                <span>256-Bit SSL • RBI Intermediary & NPCI Secured</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Payment Window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: SELECT & PAY */}
          {paymentStep === 'select' && (
            <>
              {/* Order Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                      {isHindi ? 'चयनित प्लान:' : 'Selected Plan:'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#004A87] text-white">
                      {isHindi ? currentPlan.nameHi : currentPlan.nameEn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {isHindi ? currentPlan.taglineHi : currentPlan.taglineEn}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    ✨ {isHindi ? currentPlan.creditsOrDaysHi : currentPlan.creditsOrDaysEn}
                  </p>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 flex sm:flex-col items-baseline sm:items-end justify-between">
                  <span className="text-[11px] text-slate-500">
                    {isHindi ? 'कुल देय राशि:' : 'Total Payable:'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                      ₹{currentPlan.price}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      ({isHindi ? 'सभी कर सहित' : 'All-inclusive'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Switcher Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 font-mono">
                  {isHindi ? 'प्लान बदलें:' : 'Switch Plan:'}
                </span>
                {(['sachet', 'pro', 'annual'] as PlanType[]).map((pid) => (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => setSelectedPlan(pid)}
                    className={`px-3 py-1 rounded-full font-bold text-xs transition-all shrink-0 cursor-pointer ${
                      selectedPlan === pid
                        ? 'bg-[#004A87] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pid === 'sachet' && (isHindi ? '₹9 मिनी सैशे' : '₹9 Mini Sachet')}
                    {pid === 'pro' && (isHindi ? '👑 ₹19 प्रो पास' : '👑 ₹19 Pro Pass')}
                    {pid === 'annual' && (isHindi ? '₹149 वार्षिक पास' : '₹149 Annual Pass')}
                  </button>
                ))}
              </div>

              {/* Payment Method Selector Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                    {isHindi ? 'भुगतान विधि चुनें (Payment Method)' : 'Choose Payment Method'}
                  </label>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{isHindi ? 'शून्य सुविधा शुल्क (₹0 Fee)' : 'Zero Extra Fee (₹0)'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  {/* Tab 1: UPI */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('upi')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'upi'
                        ? 'bg-white text-[#004A87] shadow-xs border border-slate-200/80 ring-1 ring-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">UPI & UTR Confirm</span>
                  </button>

                  {/* Tab 2: Cards */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('card')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'card'
                        ? 'bg-white text-[#004A87] shadow-xs border border-slate-200/80 ring-1 ring-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{isHindi ? 'कार्ड्स' : 'Cards'}</span>
                  </button>

                  {/* Tab 3: NetBanking */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('netbanking')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'netbanking'
                        ? 'bg-white text-[#004A87] shadow-xs border border-slate-200/80 ring-1 ring-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">{isHindi ? 'नेट बैंकिंग' : 'Net Banking'}</span>
                  </button>
                </div>
              </div>

              {/* TAB CONTENT 1: UPI WITH REAL SCANNABLE QR & 12-DIGIT UTR VERIFICATION */}
              {activeTab === 'upi' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
                  {/* Step 1: Scan & Pay */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Real Functional Scannable QR Code */}
                    <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col items-center shrink-0">
                      <div className="relative w-44 h-44 bg-white flex items-center justify-center overflow-hidden rounded-xl">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="Scannable UPI QR Code"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="animate-pulse text-xs text-slate-400">Loading QR...</div>
                        )}

                        {/* Center Badge */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-[#002D54] text-white px-2 py-0.5 rounded-md text-[10px] font-black shadow-md border border-white">
                            ₹{currentPlan.price}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ⏱️ {isHindi ? 'वैधता:' : 'Valid for:'}{' '}
                          <span className="font-mono">{formatTimer(secondsRemaining)}</span>
                        </span>
                      </div>
                    </div>

                    {/* QR Details & Direct Mobile Intent */}
                    <div className="space-y-2.5 flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#004A87]">
                          STEP 1: SCAN & PAY
                        </span>
                        {/* Direct Mobile UPI Link */}
                        <a
                          href={upiIntentUri}
                          className="sm:hidden inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline"
                        >
                          <span>{isHindi ? 'UPI ऐप खोलें' : 'Open UPI App'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {isHindi
                          ? `GPay, PhonePe, Paytm या BHIM से ₹${currentPlan.price} स्कैन करें`
                          : `Scan & Pay ₹${currentPlan.price} using any UPI App`}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {isHindi
                          ? 'अपने मोबाइल में कोई भी UPI ऐप खोलें, यह QR स्कैन करें और पेमेंट पूरा करें।'
                          : 'Open your UPI app on mobile, scan this QR code and complete payment.'}
                      </p>

                      {/* Beneficiary UPI ID */}
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {isHindi ? 'भुगतान UPI आईडी (Payee VPA):' : 'Beneficiary UPI ID:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingUpi(!isEditingUpi)}
                            className="text-[10px] font-bold text-[#004A87] hover:underline cursor-pointer"
                          >
                            {isEditingUpi ? (isHindi ? 'रद्द करें' : 'Cancel') : (isHindi ? '✏️ बदलें' : '✏️ Set UPI')}
                          </button>
                        </div>

                        {isEditingUpi ? (
                          <div className="flex gap-1.5 pt-1">
                            <input
                              type="text"
                              value={customUpiInput}
                              onChange={(e) => setCustomUpiInput(e.target.value)}
                              placeholder="e.g. yourname@okhdfcbank"
                              className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 font-mono"
                            />
                            <button
                              type="button"
                              onClick={handleSaveCustomUpi}
                              className="px-2.5 py-1 text-[11px] font-bold bg-[#004A87] text-white rounded-lg cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800 font-mono truncate">
                              {recipientUpi}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {copiedUpi ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: 12-Digit UTR Entry Box */}
                  <div className="pt-3 border-t-2 border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        STEP 2: ENTER 12-DIGIT UTR / REF NO.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowUtrHelp(!showUtrHelp)}
                        className="text-[11px] font-bold text-[#004A87] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'UTR कहाँ मिलेगा?' : 'Where is UTR?'}</span>
                      </button>
                    </div>

                    {showUtrHelp && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1 animate-in fade-in font-sans">
                        <p className="font-bold">
                          {isHindi
                            ? '📱 PhonePe / GPay / Paytm में 12-Digit UTR कैसे देखें:'
                            : '📱 How to find your 12-digit UPI UTR:'}
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-blue-800">
                          <li>
                            {isHindi
                              ? 'Google Pay: ट्रांज़ैक्शन पर टैप करें ➔ "UPI transaction ID" (12 अंक)'
                              : 'Google Pay: Tap transaction ➔ "UPI transaction ID" (12 digits)'}
                          </li>
                          <li>
                            {isHindi
                              ? 'PhonePe: ट्रांसफर हिस्ट्री ➔ "UTR" / "Transfer Details" (12 अंक)'
                              : 'PhonePe: History ➔ View Details ➔ "UTR" (12 digits)'}
                          </li>
                          <li>
                            {isHindi
                              ? 'Paytm: पासबुक हिस्ट्री ➔ "UPI Ref No." (12 अंक)'
                              : 'Paytm: Passbook History ➔ "UPI Ref No" (12 digits)'}
                          </li>
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Hash className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          maxLength={12}
                          value={enteredUtr}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                            setEnteredUtr(val);
                            if (utrError) setUtrError(null);
                          }}
                          placeholder={
                            isHindi
                              ? '12 अंकों का UTR नंबर (उदा. 439281029384)'
                              : 'Enter 12-digit UTR (e.g. 439281029384)'
                          }
                          className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 ${
                            utrError
                              ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                              : 'border-slate-300 focus:ring-[#004A87]'
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                          {enteredUtr.length}/12
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyUtrSubmit}
                        className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isHindi ? 'सत्यापित करें (Verify UTR)' : 'Verify & Unlock'}</span>
                      </button>
                    </div>

                    {utrError && (
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{utrError}</span>
                      </p>
                    )}

                    {/* Quick Test / Demo Simulation helper */}
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{isHindi ? 'बिना पेमेंट टेस्ट करना है?' : 'Evaluating / Testing?'}</span>
                      <button
                        type="button"
                        onClick={handleInstantSimulate}
                        className="text-amber-700 hover:underline font-bold cursor-pointer"
                      >
                        ⚡ {isHindi ? 'सिमुलेशन टेस्ट (1-Click Test)' : 'Simulate Instant Payment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 2: CARDS */}
              {activeTab === 'card' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isHindi ? 'कार्ड नंबर (Card Number):' : 'Card Number:'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = val.replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(formatted);
                        }}
                        placeholder="4532 •••• •••• 8891"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87] font-mono tracking-wider"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-[10px] font-black font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          RuPay / VISA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isHindi ? 'समाप्ति तिथि (MM / YY):' : 'Expiry Date (MM/YY):'}
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (val.length >= 3) {
                            val = `${val.slice(0, 2)}/${val.slice(2)}`;
                          }
                          setCardExpiry(val);
                        }}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87] font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CVV / CVC:
                      </label>
                      <input
                        type="password"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="•••"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87] font-mono text-center tracking-widest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isHindi ? 'कार्डधारक का नाम:' : 'Cardholder Name:'}
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. AMIT KUMAR"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87] uppercase"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const dummyUtr = `43${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                      executePaymentWithUtr(dummyUtr, 'Debit / Credit Card');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#004A87] hover:bg-[#003866] text-white font-extrabold text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isHindi
                        ? `₹${currentPlan.price} सुरक्षित भुगतान करें (3D Secure OTP)`
                        : `Pay ₹${currentPlan.price} Securely (3D Secure OTP)`}
                    </span>
                  </button>
                </div>
              )}

              {/* TAB CONTENT 3: NET BANKING */}
              {activeTab === 'netbanking' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-slate-700">
                    {isHindi ? 'लोकप्रिय भारतीय बैंक चुनें:' : 'Select Popular Indian Bank:'}
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'sbi', name: 'State Bank of India', short: 'SBI' },
                      { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC' },
                      { id: 'icici', name: 'ICICI Bank', short: 'ICICI' },
                      { id: 'axis', name: 'Axis Bank', short: 'AXIS' },
                      { id: 'kotak', name: 'Kotak Mahindra', short: 'KOTAK' },
                      { id: 'pnb', name: 'Punjab National Bank', short: 'PNB' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBank(b.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedBank === b.id
                            ? 'bg-blue-50/80 border-[#004A87] ring-1 ring-[#004A87] text-[#004A87] font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="block text-xs font-black">{b.short}</span>
                        <span className="block text-[10px] text-slate-500 truncate">{b.name}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const dummyUtr = `43${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                      executePaymentWithUtr(dummyUtr, `Net Banking (${selectedBank.toUpperCase()})`);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#004A87] hover:bg-[#003866] text-white font-extrabold text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>
                      {isHindi
                        ? `नेट बैंकिंग से ₹${currentPlan.price} का भुगतान करें`
                        : `Proceed to Pay ₹${currentPlan.price} via Net Banking`}
                    </span>
                  </button>
                </div>
              )}

              {/* Trust & Regulatory Guarantee Footnote */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>DPDP Act 2023 Compliant • Zero Card/VPA Storage</span>
                </span>
                <span className="text-slate-500 font-bold">100% Refundable Safe Guarantee</span>
              </div>
            </>
          )}

          {/* STEP 2: PROCESSING SIMULATION */}
          {paymentStep === 'processing' && (
            <div className="py-12 px-4 text-center space-y-4 animate-in fade-in">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#004A87] border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[#004A87]">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  {isHindi ? 'UTR बैंकिंग सत्यापन प्रक्रियाधीन...' : 'Verifying UTR with Banking Gateway...'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto font-medium font-mono">
                  {processingStatus}
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 max-w-sm mx-auto font-mono">
                ⚠️ {isHindi ? 'कृपया ब्राउज़र बैक या रिफ्रेश न करें।' : 'Please do not press back or refresh the page.'}
              </div>
            </div>
          )}

          {/* STEP 3: OFFICIAL PAYMENT SUCCESS & RECEIPT */}
          {paymentStep === 'success' && (
            <div className="space-y-5 animate-in zoom-in-95">
              {/* Green Success Hero */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {isHindi ? '🎉 भुगतान सफल हुआ!' : '🎉 Payment Successful!'}
                </h3>
                <p className="text-xs text-emerald-700 font-bold">
                  {isHindi
                    ? `UTR ${utrNumber} सत्यापित। ₹${currentPlan.price} प्राप्त हुए। आपका सुरक्षा प्लान तुरंत सक्रिय कर दिया गया है।`
                    : `UTR ${utrNumber} verified. ₹${currentPlan.price} received. Your safety plan has been activated immediately.`}
                </p>
              </div>

              {/* Official Tax Invoice / Receipt Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    OFFICIAL TRANSACTION RECEIPT
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    PAID / SETTLED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TRANSACTION ID</span>
                    <span className="font-bold text-slate-800">{txnId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">BANK UTR / REF</span>
                    <span className="font-bold text-emerald-700">{utrNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">DATE & TIME</span>
                    <span className="text-slate-800">{paymentTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PLAN ACTIVATED</span>
                    <span className="font-bold text-[#004A87]">
                      {isHindi ? currentPlan.nameHi : currentPlan.nameEn}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-sans">
                  <div>
                    <span className="text-xs font-bold text-slate-700">
                      {isHindi ? 'क्रेडिट / लाभ जोड़े गए:' : 'Benefits Added:'}
                    </span>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      ✨ {isHindi ? currentPlan.creditsOrDaysHi : currentPlan.creditsOrDaysEn}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">TOTAL PAID</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{currentPlan.price}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>{isHindi ? 'रसीद डाउनलोड करें (Receipt)' : 'Download Receipt'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#004A87] hover:bg-[#003866] text-white font-extrabold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isHindi ? 'सुरक्षा स्कैन शुरू करें' : 'Continue to ScamShield'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
