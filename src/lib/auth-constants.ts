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

// Master Admin Confidential Passkey & PIN
export const MASTER_ADMIN_PASSKEY = '[REDACTED_MOCK_PASSKEY]';
export const MASTER_ADMIN_PIN = '789012';

// President Confidential Passkey & PIN (Arti - Site President)
export const PRESIDENT_PASSKEY = '[REDACTED_MOCK_PASSKEY]';
export const PRESIDENT_PIN = '654321';

// Designated Site President Account
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

export const verifyAdminPasskey = (input: string): boolean => {
  const clean = input.trim();
  return (
    clean === MASTER_ADMIN_PASSKEY ||
    clean === MASTER_ADMIN_PIN ||
    clean === PRESIDENT_PASSKEY ||
    clean === PRESIDENT_PIN
  );
};

export const getAdminUserForPasskey = (input: string): UserProfile => {
  const clean = input.trim();
  if (clean === PRESIDENT_PASSKEY || clean === PRESIDENT_PIN) {
    return PRESIDENT_USER;
  }
  return MASTER_ADMIN_USER;
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
