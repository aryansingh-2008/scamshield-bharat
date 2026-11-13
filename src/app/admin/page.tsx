'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft,
  Crown,
  Zap,
  Coins,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Edit3,
  PlusCircle,
  DollarSign,
  Clock,
  Sparkles,
  QrCode,
  Save,
} from 'lucide-react';
import { useAuth, MASTER_ADMIN_USER, verifyAdminPasskey } from '@/lib/auth-context';
import {
  RegisteredCitizen,
  UtrTransaction,
  getAllCitizens,
  saveCitizens,
  getAllUtrTransactions,
  adminApproveUtr,
  adminRejectUtr,
  adminAdjustCredits,
  adminSetSubscription,
  getPlatformAdminStats,
} from '@/lib/user-registry';

export default function AdminPage() {
  const { user, loginAsAdmin, logout } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [showPasskey, setShowPasskey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<'citizens' | 'utr' | 'settings'>('citizens');
  const [citizens, setCitizens] = useState<RegisteredCitizen[]>([]);
  const [utrTxns, setUtrTxns] = useState<UtrTransaction[]>([]);
  const [stats, setStats] = useState({
    totalCitizens: 0,
    totalRevenue: 0,
    activeProPasses: 0,
    pendingTxnsCount: 0,
    verifiedTxnsCount: 0,
    totalScansPerformed: 0,
  });

  // Search & Filter
  const [citizenSearch, setCitizenSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'investor' | 'investigator' | 'admin'>('all');
  const [utrFilter, setUtrFilter] = useState<'all' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('all');

  // UPI Settings
  const [merchantUpi, setMerchantUpi] = useState('scamshieldbharat@axisbank');
  const [upiSavedNotice, setUpiSavedNotice] = useState(false);

  // Copy feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Status Action Notice
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const reloadData = () => {
    const allC = getAllCitizens();
    const allT = getAllUtrTransactions();
    setCitizens(allC);
    setUtrTxns(allT);
    setStats(getPlatformAdminStats());

    if (typeof window !== 'undefined') {
      const savedUpi = localStorage.getItem('scamshield_merchant_upi');
      if (savedUpi) setMerchantUpi(savedUpi);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthedSession = sessionStorage.getItem('scamshield_admin_authenticated') === 'true';
      if (user?.role === 'admin' && isAuthedSession) {
        setIsAuthenticated(true);
        reloadData();
      } else {
        setIsAuthenticated(false);
      }
      setCheckingAuth(false);
    }
  }, [user]);

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError(null);
    setIsVerifying(true);

    setTimeout(() => {
      const clean = passkeyInput.trim();
      if (!clean) {
        setPasskeyError('Please enter the Master Admin Security Passkey.');
        setIsVerifying(false);
        return;
      }

      if (!verifyAdminPasskey(clean)) {
        setPasskeyError('Access Denied: Invalid Security Passkey. Unauthorized entry attempt recorded.');
        setIsVerifying(false);
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('scamshield_admin_authenticated', 'true');
      }
      loginAsAdmin();
      setIsAuthenticated(true);
      setIsVerifying(false);
      reloadData();
    }, 400);
  };

  const handleLockAdmin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('scamshield_admin_authenticated');
    }
    setIsAuthenticated(false);
    setPasskeyInput('');
    logout();
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Admin Actions on Citizens
  const handleAddCredits = (uid: string, amount: number) => {
    adminAdjustCredits(uid, amount);
    reloadData();
    showNotification(`Added +${amount} safety credits to ${uid}`);
  };

  const handleSetPlan = (uid: string, plan: 'free' | 'sachet' | 'pro' | 'annual') => {
    adminSetSubscription(uid, plan);
    reloadData();
    showNotification(`Subscription updated to ${plan.toUpperCase()} for ${uid}`);
  };

  // Admin Actions on UTRs
  const handleApproveUtr = (utr: string) => {
    adminApproveUtr(utr, 'Manually approved by Master Admin');
    reloadData();
    showNotification(`UTR ${utr} approved! Credits and access granted to citizen.`);
  };

  const handleRejectUtr = (utr: string) => {
    const reason = prompt('Enter rejection reason:') || 'Invalid UTR format or payment not received';
    adminRejectUtr(utr, reason);
    reloadData();
    showNotification(`UTR ${utr} marked as REJECTED.`);
  };

  const handleSaveUpi = () => {
    const clean = merchantUpi.trim();
    if (clean && clean.includes('@')) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('scamshield_merchant_upi', clean);
      }
      setUpiSavedNotice(true);
      setTimeout(() => setUpiSavedNotice(false), 2500);
      showNotification(`Beneficiary UPI updated to ${clean}`);
    }
  };

  // Filtered Citizens
  const filteredCitizens = citizens.filter((c) => {
    const q = citizenSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.uid.toLowerCase().includes(q) ||
      c.emailOrPhone.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || c.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered UTRs
  const filteredUtrs = utrTxns.filter((t) => {
    if (utrFilter === 'all') return true;
    return t.status === utrFilter;
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-slate-400 font-mono">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          <span>Verifying cryptographic security credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Top amber accent line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600"></div>

          {/* Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/40 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                <span>Restricted Operations</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Master Admin Command Gate
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                IIT BHU &amp; ScamShield Central Operations
              </p>
            </div>
          </div>

          {/* Statutory Security Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Authorized Personnel Only</span>
            </p>
            <p className="text-slate-300 leading-relaxed">
              This terminal provides administrative control over the National Citizens Directory, UTR Verification Ledger, and Beneficiary Routing. Unauthorized access attempts are cryptographically logged.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlockAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                Master Security Passkey / PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPasskey ? 'text' : 'password'}
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter Master Security Passkey..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white text-sm font-mono placeholder:text-slate-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passkeyError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{passkeyError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="pt-2 text-center border-t border-slate-800">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Citizen Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Return to Main Console"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  ScamShield Bharat Admin
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-slate-950">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Central Citizen Registry &amp; UTR Payment Verification Command
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Identity Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">
              Admin: <strong className="text-white">{user?.name || MASTER_ADMIN_USER.name}</strong>
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              {user?.uid || MASTER_ADMIN_USER.uid}
            </span>
          </div>

          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 flex items-center gap-1.5"
            title="Open Citizen Portal in new window"
            target="_blank"
          >
            <span>Citizen Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLockAdmin}
            className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white font-bold text-xs transition-colors border border-red-800/50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Lock Console and Terminate Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock &amp; Sign Out</span>
          </button>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-16 right-4 z-50 p-3 bg-emerald-500 text-slate-950 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* KPI Stats Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Citizens */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Total Registered Citizens
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {stats.totalCitizens}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono">Unique UIDs</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Revenue Collected */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Total Revenue Collected
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  ₹{stats.totalRevenue}
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">Direct Bank</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Pending UTR Queue */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Pending UTR Queue
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {stats.pendingTxnsCount}
                </span>
                <span className="text-[10px] text-amber-400 font-bold font-mono">Needs Action</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Active Pro Passes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Active Pro Subscriptions
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {stats.activeProPasses}
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">Unlimited Scans</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('citizens')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'citizens'
                  ? 'bg-[#004A87] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>सारे रजिस्टर्ड नागरिक ({citizens.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('utr')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'utr'
                  ? 'bg-[#004A87] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>UTR वेरिफिकेशन कतार</span>
              {stats.pendingTxnsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-mono">
                  {stats.pendingTxnsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#004A87] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI गेटवे सेटिंग्स</span>
            </button>
          </div>

          <button
            onClick={reloadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700 cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>रिफ्रेश डाटा</span>
          </button>
        </div>

        {/* TAB 1: ALL REGISTERED CITIZENS DIRECTORY */}
        {activeTab === 'citizens' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={citizenSearch}
                  onChange={(e) => setCitizenSearch(e.target.value)}
                  placeholder="नागरिक UID (SSB-xxx), नाम, या मोबाइल से सर्च करें..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] text-slate-400 font-mono">Role:</span>
                {(['all', 'investor', 'investigator', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleFilter === r
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Citizens Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Citizen Unique ID (UID)</th>
                      <th className="py-3 px-4">Name & Contact</th>
                      <th className="py-3 px-4">Designation & Role</th>
                      <th className="py-3 px-4">Balance / Scans</th>
                      <th className="py-3 px-4">Subscription Plan</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredCitizens.map((c) => (
                      <tr key={c.uid} className="hover:bg-slate-900/50 transition-colors">
                        {/* UID with copy button */}
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{c.uid}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.uid, c.uid)}
                              className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy UID"
                            >
                              {copiedText === c.uid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Name & Contact */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{c.name}</span>
                            {c.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {c.emailOrPhone}
                          </div>
                        </td>

                        {/* Designation & Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              c.role === 'admin'
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : c.role === 'investigator'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {c.role}
                          </span>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {c.designation}
                          </p>
                        </td>

                        {/* Balance / Scans */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {c.isUnlimited ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                              👑 ∞ UNLIMITED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                              🪙 {c.credits} Scans Left
                            </span>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Total Scans Run: {c.totalScans}
                          </div>
                        </td>

                        {/* Subscription Plan */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                              c.planType === 'annual'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : c.planType === 'pro'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : c.planType === 'sachet'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.planType.toUpperCase()}
                          </span>
                        </td>

                        {/* Quick Admin Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddCredits(c.uid, 15)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition-colors cursor-pointer"
                              title="Add 15 Credits"
                            >
                              +15 Scans
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSetPlan(c.uid, c.isUnlimited ? 'free' : 'pro')
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                c.isUnlimited
                                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                                  : 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30'
                              }`}
                            >
                              {c.isUnlimited ? 'Revoke Pro' : '👑 Pro Pass'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredCitizens.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                          कोई नागरिक खाता नहीं मिला (No matching accounts found)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UTR & PAYMENT VERIFICATION QUEUE */}
        {activeTab === 'utr' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-mono">Status Filter:</span>
                {(['all', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setUtrFilter(s)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      utrFilter === s
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* UTR Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">12-Digit UTR No.</th>
                      <th className="py-3 px-4">Citizen Name & UID</th>
                      <th className="py-3 px-4">Plan & Amount</th>
                      <th className="py-3 px-4">Timestamp & VPA</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredUtrs.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-900/50 transition-colors">
                        {/* 12-Digit UTR */}
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="tracking-widest">{txn.utr}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(txn.utr, txn.utr)}
                              className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy UTR"
                            >
                              {copiedText === txn.utr ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 block">{txn.id}</span>
                        </td>

                        {/* Citizen Name & UID */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-white">{txn.userName}</div>
                          <div className="text-[11px] text-amber-400 font-mono">{txn.userUid}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{txn.userContact}</div>
                        </td>

                        {/* Plan & Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-white font-mono">
                              ₹{txn.amount}
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              {txn.planName}
                            </span>
                          </div>
                        </td>

                        {/* Timestamp & Beneficiary */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                          <div>
                            {new Date(txn.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            To: {txn.beneficiaryUpi}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              txn.status === 'VERIFIED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : txn.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {txn.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                            {txn.status === 'PENDING' && <Clock className="w-3 h-3" />}
                            {txn.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                            <span>{txn.status}</span>
                          </span>
                          {txn.adminNotes && (
                            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-xs">
                              {txn.adminNotes}
                            </p>
                          )}
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {txn.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveUtr(txn.utr)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                              >
                                ✅ Approve & Grant
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectUtr(txn.utr)}
                                className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Reviewed • Settled
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredUtrs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                          कोई UTR ट्रांज़ैक्शन नहीं मिला (No UTR transactions in this queue)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM & UPI GATEWAY SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Master Beneficiary UPI Settings
                  </h3>
                  <p className="text-xs text-slate-400">
                    वेबसाइट के QR कोड पर कौन सी UPI ID में पैसे रिसीव होंगे, यहाँ से सेट करें।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Official Recipient UPI ID (VPA):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={merchantUpi}
                    onChange={(e) => setMerchantUpi(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUpi}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save UPI</span>
                  </button>
                </div>
                {upiSavedNotice && (
                  <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>UPI ID सफलतापूर्वक अपडेट हो गई! अब लाइव QR कोड इसी पते पर खुलेगा।</span>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
                <span className="font-bold text-white block">💡 Admin Guidance:</span>
                <p>
                  - यहाँ डाली गई UPI ID पूरी साइट पर डायनामिक QR कोड में इस्तेमाल होती है।
                </p>
                <p>
                  - नागरिक जैसे ही PhonePe/GPay से स्कैन करेगा, पैसा सीधे इस बैंक खाते में जाएगा।
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
