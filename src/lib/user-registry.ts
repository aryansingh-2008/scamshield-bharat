'use client';

export interface RegisteredCitizen {
  uid: string; // e.g. "SSB-2026-7842" or "SSB-ADMIN-0001"
  name: string;
  emailOrPhone: string;
  role: 'investor' | 'investigator' | 'guest' | 'admin';
  designation: string;
  organization: string;
  credits: number;
  isUnlimited: boolean;
  unlimitedExpiresAt?: number | null; // epoch timestamp
  premiumStartedAt?: string | null;
  planType: 'free' | 'sachet' | 'pro' | 'annual';
  registeredAt: string; // ISO date
  lastActiveAt: string;
  totalScans: number;
  isVerified: boolean;
}

export interface UtrTransaction {
  id: string; // e.g. "TXN_SSB_..."
  utr: string; // 12-digit UTR
  userUid: string; // Citizen UID
  userName: string;
  userContact: string;
  planId: 'sachet' | 'pro' | 'annual';
  planName: string;
  amount: number; // ₹9, ₹19, ₹149
  timestamp: string; // ISO string
  beneficiaryUpi: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const STORAGE_KEY_CITIZENS = 'scamshield_citizens_registry_v1';
const STORAGE_KEY_UTR_TXNS = 'scamshield_utr_transactions_v1';
const STORAGE_KEY_MERCHANT_UPI = 'scamshield_merchant_upi';

// Import & re-export generateCitizenId from pure auth-constants
import { generateCitizenId } from './auth-constants';
export { generateCitizenId };

// Initial pre-seeded citizen accounts
const INITIAL_CITIZENS: RegisteredCitizen[] = [
  {
    uid: 'SSB-PRESIDENT-0001',
    name: 'Arti (President)',
    emailOrPhone: 'president@scamshieldbharat.live',
    role: 'admin',
    designation: 'President & Executive Director',
    organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
    credits: 9999,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    planType: 'annual',
    registeredAt: '2026-11-01T09:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    totalScans: 280,
    isVerified: true,
  },
  {
    uid: 'SSB-ADMIN-0001',
    name: 'Aryan Singh (Chief Admin)',
    emailOrPhone: 'admin@scamshieldbharat.live',
    role: 'admin',
    designation: 'Chief Cyber Safety Officer & System Administrator',
    organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
    credits: 9999,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    planType: 'annual',
    registeredAt: '2026-11-01T10:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    totalScans: 142,
    isVerified: true,
  },
  {
    uid: 'SSB-2026-784210',
    name: 'Vikram Sharma',
    emailOrPhone: 'vikram.investor@gmail.com',
    role: 'investor',
    designation: 'Verified Retail Investor (NSE/BSE)',
    organization: 'Self-Directed Investor',
    credits: 20,
    isUnlimited: false,
    unlimitedExpiresAt: null,
    planType: 'sachet',
    registeredAt: '2026-11-05T14:30:00.000Z',
    lastActiveAt: '2026-11-13T12:15:00.000Z',
    totalScans: 18,
    isVerified: true,
  },
  {
    uid: 'SSB-2026-391842',
    name: 'Inspector Anita Verma',
    emailOrPhone: 'anita.verma@cybercrime.gov.in',
    role: 'investigator',
    designation: 'Cybercrime Investigation Wing (MHA/1930)',
    organization: 'National Cyber Crime Reporting Portal',
    credits: 999,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
    planType: 'pro',
    registeredAt: '2026-11-04T09:00:00.000Z',
    lastActiveAt: '2026-11-13T16:45:00.000Z',
    totalScans: 95,
    isVerified: true,
  },
  {
    uid: 'SSB-2026-102948',
    name: 'Rohan Gupta',
    emailOrPhone: 'rohan.gupta99@gmail.com',
    role: 'investor',
    designation: 'Verified Citizen Member',
    organization: 'ScamShield Bharat',
    credits: 5,
    isUnlimited: false,
    unlimitedExpiresAt: null,
    planType: 'free',
    registeredAt: '2026-11-10T11:20:00.000Z',
    lastActiveAt: '2026-11-12T18:10:00.000Z',
    totalScans: 4,
    isVerified: true,
  },
  {
    uid: 'SSB-2026-645129',
    name: 'Priya Mehra',
    emailOrPhone: '9876543210',
    role: 'investor',
    designation: 'Verified Retail Investor',
    organization: 'Retail Investor Protection Guild',
    credits: 50,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000,
    planType: 'pro',
    registeredAt: '2026-11-08T15:00:00.000Z',
    lastActiveAt: '2026-11-13T17:30:00.000Z',
    totalScans: 27,
    isVerified: true,
  },
];

// Initial pre-seeded UTR payment transactions
const INITIAL_UTR_TRANSACTIONS: UtrTransaction[] = [
  {
    id: 'TXN_SSB_89410291',
    utr: '439281029384',
    userUid: 'SSB-2026-784210',
    userName: 'Vikram Sharma',
    userContact: 'vikram.investor@gmail.com',
    planId: 'sachet',
    planName: 'Mini Sachet Pack (15 Scans)',
    amount: 9,
    timestamp: '2026-11-13T11:42:00.000Z',
    beneficiaryUpi: 'scamshieldbharat@upi',
    status: 'VERIFIED',
    adminNotes: 'Auto-verified with NPCI bank ledger',
    reviewedAt: '2026-11-13T11:43:00.000Z',
    reviewedBy: 'Aryan Singh (Chief Admin)',
  },
  {
    id: 'TXN_SSB_91823901',
    utr: '438102948192',
    userUid: 'SSB-2026-645129',
    userName: 'Priya Mehra',
    userContact: '9876543210',
    planId: 'pro',
    planName: 'Monthly Pro Pass (30 Days Unlimited)',
    amount: 19,
    timestamp: '2026-11-13T14:10:00.000Z',
    beneficiaryUpi: 'scamshieldbharat@upi',
    status: 'VERIFIED',
    adminNotes: 'Approved via GPay UTR ledger',
    reviewedAt: '2026-11-13T14:15:00.000Z',
    reviewedBy: 'Aryan Singh (Chief Admin)',
  },
  {
    id: 'TXN_SSB_95018234',
    utr: '431092837481',
    userUid: 'SSB-2026-102948',
    userName: 'Rohan Gupta',
    userContact: 'rohan.gupta99@gmail.com',
    planId: 'sachet',
    planName: 'Mini Sachet Pack (15 Scans)',
    amount: 9,
    timestamp: '2026-11-13T18:25:00.000Z',
    beneficiaryUpi: 'scamshieldbharat@upi',
    status: 'PENDING',
    adminNotes: 'Awaiting admin settlement check',
  },
];

// ========================================================
// CORE REGISTRY API FUNCTIONS
// ========================================================

export function getAllCitizens(): RegisteredCitizen[] {
  if (typeof window === 'undefined') return INITIAL_CITIZENS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CITIZENS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CITIZENS, JSON.stringify(INITIAL_CITIZENS));
      return INITIAL_CITIZENS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_CITIZENS;

