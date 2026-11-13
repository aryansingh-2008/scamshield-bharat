'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  emailOrPhone: string;
  role: 'investor' | 'investigator' | 'guest';
  designation?: string;
  organization?: string;
  verified?: boolean;
  autoRedactPii?: boolean;
  highSensitivity?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isSkipped: boolean;
  credits: number;
  isUnlimited: boolean;
  consumeCredit: () => boolean;
  addCredits: (amount: number) => void;
  activateUnlimited: (days: number) => void;
  login: (profile: UserProfile) => void;
  updateUser: (updated: Partial<UserProfile>) => void;
  loginAsDemo: (type: 'investor' | 'investigator') => void;
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

export const DEMO_USERS = {
  investor: {
    name: 'Vikram Sharma',
    emailOrPhone: 'vikram.investor@gmail.com',
    role: 'investor' as const,
    designation: 'Retail Investor (NSE / BSE)',
    organization: 'Self-Directed Investor',
    verified: true,
  },
  investigator: {
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
        setUser(JSON.parse(savedUser));
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
    if (isUnlimited) return true;
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
  };

  const activateUnlimited = (days: number) => {
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    setIsUnlimited(true);
    try {
      localStorage.setItem(STORAGE_KEY_UNLIMITED, expiry.toString());
    } catch (e) {
      console.warn('Failed to save unlimited pass', e);
    }
  };

  const login = (profile: UserProfile) => {
    setUser(profile);
    setIsSkipped(false);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      localStorage.removeItem(STORAGE_KEY_SKIPPED);
    } catch (e) {
      console.warn('Failed to save user', e);
    }
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
  };

  const loginAsDemo = (type: 'investor' | 'investigator') => {
    const demoProfile = DEMO_USERS[type];
    login(demoProfile);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isSkipped,
        credits,
        isUnlimited,
        consumeCredit,
        addCredits,
        activateUnlimited,
        login,
        updateUser,
        loginAsDemo,
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
