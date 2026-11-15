'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateCitizenId, syncCurrentUserToRegistry, getAllCitizens } from './user-registry';

import {
  UserProfile,
  PRESIDENT_USER,
  MASTER_ADMIN_USER,
  DEMO_USERS,
} from './auth-constants';

export type { UserProfile };
export {
  PRESIDENT_USER,
  MASTER_ADMIN_USER,
  DEMO_USERS,
};

interface AuthContextType {
  user: UserProfile | null;
  isSkipped: boolean;
  isAdmin: boolean;
  credits: number;
  isUnlimited: boolean;
  consumeCredit: () => boolean;
  addCredits: (amount: number) => void;
  syncCreditsFromServer: (amount: number, isUnlimited?: boolean) => void;
  activateUnlimited: (days: number) => void;
  login: (profile: UserProfile) => void;
  updateUser: (updated: Partial<UserProfile>) => void;
  loginAsDemo: (type: 'investor' | 'investigator') => void;
  loginAsAdmin: (passkey: string) => Promise<{ success: boolean; error?: string }>;
  skipLogin: () => void;
  logout: () => void;
  resetAuth: () => void;
  refreshSubscription: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'scamshield_user_session';
const STORAGE_KEY_SKIPPED = 'scamshield_login_skipped';
const STORAGE_KEY_CREDITS = 'scamshield_user_credits';
const STORAGE_KEY_UNLIMITED = 'scamshield_unlimited_expiry';
const STORAGE_KEY_DEVICE_TRIAL = 'scamshield_device_trial_ledger_v1';
export const MAX_DEVICE_FREE_SCANS = 5;

export interface DeviceTrialLedger {
  deviceId: string;
  freeScansUsed: number;
  firstSeen: string;
}

export function getDeviceTrialLedger(): DeviceTrialLedger {
  if (typeof window === 'undefined') {
    return { deviceId: 'server', freeScansUsed: 0, firstSeen: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICE_TRIAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.freeScansUsed === 'number') {
        return parsed;
      }
    }
  } catch {}