    // Ensure Chief Admin account is permanently present, immutable, and forever Unlimited
    let modified = false;

    // Filter out locally recorded deleted citizens
    const rawDeleted = localStorage.getItem('scamshield_deleted_citizens_v1');
    const deletedSet: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    let cleanedList = parsed.filter((c: RegisteredCitizen) => !deletedSet.includes(c.uid));
    if (cleanedList.length !== parsed.length) {
      modified = true;
    }

    const chiefIdx = cleanedList.findIndex((c: RegisteredCitizen) => c.uid === 'SSB-ADMIN-0001');
    const permanentChief = INITIAL_CITIZENS.find((c) => c.uid === 'SSB-ADMIN-0001')!;

    if (chiefIdx === -1) {
      cleanedList.unshift({ ...permanentChief, isUnlimited: true, planType: 'annual', credits: 9999 });
      modified = true;
    } else {
      // Hard enforce permanence and unlimited access on Chief Admin
      if (!cleanedList[chiefIdx].isUnlimited || cleanedList[chiefIdx].role !== 'admin') {
        cleanedList[chiefIdx].role = 'admin';
        cleanedList[chiefIdx].isUnlimited = true;
        cleanedList[chiefIdx].planType = 'annual';
        cleanedList[chiefIdx].credits = 9999;
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(STORAGE_KEY_CITIZENS, JSON.stringify(cleanedList));
    }
    return cleanedList;
  } catch (e) {
    console.warn('Failed to load citizens registry', e);
    return INITIAL_CITIZENS;
  }
}

export function saveCitizens(citizens: RegisteredCitizen[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CITIZENS, JSON.stringify(citizens));
  } catch (e) {
    console.warn('Failed to save citizens registry', e);
  }
}

