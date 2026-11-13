'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateCitizenId, syncCurrentUserToRegistry } from './user-registry';

export interface UserProfile {
  uid?: string; // Citizen Unique ID (e.g. "SSB-2026-8491" or "SSB-ADMIN-0001")
  name: string;
  emailOrPhone: string;
  role: 'investor' | 'investigator' | 'guest' | 'admin';
  designation?: string;
  organization?: string;
  verified?: boolean;
  autoRedactPii?: boolean;
  highSensitivity?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isSkipped: boolean;
  isAdmin: boolean;
  credits: number;
  isUnlimited: boolean;
  consumeCredit: () => boolean;
  addCredits: (amount: number) => void;
  activateUnlimited: (days: number) => void;
  login: (profile: UserProfile) => void;
  updateUser: (updated: Partial<UserProfile>) => void;
  loginAsDemo: (type: 'investor' | 'investigator') => void;
  loginAsAdmin: () => void;
  skipLogin: () => void;
  logout: () => void;
  resetAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'scamshield_user_session';
const STORAGE_KEY_SKIPPED = 'scamshield_login_skipped';
const STORAGE_KEY_CREDITS = 'scamshield_user_credits';
const STORAGE_KEY_UNLIMITED = 'scamshield_unlimited_expiry';
const DEFAULT_INITIAL_CREDITS = 5;

// Designated Master Admin Account
export const MASTER_ADMIN_USER: UserProfile = {
  uid: 'SSB-ADMIN-0001',
  name: 'Aryan Singh (Chief Admin)',
  emailOrPhone: 'admin@scamshieldbharat.live',
  role: 'admin',
  designation: 'Chief Cyber Safety Officer & System Administrator',
  organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
  verified: true,
  autoRedactPii: false,
  highSensitivity: true,
};

export const DEMO_USERS = {
  investor: {
    uid: 'SSB-2026-784210',
    name: 'Vikram Sharma',
    emailOrPhone: 'vikram.investor@gmail.com',
    role: 'investor' as const,
    designation: 'Retail Investor (NSE / BSE)',
    organization: 'Self-Directed Investor',
    verified: true,
  },
  investigator: {
    uid: 'SSB-2026-391842',
    name: 'Inspector Anita Verma',
    emailOrPhone: 'anita.verma@cybercrime.gov.in',
    role: 'investigator' as const,
    designation: 'Cybercrime Investigation Wing',
    organization: 'National Cyber Crime Reporting Portal (1930 / MHA)',
    verified: true,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [credits, setCredits] = useState<number>(DEFAULT_INITIAL_CREDITS);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        const parsed: UserProfile = JSON.parse(savedUser);
        // Ensure every user has a unique Citizen Safety ID (UID)
        if (!parsed.uid) {
          parsed.uid = generateCitizenId();
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
        }
        setUser(parsed);
        // Automatically sync to master registry
        syncCurrentUserToRegistry(parsed);

        // If admin, automatically grant unlimited access
        if (parsed.role === 'admin') {
          setIsUnlimited(true);
        }
      }
      const savedSkip = localStorage.getItem(STORAGE_KEY_SKIPPED);
      if (savedSkip === 'true') {
        setIsSkipped(true);
      }
      const savedCredits = localStorage.getItem(STORAGE_KEY_CREDITS);
      if (savedCredits !== null) {
        const parsed = parseInt(savedCredits, 10);
        setCredits(isNaN(parsed) ? DEFAULT_INITIAL_CREDITS : parsed);
      } else {
        localStorage.setItem(STORAGE_KEY_CREDITS, DEFAULT_INITIAL_CREDITS.toString());
      }
      const savedUnlimited = localStorage.getItem(STORAGE_KEY_UNLIMITED);
      if (savedUnlimited) {
        const expiry = parseInt(savedUnlimited, 10);
        if (expiry > Date.now()) {
          setIsUnlimited(true);
        } else {
          localStorage.removeItem(STORAGE_KEY_UNLIMITED);
        }
      }
    } catch (e) {
      console.warn('Failed to read auth/credits from localStorage', e);
    }
  }, []);

  const consumeCredit = (): boolean => {
    if (isUnlimited || user?.role === 'admin') return true;
    if (credits <= 0) return false;
    const next = credits - 1;
    setCredits(next);
    try {
      localStorage.setItem(STORAGE_KEY_CREDITS, next.toString());
    } catch (e) {
      console.warn('Failed to update credits', e);
    }
    return true;
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
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    setIsUnlimited(true);
    try {
      localStorage.setItem(STORAGE_KEY_UNLIMITED, expiry.toString());
    } catch (e) {
      console.warn('Failed to save unlimited pass', e);
    }
    if (user) {
      syncCurrentUserToRegistry({ ...user, isUnlimited: true });
    }
  };

  const login = (profile: UserProfile) => {
    // Ensure UID exists
    const withUid: UserProfile = {
      ...profile,
      uid: profile.uid || generateCitizenId(),
    };
    setUser(withUid);
    setIsSkipped(false);
    if (withUid.role === 'admin') {
      setIsUnlimited(true);
    }
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(withUid));
      localStorage.removeItem(STORAGE_KEY_SKIPPED);
    } catch (e) {
      console.warn('Failed to save user', e);
    }
    // Sync into the central directory
    syncCurrentUserToRegistry(withUid);
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
    const demoProfile = DEMO_USERS[type];
    login(demoProfile);
  };

  const loginAsAdmin = () => {
    login(MASTER_ADMIN_USER);
  };

  const skipLogin = () => {
    setUser(null);
    setIsSkipped(true);
    try {
      localStorage.setItem(STORAGE_KEY_SKIPPED, 'true');
    } catch (e) {
      console.warn('Failed to save skip preference', e);
    }
  };

  const logout = () => {
    setUser(null);
    setIsSkipped(false);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_SKIPPED);
    } catch (e) {
      console.warn('Failed to remove auth session', e);
    }
  };

  const resetAuth = () => {
    logout();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isSkipped,
        isAdmin,
        credits,
        isUnlimited: isUnlimited || isAdmin,
        consumeCredit,
        addCredits,
        activateUnlimited,
        login,
        updateUser,
        loginAsDemo,
        loginAsAdmin,
        skipLogin,
        logout,
        resetAuth,
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
