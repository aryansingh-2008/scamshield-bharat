'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Home,
  Building2,
  FileCheck2,
  RefreshCw,
  ArrowLeft,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { login, skipLogin, user } = useAuth();

  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp'); // Default to OTP for Indian financial safety

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<'input_number' | 'verify_otp'>('input_number');
  const [otpValue, setOtpValue] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOtpStep, setSignupOtpStep] = useState<'details' | 'verify_otp'>('details');
  const [signupOtpValue, setSignupOtpValue] = useState('');

  const isHindi = lang === 'hi';

  // Resend OTP Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSkip = () => {
    skipLogin();
    router.push(redirectPath);
  };

  // Safe validation for Indian mobile numbers (10 digits starting with 6-9) or emails
  const validateIdentifier = (val: string): { isValid: boolean; error: string; errorHi: string } => {
    const cleaned = val.trim();
    if (!cleaned) {
      return {
        isValid: false,
        error: 'Please enter your mobile number or email address.',
        errorHi: 'कृपया अपना मोबाइल नंबर या ईमेल पता दर्ज करें।',
      };
    }

    if (cleaned.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleaned)) {
        return {
          isValid: false,
          error: 'Please enter a valid email address (e.g., name@domain.com).',
          errorHi: 'कृपया एक वैध ईमेल पता दर्ज करें (उदा. name@domain.com)।',
        };
      }
      return { isValid: true, error: '', errorHi: '' };
    }

    const digitsOnly = cleaned.replace(/\D/g, '');
    const phoneDigits =
      digitsOnly.startsWith('91') && digitsOnly.length === 12
        ? digitsOnly.slice(2)
        : digitsOnly;

    if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
      return {
        isValid: false,
        error: 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).',
        errorHi: 'कृपया 10 अंकों का एक वैध भारतीय मोबाइल नंबर दर्ज करें (उदा. 9876543210)।',
      };
    }

    return { isValid: true, error: '', errorHi: '' };
  };

  // ========================================================
  // OTP AUTHENTICATION FLOW
  // ========================================================
  const handleRequestOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const validation = validateIdentifier(identifier);
    if (!validation.isValid) {
      setAuthError(isHindi ? validation.errorHi : validation.error);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpStep('verify_otp');
      setOtpValue('');
      setResendCooldown(30);
      setAuthSuccess(
        isHindi
          ? `सत्यापन कोड भेजा गया! डेमो कोड: 193026 दर्ज करें`
          : `OTP Sent! Enter demo verification code: 193026`
      );
    }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanedOtp = otpValue.trim();
    if (!cleanedOtp) {
      setAuthError(
        isHindi
          ? 'कृपया 6 अंकों का OTP दर्ज करें (डेमो कोड: 193026)'
          : 'Please enter the 6-digit OTP (Demo code: 193026)'
      );
      return;
    }

    if (cleanedOtp.length !== 6 || !/^\d{6}$/.test(cleanedOtp)) {
      setAuthError(
        isHindi
          ? 'OTP ठीक 6 अंकों का होना चाहिए (उदा. 193026)'
          : 'OTP must be exactly 6 digits (e.g., 193026)'
      );
      return;
    }

    // Verify OTP against statutory demo code or standard 6-digit verification
    if (cleanedOtp !== '193026' && cleanedOtp !== '123456') {
      setAuthError(
        isHindi
          ? 'अमान्य OTP कोड। कृपया डेमो कोड: 193026 का उपयोग करें।'
          : 'Invalid OTP code. Please use the demo verification code: 193026.'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      login({
        name: identifier.includes('@')
          ? identifier.split('@')[0]
          : `Citizen +91 ***${identifier.replace(/\D/g, '').slice(-4)}`,
        emailOrPhone: identifier,
        role: 'investor',
        designation: 'Verified Citizen User',
        organization: 'ScamShield Bharat Safe Portal',
        verified: true,
      });
      setIsSubmitting(false);
      router.push(redirectPath);
    }, 600);
  };

  // ========================================================
  // PASSWORD AUTHENTICATION FLOW
  // ========================================================
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const validation = validateIdentifier(identifier);
    if (!validation.isValid) {
      setAuthError(isHindi ? validation.errorHi : validation.error);
      return;
    }

    if (!password || password.trim().length < 6) {
      setAuthError(
        isHindi
          ? 'कृपया कम से कम 6 अक्षरों का पासवर्ड दर्ज करें।'
          : 'Please enter your password (minimum 6 characters).'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      login({
        name: identifier.includes('@')
          ? identifier.split('@')[0]
          : `Citizen +91 ***${identifier.replace(/\D/g, '').slice(-4)}`,
        emailOrPhone: identifier,
        role: 'investor',
        designation: 'Verified Account Holder',
        organization: 'ScamShield Bharat',
        verified: true,
      });
      setIsSubmitting(false);
      router.push(redirectPath);
    }, 600);
  };

  // ========================================================
  // SIGNUP FLOW
  // ========================================================
  const handleSignupStart = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!signupName.trim() || signupName.trim().length < 2) {
      setAuthError(isHindi ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name (at least 2 letters).');
      return;
    }

    const validation = validateIdentifier(signupContact);
    if (!validation.isValid) {
      setAuthError(isHindi ? validation.errorHi : validation.error);
      return;
    }

    if (!signupPassword || signupPassword.trim().length < 6) {
      setAuthError(isHindi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSignupOtpStep('verify_otp');
      setSignupOtpValue('');
      setResendCooldown(30);
      setAuthSuccess(
        isHindi
          ? 'सत्यापन कोड भेजा गया! डेमो कोड: 193026 दर्ज करें'
          : 'OTP sent for registration! Enter demo code: 193026'
      );
    }, 400);
  };

  const handleSignupVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanedOtp = signupOtpValue.trim();
    if (!cleanedOtp || cleanedOtp.length !== 6 || !/^\d{6}$/.test(cleanedOtp)) {
      setAuthError(
        isHindi
          ? 'कृपया 6 अंकों का वैध OTP दर्ज करें (डेमो कोड: 193026)।'
          : 'Please enter a valid 6-digit OTP (Demo code: 193026).'
      );
      return;
    }

    if (cleanedOtp !== '193026' && cleanedOtp !== '123456') {
      setAuthError(
        isHindi
          ? 'अमान्य OTP कोड। कृपया डेमो कोड: 193026 दर्ज करें।'
          : 'Invalid OTP code. Please use demo code: 193026.'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      login({
        name: signupName.trim(),
        emailOrPhone: signupContact.trim(),
        role: 'investor',
        designation: 'Verified Citizen Member',
        organization: 'ScamShield Bharat',
        verified: true,
      });
      setIsSubmitting(false);
      router.push(redirectPath);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Institutional Header */}
      <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#004A87] flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
              ScamShield <span className="text-[#D97706]">Bharat</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {isHindi ? 'भारत का वित्तीय सुरक्षा कवच' : 'AI Financial Scam Prevention Portal'}
            </div>
          </div>
        </div>

        {/* Skip Button in Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            {isHindi ? 'English' : 'हिंदी'}
          </button>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs"
            title="Continue directly without signing in"
          >
            <span>{isHindi ? 'लॉगिन छोड़ें (Skip)' : 'Skip for Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Saffron, Navy, Green Indian Tricolor Ribbon */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#004A87] to-[#137333]" />

          {/* Banner Box */}
          <div className="p-6 sm:p-7 bg-gradient-to-b from-blue-50/70 to-white border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-[#004A87] mb-2.5">
                  <Lock className="w-3 h-3" />
                  <span>{isHindi ? 'नागरिक सुरक्षा लॉगिन' : 'Citizen Security Login'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {isHindi ? 'स्कैमशील्ड भारत पोर्टल' : 'ScamShield Bharat Portal'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {isHindi
                    ? 'अपनी जांच हिस्ट्री सेव करने के लिए लॉगिन करें, या सीधे बिना लॉगिन के स्कैनर का उपयोग करें।'
                    : 'Sign in to retain investigation history, or skip freely to scan messages anonymously.'}
                </p>
              </div>

              <button
                onClick={handleSkip}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                <span>{isHindi ? 'छोड़ें' : 'Skip'}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Main Tabs (Sign In vs Create Account) */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setAuthError(null);
                setAuthSuccess(null);
                setOtpStep('input_number');
              }}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === 'signin'
                  ? 'bg-white text-[#004A87] font-extrabold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              📱 {isHindi ? 'साइन इन (Sign In)' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setAuthError(null);
                setAuthSuccess(null);
                setSignupOtpStep('details');
              }}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === 'signup'
                  ? 'bg-white text-[#004A87] font-extrabold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              ✨ {isHindi ? 'नया खाता बनाएं' : 'Create Account'}
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-6 sm:p-7">
            {/* Error Message */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Success Message */}
            {authSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{authSuccess}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 1: SIGN IN                                           */}
            {/* ======================================================== */}
            {activeTab === 'signin' && (
              <div>
                {/* Mode Selector: OTP vs Password */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">
                    {isHindi ? 'प्रमाणीकरण विधि:' : 'Sign In Method:'}
                  </span>
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('otp');
                        setOtpStep('input_number');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        authMode === 'otp'
                          ? 'bg-white text-[#004A87] shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📩 OTP (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('password');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        authMode === 'password'
                          ? 'bg-white text-[#004A87] shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔑 Password
                    </button>
                  </div>
                </div>

                {/* --- A. OTP MODE: STEP 1 (INPUT PHONE/EMAIL) --- */}
                {authMode === 'otp' && otpStep === 'input_number' && (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isHindi ? 'मोबाइल नंबर या ईमेल पता' : 'Mobile Number or Email Address'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          {identifier.includes('@') ? (
                            <Mail className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Phone className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value);
                            setAuthError(null);
                          }}
                          placeholder={
                            isHindi
                              ? '+91 98765 43210 या user@example.com'
                              : '+91 98765 43210 or user@example.com'
                          }
                          className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87] focus:border-transparent font-medium"
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {isHindi
                          ? 'OTP सत्यापन के लिए अपना 10 अंकों का मोबाइल नंबर दर्ज करें।'
                          : 'Enter your 10-digit mobile number to receive a secure OTP.'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#004A87] hover:bg-[#003866] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{isHindi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...'}</span>
                      ) : (
                        <>
                          <span>{isHindi ? 'OTP प्राप्त करें (Get OTP)' : 'Send Secure OTP'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* --- A. OTP MODE: STEP 2 (VERIFY OTP) --- */}
                {authMode === 'otp' && otpStep === 'verify_otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#004A87]" />
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {identifier}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('input_number');
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className="text-[11px] font-bold text-[#004A87] hover:underline"
                      >
                        {isHindi ? 'नंबर बदलें' : 'Change Number'}
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {isHindi ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-Digit OTP'}
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Demo OTP: 193026
                        </span>
                      </div>

                      <input
                        type="text"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => {
                          setOtpValue(e.target.value.replace(/\D/g, ''));
                          setAuthError(null);
                        }}
                        placeholder="193026"
                        className="w-full px-4 py-3 text-center text-lg font-mono font-black tracking-widest rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#004A87] text-slate-900"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {resendCooldown > 0 ? (
                        <span className="text-slate-400 font-medium">
                          {isHindi
                            ? `OTP पुनः भेजें (${resendCooldown}s)`
                            : `Resend OTP in ${resendCooldown}s`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestOtp()}
                          className="font-bold text-[#004A87] hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{isHindi ? 'OTP पुनः भेजें' : 'Resend OTP'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        {isHindi ? 'बिना लॉगिन छोड़ें' : 'Skip without signing in'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{isHindi ? 'सत्यापित किया जा रहा है...' : 'Verifying OTP...'}</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isHindi ? 'OTP सत्यापित कर लॉगिन करें' : 'Verify OTP & Enter Console'}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* --- B. PASSWORD MODE --- */}
                {authMode === 'password' && (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isHindi ? 'मोबाइल नंबर या ईमेल पता' : 'Mobile Number or Email Address'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          {identifier.includes('@') ? (
                            <Mail className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Phone className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value);
                            setAuthError(null);
                          }}
                          placeholder={
                            isHindi
                              ? '+91 98765 43210 या user@example.com'
                              : '+91 98765 43210 or user@example.com'
                          }
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isHindi ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (minimum 6 characters)'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setAuthError(null);
                          }}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#004A87] hover:bg-[#003866] transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{isHindi ? 'सत्यापित किया जा रहा है...' : 'Verifying...'}</span>
                      ) : (
                        <>
                          <span>{isHindi ? 'पासवर्ड से लॉगिन करें' : 'Sign In with Password'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: CREATE NEW ACCOUNT (SIGNUP)                      */}
            {/* ======================================================== */}
            {activeTab === 'signup' && (
              <div>
                {signupOtpStep === 'details' ? (
                  <form onSubmit={handleSignupStart} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isHindi ? 'पूरा नाम' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isHindi ? 'मोबाइल नंबर या ईमेल' : 'Mobile Number or Email'}
                      </label>
                      <input
                        type="text"
                        value={signupContact}
                        onChange={(e) => setSignupContact(e.target.value)}
                        placeholder="9876543210 or user@example.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isHindi ? 'पासवर्ड सेट करें (कम से कम 6 अक्षर)' : 'Create Password (min 6 characters)'}
                      </label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{isHindi ? 'सत्यापन भेजा जा रहा है...' : 'Sending Verification...'}</span>
                      ) : (
                        <>
                          <span>{isHindi ? 'OTP प्राप्त करें और आगे बढ़ें' : 'Get OTP & Proceed'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignupVerify} className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                      <div className="font-bold text-slate-800">{signupName}</div>
                      <div className="text-slate-600 font-mono text-[11px]">{signupContact}</div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {isHindi ? 'पंजीकरण OTP दर्ज करें' : 'Enter Registration OTP'}
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Demo OTP: 193026
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={signupOtpValue}
                        onChange={(e) => setSignupOtpValue(e.target.value.replace(/\D/g, ''))}
                        placeholder="193026"
                        className="w-full px-4 py-3 text-center text-lg font-mono font-black tracking-widest rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{isHindi ? 'खाता तैयार हो रहा है...' : 'Creating Profile...'}</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isHindi ? 'OTP सत्यापित कर खाता बनाएं' : 'Verify OTP & Create Account'}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Bottom Skip Option */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
              <p className="text-xs text-slate-500 mb-3">
                {isHindi
                  ? 'खाता नहीं बनाना चाहते? कोई बात नहीं!'
                  : 'Prefer not to sign in right now? No problem!'}
              </p>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {isHindi
                    ? '⏩ बिना लॉगिन किए अतिथि के रूप में जारी रखें (Skip & Continue)'
                    : '⏩ Continue as Guest without Login (Skip & Continue)'}
                </span>
              </button>
            </div>

            {/* Privacy Note */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {isHindi
                  ? 'शून्य डेटाबेस गोपनीयता: कोई पासवर्ड या व्यक्तिगत डेटा डिस्क पर स्टोर नहीं होता।'
                  : 'Zero-DB Privacy: No credentials or financial inputs persisted on disk.'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        ScamShield Bharat • Evidence-First Financial Cyber Safety • Privacy by Design
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
          Loading ScamShield Bharat Portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