// Sync current logged-in user into the master citizens directory
export function syncCurrentUserToRegistry(user: {
  uid?: string;
  name: string;
  emailOrPhone: string;
  role: 'investor' | 'investigator' | 'guest' | 'admin';
  designation?: string;
  organization?: string;
  credits?: number;
  isUnlimited?: boolean;
  unlimitedExpiresAt?: number | null;
  planType?: 'free' | 'sachet' | 'pro' | 'annual';
}, allowCreate: boolean = false): RegisteredCitizen | null {
  const citizens = getAllCitizens();
  const targetUid = user.uid || generateCitizenId();

  const existingIdx = citizens.findIndex(
    (c) => c.uid === targetUid || c.emailOrPhone === user.emailOrPhone || c.name === user.name
  );

  if (existingIdx < 0 && !allowCreate) {
    // Prohibit silent creation during unverified operations or failed logins
    return null;
  }

  const existing = existingIdx >= 0 ? citizens[existingIdx] : null;
  const now = Date.now();

  const isUnlimitedActive = user.isUnlimited !== undefined
    ? user.isUnlimited
    : (existing ? existing.isUnlimited && (!existing.unlimitedExpiresAt || existing.unlimitedExpiresAt > now) : false);

  const expiry = user.unlimitedExpiresAt !== undefined
    ? user.unlimitedExpiresAt
    : (existing ? existing.unlimitedExpiresAt : (isUnlimitedActive ? now + 30 * 24 * 60 * 60 * 1000 : null));

  const plan = user.planType || (existing ? existing.planType : (isUnlimitedActive ? 'pro' : 'free'));

  const updatedCitizen: RegisteredCitizen = {
    uid: existing ? existing.uid : targetUid,
    name: user.name,
    emailOrPhone: user.emailOrPhone || 'citizen@scamshield.live',
    role: user.role,
    designation: user.designation || (existing ? existing.designation : 'Verified Citizen Member'),
    organization: user.organization || (existing ? existing.organization : 'ScamShield Bharat'),
    credits: typeof user.credits === 'number' ? user.credits : (existing ? existing.credits : 5),
    isUnlimited: isUnlimitedActive,
    unlimitedExpiresAt: expiry,
    planType: plan,
    registeredAt: existing ? existing.registeredAt : new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    totalScans: existing ? existing.totalScans : 0,
    isVerified: true,
  };

  if (existingIdx >= 0) {
    citizens[existingIdx] = updatedCitizen;
  } else {
    citizens.unshift(updatedCitizen);
  }

  saveCitizens(citizens);
  return updatedCitizen;
}

// ========================================================
// UTR & SUBSCRIPTION TRANSACTIONS API
// ========================================================

export function getAllUtrTransactions(): UtrTransaction[] {
  if (typeof window === 'undefined') return INITIAL_UTR_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UTR_TXNS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_UTR_TXNS, JSON.stringify(INITIAL_UTR_TRANSACTIONS));
      return INITIAL_UTR_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_UTR_TRANSACTIONS;
  } catch (e) {
    console.warn('Failed to load UTR transactions', e);
    return INITIAL_UTR_TRANSACTIONS;
  }
}

export function saveUtrTransactions(txns: UtrTransaction[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_UTR_TXNS, JSON.stringify(txns));
  } catch (e) {
    console.warn('Failed to save UTR transactions', e);
  }
}

// Record a new UTR submission from payment modal
export function recordNewUtrSubmission(params: {
  utr: string;
  userUid: string;
  userName: string;
  userContact: string;
  planId: 'sachet' | 'pro' | 'annual';
  amount: number;
  beneficiaryUpi: string;
}): UtrTransaction {
  const txns = getAllUtrTransactions();
  const planNames: Record<string, string> = {
    sachet: 'Mini Sachet Pack (15 Scans)',
    pro: 'Monthly Pro Pass (30 Days Unlimited)',
    annual: 'Annual Shield Pass (365 Days Unlimited)',
  };

  const newTxn: UtrTransaction = {
    id: `TXN_SSB_${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`,
    utr: params.utr,
    userUid: params.userUid,
    userName: params.userName,
    userContact: params.userContact,
    planId: params.planId,
    planName: planNames[params.planId] || params.planId,
    amount: params.amount,
    timestamp: new Date().toISOString(),
    beneficiaryUpi: params.beneficiaryUpi,
    status: 'PENDING', // STRICTLY PENDING: Must be verified by Admin against Bank SMS / UTR ledger
    adminNotes: 'Awaiting Bank SMS / Admin UTR verification',
  };

  txns.unshift(newTxn);
  saveUtrTransactions(txns);
  return newTxn;
}

