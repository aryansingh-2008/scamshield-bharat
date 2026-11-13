'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Settings,
  Lock,
  PlayCircle,
  Home,
  Building2,
  HelpCircle,
  Info,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Shield,
  Scale,
  Coins,
} from 'lucide-react';
import { TRANSLATIONS } from '@/lib/translations';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  lang: 'en' | 'hi';
  currentView?: 'home' | 'sources';
  onToggleLang: () => void;
  onOpenArch: () => void;
  onOpenSafetyTips?: () => void;
  onOpenAbout?: () => void;
  onOpenSecurity?: () => void;
  onOpenTerms?: () => void;
  onOpenProfile?: () => void;
  onOpenRecharge?: () => void;
  onNavigateHome: () => void;
  onNavigateSources?: () => void;
  onTriggerDemo?: () => void;
}

export default function Header({
  lang,
  currentView = 'home',
  onToggleLang,
  onOpenArch,
  onOpenSafetyTips,
  onOpenAbout,
  onOpenSecurity,
  onOpenTerms,
  onOpenProfile,
  onOpenRecharge,
  onNavigateHome,
  onNavigateSources,
  onTriggerDemo,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHindi = lang === 'hi';
  const t = TRANSLATIONS[lang];
  const { user, logout, credits, isUnlimited } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-xs">
      {/* Statutory Civic Awareness Top Bar */}
      <div className="w-full bg-[#07131F] text-slate-300 text-[10.5px] py-1 px-3 sm:px-6 lg:px-8 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">
            {isHindi
              ? 'स्वतंत्र नागरिक सुरक्षा साधन • भारत सरकार या सेबी से संबद्ध नहीं • आपातकालीन साइबर हेल्पलाइन: 1930'
              : 'Independent Civic Safety Platform • Not Affiliated with Govt of India or SEBI • National Helpline: 1930'}
          </span>
        </div>
        {onOpenTerms && (
          <button
            onClick={onOpenTerms}
            className="text-amber-400 hover:text-amber-300 font-semibold underline text-[10.5px] shrink-0 ml-3 cursor-pointer"
          >
            {isHindi ? 'कानूनी नियम व अस्वीकरण' : 'Terms & Disclaimers'}
          </button>
        )}
      </div>

      <div className="max-w-[1340px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        {/* Left Brand Identity */}
        <div className="relative flex items-center h-full min-w-0 pr-1 sm:pr-0">
          {/* Angled background accent shape */}
          <div
            className="hidden sm:block absolute inset-y-0 -left-6 w-[calc(100%+38px)] bg-[#EEF4F9] border-r border-slate-200/80 -z-10"
            style={{
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%)',
            }}
          />

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigateHome();
            }}
            className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none focus:ring-2 focus:ring-[#004A87] rounded-lg p-1 min-w-0"
            aria-label="ScamShield Bharat Home"
          >
            {/* Solid Deep Institutional Blue Shield Block */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#004A87] flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-lg text-slate-900 tracking-tight font-sans truncate">
                  {t.brandName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-[#004A87] text-white rounded tracking-wider shrink-0">
                  SAFETY CONSOLE
                </span>
              </div>
              <p className="hidden md:block text-[11px] sm:text-xs text-slate-500 font-sans leading-tight mt-0.5 truncate">
                {isHindi
                  ? 'प्रमाण-आधारित वित्तीय धोखाधड़ी जांच सहायक'
                  : 'Evidence-First Financial Verification Assistant'}
              </p>
            </div>
          </button>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Home */}
          <button
            onClick={onNavigateHome}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              currentView === 'home'
                ? 'text-[#004A87] bg-blue-50/80 border border-blue-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isHindi ? 'होम' : 'Home'}</span>
          </button>

          {/* How it Works */}
          <button
            onClick={onOpenArch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>{isHindi ? 'यह कैसे काम करता है' : 'How it Works'}</span>
          </button>

          {/* Safety Tips */}
          {onOpenSafetyTips && (
            <button
              onClick={onOpenSafetyTips}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{isHindi ? 'सुरक्षा सुझाव' : 'Safety Tips'}</span>
            </button>
          )}

          {/* Official Sources */}
          {onNavigateSources && (
            <button
              onClick={onNavigateSources}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                currentView === 'sources'
                  ? 'text-[#004A87] bg-[#EBF3FA] border border-[#B9DCF7] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#004A87]" />
              <span>{isHindi ? 'आधिकारिक स्रोत' : 'Official Sources'}</span>
            </button>
          )}

          {/* About */}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{isHindi ? 'हमारे बारे में' : 'About'}</span>
            </button>
          )}

          {/* Profile Navigation Button */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#004A87] bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={isHindi ? 'नागरिक सुरक्षा प्रोफ़ाइल' : 'Citizen Safety Profile'}
            >
              <User className="w-3.5 h-3.5 text-[#004A87]" />
              <span>{isHindi ? 'प्रोफ़ाइल' : 'Profile'}</span>
            </button>
          )}
        </nav>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Demo Trigger in Header */}
          {onTriggerDemo && currentView === 'home' && (
            <button
              onClick={onTriggerDemo}
              className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              title="Open Live Demo Scenarios"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#004A87] shrink-0" />
              <span className="hidden xs:inline">{t.navDemo}</span>
            </button>
          )}

          {/* Bilingual Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 transition-colors focus:ring-2 focus:ring-[#004A87] shrink-0 shadow-2xs"
            aria-label="Toggle language between English and Hindi"
          >
            <span
              className={
                lang === 'en'
                  ? 'text-[#004A87] font-bold underline underline-offset-4'
                  : 'text-slate-400'
              }
            >
              EN
            </span>
            <span className="text-slate-300">|</span>
            <span
              className={
                lang === 'hi'
                  ? 'text-[#004A87] font-bold underline underline-offset-4'
                  : 'text-slate-400'
              }
            >
              हिंदी
            </span>
          </button>

          {/* Credit Quota & Recharge Button */}
          {onOpenRecharge && (
            <button
              onClick={onOpenRecharge}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                isUnlimited
                  ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : credits > 2
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 animate-pulse'
              }`}
              title={isHindi ? 'सुरक्षा क्रेडिट्स बैलेंस व रीचार्ज' : 'Safety Credits Balance & Recharge'}
            >
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {isUnlimited
                  ? '👑 Pro'
                  : `${credits} ${isHindi ? 'क्रेडिट' : 'Credits'}`}
              </span>
              <span className="text-[10px] px-1 py-0.2 bg-amber-200/80 text-amber-900 rounded font-extrabold hidden sm:inline">
                {isHindi ? 'रीचार्ज (₹9)' : 'Top-up'}
              </span>
            </button>
          )}

          {/* Authentication Badge / Login Button */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs rounded-lg bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-[#004A87] shadow-2xs transition-colors cursor-pointer group"
                title={isHindi ? 'मेरी प्रोफ़ाइल देखें' : 'View My Profile'}
              >
                <div className="w-5 h-5 rounded-full bg-[#004A87] text-white flex items-center justify-center text-[10px] font-bold shrink-0 group-hover:scale-105 transition-transform">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold hidden md:inline truncate max-w-[110px]">
                  {user.name}
                </span>
                <span className="text-[10px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold hidden lg:inline">
                  ✓
                </span>
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title={isHindi ? 'लॉगआउट करें' : 'Sign Out'}
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-[#004A87] hover:bg-[#003866] transition-colors shadow-2xs shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isHindi ? 'लॉगिन' : 'Sign In'}</span>
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            aria-label="Toggle mobile navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1.5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {/* Mobile User Profile Section */}
          {user ? (
            <div className="p-3 mb-2 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenProfile?.();
                }}
                className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#004A87] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-xs text-slate-900 truncate">{user.name}</p>
                    <span className="text-[9px] px-1 bg-emerald-100 text-emerald-800 rounded font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.emailOrPhone || 'Verified Account'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 text-xs font-bold text-red-600 bg-white hover:bg-red-50 rounded-lg border border-red-200 transition-colors shrink-0 ml-2 cursor-pointer"
              >
                {isHindi ? 'लॉगआउट' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <div className="p-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isHindi ? 'स्कैमशील्ड अकाउंट' : 'ScamShield Account'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isHindi ? 'लॉगिन वैकल्पिक है (Skippable)' : 'Login is optional (Skippable)'}
                </p>
              </div>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#004A87] rounded-lg shadow-xs"
              >
                {isHindi ? 'लॉगिन करें' : 'Sign In'}
              </Link>
            </div>
          )}

          {/* Mobile Credit Recharge Banner */}
          {onOpenRecharge && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenRecharge();
              }}
              className="w-full flex items-center justify-between p-2.5 mb-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-700" />
                <span>
                  {isUnlimited
                    ? '👑 Pro Unlimited Pass'
                    : `🪙 ${credits} ${isHindi ? 'क्रेडिट्स शेष' : 'Credits Left'}`}
                </span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-200 text-amber-900 font-extrabold shadow-2xs">
                {isHindi ? 'रीचार्ज (₹9)' : 'Top-up (₹9)'}
              </span>
            </button>
          )}

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigateHome();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${
              currentView === 'home'
                ? 'text-[#004A87] bg-blue-50/80 border border-blue-200/60 font-bold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4 text-[#004A87]" />
            <span>{isHindi ? 'होम' : 'Home'}</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenArch();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>{isHindi ? 'यह कैसे काम करता है' : 'How it Works'}</span>
          </button>

          {onOpenSafetyTips && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenSafetyTips();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{isHindi ? 'सुरक्षा सुझाव (5 Golden Rules)' : 'Safety Tips (5 Golden Rules)'}</span>
            </button>
          )}

          {onNavigateSources && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigateSources();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                currentView === 'sources'
                  ? 'text-[#004A87] bg-[#EBF3FA] border border-[#B9DCF7] font-bold'
                  : 'text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#004A87]" />
              <span>{isHindi ? 'आधिकारिक स्रोत (SEBI, RBI, 1930)' : 'Official Sources (SEBI, RBI, 1930)'}</span>
            </button>
          )}

          {onOpenProfile && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#004A87] bg-blue-50/80 hover:bg-blue-100 rounded-lg text-left transition-colors"
            >
              <User className="w-4 h-4 text-[#004A87]" />
              <span>{isHindi ? 'नागरिक सुरक्षा प्रोफ़ाइल' : 'Citizen Safety Profile'}</span>
            </button>
          )}

          {onOpenAbout && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left transition-colors"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>{isHindi ? 'हमारे बारे में' : 'About ScamShield Bharat'}</span>
            </button>
          )}

          {onOpenTerms && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenTerms();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg text-left transition-colors"
            >
              <Scale className="w-4 h-4 text-amber-600" />
              <span>{isHindi ? 'कानूनी नियम व अस्वीकरण' : 'Terms & Disclaimers'}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
