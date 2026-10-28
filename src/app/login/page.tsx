'use client';

import React, { useState, Suspense } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { login, skipLogin, user } = useAuth();

  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [activeTab, setActiveTab] = useState<'credentials' | 'signup'>('credentials');
  
  // Credentials Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupRole, setSignupRole] = useState<'investor' | 'investigator'>('investor');

  const isHindi = lang === 'hi';

  const handleSkip = () => {
    skipLogin();
    router.push(redirectPath);
  };



  const handleSendOtp = () => {
    if (!identifier.trim()) {
      setAuthError(isHindi ? 'कृपया मोबाइल नंबर या ईमेल दर्ज करें' : 'Please enter your mobile number or email');
      return;
    }
    setAuthError(null);
    setOtpSent(true);
  };

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setAuthError(isHindi ? 'कृपया मोबाइल नंबर या ईमेल दर्ज करें' : 'Please enter your mobile number or email');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    setTimeout(() => {
      login({
        name: identifier.includes('@') ? identifier.split('@')[0] : `Investor ${identifier.slice(-4)}`,
        emailOrPhone: identifier,
        role: 'investor',
        designation: 'Verified Retail Investor',
        organization: 'Independent Trader',
        verified: true,
      });
      setIsSubmitting(false);
      router.push(redirectPath);
    }, 600);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupContact.trim()) {
      setAuthError(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    setTimeout(() => {
      login({
        name: signupName,
        emailOrPhone: signupContact,
        role: signupRole,
        designation: signupRole === 'investor' ? 'Retail Investor (NSE/BSE)' : 'Cybercrime & Compliance Auditor',
        organization: signupRole === 'investor' ? 'Self-Directed Investor' : 'Cyber Security Wing',
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
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                ScamShield Bharat
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-[#004A87] text-white rounded">
                SANGYAN 2026
              </span>
            </div>
            <p className="hidden xs:block text-[11px] text-slate-500">
              SNTC, IIT BHU × SEBI × NSDL Hackathon
            </p>
          </div>
        </div>

        {/* Right Action Bar with Skip & Lang Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bilingual Switcher */}
          <button
            onClick={() => setLang(prev => (prev === 'en' ? 'hi' : 'en'))}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 transition-colors shadow-2xs"
          >
            {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
          </button>

          {/* Primary Skip Button */}
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
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-lg overflow-hidden">
          
          {/* Saffron & Navy Decorative Top Ribbon */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#004A87] to-[#137333]" />

          {/* Banner Box */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-blue-50/60 to-white border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-[#004A87] mb-2.5">
                  <Lock className="w-3 h-3" />
                  <span>{isHindi ? 'वैकल्पिक सुरक्षा एक्सेस' : 'Optional Secure Access'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {isHindi ? 'स्कैमशील्ड भारत पोर्टल' : 'ScamShield Bharat Portal'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {isHindi
                    ? 'अपनी जांच हिस्ट्री सेव करने के लिए लॉगिन करें, या सीधे बिना लॉगिन के स्कैनर का उपयोग करें।'
                    : 'Sign in to retain investigation records, or skip freely to use the verification scanner.'}
                </p>
              </div>

              {/* Quick Skip Pill */}
              <button
                onClick={handleSkip}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                <span>{isHindi ? 'छोड़ें (Skip)' : 'Skip'}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Quick Skip Notification Box */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isHindi
                    ? 'लॉगिन अनिवार्य नहीं है। आप किसी भी समय छोड़ सकते हैं।'
                    : 'Login is 100% optional. No account required to detect scams.'}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="font-bold underline text-amber-800 hover:text-amber-950 shrink-0"
              >
                {isHindi ? 'अभी छोड़ें ➔' : 'Skip Now ➔'}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('credentials'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === 'credentials'
                  ? 'bg-white text-[#004A87] font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              📱 {isHindi ? 'मोबाइल / ईमेल से लॉगिन' : 'Sign In with Mobile / Email'}
            </button>

            <button
              onClick={() => { setActiveTab('signup'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === 'signup'
                  ? 'bg-white text-[#004A87] font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              ✨ {isHindi ? 'नया खाता बनाएं' : 'Create New Account'}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 sm:p-8">
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB 2: Mobile / Email Credentials */}
            {activeTab === 'credentials' && (
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isHindi ? 'मोबाइल नंबर या ईमेल पता' : 'Mobile Number or Email Address'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      {identifier.includes('@') ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={isHindi ? '+91 98765 43210 या user@example.com' : '+91 98765 43210 or user@example.com'}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87] focus:border-transparent font-sans"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isHindi ? 'पासवर्ड (वैकल्पिक अगर OTP चाहते हैं)' : 'Password (or choose OTP)'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="font-bold text-[#004A87] hover:underline"
                      >
                        {isHindi ? '📩 इसके बजाय OTP प्राप्त करें' : '📩 Get 6-digit OTP instead'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        {isHindi ? 'बिना पासवर्ड छोड़ें' : 'Skip without password'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#004A87]">
                        {isHindi ? 'OTP भेजा गया (डेमो कोड: 193026)' : 'OTP Sent (Demo Code: 193026)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-slate-500 underline"
                      >
                        {isHindi ? 'पासवर्ड पर लौटें' : 'Back to Password'}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      placeholder="193026"
                      className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#004A87] hover:bg-[#003866] transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>{isHindi ? 'सत्यापित किया जा रहा है...' : 'Verifying...'}</span>
                  ) : (
                    <>
                      <span>{isHindi ? 'लॉगिन करें और कंसोल खोलें' : 'Sign In & Enter Console'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: New Account Signup */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
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
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'उपयोगकर्ता प्रकार' : 'User Role'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSignupRole('investor')}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        signupRole === 'investor'
                          ? 'border-[#004A87] bg-blue-50/60 font-bold text-[#004A87]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      👤 {isHindi ? 'रिटेल निवेशक' : 'Retail Investor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole('investigator')}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        signupRole === 'investigator'
                          ? 'border-emerald-700 bg-emerald-50/60 font-bold text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🛡️ {isHindi ? 'साइबर सेल / ऑडिटर' : 'Auditor / Officer'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <span>{isHindi ? 'खाता तैयार हो रहा है...' : 'Creating Profile...'}</span>
                  ) : (
                    <>
                      <span>{isHindi ? 'खाता बनाएं और शुरू करें' : 'Create Account & Enter'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Clear Skip Divider & Button */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
              <p className="text-xs text-slate-500 mb-3">
                {isHindi
                  ? 'खाता नहीं बनाना चाहते? कोई बात नहीं!'
                  : 'Prefer not to sign in right now? No problem!'}
              </p>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  {isHindi
                    ? '⏩ बिना लॉगिन किए अतिथि के रूप में जारी रखें (Skip & Continue)'
                    : '⏩ Continue as Guest without Login (Skip & Continue)'}
                </span>
              </button>
            </div>

            {/* Privacy Guarantee Note */}
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

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        ScamShield Bharat • SANGYAN Hackathon 2026 (SNTC, IIT BHU × SEBI × NSDL) • Privacy by Design
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