// Admin approves a UTR: Updates status and automatically credits the user
export function adminApproveUtr(utr: string, adminNotes?: string, reviewerName?: string): boolean {
  const txns = getAllUtrTransactions();
  const txn = txns.find((t) => t.utr === utr);
  if (!txn) return false;

  txn.status = 'VERIFIED';
  txn.adminNotes = adminNotes || 'Approved by Master Admin';
  txn.reviewedAt = new Date().toISOString();
  txn.reviewedBy = reviewerName || 'Authorized Admin';
  saveUtrTransactions(txns);

  // Auto-credit the citizen account in registry
  const citizens = getAllCitizens();
  const citizen = citizens.find((c) => c.uid === txn.userUid || c.name === txn.userName);
  if (citizen) {
    if (txn.planId === 'sachet') {
      citizen.credits += 15;
      citizen.planType = 'sachet';
    } else if (txn.planId === 'pro') {
      citizen.isUnlimited = true;
      citizen.planType = 'pro';
      citizen.unlimitedExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    } else if (txn.planId === 'annual') {
      citizen.isUnlimited = true;
      citizen.planType = 'annual';
      citizen.unlimitedExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    }
    citizen.lastActiveAt = new Date().toISOString();
    saveCitizens(citizens);

    // Sync active session if citizen is open in current browser
    if (typeof window !== 'undefined') {
      try {
        const rawUser = localStorage.getItem('scamshield_user_session');
        if (rawUser) {
          const activeUser = JSON.parse(rawUser);
          if (activeUser.uid === citizen.uid || activeUser.emailOrPhone === citizen.emailOrPhone) {
            if (citizen.isUnlimited) {
              localStorage.setItem(
                'scamshield_unlimited_expiry',
                (citizen.unlimitedExpiresAt || (Date.now() + 30 * 86400000)).toString()
              );
            }
            localStorage.setItem('scamshield_user_credits', citizen.credits.toString());
            window.dispatchEvent(new Event('scamshield_subscription_updated'));
          }
        }
      } catch {}
    }
  }

  return true;
}

// Admin rejects a UTR
export function adminRejectUtr(utr: string, reason: string): boolean {
  const txns = getAllUtrTransactions();
  const txn = txns.find((t) => t.utr === utr);
  if (!txn) return false;

  txn.status = 'REJECTED';
  txn.adminNotes = reason || 'Rejected: UTR verification failed with bank ledger';
  txn.reviewedAt = new Date().toISOString();
  txn.reviewedBy = 'Aryan Singh (Chief Admin)';
  saveUtrTransactions(txns);
  return true;
}

// Admin manual user credit adjustment
export function adminAdjustCredits(uid: string, creditsToAdd: number): boolean {
  const citizens = getAllCitizens();
  const citizen = citizens.find((c) => c.uid === uid);
  if (!citizen) return false;

  citizen.credits = Math.max(0, citizen.credits + creditsToAdd);
  citizen.lastActiveAt = new Date().toISOString();
  saveCitizens(citizens);
  return true;
}

// Admin manual Premium allotment with explicit duration and automatic extension
export function adminAllotPremium(
  uid: string,
  days: number
): { success: boolean; citizen?: RegisteredCitizen; actionType?: 'GRANTED' | 'EXTENDED'; error?: string } {
  if (typeof days !== 'number' || !Number.isInteger(days) || days <= 0 || days > 3650) {
    return { success: false, error: 'Days must be an integer between 1 and 3650.' };
  }

  const citizens = getAllCitizens();
  const citizen = citizens.find((c) => c.uid === uid);
  if (!citizen) return { success: false, error: 'Citizen not found.' };

  const now = Date.now();
  const currentExpiry = citizen.unlimitedExpiresAt;
  const isCurrentlyActive = citizen.isUnlimited && typeof currentExpiry === 'number' && currentExpiry > now;

  let newExpiry: number;
  let actionType: 'GRANTED' | 'EXTENDED';

  if (isCurrentlyActive && currentExpiry) {
    actionType = 'EXTENDED';
    newExpiry = currentExpiry + days * 24 * 60 * 60 * 1000;
  } else {
    actionType = 'GRANTED';
    newExpiry = now + days * 24 * 60 * 60 * 1000;
    citizen.premiumStartedAt = new Date(now).toISOString();
  }

  citizen.isUnlimited = true;
  citizen.unlimitedExpiresAt = newExpiry;
  citizen.planType = days >= 365 ? 'annual' : 'pro';
  citizen.lastActiveAt = new Date().toISOString();

  saveCitizens(citizens);

  // Sync active user session if current browser matches
  if (typeof window !== 'undefined') {
    try {
      const rawUser = localStorage.getItem('scamshield_user_session');
      if (rawUser) {
        const activeUser = JSON.parse(rawUser);
        if (activeUser.uid === citizen.uid || activeUser.emailOrPhone === citizen.emailOrPhone) {
          localStorage.setItem('scamshield_unlimited_expiry', newExpiry.toString());
          window.dispatchEvent(new Event('scamshield_subscription_updated'));
        }
      }
    } catch {}
  }

  return { success: true, citizen, actionType };
}

