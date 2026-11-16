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
import { useAuth, MASTER_ADMIN_USER } from '@/lib/auth-context';
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
  adminAllotPremium,
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
  const [merchantUpi, setMerchantUpi] = useState('scamshieldbharat@upi');
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

  // Premium Duration Allotment Modal State
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumTargetCitizen, setPremiumTargetCitizen] = useState<RegisteredCitizen | null>(null);
  const [selectedDurationOption, setSelectedDurationOption] = useState<number | 'custom'>(30);
  const [customDaysInput, setCustomDaysInput] = useState<string>('45');
  const [customDaysError, setCustomDaysError] = useState<string | null>(null);
  const [isAllottingPremium, setIsAllottingPremium] = useState<boolean>(false);

  // Change Admin Passkey State
  const [currentPasskeyInput, setCurrentPasskeyInput] = useState('');
  const [newPasskeyInput, setNewPasskeyInput] = useState('');
  const [confirmPasskeyInput, setConfirmPasskeyInput] = useState('');
  const [showCurrentPasskey, setShowCurrentPasskey] = useState(false);
  const [showNewPasskey, setShowNewPasskey] = useState(false);
  const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);
  const [passkeyChangeLoading, setPasskeyChangeLoading] = useState(false);
  const [passkeyChangeError, setPasskeyChangeError] = useState<string | null>(null);
  const [passkeyChangeSuccess, setPasskeyChangeSuccess] = useState<string | null>(null);

  // Form State for Add Member
  const [addName, setAddName] = useState('');
  const [addContact, setAddContact] = useState('');
  const [addDesignation, setAddDesignation] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'investigator' | 'investor'>('investor');
  const [addOrg, setAddOrg] = useState('ScamShield Bharat (IIT BHU)');
  const [addUnlimited, setAddUnlimited] = useState(false);
  const [addCredits, setAddCredits] = useState(25);
  const [addPassword, setAddPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Form State for Edit Post
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'investigator' | 'investor'>('investor');
  const [editOrg, setEditOrg] = useState('');
  const [editCredits, setEditCredits] = useState(5);
  const [editUnlimited, setEditUnlimited] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Credentials Slip Modal State (When Appointing a Member or Changing Password)
  const [credentialsSlip, setCredentialsSlip] = useState<{
    name: string;
    uid: string;
    contact: string;
    role: string;
    designation: string;
    password: string;
  } | null>(null);
  const [slipCopied, setSlipCopied] = useState(false);

  const reloadData = async () => {
    const localC = getAllCitizens();
    const allT = getAllUtrTransactions();
    setCitizens(localC);
    setUtrTxns(allT);
    setStats(getPlatformAdminStats());

    if (typeof window !== 'undefined') {
      const savedUpi = localStorage.getItem('scamshield_merchant_upi');
      if (savedUpi) setMerchantUpi(savedUpi);
    }

    // Authoritatively fetch newly registered citizens from server backend
    try {
      const res = await fetch('/api/admin/citizens', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.citizens)) {
          const localMap = new Map<string, RegisteredCitizen>();
          for (const c of localC) {
            localMap.set(c.uid, c);
          }
          const serverList: RegisteredCitizen[] = data.citizens.map((sc: any) => {
            const existing = localMap.get(sc.uid);
            return {
              ...existing,
              ...sc,
              role: sc.role || existing?.role || 'investor',
              planType: sc.planType || existing?.planType || (sc.isUnlimited ? 'pro' : 'free'),
            };
          });
          setCitizens(serverList);
          saveCitizens(serverList);
          setStats(getPlatformAdminStats());
        }
      }
    } catch {
      // Local fallback preserved if offline
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthedSession = sessionStorage.getItem('scamshield_admin_authenticated') === 'true';
      if (isAuthedSession) {
        // Cryptographically verify active privileged admin session with dedicated server endpoint
        fetch('/api/admin/verify', { credentials: 'include' })
          .then((res) => res.json())
          .then((data) => {
            if (data?.authorized) {
              setIsAuthenticated(true);
              reloadData();
            } else {
              setIsAuthenticated(false);
              sessionStorage.removeItem('scamshield_admin_authenticated');
            }
          })
          .catch(() => {
            setIsAuthenticated(false);
          })
          .finally(() => {
            setCheckingAuth(false);
          });
      } else {
        setIsAuthenticated(false);
        setCheckingAuth(false);
      }
    }
  }, [user]);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError(null);
    setIsVerifying(true);

    const clean = passkeyInput.trim();
    if (!clean) {
      setPasskeyError('Please enter the Master Admin Security Passkey.');
      setIsVerifying(false);
      return;
    }

    const res = await loginAsAdmin(clean);
    if (!res.success) {
      setPasskeyError(res.error || 'Access Denied: Invalid Security Passkey. Unauthorized entry attempt recorded.');
      setIsVerifying(false);
      return;
    }

    setIsAuthenticated(true);
    setIsVerifying(false);
    reloadData();
  };

  const handleLockAdmin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('scamshield_admin_authenticated');
    }
    setIsAuthenticated(false);
    setPasskeyInput('');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
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

  const handleOpenPremiumModal = (c: RegisteredCitizen) => {
    setPremiumTargetCitizen(c);
    setSelectedDurationOption(30);
    setCustomDaysInput('45');
    setCustomDaysError(null);
    setIsPremiumModalOpen(true);
  };

  const handleConfirmAllotPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premiumTargetCitizen) return;

    let effectiveDays = 30;
    if (selectedDurationOption === 'custom') {
      const parsed = parseInt(customDaysInput, 10);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3650) {
        setCustomDaysError('कृपया 1 से 3650 दिनों के बीच की मान्य संख्या दर्ज करें।');
        return;
      }
      effectiveDays = parsed;
    } else {
      effectiveDays = selectedDurationOption;
    }

    setIsAllottingPremium(true);
    try {
      const serverRes = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'ALLOT_PREMIUM',
          payload: {
            uid: premiumTargetCitizen.uid,
            days: effectiveDays,
          },
        }),
      });

      const data = await serverRes.json().catch(() => ({}));
      if (!serverRes.ok) {
        showNotification(`⚠️ प्रीमियम आवंटन अस्वीकृत: ${data.error || 'Server error'}`);
        setIsAllottingPremium(false);
        return;
      }

      adminAllotPremium(premiumTargetCitizen.uid, effectiveDays);
      setIsPremiumModalOpen(false);
      const targetName = premiumTargetCitizen.name;
      setPremiumTargetCitizen(null);
      await reloadData();
      showNotification(`✅ '${targetName}' को +${effectiveDays} दिन का प्रीमियम ऐक्सेस सफलतापूर्वक आवंटित किया गया!`);
    } catch {
      showNotification('⚠️ सर्वर संचार त्रुटि (Network Error)।');
    } finally {
      setIsAllottingPremium(false);
    }
  };

  const handleOpenEditModal = (c: RegisteredCitizen) => {
    if (c.uid === CHIEF_ADMIN_UID) {
      showNotification('सुरक्षा नियम: मुख्य व्यवस्थापक (Chief Admin) स्थायी है — इसका पद अपरिवर्तनीय व सुरक्षित है।');
      return;
    }
    setSelectedCitizenForEdit(c);
    setEditName(c.name);
    setEditDesignation(c.designation);
    setEditRole(c.role === 'admin' || c.role === 'investigator' ? c.role : 'investor');
    setEditOrg(c.organization);
    setEditCredits(c.credits);
    setEditUnlimited(c.isUnlimited);
    setEditPassword('');
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  const handleCreateCitizenSubmit = async (e: React.FormEvent) => {
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
    try {
      const serverRes = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'APPOINT_POST',
          payload: {
            uid: created.uid,
            name: addName.trim(),
            identifier: addContact.trim(),
            emailOrPhone: addContact.trim(),
            contact: addContact.trim(),
            role: addRole,
            designation: created.designation,
            organization: addOrg,
            credits: addCredits,
            isUnlimited: addUnlimited,
            password: addPassword.trim() || undefined,
          },
        }),
      });
      const data = await serverRes.json().catch(() => ({}));
      if (!serverRes.ok) {
        showNotification(`⚠️ सर्वर नियुक्ति सिंक चेतावनी: ${data.error || 'Server rejected'}`);
      }
    } catch {
      showNotification('⚠️ सर्वर संचार त्रुटि (Network Error)।');
    }

    setIsAddModalOpen(false);
    const assignedPass = addPassword.trim();
    setAddName('');
    setAddContact('');
    setAddDesignation('');
    setAddPassword('');
    await reloadData();

    if (assignedPass) {
      setCredentialsSlip({
        name: created.name,
        uid: created.uid,
        contact: created.emailOrPhone,
        role: created.role,
        designation: created.designation,
        password: assignedPass,
      });
    }
    showNotification(`✅ सदस्य '${created.name}' (${created.uid}) को सफलतापूर्वक नियुक्त किया गया!`);
  };

  const handleAppointPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizenForEdit) return;

    try {
      const serverRes = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'APPOINT_POST',
          payload: {
            uid: selectedCitizenForEdit.uid,
            name: editName.trim(),
            identifier: selectedCitizenForEdit.emailOrPhone,
            role: editRole,
            designation: editDesignation.trim(),
            organization: editOrg.trim(),
            credits: editCredits,
            isUnlimited: editUnlimited,
            password: editPassword.trim() || undefined,
          },
        }),
      });
      const data = await serverRes.json().catch(() => ({}));
      if (!serverRes.ok) {
        showNotification(`⚠️ पद परिवर्तन अस्वीकृत: ${data.error || 'Unauthorized'}`);
        return;
      }

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
      const savedUid = selectedCitizenForEdit.uid;
      const savedContact = selectedCitizenForEdit.emailOrPhone;
      const assignedPass = editPassword.trim();
      setSelectedCitizenForEdit(null);
      reloadData();

      if (assignedPass) {
        setCredentialsSlip({
          name: editName,
          uid: savedUid,
          contact: savedContact,
          role: editRole,
          designation: editDesignation,
          password: assignedPass,
        });
      }
      showNotification(`✅ ${res.message}`);
    } catch {
      showNotification('⚠️ सर्वर संचार त्रुटि (Network Error)।');
    }
  };

  const handleDeleteCitizen = async (uid: string) => {
    try {
      const serverRes = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid },
        }),
      });
      const data = await serverRes.json().catch(() => ({}));
      if (!serverRes.ok || !data.success) {
        showNotification(`⚠️ खाता हटाना अस्वीकृत: ${data.error || 'Unauthorized'}`);
        setDeleteConfirmCitizen(null);
        return;
      }

      const res = adminDeleteCitizen(uid);
      setDeleteConfirmCitizen(null);
      await reloadData();
      showNotification(`✅ ${data.message || res.message}`);
    } catch {
      showNotification('⚠️ सर्वर संचार त्रुटि (Network Error)।');
      setDeleteConfirmCitizen(null);
    }
  };

  // Admin Actions on UTRs
  const handleApproveUtr = async (utr: string) => {
    const reviewer = user?.name || 'Master Admin';
    const txns = getAllUtrTransactions();
    const txn = txns.find((t) => t.utr === utr);

    try {
      const serverRes = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'APPROVE_UTR',
          payload: {
            utr,
            userUid: txn?.userUid,
            planId: txn?.planId,
            notes: `Approved by ${reviewer}`,
          },
        }),
      });
      const data = await serverRes.json().catch(() => ({}));
      if (!serverRes.ok) {
        showNotification(`⚠️ UTR सत्यापन अस्वीकृत: ${data.error || 'Server error'}`);
        return;
      }
      adminApproveUtr(utr, `Approved by ${reviewer}`, reviewer);
      await reloadData();
      showNotification(`✅ UTR ${utr} सत्यापित! नागरिक को प्रीमियम/क्रेडिट्स आवंटित किए गए।`);
    } catch {
      showNotification('⚠️ सर्वर संचार त्रुटि (Network Error)।');
    }
  };

  const handleRejectUtr = (utr: string) => {
    const reason = prompt('Enter rejection reason:') || 'Invalid UTR format or payment not received';
    adminRejectUtr(utr, reason);
    reloadData();
    showNotification(`UTR ${utr} marked as REJECTED.`);
  };

  const handleSaveUpi = async () => {
    const clean = merchantUpi.trim();
    if (!clean || !clean.includes('@') || clean.length <= 5) {
      showNotification('⚠️ कृपया वैध UPI VPA (उदा. scamshieldbharat@upi) दर्ज करें।');
      return;
    }

    try {
      const serverRes = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'UPDATE_BENEFICIARY_UPI',
          payload: { upi: clean },
        }),
      });
      const data = await serverRes.json().catch(() => ({}));
      if (!serverRes.ok) {
        showNotification(`⚠️ UPI परिवर्तन अस्वीकृत: ${data.error || 'Unauthorized'}`);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('scamshield_merchant_upi', clean);
        window.dispatchEvent(new CustomEvent('scamshield_merchant_upi_updated', { detail: clean }));
      }
      setUpiSavedNotice(true);
      setTimeout(() => setUpiSavedNotice(false), 2500);
      showNotification(`✅ Official Beneficiary UPI updated to '${clean}'! Live QR codes and payments are now routing to this account.`);
    } catch {
      showNotification('⚠️ सर्वर संचार त्रुटि (Network Error)।');
    }
  };

  const handleChangePasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyChangeError(null);
    setPasskeyChangeSuccess(null);

    const cur = currentPasskeyInput.trim();
    const next = newPasskeyInput.trim();
    const conf = confirmPasskeyInput.trim();

    if (!cur) {
      setPasskeyChangeError('कृपया वर्तमान सुरक्षा पासकी (Current Passkey) दर्ज करें।');
      return;
    }
    if (!next) {
      setPasskeyChangeError('कृपया नई सुरक्षा पासकी दर्ज करें।');
      return;
    }
    if (next.length < 12) {
      setPasskeyChangeError('सुरक्षा नियम: नई पासकी कम से कम 12 अक्षरों की होनी चाहिए।');
      return;
    }
    if (/^\d{4,8}$/.test(next)) {
      setPasskeyChangeError('सुरक्षा नियम: केवल 4-8 अंकों का साधारण PIN पासकी के रूप में अमान्य है।');
      return;
    }
    if (next !== conf) {
      setPasskeyChangeError('नई पासकी और कन्फर्म पासकी मेल नहीं खा रहे हैं।');
      return;
    }
    if (cur === next) {
      setPasskeyChangeError('नई पासकी पुरानी पासकी से भिन्न होनी चाहिए।');
      return;
    }

    setPasskeyChangeLoading(true);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'CHANGE_ADMIN_PASSKEY',
          currentPasskey: cur,
          newPasskey: next,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setPasskeyChangeError(data.error || 'पासकी बदलने में विफल। कृपया वर्तमान पासकी जांचें।');
        setPasskeyChangeLoading(false);
        return;
      }

      setPasskeyChangeSuccess('✅ मुख्य व्यवस्थापक सुरक्षा पासकी सफलतापूर्वक बदल दी गई है! नए लॉगिन के लिए नई पासकी का उपयोग करें।');
      setCurrentPasskeyInput('');
      setNewPasskeyInput('');
      setConfirmPasskeyInput('');
      showNotification('✅ Master Admin Security Passkey Successfully Updated!');
    } catch {
      setPasskeyChangeError('सर्वर से संचार में त्रुटि (Network Error)।');
    } finally {
      setPasskeyChangeLoading(false);
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
                Master Security Passkey
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPasskey ? 'text' : 'password'}
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter 32+ character Master Security Passkey..."
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

          {/* Change Passkey Quick Shortcut Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Change Security Passkey"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">पासकी बदलें</span>
          </button>

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
              <Lock className="w-4 h-4" />
              <span>सुरक्षा व UPI सेटिंग्स</span>
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
                          {c.unlimitedExpiresAt ? (
                            <div className="text-[10px] mt-0.5 font-mono">
                              {c.unlimitedExpiresAt > Date.now() ? (
                                <span className="text-emerald-700 font-bold">
                                  वैध: {new Date(c.unlimitedExpiresAt).toLocaleDateString('en-GB')} ({Math.ceil((c.unlimitedExpiresAt - Date.now()) / (1000 * 60 * 60 * 24))}d left)
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold">
                                  समाप्त: {new Date(c.unlimitedExpiresAt).toLocaleDateString('en-GB')} (Expired)
                                </span>
                              )}
                            </div>
                          ) : null}
                        </td>

                        {/* Quick Admin Actions & Governance */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[280px]">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Chief Admin: Permanent Root Authority (Cannot be modified, revoked, or deleted) */}
                            {c.uid === CHIEF_ADMIN_UID ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 text-amber-950 border border-amber-300 text-[11px] font-mono font-black shadow-xs select-none"
                                title="मुख्य व्यवस्थापक (Chief Admin - Aryan Singh) स्थायी है — इसे किसी भी तरीके से हटाया या बदला नहीं जा सकता"
                              >
                                <Crown className="w-3.5 h-3.5 text-amber-700" />
                                <span>स्थायी मुख्य व्यवस्थापक (Permanent Root)</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAddCredits(c.uid, 15)}
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold border border-slate-300 transition-colors cursor-pointer"
                                  title="Add 15 Credits"
                                >
                                  +15 Scans
                                </button>

                                {/* Allot / Extend Premium Duration */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPremiumModal(c)}
                                  className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="प्रीमियम अवधि आवंटित करें (Allot Premium Duration)"
                                >
                                  <Crown className="w-3 h-3 text-amber-700" />
                                  <span>{c.isUnlimited && c.unlimitedExpiresAt && c.unlimitedExpiresAt > Date.now() ? '+अवधि बढ़ाएं' : '👑 +प्रो पास'}</span>
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

                                {/* Delete Action for non-root accounts */}
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmCitizen(c)}
                                  className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 transition-colors cursor-pointer"
                                  title={`खाता हटाएं (${c.name})`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Master Beneficiary UPI Settings
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                      👑 Chief Admin Exclusive
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    वेबसाइट के QR कोड पर कौन सी UPI ID में पैसे रिसीव होंगे, केवल मुख्य व्यवस्थापक यहाँ से सेट कर सकते हैं।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                  Official Recipient UPI ID (VPA):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={merchantUpi}
                    onChange={(e) => setMerchantUpi(e.target.value)}
                    placeholder="e.g. scamshieldbharat@upi or yourname@okhdfcbank"
                    className="flex-1 px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#004A87]/20 focus:border-[#004A87]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveUpi}
                      className="px-5 py-2.5 rounded-xl bg-[#004A87] hover:bg-[#003868] text-white font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMerchantUpi('scamshieldbharat@upi');
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('scamshield_merchant_upi', 'scamshieldbharat@upi');
                          window.dispatchEvent(new CustomEvent('scamshield_merchant_upi_updated', { detail: 'scamshieldbharat@upi' }));
                        }
                        showNotification('✅ UPI ID को आधिकारिक डिफ़ॉल्ट (scamshieldbharat@upi) पर रीसेट कर दिया गया!');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      title="Reset to official default"
                    >
                      <span>डिफ़ॉल्ट रीसेट</span>
                    </button>
                  </div>
                </div>
                {upiSavedNotice && (
                  <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>UPI ID सफलतापूर्वक अपडेट हो गई! अब लाइव QR कोड इसी पते पर खुलेगा।</span>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono text-slate-600">
                <span className="font-bold text-slate-900 block">💡 मुख्य व्यवस्थापक सुरक्षा नियम:</span>
                <p>
                  - नागरिक चेकआउट स्क्रीन पर UPI आईडी हमेशा <strong>नॉन-एडिटेबल (Non-Editable)</strong> रहती है।
                </p>
                <p>
                  - केवल यहाँ चीफ एडमिन द्वारा सेट की गई UPI ID ही पूरे प्लेटफ़ॉर्म पर डायनामिक QR कोड और बैंक लेजर में रूट होगी।
                </p>
              </div>
            </div>

            {/* CARD 2: MASTER ADMIN SECURITY PASSKEY SETTINGS */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Master Admin Security Passkey (सुरक्षा पासकी बदलें)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                      👑 Chief Admin Exclusive
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    मुख्य व्यवस्थापक (Chief Admin) अपना लॉगिन पासवर्ड / सुरक्षा पासकी यहाँ से बदल सकते हैं।
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePasskey} className="space-y-4">
                {/* Current Passkey */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                    Current Security Passkey (वर्तमान पासकी):
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPasskey ? 'text' : 'password'}
                      value={currentPasskeyInput}
                      onChange={(e) => setCurrentPasskeyInput(e.target.value)}
                      placeholder="Enter current Master Admin passkey..."
                      className="w-full px-3 py-2.5 pr-10 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#004A87]/20 focus:border-[#004A87]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPasskey(!showCurrentPasskey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Passkey */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 font-mono">
                      New Security Passkey (नया पासकी):
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Min 12 characters (alphanumeric + symbol)</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPasskey ? 'text' : 'password'}
                      value={newPasskeyInput}
                      onChange={(e) => setNewPasskeyInput(e.target.value)}
                      placeholder="Enter new strong passkey (min 12 chars)..."
                      className="w-full px-3 py-2.5 pr-10 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#004A87]/20 focus:border-[#004A87]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPasskey(!showNewPasskey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPasskeyInput.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-slate-500">Strength:</span>
                      {newPasskeyInput.length < 12 ? (
                        <span className="text-red-600 font-bold">Too Short (&lt; 12 chars)</span>
                      ) : newPasskeyInput.length < 32 ? (
                        <span className="text-amber-600 font-bold">Good ({newPasskeyInput.length} chars)</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Strong (32+ chars, High Entropy)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm New Passkey */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                    Confirm New Passkey (नए पासकी की पुष्टि करें):
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPasskey ? 'text' : 'password'}
                      value={confirmPasskeyInput}
                      onChange={(e) => setConfirmPasskeyInput(e.target.value)}
                      placeholder="Re-enter new passkey..."
                      className="w-full px-3 py-2.5 pr-10 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#004A87]/20 focus:border-[#004A87]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPasskey(!showConfirmPasskey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Status Notices */}
                {passkeyChangeError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passkeyChangeError}</span>
                  </div>
                )}
                {passkeyChangeSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{passkeyChangeSuccess}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={passkeyChangeLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#004A87] hover:bg-[#003868] text-white font-extrabold text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {passkeyChangeLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Security Passkey...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Passkey (पासकी सुरक्षित करें)</span>
                    </>
                  )}
                </button>
              </form>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1 font-mono text-amber-900">
                <span className="font-bold block">🛡️ सुरक्षा नियम (Security Rules):</span>
                <p>• केवल मुख्य व्यवस्थापक (Chief Admin) के पास पासकी बदलने का अधिकार है।</p>
                <p>• केवल 4-8 अंकों का साधारण PIN मान्य नहीं होगा; कम से कम 12 वर्ण अनिवार्य हैं।</p>
                <p>• पासकी अपडेट होते ही नए लॉगिन के लिए नई पासकी का उपयोग करना होगा।</p>
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

                {/* Password / Passkey Field for New Appointee */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#004A87]" />
                      <span>सदस्य लॉगिन पासवर्ड / सुरक्षा पासकी (Login Password / Passkey)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                        let code = '';
                        for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
                        const rand = `SSB#${code}${Math.floor(100 + Math.random() * 900)}`;
                        setAddPassword(rand);
                      }}
                      className="text-[11px] font-extrabold text-[#004A87] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs"
                    >
                      <span>🎲 ऑटो-पासवर्ड बनाएं</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder="कम से कम 6 अक्षरों का पासवर्ड (उदा. Member@Pass2026)"
                      className="w-full px-3 py-2.5 rounded-xl border border-blue-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#004A87] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      title={showAddPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-tight">
                    🔑 नियुक्त होने के बाद यह सदस्य अपने मोबाइल/ईमेल और इस पासवर्ड से <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold text-blue-950">/login</code> पर लॉगिन कर सकेगा।
                  </p>
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

                {/* Password / Passkey Field for Appointed Member */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span>सदस्य लॉगिन पासवर्ड / सुरक्षा पासकी (Login Password / Passkey)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                        let code = '';
                        for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
                        const rand = `SSB#${code}${Math.floor(100 + Math.random() * 900)}`;
                        setEditPassword(rand);
                      }}
                      className="text-[11px] font-extrabold text-[#004A87] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs"
                    >
                      <span>🎲 ऑटो-पासवर्ड बनाएं</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="कम से कम 8 अक्षरों का सुरक्षित पासवर्ड सेट करें (उदा. Pass#K9m8!2026)"
                      className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#004A87] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      title={showEditPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-tight">
                    🔑 यह सदस्य अपने UID (<span className="font-mono font-bold">{selectedCitizenForEdit.uid}</span>) या मोबाइल/ईमेल और इस पासवर्ड से <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">/login</code> पर लॉगिन कर सकेगा।
                  </p>
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
        {/* MODAL: APPOINTMENT CREDENTIALS SLIP (COPY & SEND)       */}
        {/* ======================================================== */}
        {credentialsSlip && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 relative animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      नियुक्ति पत्र व लॉगिन क्रेडेंशियल्स
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-mono font-bold">
                      Official Appointment Slip Generated
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCredentialsSlip(null);
                    setSlipCopied(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">सदस्य का नाम (Member Name)</span>
                  <span className="font-bold text-slate-900 font-sans text-sm">{credentialsSlip.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">पद (Designation)</span>
                    <span className="font-bold text-[#004A87] font-sans">{credentialsSlip.designation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">सिस्टम रोल (Role)</span>
                    <span className="font-bold text-amber-800 uppercase">{credentialsSlip.role}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">लॉगिन पोर्टल (Portal)</span>
                  <span className="font-bold text-blue-700 break-all select-all font-sans">https://scamshieldbharat.live/login</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">लॉगिन आईडी (Login ID / UID)</span>
                  <span className="font-bold text-slate-900 break-all select-all">{credentialsSlip.uid} ({credentialsSlip.contact})</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300">
                  <span className="text-[10px] text-amber-800 uppercase tracking-wider block font-bold">लॉगिन पासवर्ड (Login Password)</span>
                  <span className="font-bold text-base text-amber-950 font-mono tracking-wider select-all">{credentialsSlip.password}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `🛡️ ScamShield Bharat — Official Appointment & Login Credentials\n\n👤 सदस्य का नाम: ${credentialsSlip.name}\n🎖️ आधिकारिक पद: ${credentialsSlip.designation} (${credentialsSlip.role.toUpperCase()})\n🌐 लॉगिन पोर्टल: https://scamshieldbharat.live/login\n🆔 लॉगिन आईडी: ${credentialsSlip.uid} (या ${credentialsSlip.contact})\n🔑 लॉगिन पासवर्ड: ${credentialsSlip.password}\n\n⚠️ कृपया लॉगिन करके अपना पासवर्ड सुरक्षित रखें।`;
                    navigator.clipboard.writeText(text);
                    setSlipCopied(true);
                    showNotification('📋 क्रेडेंशियल्स सफलतापूर्वक क्लिपबोर्ड पर कॉपी हो गए!');
                    setTimeout(() => setSlipCopied(false), 3000);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#002D54] to-[#004A87] hover:from-[#001D38] hover:to-[#003868] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {slipCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{slipCopied ? 'क्रेडेंशियल्स कॉपी हो गए!' : '📋 क्रेडेंशियल्स कॉपी करें (WhatsApp / Email पर भेजें)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCredentialsSlip(null);
                    setSlipCopied(false);
                  }}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                >
                  पूर्ण हुआ (Close)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 4: PREMIUM ACCESS DURATION ALLOTMENT DIALOG        */}
        {/* ======================================================== */}
        {isPremiumModalOpen && premiumTargetCitizen && (() => {
          const now = Date.now();
          const isCurrentlyActive = Boolean(
            premiumTargetCitizen.isUnlimited &&
            premiumTargetCitizen.unlimitedExpiresAt &&
            premiumTargetCitizen.unlimitedExpiresAt > now
          );
          const baseTime = (isCurrentlyActive && premiumTargetCitizen.unlimitedExpiresAt) ? premiumTargetCitizen.unlimitedExpiresAt : now;
          const effectiveDays = selectedDurationOption === 'custom' ? (parseInt(customDaysInput, 10) || 0) : selectedDurationOption;
          const calculatedExpiryDate = new Date(baseTime + effectiveDays * 24 * 60 * 60 * 1000);
          const formattedCalculatedExpiry = calculatedExpiryDate.toLocaleDateString('hi-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        प्रीमियम ऐक्सेस व अवधि आवंटन
                      </h3>
                      <p className="text-[11px] text-[#004A87] font-mono font-bold">
                        {premiumTargetCitizen.name} • {premiumTargetCitizen.uid}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPremiumModalOpen(false);
                      setPremiumTargetCitizen(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Citizen's Current Status Banner */}
                <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                  isCurrentlyActive
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : premiumTargetCitizen.unlimitedExpiresAt
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {isCurrentlyActive ? '🟢 सक्रिय प्रो पास (Active Premium)' : premiumTargetCitizen.unlimitedExpiresAt ? '⏳ समाप्त प्रो पास (Expired Premium)' : '⚪ सामान्य खाता (Free Account)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white border shadow-2xs font-extrabold">
                      {isCurrentlyActive ? 'विस्तार मोड (Extending)' : 'नया आवंटन (Granting)'}
                    </span>
                  </div>
                  {premiumTargetCitizen.unlimitedExpiresAt && (
                    <p className="text-[11px] font-mono">
                      {isCurrentlyActive
                        ? `वर्तमान समाप्ति तिथि: ${new Date(premiumTargetCitizen.unlimitedExpiresAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${Math.ceil((premiumTargetCitizen.unlimitedExpiresAt - now) / (1000 * 60 * 60 * 24))} दिन शेष)`
                        : `पिछली समाप्ति तिथि: ${new Date(premiumTargetCitizen.unlimitedExpiresAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  )}
                </div>

                <form onSubmit={handleConfirmAllotPremium} className="space-y-4 text-xs font-sans">
                  {/* Duration Options */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      अवधि चुनें (Select Premium Duration)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { days: 7, label: '7 दिन', sub: '1 सप्ताह' },
                        { days: 30, label: '30 दिन', sub: '1 माह' },
                        { days: 90, label: '90 दिन', sub: '3 माह' },
                        { days: 180, label: '180 दिन', sub: '6 माह' },
                        { days: 365, label: '365 दिन', sub: '1 वर्ष' },
                      ].map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => {
                            setSelectedDurationOption(opt.days);
                            setCustomDaysError(null);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            selectedDurationOption === opt.days
                              ? 'bg-[#004A87] text-white border-[#004A87] shadow-sm font-bold ring-2 ring-[#004A87]/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="font-extrabold text-sm">{opt.label}</div>
                          <div className={`text-[10px] ${selectedDurationOption === opt.days ? 'text-blue-100' : 'text-slate-500'}`}>
                            {opt.sub}
                          </div>
                        </button>
                      ))}

                      {/* Custom Duration Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDurationOption('custom');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedDurationOption === 'custom'
                            ? 'bg-[#004A87] text-white border-[#004A87] shadow-sm font-bold ring-2 ring-[#004A87]/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="font-extrabold text-sm">कस्टम दिन</div>
                        <div className={`text-[10px] ${selectedDurationOption === 'custom' ? 'text-blue-100' : 'text-slate-500'}`}>
                          अपनी पसंद के दिन
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Custom Days Input if Selected */}
                  {selectedDurationOption === 'custom' && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700">
                        दिनों की संख्या दर्ज करें (Enter Days, 1 to 3650)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={3650}
                          value={customDaysInput}
                          onChange={(e) => {
                            setCustomDaysInput(e.target.value);
                            setCustomDaysError(null);
                          }}
                          placeholder="उदा. 45 या 60"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#004A87] bg-white"
                        />
                      </div>
                      {customDaysError && (
                        <p className="text-[11px] text-red-600 font-bold">{customDaysError}</p>
                      )}
                    </div>
                  )}

                  {/* Live Expiry Calculation Preview Card */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>नई समाप्ति तिथि (New Expiry Date):</span>
                      </span>
                      <span className="text-xs font-mono font-black text-[#004A87] bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                        +{effectiveDays} दिन
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-900 pl-5">
                      {effectiveDays > 0 ? formattedCalculatedExpiry : 'कृपया वैध दिन दर्ज करें'}
                    </div>

                    <p className="text-[11px] text-amber-900 leading-tight border-t border-amber-200/60 pt-2">
                      {isCurrentlyActive
                        ? `ℹ️ विस्तार नियम: सक्रिय पास होने के कारण, ये +${effectiveDays} दिन वर्तमान समाप्ति तिथि के बाद जोड़े जाएंगे।`
                        : `ℹ️ नया आवंटन नियम: ये +${effectiveDays} दिन वर्तमान समय से जोड़े जाएंगे।`}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isAllottingPremium}
                      onClick={() => {
                        setIsPremiumModalOpen(false);
                        setPremiumTargetCitizen(null);
                      }}
                      className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="submit"
                      disabled={isAllottingPremium || effectiveDays <= 0}
                      className="px-5 py-2.5 rounded-xl bg-[#004A87] hover:bg-[#003868] text-white font-extrabold shadow-sm cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isAllottingPremium ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>आवंटित किया जा रहा है...</span>
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 text-amber-300" />
                          <span>💾 {isCurrentlyActive ? 'प्रीमियम अवधि बढ़ाएं' : 'प्रीमियम ऐक्सेस आवंटित करें'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

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
