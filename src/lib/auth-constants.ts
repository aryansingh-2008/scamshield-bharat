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
  credits?: number;
  isUnlimited?: boolean;
  unlimitedExpiresAt?: number | null;
  planType?: 'free' | 'sachet' | 'pro' | 'annual';
}

// Designated Site President Account Public Metadata
export const PRESIDENT_USER: UserProfile = {
  uid: 'SSB-PRESIDENT-0001',
  name: 'Arti (President)',
  emailOrPhone: 'president@scamshieldbharat.live',
  role: 'admin',
  designation: 'President & Executive Director',
  organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
  verified: true,
  autoRedactPii: false,
  highSensitivity: true,
};

// Designated Master Admin Account Public Metadata
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

// Non-sensitive Demo Personas for Citizen & Investigator Evaluation
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

export function generateCitizenId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.floor(10 + Math.random() * 90);
  return `SSB-${year}-${randomPart}${suffix}`;
}

/**
 * Canonically normalizes citizen identifiers (Indian mobile numbers, emails, official UIDs, aliases).
 * Guarantees that "+91 98765 43210", "9876543210", "09876543210", and "+91-9876543210" map to the exact same key.
 */
export function normalizeCitizenIdentifier(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  const clean = input.trim();
  if (!clean) return '';

  const cleanLower = clean.toLowerCase();

  // 1. Privileged aliases
  if (cleanLower === 'admin' || cleanLower === 'aryan') return 'admin';
  if (cleanLower === 'arti' || cleanLower === 'president') return 'president';

  // 2. Official UID (e.g. SSB-2026-XXXXXX, SSB-ADMIN-0001, SSB-PRESIDENT-0001)
  if (cleanLower.startsWith('ssb-')) {
    return clean.toUpperCase();
  }

  // 3. Email Address
  if (clean.includes('@')) {
    return cleanLower;
  }

  // 4. Indian Mobile Phone Number
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }

  return cleanLower;
}