// Admin manual subscription activation
export function adminSetSubscription(
  uid: string,
  plan: 'free' | 'sachet' | 'pro' | 'annual'
): boolean {
  if (uid === CHIEF_ADMIN_UID) {
    // Chief Admin is permanent and can never be downgraded
    return true;
  }
  const citizens = getAllCitizens();
  const citizen = citizens.find((c) => c.uid === uid);
  if (!citizen) return false;

  citizen.planType = plan;
  if (plan === 'free') {
    citizen.isUnlimited = false;
    citizen.unlimitedExpiresAt = null;
  } else if (plan === 'sachet') {
    citizen.credits += 15;
    citizen.isUnlimited = false;
  } else if (plan === 'pro') {
    citizen.isUnlimited = true;
    citizen.unlimitedExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  } else if (plan === 'annual') {
    citizen.isUnlimited = true;
    citizen.unlimitedExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
  }
  citizen.lastActiveAt = new Date().toISOString();
  saveCitizens(citizens);
  return true;
}

// Chief Administrator UID - Root Authority with Permanent Immunity
export const CHIEF_ADMIN_UID = 'SSB-ADMIN-0001';

// Admin deletes a citizen or official account (Chief Admin & President CANNOT be deleted by anyone)
export function adminDeleteCitizen(
  targetUid: string
): { success: boolean; message: string } {
  if (targetUid === CHIEF_ADMIN_UID || targetUid === 'SSB-ADMIN-0001') {
    return {
      success: false,
      message: 'सुरक्षा नियम: मुख्य व्यवस्थापक (Chief Admin - Aryan Singh) को किसी के द्वारा भी डिलीट नहीं किया जा सकता। यह रूट खाता अपरिवर्तनीय व स्थायी रूप से सुरक्षित है।',
    };
  }

  if (targetUid === 'SSB-PRESIDENT-0001') {
    return {
      success: false,
      message: 'सुरक्षा नियम: राष्ट्रपति (President - Arti) के खाते को डिलीट नहीं किया जा सकता। यह पद सुरक्षित है।',
    };
  }

  const citizens = getAllCitizens();
  const idx = citizens.findIndex((c) => c.uid === targetUid);
  if (idx === -1) {
    return { success: false, message: 'नागरिक खाता नहीं मिला (Account not found).' };
  }

  const deletedUser = citizens[idx];
  if (deletedUser.role === 'admin') {
    return {
      success: false,
      message: 'सुरक्षा नियम: व्यवस्थापक (Admin) खाते को डिलीट नहीं किया जा सकता।',
    };
  }

  citizens.splice(idx, 1);
  saveCitizens(citizens);

  // Record deleted UID in client deleted set to avoid re-seeding from INITIAL_CITIZENS
  if (typeof window !== 'undefined') {
    try {
      const rawDeleted = localStorage.getItem('scamshield_deleted_citizens_v1');
      const deletedSet: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!deletedSet.includes(targetUid)) {
        deletedSet.push(targetUid);
        localStorage.setItem('scamshield_deleted_citizens_v1', JSON.stringify(deletedSet));
      }
      // If deleted citizen is current active session on this device, log them out
      const rawUser = localStorage.getItem('scamshield_user_session');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.uid === targetUid) {
          localStorage.removeItem('scamshield_user_session');
          localStorage.removeItem('scamshield_user_unlimited');
        }
      }
    } catch {}
  }

  return {
    success: true,
    message: `खाता '${deletedUser.name}' (${targetUid}) सफलतापूर्वक हटा दिया गया।`,
  };
}

