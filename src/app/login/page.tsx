'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { login, skipLogin } = useAuth();

  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState({ n1: 7, n2: 5 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupCaptchaInput, setSignupCaptchaInput] = useState('');

  const isHindi = lang === 'hi';

  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const n2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
    setCaptchaAnswer({ n1, n2 });
    setCaptchaInput('');
    setSignupCaptchaInput('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

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
  // PASSWORD AUTHENTICATION FLOW (WITH CAPTCHA)
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

    const expected = captchaAnswer.n1 + captchaAnswer.n2;
    if (!captchaInput.trim() || parseInt(captchaInput.trim(), 10) !== expected) {
      setAuthError(
        isHindi
          ? 'अमान्य सुरक्षा CAPTCHA उत्तर। कृपया पुनः प्रयास करें।'
          : 'Incorrect security CAPTCHA answer. Please try again.'
      );
      refreshCaptcha();
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
    }, 500);
  };

  // ========================================================
  // SIGNUP FLOW (WITH CAPTCHA)
  // ========================================================
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!signupName.trim() || signupName.trim().length < 2) {
      setAuthError(
        isHindi
          ? 'कृपया अपना पूरा नाम दर्ज करें।'
          : 'Please enter your full name (at least 2 letters).'
      );
      return;
    }

    const validation = validateIdentifier(signupContact);
    if (!validation.isValid) {
      setAuthError(isHindi ? validation.errorHi : validation.error);
      return;
    }

    if (!signupPassword || signupPassword.trim().length < 6) {
      setAuthError(
        isHindi
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setAuthError(
        isHindi
          ? 'पासवर्ड मेल नहीं खाते। कृपया पुनः जांचें।'
          : 'Passwords do not match. Please verify.'
      );
      return;
    }

    const expected = captchaAnswer.n1 + captchaAnswer.n2;
    if (!signupCaptchaInput.trim() || parseInt(signupCaptchaInput.trim(), 10) !== expected) {
      setAuthError(
        isHindi
          ? 'अमान्य सुरक्षा CAPTCHA उत्तर। कृपया पुनः प्रयास करें।'
          : 'Incorrect security CAPTCHA answer. Please try again.'
      );
      refreshCaptcha();
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
    }, 500);
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
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
          >
            {isHindi ? 'English' : 'हिंदी'}
          </button>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs cursor-pointer"
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
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer"
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
              }}
              className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white text-[#004A87] font-extrabold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              🔑 {isHindi ? 'साइन इन (Sign In)' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
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
            {/* TAB 1: SIGN IN (PASSWORD + CAPTCHA)                      */}
            {/* ======================================================== */}
            {activeTab === 'signin' && (
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
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isHindi
                      ? 'अपना पंजीकृत 10 अंकों का मोबाइल नंबर या ईमेल दर्ज करें।'
                      : 'Enter your registered 10-digit mobile number or email.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isHindi ? 'पासवर्ड' : 'Password'}
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
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Anti-Bot Security CAPTCHA */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#004A87]" />
                      <span>{isHindi ? 'सुरक्षा सत्यापन (Anti-Bot CAPTCHA)' : 'Security Verification (Anti-Bot CAPTCHA)'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004A87] hover:text-[#003866] transition-colors cursor-pointer"
                      title={isHindi ? 'नया कोड लोड करें' : 'Refresh CAPTCHA'}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isHindi ? 'नया कोड' : 'Refresh'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 font-mono font-bold text-sm text-[#004A87] tracking-wider select-none shrink-0 shadow-2xs">
                      {captchaAnswer.n1} + {captchaAnswer.n2} = ?
                    </div>
                    <input
                      type="number"
                      value={captchaInput}
                      onChange={(e) => {
                        setCaptchaInput(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder={isHindi ? 'सत्यापन उत्तर दर्ज करें' : 'Enter answer'}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#004A87] font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#004A87] hover:bg-[#003866] transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{isHindi ? 'सत्यापित किया जा रहा है...' : 'Verifying Credentials...'}</span>
                  ) : (
                    <>
                      <span>{isHindi ? 'पासवर्ड से लॉगिन करें' : 'Sign In with Password'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ======================================================== */}
            {/* TAB 2: CREATE NEW ACCOUNT (SIGNUP WITH CAPTCHA)          */}
            {/* ======================================================== */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'पूरा नाम' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => {
                        setSignupName(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'मोबाइल नंबर या ईमेल' : 'Mobile Number or Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      {signupContact.includes('@') ? (
                        <Mail className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Phone className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={signupContact}
                      onChange={(e) => {
                        setSignupContact(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="9876543210 or user@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'पासवर्ड सेट करें (कम से कम 6 अक्षर)' : 'Create Password (min 6 characters)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => {
                        setSignupConfirmPassword(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                      required
                    />
                  </div>
                </div>

                {/* Anti-Bot Security CAPTCHA for Signup */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isHindi ? 'सुरक्षा सत्यापन (Anti-Bot CAPTCHA)' : 'Security Verification (Anti-Bot CAPTCHA)'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004A87] hover:text-[#003866] transition-colors cursor-pointer"
                      title={isHindi ? 'नया कोड लोड करें' : 'Refresh CAPTCHA'}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isHindi ? 'नया कोड' : 'Refresh'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 font-mono font-bold text-sm text-emerald-700 tracking-wider select-none shrink-0 shadow-2xs">
                      {captchaAnswer.n1} + {captchaAnswer.n2} = ?
                    </div>
                    <input
                      type="number"
                      value={signupCaptchaInput}
                      onChange={(e) => {
                        setSignupCaptchaInput(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder={isHindi ? 'सत्यापन उत्तर दर्ज करें' : 'Enter answer'}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{isHindi ? 'खाता बनाया जा रहा है...' : 'Creating Secure Account...'}</span>
                  ) : (
                    <>
                      <span>{isHindi ? 'सुरक्षित खाता बनाएं और लॉगिन करें' : 'Create Account & Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
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
