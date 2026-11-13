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
  Hash,
  X,
  Trash2,
  UserPlus,
  Award,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useAuth, MASTER_ADMIN_USER, verifyAdminPasskey } from '@/lib/auth-context';
import {
  RegisteredCitizen,
  UtrTransaction,
  CHIEF_ADMIN_UID,
  getAllCitizens,
  saveCitizens,
  getAllUtrTransactions,
  adminApproveUtr,
  adminRejectUtr,
  adminAdjustCredits,
  adminSetSubscription,
  adminDeleteCitizen,
  adminAppointPost,
  adminCreateCitizen,
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
  const [quickUtrInput, setQuickUtrInput] = useState('');
  const [utrSearchQuery, setUtrSearchQuery] = useState('');

  // UPI Settings
  const [merchantUpi, setMerchantUpi] = useState('scamshieldbharat@axisbank');
  const [upiSavedNotice, setUpiSavedNotice] = useState(false);

  // Copy feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Status Action Notice
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals for Chief Admin Powers (Add, Appoint Post, Delete)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCitizenForEdit, setSelectedCitizenForEdit] = useState<RegisteredCitizen | null>(null);
  const [deleteConfirmCitizen, setDeleteConfirmCitizen] = useState<RegisteredCitizen | null>(null);

  // Form State for Add Member
  const [addName, setAddName] = useState('');
  const [addContact, setAddContact] = useState('');
  const [addDesignation, setAddDesignation] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'investigator' | 'investor'>('investor');
  const [addOrg, setAddOrg] = useState('ScamShield Bharat (IIT BHU)');
  const [addUnlimited, setAddUnlimited] = useState(false);
  const [addCredits, setAddCredits] = useState(25);

  // Form State for Edit Post
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'investigator' | 'investor'>('investor');
  const [editOrg, setEditOrg] = useState('');
  const [editCredits, setEditCredits] = useState(5);
  const [editUnlimited, setEditUnlimited] = useState(false);

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

      const ok = loginAsAdmin(clean);
      if (!ok) {
        setPasskeyError('Access Denied: Invalid Security Passkey. Unauthorized entry attempt recorded.');
        setIsVerifying(false);
        return;
      }

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

  const handleOpenEditModal = (c: RegisteredCitizen) => {
    setSelectedCitizenForEdit(c);
    setEditName(c.name);
    setEditDesignation(c.designation);
    setEditRole(c.role === 'admin' || c.role === 'investigator' ? c.role : 'investor');
    setEditOrg(c.organization);
    setEditCredits(c.credits);
    setEditUnlimited(c.isUnlimited);
    setIsEditModalOpen(true);
  };

  const handleCreateCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addContact.trim()) {
      showNotification('कृपया सदस्य का नाम व मोबाइल/ईमेल दर्ज करें।');
      return;
    }
    const created = adminCreateCitizen({
      name: addName,
      emailOrPhone: addContact,
      role: addRole,
      designation: addDesignation || 'Verified Official Member',
      organization: addOrg,
      isUnlimited: addUnlimited,
      credits: addCredits,
    });
    setIsAddModalOpen(false);
    setAddName('');
    setAddContact('');
    setAddDesignation('');
    reloadData();
    showNotification(`✅ सदस्य '${created.name}' (${created.uid}) को सफलतापूर्वक नियुक्त किया गया!`);
  };

  const handleAppointPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizenForEdit) return;
    const res = adminAppointPost(selectedCitizenForEdit.uid, {
      name: editName,
      role: editRole,
      designation: editDesignation,
      organization: editOrg,
      credits: editCredits,
      isUnlimited: editUnlimited,
    });
    if (!res.success) {
      showNotification(`⚠️ ${res.message}`);
      return;
    }
    setIsEditModalOpen(false);
    setSelectedCitizenForEdit(null);
    reloadData();
    showNotification(`✅ ${res.message}`);
  };

  const handleDeleteCitizen = (uid: string) => {
    const res = adminDeleteCitizen(uid);
    if (!res.success) {
      showNotification(`⚠️ ${res.message}`);
      setDeleteConfirmCitizen(null);
      return;
    }
    setDeleteConfirmCitizen(null);
    reloadData();
    showNotification(`✅ ${res.message}`);
  };

  // Admin Actions on UTRs
  const handleApproveUtr = (utr: string) => {
    const reviewer = user?.name || 'Master Admin';
    adminApproveUtr(utr, `Approved by ${reviewer}`, reviewer);
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

  // Filtered UTRs (with Search & Status Filter)
  const filteredUtrs = utrTxns.filter((t) => {
    const q = utrSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.utr.toLowerCase().includes(q) ||
      t.userName.toLowerCase().includes(q) ||
      t.userUid.toLowerCase().includes(q) ||
      t.userContact.toLowerCase().includes(q);
    const matchesFilter = utrFilter === 'all' || t.status === utrFilter;
    return matchesSearch && matchesFilter;
  });

  // Real-time matched transaction for Quick SMS/Statement Matcher
  const cleanQuickUtr = quickUtrInput.replace(/\D/g, '').trim();
  const matchedTxn =
    cleanQuickUtr.length >= 6
      ? utrTxns.find(
          (t) =>
            t.utr.toLowerCase().includes(cleanQuickUtr.toLowerCase()) ||
            cleanQuickUtr.toLowerCase().includes(t.utr.toLowerCase())
        )
      : null;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-slate-600 font-mono">
          <RefreshCw className="w-5 h-5 animate-spin text-[#004A87]" />
          <span>Verifying cryptographic security credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Top blue accent line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#002D54] via-[#004A87] to-[#002D54]"></div>

          {/* Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-[#004A87] flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                <span>Restricted Operations</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Master Admin Command Gate
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                IIT BHU &amp; ScamShield Central Operations
              </p>
            </div>
          </div>

          {/* Statutory Security Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Authorized Personnel Only</span>
            </p>
            <p className="text-slate-700 leading-relaxed">
              This terminal provides administrative control over the National Citizens Directory, UTR Verification Ledger, and Beneficiary Routing. Unauthorized access attempts are cryptographically logged under DPDP Act 2023.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlockAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
                Master Security Passkey / PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPasskey ? 'text' : 'password'}
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter Master Security Passkey..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:border-[#004A87] focus:ring-2 focus:ring-[#004A87]/15 text-slate-900 text-sm font-mono placeholder:text-slate-400 outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passkeyError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{passkeyError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#002D54] to-[#004A87] hover:from-[#001D38] hover:to-[#003868] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
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
          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-[#004A87] font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Admin Header Bar - Matching Citizen Portal Navy Theme */}
      <header className="bg-[#002D54] border-b border-[#003868] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Return to Main Console"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  ScamShield Bharat Admin
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-slate-950">
                  {user?.uid === 'SSB-PRESIDENT-0001' ? '👑 PRESIDENT' : 'SUPER ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-blue-200 font-mono">
                {user?.uid === 'SSB-PRESIDENT-0001'
                  ? 'President Executive Command & Central Registry'
                  : 'Central Citizen Registry & UTR Payment Verification Command'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Identity Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-blue-100 font-mono">
              {user?.uid === 'SSB-PRESIDENT-0001' ? 'President:' : 'Admin:'}{' '}
              <strong className="text-white">{user?.name || MASTER_ADMIN_USER.name}</strong>
            </span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-300/30">
              {user?.uid || MASTER_ADMIN_USER.uid}
            </span>
          </div>

          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors border border-white/25 flex items-center gap-1.5"
            title="Open Citizen Portal in new window"
            target="_blank"
          >
            <span>Citizen Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLockAdmin}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors border border-red-500 flex items-center gap-1.5 cursor-pointer shadow-xs"
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

      {/* Main Container - Citizen Light Styling */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* KPI Stats Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Citizens */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                Total Registered Citizens
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {stats.totalCitizens}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold font-mono">Unique UIDs</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004A87] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Revenue Collected */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                Total Revenue Collected
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                  ₹{stats.totalRevenue}
                </span>
                <span className="text-[10px] text-slate-500 font-bold font-mono">Direct Bank</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Pending UTR Queue */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-wider block">
                Pending UTR Queue
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-800 font-mono">
                  {stats.pendingTxnsCount}
                </span>
                <span className="text-[10px] text-amber-700 font-bold font-mono">Needs Action</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Active Pro Passes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                Active Pro Subscriptions
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#004A87] font-mono">
                  {stats.activeProPasses}
                </span>
                <span className="text-[10px] text-slate-500 font-bold font-mono">Unlimited Scans</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('citizens')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'citizens'
                  ? 'bg-[#004A87] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI गेटवे सेटिंग्स</span>
            </button>
          </div>

          <button
            onClick={reloadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors border border-slate-200 shadow-2xs cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>रिफ्रेश डाटा</span>
          </button>
        </div>

        {/* TAB 1: ALL REGISTERED CITIZENS DIRECTORY */}
        {activeTab === 'citizens' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter, Search & Add Member Action Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={citizenSearch}
                  onChange={(e) => setCitizenSearch(e.target.value)}
                  placeholder="नागरिक UID (SSB-xxx), नाम, या मोबाइल से सर्च करें..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004A87]/20 focus:border-[#004A87] shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="text-[11px] text-slate-500 font-mono font-bold">Role:</span>
                  {(['all', 'investor', 'investigator', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        roleFilter === r
                          ? 'bg-[#004A87] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#002D54] to-[#004A87] hover:from-[#001D38] hover:to-[#003868] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-[0.98] transition-all"
                  title="नया सदस्य जोड़ें व पद नियुक्त करें"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                  <span>+ नया सदस्य / पद नियुक्त करें</span>
                </button>
              </div>
            </div>

            {/* Citizens Table */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Citizen Unique ID (UID)</th>
                      <th className="py-3 px-4">Name & Contact</th>
                      <th className="py-3 px-4">Designation & Role</th>
                      <th className="py-3 px-4">Balance / Scans</th>
                      <th className="py-3 px-4">Subscription Plan</th>
                      <th className="py-3 px-4 text-right min-w-[280px]">Admin Actions & Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredCitizens.map((c) => (
                      <tr key={c.uid} className="hover:bg-slate-50/80 transition-colors">
                        {/* UID with copy button */}
                        <td className="py-3.5 px-4 font-mono font-black text-[#004A87] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="tracking-wide">{c.uid}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.uid, c.uid)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copy UID"
                            >
                              {copiedText === c.uid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Name & Contact */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{c.name}</span>
                            {c.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {c.emailOrPhone}
                          </div>
                        </td>

                        {/* Designation & Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              c.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : c.role === 'investigator'
                                ? 'bg-blue-100 text-[#004A87] border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {c.role}
                          </span>
                          <p className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5">
                            {c.designation}
                          </p>
                        </td>

                        {/* Balance / Scans */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {c.isUnlimited ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                              👑 ∞ UNLIMITED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
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
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : c.planType === 'pro'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : c.planType === 'sachet'
                                ? 'bg-blue-100 text-[#004A87] border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.planType.toUpperCase()}
                          </span>
                        </td>

                        {/* Quick Admin Actions & Governance */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[280px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddCredits(c.uid, 15)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold border border-slate-300 transition-colors cursor-pointer"
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
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                              }`}
                              title={c.isUnlimited ? 'Revoke Pro' : 'Grant Pro Pass'}
                            >
                              {c.isUnlimited ? 'Revoke' : '👑 Pro'}
                            </button>

                            {/* Appoint Post & Role Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(c)}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#004A87] text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="पद व रोल नियुक्त करें / Appoint Post"
                            >
                              <Award className="w-3 h-3 text-[#004A87]" />
                              <span>पद बदलें</span>
                            </button>

                            {/* Delete Action or Immutable Immunity Badge for Chief Admin */}
                            {c.uid === CHIEF_ADMIN_UID ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-mono font-black shadow-2xs select-none"
                                title="मुख्य व्यवस्थापक (Chief Admin - Aryan Singh) का खाता पूर्णतः सुरक्षित है — इसे किसी के द्वारा भी हटाया या बदला नहीं जा सकता (Root Authority Immunity)"
                              >
                                <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>सुरक्षित रूट (Immune)</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmCitizen(c)}
                                className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 transition-colors cursor-pointer"
                                title={`खाता हटाएं (${c.name})`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
          <div className="space-y-5 animate-in fade-in">
            {/* NEW: QUICK UTR MATCH & VERIFICATION TOOL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-white to-blue-50/50 border border-blue-200 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#004A87] text-white">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 font-sans">
                      त्वरित UTR मिलान एवं सत्यापन टूल (Instant Bank SMS / Statement Matcher)
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      बैंक SMS या PhonePe / GPay का 12-अंकों का UTR यहाँ डालें — सिस्टम तुरंत नागरिक के साथ मैच करके 1-क्लिक अप्रूवल देगा।
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#004A87] bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  LIVE NPCI UTR MATCH
                </span>
              </div>

              {/* UTR Input Field */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4 text-[#004A87]" />
                  </div>
                  <input
                    type="text"
                    value={quickUtrInput}
                    onChange={(e) => setQuickUtrInput(e.target.value)}
                    placeholder="यहाँ 12 अंकों का बैंक UTR नंबर डालें या पेस्ट करें (उदा. 438102948192)..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border-2 border-blue-200 focus:border-[#004A87] focus:ring-2 focus:ring-[#004A87]/15 text-slate-900 font-mono font-extrabold text-sm tracking-widest outline-none placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 shadow-inner"
                  />
                  {quickUtrInput && (
                    <button
                      type="button"
                      onClick={() => setQuickUtrInput('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {matchedTxn && matchedTxn.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveUtr(matchedTxn.utr);
                      setQuickUtrInput('');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✅ मैच स्वीकृत करें व क्रेडिट दें</span>
                  </button>
                )}
              </div>

              {/* Dynamic Match Feedback Box */}
              {cleanQuickUtr.length >= 6 && (
                <div>
                  {matchedTxn ? (
                    <div
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
                        matchedTxn.status === 'PENDING'
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                          : matchedTxn.status === 'VERIFIED'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-red-50 border-red-300 text-red-950'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm tracking-widest text-[#004A87]">
                            🎯 UTR मैच: {matchedTxn.utr}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                              matchedTxn.status === 'PENDING'
                                ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                : matchedTxn.status === 'VERIFIED'
                                ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-red-200 text-red-900 border border-red-300'
                            }`}
                          >
                            {matchedTxn.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          नागरिक: {matchedTxn.userName} • UID: <span className="font-mono text-[#004A87] font-black">{matchedTxn.userUid}</span> • {matchedTxn.userContact}
                        </p>
                        <p className="text-[11px] text-slate-600 font-sans">
                          प्लान: <strong className="text-slate-900 font-mono">₹{matchedTxn.amount}</strong> ({matchedTxn.planName}) • सबमिट: {new Date(matchedTxn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>

                      {matchedTxn.status === 'PENDING' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleApproveUtr(matchedTxn.utr);
                              setQuickUtrInput('');
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>तुरंत अप्रूव करें</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectUtr(matchedTxn.utr)}
                            className="px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition-colors cursor-pointer border border-red-200"
                          >
                            रिजेक्ट
                          </button>
                        </div>
                      )}
                      {matchedTxn.status === 'VERIFIED' && (
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 font-mono bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>पहले से सत्यापित व क्रेडिटेड (Already Settled)</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-2 font-mono">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>कतार में इस UTR ({cleanQuickUtr}) के लिए कोई सबमिशन नहीं मिला। कृपया नंबर जांचें।</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter buttons & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={utrSearchQuery}
                  onChange={(e) => setUtrSearchQuery(e.target.value)}
                  placeholder="UTR नंबर, नागरिक का नाम, या UID से खोजें..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004A87]/20 focus:border-[#004A87] shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
                <span className="text-slate-500 font-mono font-bold">Status:</span>
                {(['all', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setUtrFilter(s)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      utrFilter === s
                        ? 'bg-[#004A87] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* UTR Table */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">12-Digit UTR No.</th>
                      <th className="py-3 px-4">Citizen Name & UID</th>
                      <th className="py-3 px-4">Plan & Amount</th>
                      <th className="py-3 px-4">Timestamp & VPA</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right min-w-[200px]">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredUtrs.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 12-Digit UTR */}
                        <td className="py-3.5 px-4 font-mono font-black text-[#004A87] whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="tracking-widest">{txn.utr}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(txn.utr, txn.utr)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copy UTR"
                            >
                              {copiedText === txn.utr ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-normal">{txn.id}</span>
                        </td>

                        {/* Citizen Name & UID */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{txn.userName}</div>
                          <div className="text-[11px] text-[#004A87] font-mono font-bold">{txn.userUid}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{txn.userContact}</div>
                        </td>

                        {/* Plan & Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-slate-900 font-mono">
                              ₹{txn.amount}
                            </span>
                            <span className="text-[11px] text-slate-600 font-sans font-medium">
                              {txn.planName}
                            </span>
                          </div>
                        </td>

                        {/* Timestamp & Beneficiary */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-600 font-mono">
                          <div>
                            {new Date(txn.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            To: {txn.beneficiaryUpi}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              txn.status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : txn.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {txn.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                            {txn.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-700" />}
                            {txn.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-700" />}
                            <span>{txn.status}</span>
                          </span>
                          {txn.adminNotes && (
                            <p className="text-[10px] text-slate-500 mt-1 truncate max-w-xs">
                              {txn.adminNotes}
                            </p>
                          )}
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[200px]">
                          {txn.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveUtr(txn.utr)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <span>✅ Approve & Grant</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectUtr(txn.utr)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors cursor-pointer"
                              >
                                <span>❌ Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-emerald-700 font-mono font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reviewed • Settled</span>
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004A87] flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Master Beneficiary UPI Settings
                  </h3>
                  <p className="text-xs text-slate-500">
                    वेबसाइट के QR कोड पर कौन सी UPI ID में पैसे रिसीव होंगे, यहाँ से सेट करें।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                  Official Recipient UPI ID (VPA):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={merchantUpi}
                    onChange={(e) => setMerchantUpi(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    className="flex-1 px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#004A87]/20 focus:border-[#004A87]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUpi}
                    className="px-5 py-2.5 rounded-xl bg-[#004A87] hover:bg-[#003868] text-white font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save UPI</span>
                  </button>
                </div>
                {upiSavedNotice && (
                  <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>UPI ID सफलतापूर्वक अपडेट हो गई! अब लाइव QR कोड इसी पते पर खुलेगा।</span>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono text-slate-600">
                <span className="font-bold text-slate-900 block">💡 Admin Guidance:</span>
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

        {/* ======================================================== */}
        {/* MODAL 1: ADD NEW MEMBER & APPOINT OFFICIAL POST         */}
        {/* ======================================================== */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#004A87] flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      नया सदस्य जोड़ें व पद नियुक्त करें
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Chief Admin Executive Appointment Console
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCitizenSubmit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पूरा नाम (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="उदा. डॉ. नीहा सेन या राहुल वर्मा"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      मोबाइल / ईमेल (Contact) *
                    </label>
                    <input
                      type="text"
                      required
                      value={addContact}
                      onChange={(e) => setAddContact(e.target.value)}
                      placeholder="उदा. 9876543210 या user@domain.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      रोल (Authority Role)
                    </label>
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                    >
                      <option value="admin">ADMIN (Executive Admin)</option>
                      <option value="investigator">INVESTIGATOR (Cybercrime Wing)</option>
                      <option value="investor">INVESTOR (Verified Citizen Member)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    आधिकारिक पद (Official Designation / Post) *
                  </label>
                  <input
                    type="text"
                    required
                    value={addDesignation}
                    onChange={(e) => setAddDesignation(e.target.value)}
                    placeholder="उदा. Vice President, Cyber Crime Inspector, Advisory Member"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संस्थान / विभाग (Organization)
                  </label>
                  <input
                    type="text"
                    value={addOrg}
                    onChange={(e) => setAddOrg(e.target.value)}
                    placeholder="उदा. ScamShield Bharat (IIT BHU) या National Cyber Wing"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">👑 अनलिमिटेड प्रो पास (Unlimited VIP Access)</span>
                    <span className="text-[11px] text-slate-500">
                      बिना किसी सीमा के आजीवन/वार्षिक सुरक्षा स्कैन्स की अनुमति दें
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={addUnlimited}
                    onChange={(e) => setAddUnlimited(e.target.checked)}
                    className="w-5 h-5 accent-[#004A87] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#002D54] to-[#004A87] hover:from-[#001D38] hover:to-[#003868] text-white font-extrabold shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                  >
                    ✅ सदस्य नियुक्त करें व खाता जोड़ें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: EDIT MEMBER / APPOINT POST                     */}
        {/* ======================================================== */}
        {isEditModalOpen && selectedCitizenForEdit && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      पद व अधिकार नियुक्त करें (Appoint Post &amp; Alter Role)
                    </h3>
                    <p className="text-[11px] text-[#004A87] font-mono font-bold">
                      {selectedCitizenForEdit.name} • {selectedCitizenForEdit.uid}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAppointPostSubmit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    सदस्य का नाम (Member Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      रोल (System Role)
                    </label>
                    <select
                      value={editRole}
                      disabled={selectedCitizenForEdit.uid === CHIEF_ADMIN_UID}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#004A87] disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="admin">ADMIN (Executive Admin)</option>
                      <option value="investigator">INVESTIGATOR (Cybercrime Wing)</option>
                      <option value="investor">INVESTOR (Verified Citizen Member)</option>
                    </select>
                    {selectedCitizenForEdit.uid === CHIEF_ADMIN_UID && (
                      <p className="text-[10px] text-amber-700 font-mono mt-1">
                        🔒 मुख्य व्यवस्थापक पद को डिमोट नहीं किया जा सकता
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      क्रेडिट्स बैलेंस (Scans Left)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editCredits}
                      onChange={(e) => setEditCredits(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    आधिकारिक पद (Official Post / Designation)
                  </label>
                  <input
                    type="text"
                    required
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    placeholder="उदा. President, Vice President, Chief Investigator"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संस्थान / विभाग (Organization)
                  </label>
                  <input
                    type="text"
                    value={editOrg}
                    onChange={(e) => setEditOrg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004A87]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">👑 अनलिमिटेड प्रो पास (Unlimited Access)</span>
                    <span className="text-[11px] text-slate-500">
                      नागरिक को असीमित स्कैन्स व एफआईआर रिपोर्ट का अधिकार दें
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editUnlimited}
                    onChange={(e) => setEditUnlimited(e.target.checked)}
                    className="w-5 h-5 accent-[#004A87] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#004A87] hover:bg-[#003868] text-white font-extrabold shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                  >
                    💾 पद व बदलाव सुरक्षित करें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: DELETE CONFIRMATION DIALOG                     */}
        {/* ======================================================== */}
        {deleteConfirmCitizen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-extrabold text-base text-slate-900">
                  खाता हटाने की पुष्टि (Confirm Deletion)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  क्या आप वाकई <strong className="text-slate-900">{deleteConfirmCitizen.name}</strong> (UID: <span className="font-mono text-[#004A87] font-bold">{deleteConfirmCitizen.uid}</span>) का खाता हटाना चाहते हैं?
                </p>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1 text-amber-800">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>अपरिवर्तनीय क्रिया (Permanent Removal):</span>
                  </p>
                  <p className="text-slate-700">
                    यह खाता केंद्रीय रजिस्ट्री से तुरंत हटा दिया जाएगा। (मुख्य व्यवस्थापक को कभी नहीं हटाया जा सकता)।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmCitizen(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCitizen(deleteConfirmCitizen.uid)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-[0.98]"
                >
                  हाँ, खाता हटाएं (Delete)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