  const newLedger: DeviceTrialLedger = {
    deviceId: `DEV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    freeScansUsed: 0,
    firstSeen: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY_DEVICE_TRIAL, JSON.stringify(newLedger));
  } catch {}
  return newLedger;
}

export function recordDeviceFreeScanUsed(): number {
  const ledger = getDeviceTrialLedger();
  const next = Math.min(MAX_DEVICE_FREE_SCANS, ledger.freeScansUsed + 1);
  ledger.freeScansUsed = next;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_DEVICE_TRIAL, JSON.stringify(ledger));
    } catch {}
  }
  return next;
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [credits, setCredits] = useState<number>(MAX_DEVICE_FREE_SCANS);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      // Sync with server session if available
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated && data?.user) {
            const serverUser: UserProfile = data.user;
            setUser(serverUser);
            if (typeof serverUser.credits === 'number') {
              setCredits(serverUser.credits);
            }
            if (serverUser.isUnlimited !== undefined) {
              setIsUnlimited(Boolean(serverUser.isUnlimited));
              if (serverUser.isUnlimited) {
                localStorage.setItem(STORAGE_KEY_UNLIMITED, 'true');
              } else {
                localStorage.removeItem(STORAGE_KEY_UNLIMITED);
              }
            }
            try {
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(serverUser));
              if (typeof serverUser.credits === 'number') {
                localStorage.setItem(STORAGE_KEY_CREDITS, serverUser.credits.toString());
              }
            } catch {}
            syncCurrentUserToRegistry(serverUser);
          }
        })
        .catch(() => {});

      const deviceLedger = getDeviceTrialLedger();
      const remainingDeviceFreeScans = Math.max(0, MAX_DEVICE_FREE_SCANS - deviceLedger.freeScansUsed);

      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        const parsed: UserProfile = JSON.parse(savedUser);
        // Security guardrail: Never trust privileged 'admin' role from client localStorage without server verification
        if (parsed.role === 'admin') {
          parsed.role = 'guest';
        }
        // Ensure every user has a unique Citizen Safety ID (UID)
        if (!parsed.uid) {
          parsed.uid = generateCitizenId();
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        }
        setUser(parsed);
        syncCurrentUserToRegistry(parsed);

        // Check central registry for Admin confirmation of Pro status
        const allCitizens = getAllCitizens();
        const myRecord = allCitizens.find((c) => c.uid === parsed.uid);

        if (myRecord && myRecord.isUnlimited) {
          setIsUnlimited(true);
        } else {
          setIsUnlimited(false);
          localStorage.removeItem(STORAGE_KEY_UNLIMITED);
        }

        // Load credits
        const savedCredits = localStorage.getItem(STORAGE_KEY_CREDITS);
        if (myRecord && typeof myRecord.credits === 'number') {
          setCredits(myRecord.credits);
        } else if (savedCredits !== null) {
          const parsedCredits = parseInt(savedCredits, 10);
          setCredits(isNaN(parsedCredits) ? remainingDeviceFreeScans : parsedCredits);
        } else {
          setCredits(remainingDeviceFreeScans);
        }
      } else {
        // Unauthenticated Guest / Skipped: STRICTLY NO UNLIMITED ACCESS
        setIsUnlimited(false);
        localStorage.removeItem(STORAGE_KEY_UNLIMITED);
        setCredits(remainingDeviceFreeScans);
        localStorage.setItem(STORAGE_KEY_CREDITS, remainingDeviceFreeScans.toString());
      }

      const savedSkip = localStorage.getItem(STORAGE_KEY_SKIPPED);
      if (savedSkip === 'true') {
        setIsSkipped(true);
      }
    } catch (e) {
      console.warn('Failed to read auth/credits from localStorage', e);
    }

    const handleSubscriptionUpdate = () => {
      refreshSubscription();
    };

    window.addEventListener('scamshield_subscription_updated', handleSubscriptionUpdate);
    window.addEventListener('storage', handleSubscriptionUpdate);
    window.addEventListener('focus', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('scamshield_subscription_updated', handleSubscriptionUpdate);
      window.removeEventListener('storage', handleSubscriptionUpdate);
      window.removeEventListener('focus', handleSubscriptionUpdate);
    };
  }, []);

  const refreshSubscription = async () => {
    try {
      // 1. Authoritative check from server session endpoint
      const res = await fetch('/api/auth/session').catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.authenticated && data?.user) {
          const sUser: UserProfile = data.user;
          setUser(sUser);
          if (typeof sUser.credits === 'number') {
            setCredits(sUser.credits);
            localStorage.setItem(STORAGE_KEY_CREDITS, sUser.credits.toString());
          }
          if (sUser.isUnlimited !== undefined) {
            setIsUnlimited(Boolean(sUser.isUnlimited));
            if (sUser.isUnlimited) {
              localStorage.setItem(STORAGE_KEY_UNLIMITED, 'true');
            } else {
              localStorage.removeItem(STORAGE_KEY_UNLIMITED);
            }
          }
          try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sUser));
          } catch {}
          syncCurrentUserToRegistry(sUser);
          return;
        }
      }

      // 2. Fallback to local registry
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (!savedUser) {
        setIsUnlimited(false);
        return;
      }
      const parsed: UserProfile = JSON.parse(savedUser);
      const allCitizens = getAllCitizens();
      const myRecord = allCitizens.find((c) => c.uid === parsed.uid);
      const now = Date.now();
      const isUnlimitedActive = Boolean(
        parsed.role === 'admin' ||
        parsed.isUnlimited ||
        (myRecord && myRecord.isUnlimited && (!myRecord.unlimitedExpiresAt || myRecord.unlimitedExpiresAt > now))
      );
      setIsUnlimited(isUnlimitedActive);
      if (isUnlimitedActive) {
        localStorage.setItem(STORAGE_KEY_UNLIMITED, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_UNLIMITED);
      }
      if (myRecord && typeof myRecord.credits === 'number') {
        setCredits(myRecord.credits);
      }
    } catch {}
  };

  const consumeCredit = (): boolean => {
    // Only authenticated admins or authenticated citizens with verified Pro pass get unlimited scans
    if (user && (user.role === 'admin' || isUnlimited)) return true;

    if (credits <= 0) return false;

    // Track free trial scans at device ledger level so switching accounts or logout cannot bypass quota
    if (!user || credits <= MAX_DEVICE_FREE_SCANS) {
      recordDeviceFreeScanUsed();
    }

    const next = Math.max(0, credits - 1);
    setCredits(next);
    try {
      localStorage.setItem(STORAGE_KEY_CREDITS, next.toString());
    } catch (e) {
      console.warn('Failed to update credits', e);
    }
    if (user) {
      syncCurrentUserToRegistry({ ...user, credits: next });
    }
    return true;
  };

  const syncCreditsFromServer = (amount: number, serverIsUnlimited?: boolean) => {
    if (typeof amount !== 'number' || isNaN(amount)) return;
    const cleanAmount = Math.max(0, amount);
    setCredits(cleanAmount);
    if (serverIsUnlimited !== undefined) {
      setIsUnlimited(Boolean(serverIsUnlimited));
      if (serverIsUnlimited) {
        localStorage.setItem(STORAGE_KEY_UNLIMITED, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_UNLIMITED);
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY_CREDITS, cleanAmount.toString());
    } catch {}
    if (user) {
      syncCurrentUserToRegistry({
        ...user,
        credits: cleanAmount,
        isUnlimited: serverIsUnlimited !== undefined ? serverIsUnlimited : user.isUnlimited,
      });
    }
  };

  const addCredits = (amount: number) => {
    const next = credits + amount;
    setCredits(next);
    try {
      localStorage.setItem(STORAGE_KEY_CREDITS, next.toString());
    } catch (e) {
      console.warn('Failed to save top-up credits', e);
    }
    if (user) {
      syncCurrentUserToRegistry({ ...user, credits: next });
    }
  };

  const activateUnlimited = (days: number) => {
    if (!user) return; // Only authenticated users can receive Pro pass
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    setIsUnlimited(true);
    try {
      localStorage.setItem(STORAGE_KEY_UNLIMITED, expiry.toString());
    } catch (e) {
      console.warn('Failed to save unlimited pass', e);
    }
    syncCurrentUserToRegistry({ ...user, isUnlimited: true });
  };

  const login = (profile: UserProfile) => {
    // Ensure UID exists
    const withUid: UserProfile = {
      ...profile,
      uid: profile.uid || generateCitizenId(),
    };
    setUser(withUid);
    setIsSkipped(false);

    // Look up in central registry for admin-verified status
    const allC = getAllCitizens();
    const existing = allC.find((c) => c.uid === withUid.uid || c.emailOrPhone === withUid.emailOrPhone);
    const now = Date.now();

    const hasActiveUnlimited = Boolean(
      withUid.role === 'admin' ||
      withUid.isUnlimited ||
      (existing && existing.isUnlimited && (!existing.unlimitedExpiresAt || existing.unlimitedExpiresAt > now))
    );

    if (hasActiveUnlimited) {
      setIsUnlimited(true);
      localStorage.setItem(STORAGE_KEY_UNLIMITED, 'true');
    } else {
      setIsUnlimited(false);
      localStorage.removeItem(STORAGE_KEY_UNLIMITED);
    }

    // Allocate credits: prioritize profile from server, then existing registry, then device ledger
    const deviceLedger = getDeviceTrialLedger();
    const remainingDeviceFreeScans = Math.max(0, MAX_DEVICE_FREE_SCANS - deviceLedger.freeScansUsed);
    const assignedCredits = typeof withUid.credits === 'number'
      ? withUid.credits
      : (existing && typeof existing.credits === 'number' ? existing.credits : remainingDeviceFreeScans);

    setCredits(assignedCredits);

    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify({ ...withUid, isUnlimited: hasActiveUnlimited, credits: assignedCredits }));
      localStorage.setItem(STORAGE_KEY_CREDITS, assignedCredits.toString());
      localStorage.removeItem(STORAGE_KEY_SKIPPED);
    } catch (e) {
      console.warn('Failed to save user', e);
    }
    syncCurrentUserToRegistry({ ...withUid, isUnlimited: hasActiveUnlimited, credits: assignedCredits });
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newProfile));
    } catch (e) {
      console.warn('Failed to update user in localStorage', e);
    }
    syncCurrentUserToRegistry(newProfile);
  };

  const loginAsDemo = (type: 'investor' | 'investigator') => {
    if (typeof window !== 'undefined') {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDemo: true, demoType: type }),
      }).catch(() => {});
    }
    const demoProfile = DEMO_USERS[type];
    login(demoProfile);
  };

  const loginAsAdmin = async (passkey: string): Promise<{ success: boolean; error?: string }> => {
    const clean = (passkey || '').trim();
    if (!clean) {
      return { success: false, error: 'Please enter a security passkey.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin',
          password: clean,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.user) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('scamshield_admin_authenticated', 'true');
        }
        login(data.user);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Access Denied: Invalid Security Passkey. Unauthorized entry attempt recorded.',
      };
    } catch (err) {
      return {
        success: false,
        error: 'Network error communicating with authentication service.',
      };
    }
  };

  const skipLogin = () => {
    setUser(null);
    setIsSkipped(true);
    setIsUnlimited(false);
    localStorage.removeItem(STORAGE_KEY_UNLIMITED);
    const deviceLedger = getDeviceTrialLedger();
    const remainingFree = Math.max(0, MAX_DEVICE_FREE_SCANS - deviceLedger.freeScansUsed);
    setCredits(remainingFree);
    try {
      localStorage.setItem(STORAGE_KEY_SKIPPED, 'true');
      localStorage.setItem(STORAGE_KEY_CREDITS, remainingFree.toString());
    } catch (e) {
      console.warn('Failed to save skip preference', e);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    setUser(null);
    setIsSkipped(false);
    setIsUnlimited(false);
    const deviceLedger = getDeviceTrialLedger();
    const remainingFree = Math.max(0, MAX_DEVICE_FREE_SCANS - deviceLedger.freeScansUsed);
    setCredits(remainingFree);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_SKIPPED);
      localStorage.removeItem(STORAGE_KEY_UNLIMITED);
      localStorage.setItem(STORAGE_KEY_CREDITS, remainingFree.toString());
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('scamshield_admin_authenticated');
      }
    } catch (e) {
      console.warn('Failed to remove auth session', e);
    }
  };

  const resetAuth = () => {
    logout();
  };

  const isAdmin = user?.role === 'admin';
  const isActuallyUnlimited = Boolean(user && (user.role === 'admin' || isUnlimited));

  return (
    <AuthContext.Provider
      value={{
        user,
        isSkipped,
        isAdmin,
        credits,
        isUnlimited: isActuallyUnlimited,
        consumeCredit,
        addCredits,
        syncCreditsFromServer,
        activateUnlimited,
        login,
        updateUser,
        loginAsDemo,
        loginAsAdmin,
        skipLogin,
        logout,
        resetAuth,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