// Admin appoints a post / designation or alters role for any member
export function adminAppointPost(
  targetUid: string,
  updates: {
    name?: string;
    role: 'admin' | 'investigator' | 'investor';
    designation: string;
    organization?: string;
    credits?: number;
    isUnlimited?: boolean;
  }
): { success: boolean; message: string; updatedCitizen?: RegisteredCitizen } {
  const citizens = getAllCitizens();
  const citizen = citizens.find((c) => c.uid === targetUid);
  if (!citizen) {
    return { success: false, message: 'नागरिक खाता नहीं मिला (Account not found).' };
  }

  // Chief Admin is permanent and immutable
  if (targetUid === CHIEF_ADMIN_UID) {
    return {
      success: false,
      message: 'मुख्य व्यवस्थापक (Chief Admin) स्थायी है — इसका पद अपरिवर्तनीय व सुरक्षित है।',
    };
  }

  if (updates.name && updates.name.trim()) {
    citizen.name = updates.name.trim();
  }
  citizen.role = updates.role;
  citizen.designation = updates.designation.trim() || citizen.designation;
  if (updates.organization) citizen.organization = updates.organization.trim();
  if (updates.credits !== undefined) citizen.credits = updates.credits;
  if (updates.isUnlimited !== undefined) {
    citizen.isUnlimited = updates.isUnlimited;
    if (updates.isUnlimited) {
      citizen.unlimitedExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
      citizen.planType = 'annual';
    }
  }
  citizen.lastActiveAt = new Date().toISOString();
  saveCitizens(citizens);

  return {
    success: true,
    message: `${citizen.name} को सफलतापूर्वक '${updates.designation}' (${updates.role.toUpperCase()}) नियुक्त कर दिया गया।`,
    updatedCitizen: citizen,
  };
}

// Admin creates and appoints a new official member or citizen
export function adminCreateCitizen(data: {
  name: string;
  emailOrPhone: string;
  role: 'admin' | 'investigator' | 'investor';
  designation: string;
  organization?: string;
  isUnlimited?: boolean;
  credits?: number;
}): RegisteredCitizen {
  const citizens = getAllCitizens();
  const newUid = generateCitizenId();
  const newCitizen: RegisteredCitizen = {
    uid: newUid,
    name: data.name.trim(),
    emailOrPhone: data.emailOrPhone.trim(),
    role: data.role,
    designation: data.designation.trim() || 'Verified Official Member',
    organization: data.organization?.trim() || 'ScamShield Bharat (IIT BHU)',
    credits: data.credits ?? (data.isUnlimited || data.role === 'admin' ? 9999 : 25),
    isUnlimited: data.isUnlimited ?? (data.role === 'admin'),
    unlimitedExpiresAt:
      data.isUnlimited || data.role === 'admin'
        ? Date.now() + 365 * 24 * 60 * 60 * 1000
        : null,
    planType: data.isUnlimited || data.role === 'admin' ? 'annual' : 'sachet',
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    totalScans: 0,
    isVerified: true,
  };

  citizens.unshift(newCitizen);
  saveCitizens(citizens);
  return newCitizen;
}

// Helper to look up a registered citizen by email, phone, or UID
export function findCitizenForLogin(identifier: string): RegisteredCitizen | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const citizens = getAllCitizens();
  return (
    citizens.find(
      (c) =>
        c.uid.toLowerCase() === clean ||
        c.emailOrPhone.toLowerCase() === clean ||
        c.name.toLowerCase() === clean ||
        ((clean === 'admin' || clean === 'aryan') && c.uid === 'SSB-ADMIN-0001') ||
        ((clean === 'arti' || clean === 'president') && c.uid === 'SSB-PRESIDENT-0001')
    ) || null
  );
}

// Get aggregate platform stats for Admin
export function getPlatformAdminStats() {
  const citizens = getAllCitizens();
  const txns = getAllUtrTransactions();

  const totalCitizens = citizens.length;
  const verifiedTxns = txns.filter((t) => t.status === 'VERIFIED');
  const pendingTxns = txns.filter((t) => t.status === 'PENDING');
  const totalRevenue = verifiedTxns.reduce((acc, t) => acc + (t.amount || 0), 0);
  const activeProPasses = citizens.filter((c) => c.isUnlimited).length;
  const totalScansPerformed = citizens.reduce((acc, c) => acc + (c.totalScans || 0), 0);

  return {
    totalCitizens,
    totalRevenue,
    activeProPasses,
    pendingTxnsCount: pendingTxns.length,
    verifiedTxnsCount: verifiedTxns.length,
    totalScansPerformed,
  };
}
