'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  emailOrPhone: string;
  role: 'investor' | 'investigator' | 'guest';
  designation?: string;
  organization?: string;
  verified?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isSkipped: boolean;
  login: (profile: UserProfile) => void;
  loginAsDemo: (type: 'investor' | 'investigator') => void;
  skipLogin: () => void;
  logout: () => void;
  resetAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'scamshield_user_session';
const STORAGE_KEY_SKIPPED = 'scamshield_login_skipped';

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
    } catch (e) {
      console.warn('Failed to read auth from localStorage', e);
    }
  }, []);

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
        login,
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
