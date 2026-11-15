'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  User,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Lock,
  LogOut,
  Building,
  BellRing,
  EyeOff,
  Scale,
  ExternalLink,
  PhoneCall,
  Save,
  Edit3,
  Check,
  Copy,
} from 'lucide-react';
import { useAuth, UserProfile } from '@/lib/auth-context';
import { OFFICIAL_SOURCES, CYBERCRIME_HELPLINE } from '@/lib/official-sources';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export default function UserProfileModal({ isOpen, onClose, lang }: UserProfileModalProps) {
  const { user, login, updateUser, logout } = useAuth();
  const isHindi = lang === 'hi';

  const [editName, setEditName] = useState(user?.name || '');
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [autoRedact, setAutoRedact] = useState(user?.autoRedactPii ?? true);
  const [highSens, setHighSens] = useState(user?.highSensitivity ?? true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setAutoRedact(user.autoRedactPii ?? true);
      setHighSens(user.highSensitivity ?? true);
    } else {
      setEditName('');
    }
  }, [user, isOpen]);

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

  // System-decided designation (User CANNOT self-assign or manipulate this)
  const getSystemDesignation = () => {
    if (user?.role === 'admin') {
      return (
        user.designation ||
        (user.uid === 'SSB-PRESIDENT-0001'
          ? isHindi
            ? 'प्रेसिडेंट व कार्यकारी निदेशक (Executive President)'
            : 'President & Executive Director'
          : isHindi
          ? 'मुख्य प्रशासक (Chief Administrator)'
          : 'Chief Cyber Safety Officer')
      );
    }
    if (user?.role === 'investor') {
      return isHindi ? 'सत्यापित खुदरा निवेशक (Retail Investor)' : 'Verified Retail Investor';
    }
    if (user?.role === 'investigator') {
      return isHindi ? 'साइबर जांच विंग (Investigation Wing)' : 'Cybercrime Investigation Wing';
    }
    return isHindi ? 'सत्यापित नागरिक सदस्य (Citizen Member)' : 'Verified Citizen Member';
  };

  const systemDesignation = getSystemDesignation();

  const handleSave = () => {
    const finalName = editName.trim() || (isHindi ? 'नागरिक सदस्य' : 'Citizen Member');

    if (!user) {
      login({
        name: finalName,
        emailOrPhone: 'citizen.local@scamshield.live',
        role: 'investor',
        designation: systemDesignation,
        organization: 'ScamShield Bharat',
        verified: true,
        autoRedactPii: autoRedact,
        highSensitivity: highSens,
      });
    } else {
      updateUser({
        name: finalName,
        designation: systemDesignation,
        autoRedactPii: autoRedact,
        highSensitivity: highSens,
      });
    }

    setSavedNotice(true);
    setIsEditingInline(false);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const currentDisplayName = editName.trim() || user?.name || (isHindi ? 'नागरिक सदस्य' : 'Citizen Member');
  const avatarLetter = currentDisplayName ? currentDisplayName.charAt(0).toUpperCase() : 'U';

  const maskContact = (val: string) => {
    if (!val || val === 'Citizen Guest' || val === 'citizen.local@scamshield.live') {
      return isHindi ? 'स्थानीय नागरिक सत्र (Local Session)' : 'Local Citizen Session';
    }
    if (val.includes('@')) {
      const [name, domain] = val.split('@');
      if (name.length <= 2) return `${name}***@${domain}`;
      return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
    }
    const digits = val.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `+91 ${digits.slice(0, 2)}******${digits.slice(-2)}`;
    }
    return val;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#004A87] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <h3 id="profile-modal-title" className="text-base sm:text-lg font-extrabold text-slate-900 font-sans">
                {isHindi ? 'नागरिक सुरक्षा प्रोफ़ाइल' : 'Citizen Safety Profile'}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {isHindi
                  ? 'स्कैमशील्ड भारत • सत्यापित नागरिक पहचान व प्राथमिकताएं'
                  : 'ScamShield Bharat • Verified Identity & Preferences'}
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

        {/* 🪪 PROFILE CARD WITH DIRECT "EDIT NAME" BUTTON */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#004A87] to-[#0A2540] text-white space-y-3.5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
            <ShieldCheck className="w-40 h-40 text-white" />
          </div>

          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black text-amber-300 shrink-0 shadow-inner mt-0.5">
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base sm:text-lg font-bold text-white truncate font-sans">
                  {currentDisplayName}
                </h4>

                {/* ✏️ EXPLICIT "EDIT NAME" BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsEditingInline(!isEditingInline)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/25 hover:bg-amber-400/35 text-amber-300 hover:text-white font-bold text-xs transition-all cursor-pointer border border-amber-300/40 shadow-xs active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'Edit Name (नाम बदलें)' : 'Edit Name'}</span>
                </button>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{isHindi ? 'सत्यापित' : 'VERIFIED'}</span>
                </span>
              </div>

              {/* INLINE QUICK EDIT NAME */}
              {isEditingInline ? (
                <div className="mt-2.5 p-3 rounded-xl bg-white text-slate-900 shadow-lg space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <label className="text-[11px] font-bold text-[#004A87] block">
                    {isHindi ? '✏️ अपना नया नाम यहाँ टाइप करें:' : '✏️ Type Your Name Here:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={isHindi ? 'उदा. आर्यन सिंह' : 'e.g. Aryan Singh'}
                      className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-[#004A87] focus:outline-none text-slate-900 bg-blue-50/30"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-3.5 py-1.5 rounded-lg bg-[#004A87] hover:bg-[#003866] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'सेव' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingInline(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-200/90 font-sans mt-0.5 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-300 shrink-0" />
                    <span>{systemDesignation}</span>
                  </p>
                  <p className="text-[11px] text-slate-300/80 font-mono mt-0.5">
                    {maskContact(user?.emailOrPhone || '')}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 🆔 UNIQUE CITIZEN SAFETY ID (UID) WITH COPY BUTTON */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs relative z-10">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-amber-300 font-bold text-[11px]">🆔 CITIZEN UID:</span>
              <span className="text-white font-extrabold tracking-wider">{user?.uid || 'SSB-2026-ACTIVE'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(user?.uid || 'SSB-2026-ACTIVE');
                setCopiedUid(true);
                setTimeout(() => setCopiedUid(false), 2000);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUid ? 'Copied' : 'Copy UID'}</span>
            </button>
          </div>

          {/* Master Admin Shortcut if User is Admin */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={onClose}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer relative z-10"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>🛡️ Open Master Admin Console (/admin)</span>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-xs relative z-10">
            <div className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
              <span className="text-[10px] text-slate-300 block">
                {isHindi ? 'सिस्टम पद (Designation)' : 'System Role'}
              </span>
              <span className="font-semibold text-amber-300 capitalize text-xs flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-300 shrink-0" />
                <span>{systemDesignation}</span>
              </span>
            </div>
            <div className="bg-white/10 rounded-lg p-2 backdrop-blur-xs">
              <span className="text-[10px] text-slate-300 block">
                {isHindi ? 'डेटा प्राइवेसी' : 'Privacy Protection'}
              </span>
              <span className="font-semibold text-emerald-300 text-xs">
                DPDP Act 2023 (Zero-DB)
              </span>
            </div>
          </div>
        </div>

        {/* 📝 ONLY NAME INPUT (CLEAN & SIMPLE) */}
        <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50/70 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800 font-mono flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#004A87]" />
              <span>{isHindi ? 'आपका नाम (Your Name)' : 'Your Name'}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {isHindi ? 'केवल नाम बदलने का विकल्प' : 'User Editable Name'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {isHindi ? 'आपका पूरा नाम दर्ज करें:' : 'Enter Your Full Name:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={isHindi ? 'उदा. आर्यन सिंह' : 'e.g. Aryan Singh'}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:border-[#004A87] focus:ring-2 focus:ring-[#004A87]/20 outline-none text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isHindi
                  ? '🔒 पद (Designation) सिस्टम द्वारा स्वचालित रूप से निर्धारित होता है, इसे बदला नहीं जा सकता।'
                  : '🔒 Designation is system-verified and cannot be altered by users.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedNotice ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isHindi ? 'नाम सफलतापूर्वक सहेजा गया!' : 'Name successfully saved!'}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  {isHindi ? 'बदलाव तुरंत प्रभाव से लागू होंगे' : 'Changes apply immediately'}
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004A87] hover:bg-[#003B6D] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isHindi ? 'नाम सहेजें (Save Name)' : 'Save Name'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ⚙️ PREFERENCES */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
            {isHindi ? 'सुरक्षा सेटिंग्स' : 'Security Settings'}
          </h5>

          <div className="space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRedact}
                onChange={(e) => setAutoRedact(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#004A87] focus:ring-[#004A87]"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  {isHindi ? 'व्यक्तिगत डेटा स्वतः छुपाएं (Auto-Redact PII)' : 'Auto-Mask Sensitive Data (PII)'}
                </span>
                <span className="text-slate-500 text-[11px] leading-tight block">
                  {isHindi
                    ? 'जांच से पहले फोन नंबर और यूपीआई आईडी स्वतः मास्क करें।'
                    : 'Mask phone numbers and UPI IDs before heuristic processing.'}
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={highSens}
                onChange={(e) => setHighSens(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#004A87] focus:ring-[#004A87]"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  {isHindi ? 'उच्च संवेदनशीलता मोड (High Sensitivity Mode)' : 'High Sensitivity Heuristic Mode'}
                </span>
                <span className="text-slate-500 text-[11px] leading-tight block">
                  {isHindi
                    ? 'अवैध टेलीग्राम पंप-एंड-डंप व नकली आईपीओ लिंक को सख्ती से पकड़ें।'
                    : 'Aggressive detection for Telegram trading groups and fake IPO links.'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 🚨 EMERGENCY ACTION & CLOSE */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          {user ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isHindi ? 'लॉगआउट' : 'Sign Out'}</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-mono">
              {isHindi ? 'स्थानीय सत्र (Local Session)' : 'Local Session'}
            </span>
          )}

          <div className="flex items-center gap-2">
            <a
              href={`tel:${CYBERCRIME_HELPLINE.number}`}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>1930 Helpline</span>
            </a>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              {isHindi ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
