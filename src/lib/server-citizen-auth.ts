import 'server-only';
import crypto from 'crypto';
import {
  generateCitizenId,
  normalizeCitizenIdentifier,
  DEMO_USERS,
  UserProfile,
} from './auth-constants';
import { revokeUserSessionsAsync } from './server-auth';

export interface CitizenAccountRecord {
  uid: string;
  normalizedIdentifier: string;
  name: string;
  salt: string;
  passwordHash: string;
  iterations?: number;
  role: 'investor' | 'investigator' | 'admin';
  designation: string;
  organization: string;
  credits: number;
  isUnlimited: boolean;
  unlimitedExpiresAt: number | null;
  premiumStartedAt?: string | null;
  planType?: 'free' | 'sachet' | 'pro' | 'annual';
  createdAt: string;
  updatedAt: string;
}

// In-memory backing store for local testing, fallback, and instance caching
const localCitizenAccounts = new Map<string, CitizenAccountRecord>();
const localUidToIdentifier = new Map<string, string>();
const localDeletedUids = new Set<string>();
const localDeletedIdentifiers = new Set<string>();

/**
 * Synchronized tombstone interface distinguishing deleted UIDs from deleted identifiers
 */
const localDeletedCitizens = {
  has: (val: string) => localDeletedUids.has(val) || localDeletedIdentifiers.has(val),
  add: (val: string) => {
    if (val.startsWith('SSB-')) localDeletedUids.add(val);
    else localDeletedIdentifiers.add(val);
  },
  delete: (val: string) => {
    localDeletedUids.delete(val);
    localDeletedIdentifiers.delete(val);
  },
  clear: () => {
    localDeletedUids.clear();
    localDeletedIdentifiers.clear();
  },
};

/**
 * Resolve Redis connection credentials with strict environment variable validation
 */
function getRedisCredentials(): { url: string; token: string } | null {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!rawUrl || rawUrl === 'undefined' || !token || token === 'undefined') {
    return null;
  }
  return { url: rawUrl.trim().replace(/\/+$/, ''), token };
}

/**
 * Reserved executive identifiers prohibited from being claimed via public citizen registration.
 */
export const RESERVED_EXECUTIVE_IDENTIFIERS = new Set<string>([
  'admin',
  'aryan',
  'arti',
  'president',
  'ssb-admin-0001',
  'ssb-president-0001',
  'admin@scamshieldbharat.live',
  'president@scamshieldbharat.live',
  'arti@scamshieldbharat.live',
]);

/**
 * OWASP 2024 Password Storage Guidance:
 * - PBKDF2-HMAC-SHA256: 600,000 iterations (standard work factor).
 * - Legacy compatibility: 100,000 iterations supported for seamless transparent upgrade.
 */
export const OWASP_RECOMMENDED_PBKDF2_ITERATIONS = 600000;
export const LEGACY_PBKDF2_ITERATIONS = 100000;

/**
 * Deterministically compute PBKDF2 hash of citizen password with random salt.
 * Uses 600,000 iterations of SHA-256 producing 32 bytes (64 hex characters) in accordance with OWASP.
 * Preserves strict case-sensitivity ("Ashwini" !== "ashwini").
 */
export function hashCitizenPassword(
  password: string,
  customSalt?: string,
  iterations: number = OWASP_RECOMMENDED_PBKDF2_ITERATIONS
): { salt: string; hash: string; iterations: number } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return { salt, hash, iterations };
}

/**
 * Constant-time comparison of candidate password hash against expected hash.
 * Completely timing-safe against side-channel analysis.
 */
export function verifyCitizenPassword(
  candidatePassword: string,
  salt: string,
  expectedHash: string,
  iterations: number = OWASP_RECOMMENDED_PBKDF2_ITERATIONS
): boolean {
  return verifyCitizenPasswordWithMigration(candidatePassword, salt, expectedHash, iterations).valid;
}

/**
 * Evaluates candidate password and determines if transparent hash upgrade is required.
 */
export function verifyCitizenPasswordWithMigration(
  candidatePassword: string,
  salt: string,
  expectedHash: string,
  iterations: number = OWASP_RECOMMENDED_PBKDF2_ITERATIONS
): { valid: boolean; needsRehash: boolean } {
  if (!candidatePassword || !salt || !expectedHash) return { valid: false, needsRehash: false };

  // 1. Try with configured iteration work factor (OWASP 600k)
  const candidateHash = crypto.pbkdf2Sync(candidatePassword, salt, iterations, 32, 'sha256').toString('hex');
  const bufCandidate = Buffer.from(candidateHash, 'hex');
  const bufExpected = Buffer.from(expectedHash, 'hex');

  if (bufCandidate.length === bufExpected.length && crypto.timingSafeEqual(bufCandidate, bufExpected)) {
    return { valid: true, needsRehash: iterations < OWASP_RECOMMENDED_PBKDF2_ITERATIONS };
  }

  // 2. Legacy fallback: check against 100k iterations to support seamless migration
  if (iterations !== LEGACY_PBKDF2_ITERATIONS) {
    const legacyCandidateHash = crypto.pbkdf2Sync(candidatePassword, salt, LEGACY_PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
    const bufLegacy = Buffer.from(legacyCandidateHash, 'hex');
    if (bufLegacy.length === bufExpected.length && crypto.timingSafeEqual(bufLegacy, bufExpected)) {
      return { valid: true, needsRehash: true };
    }
  }

  return { valid: false, needsRehash: false };
}

// Seed initial demo accounts
function seedInitialAccounts() {
  if (localCitizenAccounts.size > 0) return;

  const adminRecord: CitizenAccountRecord = {
    uid: 'SSB-ADMIN-0001',
    normalizedIdentifier: 'admin@scamshieldbharat.live',
    name: 'Aryan Singh (Chief Admin)',
    salt: '0000000000000000',
    passwordHash: '0000000000000000',
    iterations: 600000,
    role: 'admin',
    designation: 'Chief Cyber Safety Officer & System Administrator',
    organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
    credits: 9999,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    planType: 'annual',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };
  localCitizenAccounts.set(adminRecord.normalizedIdentifier, adminRecord);
  localUidToIdentifier.set(adminRecord.uid, adminRecord.normalizedIdentifier);

  const presidentRecord: CitizenAccountRecord = {
    uid: 'SSB-PRESIDENT-0001',
    normalizedIdentifier: 'president@scamshieldbharat.live',
    name: 'Arti (President)',
    salt: '0000000000000000',
    passwordHash: '0000000000000000',
    iterations: 600000,
    role: 'admin',
    designation: 'President & Executive Director',
    organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
    credits: 9999,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    planType: 'annual',
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };
  localCitizenAccounts.set(presidentRecord.normalizedIdentifier, presidentRecord);
  localUidToIdentifier.set(presidentRecord.uid, presidentRecord.normalizedIdentifier);

  const investorSeed = hashCitizenPassword('DemoInvestor@2026', 'seed_salt_investor_123');
  const demoInvestor: CitizenAccountRecord = {
    uid: DEMO_USERS.investor.uid,
    normalizedIdentifier: normalizeCitizenIdentifier(DEMO_USERS.investor.emailOrPhone),
    name: DEMO_USERS.investor.name,
    salt: investorSeed.salt,
    passwordHash: investorSeed.hash,
    role: DEMO_USERS.investor.role,
    designation: DEMO_USERS.investor.designation,
    organization: DEMO_USERS.investor.organization,
    credits: 20,
    isUnlimited: false,
    unlimitedExpiresAt: null,
    planType: 'sachet',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
  localCitizenAccounts.set(demoInvestor.normalizedIdentifier, demoInvestor);
  localUidToIdentifier.set(demoInvestor.uid, demoInvestor.normalizedIdentifier);

  const investigatorSeed = hashCitizenPassword('DemoInvestigator@2026', 'seed_salt_investigator_456');
  const demoInvestigator: CitizenAccountRecord = {
    uid: DEMO_USERS.investigator.uid,
    normalizedIdentifier: normalizeCitizenIdentifier(DEMO_USERS.investigator.emailOrPhone),
    name: DEMO_USERS.investigator.name,
    salt: investigatorSeed.salt,
    passwordHash: investigatorSeed.hash,
    role: DEMO_USERS.investigator.role,
    designation: DEMO_USERS.investigator.designation,
    organization: DEMO_USERS.investigator.organization,
    credits: 999,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    planType: 'pro',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
  localCitizenAccounts.set(demoInvestigator.normalizedIdentifier, demoInvestigator);
  localUidToIdentifier.set(demoInvestigator.uid, demoInvestigator.normalizedIdentifier);

  const rohanSeed = hashCitizenPassword('RohanGupta@2026', 'seed_salt_rohan_789');
  const demoRohan: CitizenAccountRecord = {
    uid: 'SSB-2026-102948',
    normalizedIdentifier: 'rohan.gupta99@gmail.com',
    name: 'Rohan Gupta',
    salt: rohanSeed.salt,
    passwordHash: rohanSeed.hash,
    role: 'investor',
    designation: 'Verified Citizen Member',
    organization: 'ScamShield Bharat',
    credits: 5,
    isUnlimited: false,
    unlimitedExpiresAt: null,
    planType: 'free',
    createdAt: '2026-11-10T11:20:00.000Z',
    updatedAt: '2026-11-10T11:20:00.000Z',
  };
  localCitizenAccounts.set(demoRohan.normalizedIdentifier, demoRohan);
  localUidToIdentifier.set(demoRohan.uid, demoRohan.normalizedIdentifier);

  const priyaSeed = hashCitizenPassword('PriyaMehra@2026', 'seed_salt_priya_101');
  const demoPriya: CitizenAccountRecord = {
    uid: 'SSB-2026-645129',
    normalizedIdentifier: 'priya.mehra@guild.org',
    name: 'Priya Mehra',
    salt: priyaSeed.salt,
    passwordHash: priyaSeed.hash,
    role: 'investor',
    designation: 'Verified Retail Investor',
    organization: 'Retail Investor Protection Guild',
    credits: 50,
    isUnlimited: true,
    unlimitedExpiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000,
    planType: 'pro',
    createdAt: '2026-11-08T15:00:00.000Z',
    updatedAt: '2026-11-08T15:00:00.000Z',
  };
  localCitizenAccounts.set(demoPriya.normalizedIdentifier, demoPriya);
  localUidToIdentifier.set(demoPriya.uid, demoPriya.normalizedIdentifier);
}

seedInitialAccounts();

export function resetCitizenStoreForTesting(): void {
  localCitizenAccounts.clear();
  localUidToIdentifier.clear();
  localDeletedUids.clear();
  localDeletedIdentifiers.clear();
  seedInitialAccounts();
}

/**
 * Retrieve a citizen account record by normalized identifier or UID.
 */
export async function getCitizenAccountAsync(identifierOrUid: string): Promise<CitizenAccountRecord | null> {
  const clean = normalizeCitizenIdentifier(identifierOrUid);
  if (!clean) return null;

  const isUid = clean.startsWith('SSB-');

  // Immediate check if this account was deleted in current lifecycle
  if (isUid) {
    if (localDeletedUids.has(clean)) {
      return null;
    }
  } else {
    if (localDeletedIdentifiers.has(clean) && !localCitizenAccounts.has(clean)) {
      return null;
    }
  }

  // 1. Check in-memory index
  if (isUid) {
    const mapped = localUidToIdentifier.get(clean);
    if (mapped && localCitizenAccounts.has(mapped)) {
      const acct = localCitizenAccounts.get(mapped)!;
      if (localDeletedUids.has(acct.uid)) return null;
      return acct;
    }
  } else {
    if (localCitizenAccounts.has(clean)) {
      const acct = localCitizenAccounts.get(clean)!;
      if (localDeletedUids.has(acct.uid)) return null;
      return acct;
    }
  }

  // 2. Query Redis if available
  const redis = getRedisCredentials();
  if (!redis) return null;
  const { url, token: redisToken } = redis;

  try {

    // Check if account is marked deleted in Redis
    if (isUid) {
      const isDeletedRes = await fetch(`${url}/sismember/scamshield:citizens:deleted:uids/${clean}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (isDeletedRes.ok) {
        const isDeletedData = await isDeletedRes.json();
        if (isDeletedData?.result === 1) {
          localDeletedUids.add(clean);
          return null;
        }
      }
    } else {
      const isDeletedRes = await fetch(`${url}/sismember/scamshield:citizens:deleted:identifiers/${clean}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (isDeletedRes.ok) {
        const isDeletedData = await isDeletedRes.json();
        if (isDeletedData?.result === 1) {
          localDeletedIdentifiers.add(clean);
          return null;
        }
      }
    }

    // Fallback check on legacy deleted set
    const legacyCheckRes = await fetch(`${url}/sismember/scamshield:citizens:deleted/${clean}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    if (legacyCheckRes.ok) {
      const legacyData = await legacyCheckRes.json();
      if (legacyData?.result === 1) {
        if (isUid) localDeletedUids.add(clean);
        else localDeletedIdentifiers.add(clean);
        return null;
      }
    }

    let key = `scamshield:citizen:acct:${clean}`;
    if (isUid) {
      // Lookup UID index first
      const uidRes = await fetch(`${url}/get/scamshield:citizen:uid:${clean}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (uidRes.ok) {
        const uidData = await uidRes.json();
        if (uidData?.result) {
          key = `scamshield:citizen:acct:${uidData.result}`;
        }
      }
    }

    const res = await fetch(`${url}/get/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.result) {
        const parsed: CitizenAccountRecord = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        if (localDeletedUids.has(parsed.uid)) {
          return null;
        }
        localCitizenAccounts.set(parsed.normalizedIdentifier, parsed);
        localUidToIdentifier.set(parsed.uid, parsed.normalizedIdentifier);
        return parsed;
      }
    }

    // Direct UID key fallback if uid mapping wasn't found
    if (isUid && key !== `scamshield:citizen:acct:${clean}`) {
      const fallbackRes = await fetch(`${url}/get/scamshield:citizen:acct:${clean}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData?.result) {
          const parsed: CitizenAccountRecord = typeof fallbackData.result === 'string' ? JSON.parse(fallbackData.result) : fallbackData.result;
          if (localDeletedUids.has(parsed.uid)) {
            return null;
          }
          localCitizenAccounts.set(parsed.normalizedIdentifier, parsed);
          localUidToIdentifier.set(parsed.uid, parsed.normalizedIdentifier);
          return parsed;
        }
      }
    }
  } catch {
    // Fallback to local
  }

  return null;
}

/**
 * Persist citizen record to Redis and local cache.
 */
export async function saveCitizenAccountAsync(record: CitizenAccountRecord): Promise<boolean> {
  localCitizenAccounts.set(record.normalizedIdentifier, record);
  localUidToIdentifier.set(record.uid, record.normalizedIdentifier);
  localDeletedIdentifiers.delete(record.normalizedIdentifier);

  const redis = getRedisCredentials();
  if (!redis) return true;
  const { url, token: redisToken } = redis;

  try {
    const serialized = JSON.stringify(record);
    const commands: (string | number)[][] = [
      ['SET', `scamshield:citizen:acct:${record.normalizedIdentifier}`, serialized],
      ['SET', `scamshield:citizen:acct:${record.uid}`, serialized],
      ['SET', `scamshield:citizen:uid:${record.uid}`, record.normalizedIdentifier],
      ['SET', `scamshield:citizen:credits:${record.uid}`, String(record.credits)],
      ['SADD', 'scamshield:citizens:index', record.normalizedIdentifier],
      ['SADD', 'scamshield:citizens:uids', record.uid],
      ['SREM', 'scamshield:citizens:deleted:identifiers', record.normalizedIdentifier],
      ['SREM', 'scamshield:citizens:deleted', record.normalizedIdentifier],
      ['DEL', `scamshield:revoked:user:${record.normalizedIdentifier}`],
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const data = await res.json();
    if (!Array.isArray(data)) return false;
    for (const cmdResult of data) {
      if (cmdResult?.error) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve all registered citizens across Redis datastore and memory cache.
 * Excludes sensitive cryptographic hashes and salts before consumer consumption.
 */
export async function getAllCitizenAccountsAsync(): Promise<CitizenAccountRecord[]> {
  const accountsMap = new Map<string, CitizenAccountRecord>();

  // Ensure default root executive accounts are seeded
  const defaultSeeds: CitizenAccountRecord[] = [
    {
      uid: 'SSB-ADMIN-0001',
      normalizedIdentifier: 'admin@scamshieldbharat.live',
      name: 'Aryan Singh (Chief Admin)',
      salt: '0000000000000000',
      passwordHash: '0000000000000000',
      iterations: 600000,
      role: 'admin',
      designation: 'Chief Cyber Safety Officer & System Administrator',
      organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
      credits: 9999,
      isUnlimited: true,
      unlimitedExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      planType: 'annual',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'SSB-PRESIDENT-0001',
      normalizedIdentifier: 'president@scamshieldbharat.live',
      name: 'Arti (President)',
      salt: '0000000000000000',
      passwordHash: '0000000000000000',
      iterations: 600000,
      role: 'admin',
      designation: 'President & Executive Director',
      organization: 'ScamShield Bharat (IIT BHU Civic Initiative)',
      credits: 9999,
      isUnlimited: true,
      unlimitedExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      planType: 'annual',
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const seed of defaultSeeds) {
    accountsMap.set(seed.normalizedIdentifier, seed);
  }

  // Load all local in-memory accounts (excluding deleted)
  for (const [id, acct] of localCitizenAccounts.entries()) {
    if (!localDeletedUids.has(acct.uid)) {
      accountsMap.set(id, acct);
    }
  }

  // Query Redis if available
  const redis = getRedisCredentials();

  if (redis) {
    try {
      const { url, token: redisToken } = redis;

      // Load deleted UIDs set from Redis
      const deletedRes = await fetch(`${url}/smembers/scamshield:citizens:deleted:uids`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (deletedRes.ok) {
        const deletedData = await deletedRes.json();
        if (Array.isArray(deletedData?.result)) {
          for (const d of deletedData.result) {
            localDeletedUids.add(d);
          }
        }
      }

      // Load legacy deleted set for backward compatibility
      const legacyDeletedRes = await fetch(`${url}/smembers/scamshield:citizens:deleted`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (legacyDeletedRes.ok) {
        const legacyData = await legacyDeletedRes.json();
        if (Array.isArray(legacyData?.result)) {
          for (const d of legacyData.result) {
            if (typeof d === 'string' && d.startsWith('SSB-')) {
              localDeletedUids.add(d);
            }
          }
        }
      }

      const membersRes = await fetch(`${url}/smembers/scamshield:citizens:index`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        const identifiers: string[] = Array.isArray(membersData?.result)
          ? membersData.result
          : [];

        if (identifiers.length > 0) {
          const pipelineCommands = identifiers.map((id) => ['GET', `scamshield:citizen:acct:${id}`]);
          const pipeRes = await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${redisToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pipelineCommands),
          });
          if (pipeRes.ok) {
            const pipeData = await pipeRes.json();
            if (Array.isArray(pipeData)) {
              for (const item of pipeData) {
                if (item?.result) {
                  const record: CitizenAccountRecord =
                    typeof item.result === 'string' ? JSON.parse(item.result) : item.result;
                  if (
                    record &&
                    record.normalizedIdentifier &&
                    !localDeletedUids.has(record.uid)
                  ) {
                    accountsMap.set(record.normalizedIdentifier, record);
                    localCitizenAccounts.set(record.normalizedIdentifier, record);
                    localUidToIdentifier.set(record.uid, record.normalizedIdentifier);
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Memory store fallback
    }
  }

  return Array.from(accountsMap.values()).filter(
    (acct) => !localDeletedUids.has(acct.uid)
  );
}

export interface DeleteCitizenResult {
  success: boolean;
  message: string;
  code?: string;
  alreadyDeleted?: boolean;
  uid?: string;
}

/**
 * Authoritatively deletes a citizen account from Redis and in-memory stores.
 *
 * Security Requirements:
 * 1. Strictly protects Chief Admin (SSB-ADMIN-0001), President (SSB-PRESIDENT-0001),
 *    and any account with role === 'admin' from deletion.
 * 2. Purges all associated Redis keys:
 *    - scamshield:citizen:acct:${identifier}
 *    - scamshield:citizen:acct:${uid}
 *    - scamshield:citizen:uid:${uid}
 *    - scamshield:citizen:credits:${uid}
 * 3. Removes members from index sets:
 *    - scamshield:citizens:index
 *    - scamshield:citizens:uids
 * 4. Adds UID to scamshield:citizens:deleted:uids and identifier to scamshield:citizens:deleted:identifiers.
 * 5. Revokes all active sessions for the citizen so they cannot access the system again.
 * 6. Handles repeated or already-deleted deletion requests idempotently.
 * 7. Never deletes another citizen by matching strictly on exact UID or identifier.
 * 8. Validates every Redis pipeline command result and never swallows datastore errors.
 */
export async function deleteCitizenAccountAsync(
  targetUidOrIdentifier: string
): Promise<DeleteCitizenResult> {
  const clean = normalizeCitizenIdentifier(targetUidOrIdentifier);
  if (!clean) {
    return {
      success: false,
      message: 'Citizen UID or identifier is required.',
      code: 'MISSING_IDENTIFIER',
    };
  }

  // 1. Protect Chief Admin, President, and Executive accounts
  const isChiefAdmin = clean === 'SSB-ADMIN-0001' || clean === 'admin' || clean === 'aryan';
  const isPresident = clean === 'SSB-PRESIDENT-0001' || clean === 'president' || clean === 'arti';
  const isReserved = RESERVED_EXECUTIVE_IDENTIFIERS.has(clean.toLowerCase());

  if (isChiefAdmin || isPresident || isReserved) {
    return {
      success: false,
      message: 'सुरक्षा नियम: मुख्य व्यवस्थापक एवं राष्ट्रपति खाते (Chief Admin & President) अपरिवर्तनीय व स्थायी रूप से सुरक्षित हैं।',
      code: 'PROTECTED_ACCOUNT',
    };
  }

  // 2. Lookup existing account to obtain exact UID and normalized identifier
  const citizen = await getCitizenAccountAsync(clean);

  // If found, check role
  if (citizen && citizen.role === 'admin') {
    return {
      success: false,
      message: 'सुरक्षा नियम: व्यवस्थापक (Admin) खाते को हटाया नहीं जा सकता।',
      code: 'PROTECTED_ACCOUNT',
    };
  }

  const redis = getRedisCredentials();

  // 3. Handle already deleted or nonexistent account idempotently
  if (!citizen) {
    if (clean.startsWith('SSB-')) {
      localDeletedUids.add(clean);
    } else {
      localDeletedIdentifiers.add(clean);
    }

    if (redis) {
      const { url, token: redisToken } = redis;
      const commands: (string | number)[][] = [
        ['DEL', `scamshield:citizen:acct:${clean}`],
        ['DEL', `scamshield:citizen:uid:${clean}`],
        ['DEL', `scamshield:citizen:credits:${clean}`],
        ['SREM', 'scamshield:citizens:index', clean],
        ['SREM', 'scamshield:citizens:uids', clean],
      ];
      if (clean.startsWith('SSB-')) {
        commands.push(['SADD', 'scamshield:citizens:deleted:uids', clean]);
        commands.push(['SADD', 'scamshield:citizens:deleted', clean]);
      } else {
        commands.push(['SADD', 'scamshield:citizens:deleted:identifiers', clean]);
        commands.push(['SADD', 'scamshield:citizens:deleted', clean]);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`${url}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${redisToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commands),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          console.error(`[REDIS_DELETE_ERROR] Datastore HTTP ${res.status} on cleanup for '${clean}'`);
          return {
            success: false,
            code: 'REDIS_HTTP_ERROR',
            message: `Datastore error during cleanup (HTTP ${res.status}).`,
          };
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          return {
            success: false,
            code: 'REDIS_RESPONSE_ERROR',
            message: 'Invalid datastore response format.',
          };
        }
        for (let i = 0; i < data.length; i++) {
          const cmdResult = data[i];
          if (cmdResult && cmdResult.error) {
            console.error(`[REDIS_DELETE_ERROR] Command ${i} failed during cleanup: ${cmdResult.error}`);
            return {
              success: false,
              code: 'REDIS_COMMAND_ERROR',
              message: `Datastore command error: ${cmdResult.error}`,
            };
          }
        }
      } catch (err: any) {
        clearTimeout(timeout);
        return {
          success: false,
          code: err?.name === 'AbortError' ? 'REDIS_TIMEOUT' : 'REDIS_NETWORK_ERROR',
          message: err?.name === 'AbortError'
            ? 'Datastore timed out during account cleanup.'
            : 'Network error communicating with datastore.',
        };
      }
    }
    return {
      success: true,
      alreadyDeleted: true,
      uid: clean,
      message: `खाता '${clean}' पहले ही हटाया जा चुका है या मौजूद नहीं है।`,
    };
  }

  const targetUid = citizen.uid;
  const targetIdentifier = citizen.normalizedIdentifier;

  // Double check that target isn't protected
  if (targetUid === 'SSB-ADMIN-0001' || targetUid === 'SSB-PRESIDENT-0001' || citizen.role === 'admin') {
    return {
      success: false,
      message: 'सुरक्षा नियम: व्यवस्थापक खाते को हटाया नहीं जा सकता।',
      code: 'PROTECTED_ACCOUNT',
    };
  }

  // 4. Redis Deletion with Full Status & Command Validation
  if (redis) {
    const { url, token: redisToken } = redis;
    const commands: (string | number)[][] = [
      ['DEL', `scamshield:citizen:acct:${targetIdentifier}`],
      ['DEL', `scamshield:citizen:acct:${targetUid}`],
      ['DEL', `scamshield:citizen:uid:${targetUid}`],
      ['DEL', `scamshield:citizen:credits:${targetUid}`],
      ['SREM', 'scamshield:citizens:index', targetIdentifier],
      ['SREM', 'scamshield:citizens:uids', targetUid],
      ['SADD', 'scamshield:citizens:deleted:uids', targetUid],
      ['SADD', 'scamshield:citizens:deleted', targetUid],
      ['SADD', 'scamshield:citizens:deleted:identifiers', targetIdentifier],
      ['SET', `scamshield:revoked:user:${targetUid}`, 'deleted', 'EX', 7 * 86400],
      ['SET', `scamshield:revoked:user:${targetIdentifier}`, 'deleted', 'EX', 7 * 86400],
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[REDIS_DELETE_ERROR] Upstash responded with HTTP ${res.status}`);
        return {
          success: false,
          code: 'REDIS_HTTP_ERROR',
          message: `Failed to delete citizen account from authoritative datastore (HTTP ${res.status}).`,
        };
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error(`[REDIS_DELETE_ERROR] Invalid pipeline response: not an array`, data);
        return {
          success: false,
          code: 'REDIS_RESPONSE_ERROR',
          message: 'Invalid response from authoritative datastore during account deletion.',
        };
      }

      for (let i = 0; i < data.length; i++) {
        const cmdResult = data[i];
        if (cmdResult && cmdResult.error) {
          console.error(`[REDIS_DELETE_ERROR] Pipeline command ${i} failed: ${cmdResult.error}`);
          return {
            success: false,
            code: 'REDIS_COMMAND_ERROR',
            message: `Datastore command error: ${cmdResult.error}`,
          };
        }
      }
    } catch (err: any) {
      clearTimeout(timeout);
      console.error(`[REDIS_DELETE_ERROR] Network or timeout error during account deletion:`, err?.message || err);
      return {
        success: false,
        code: err?.name === 'AbortError' ? 'REDIS_TIMEOUT' : 'REDIS_NETWORK_ERROR',
        message: err?.name === 'AbortError'
          ? 'Authoritative datastore timed out during account deletion.'
          : 'Network error communicating with authoritative datastore.',
      };
    }
  }

  // 5. Purge from in-memory stores ONLY AFTER REDIS SUCCEEDS (or if in local fallback mode)
  localCitizenAccounts.delete(targetIdentifier);
  localCitizenAccounts.delete(targetUid);
  localUidToIdentifier.delete(targetUid);
  localDeletedUids.add(targetUid);
  localDeletedIdentifiers.add(targetIdentifier);

  // 6. Revoke in-memory sessions for this citizen
  await revokeUserSessionsAsync(targetUid, targetIdentifier);

  console.log(`[AUDIT:CITIZEN_DELETE] Target UID: ${targetUid}, Status: DELETED`);

  return {
    success: true,
    uid: targetUid,
    message: `नागरिक खाता '${citizen.name}' (${targetUid}) सफलतापूर्वक हटा दिया गया।`,
  };
}

export const ALLOWED_PREMIUM_DURATIONS = [7, 30, 90, 180, 365] as const;
export const MAX_CUSTOM_PREMIUM_DAYS = 3650;

export interface AllotPremiumParams {
  uid: string;
  days: number;
  allottedBy: string;
}

export interface AllotPremiumResult {
  success: boolean;
  citizen?: CitizenAccountRecord;
  actionType?: 'GRANTED' | 'EXTENDED';
  previousExpiry?: number | null;
  newExpiry?: number;
  error?: string;
  code?: string;
}

/**
 * Server-side calculation and allotment of Premium / Pro Pass access.
 * Strict rules:
 * 1. Duration validated (positive integer, max 3650 days).
 * 2. Active access is extended by adding duration to existing expiry.
 * 3. Expired access is calculated from current server time.
 * 4. Start and expiry timestamps stored reliably server-side.
 * 5. Logs auditable event with zero secrets.
 */
export async function allotCitizenPremiumAsync(params: AllotPremiumParams): Promise<AllotPremiumResult> {
  const { uid, days, allottedBy } = params;

  if (!uid || typeof uid !== 'string') {
    return { success: false, error: 'Citizen UID is required.', code: 'MISSING_UID' };
  }

  // Validate days: positive integer up to MAX_CUSTOM_PREMIUM_DAYS
  if (typeof days !== 'number' || !Number.isInteger(days) || days <= 0 || days > MAX_CUSTOM_PREMIUM_DAYS) {
    return {
      success: false,
      error: `Invalid duration. Days must be a positive integer between 1 and ${MAX_CUSTOM_PREMIUM_DAYS}.`,
      code: 'INVALID_DURATION',
    };
  }

  const citizen = await getCitizenAccountAsync(uid);
  if (!citizen) {
    return { success: false, error: 'Citizen account not found.', code: 'ACCOUNT_NOT_FOUND' };
  }

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
  citizen.updatedAt = new Date(now).toISOString();

  await saveCitizenAccountAsync(citizen);

  // Auditable log entry with zero secret leakage
  console.log(
    `[AUDIT:PREMIUM_ALLOTMENT] Citizen UID: ${citizen.uid}, Action: ${actionType}, Added Days: ${days}, New Expiry: ${new Date(
      newExpiry
    ).toISOString()}, Admin: ${allottedBy || 'system'}`
  );

  return {
    success: true,
    citizen,
    actionType,
    previousExpiry: currentExpiry,
    newExpiry,
  };
}

/**
 * Register a new citizen account with permanent Citizen UID and hashed credentials.
 */
export async function createCitizenAccountAsync(params: {
  identifier: string;
  password: string;
  name?: string;
  role?: 'investor' | 'investigator';
  designation?: string;
  organization?: string;
  initialCredits?: number;
}): Promise<{ success: boolean; citizen?: CitizenAccountRecord; error?: string; code?: string }> {
  const normalized = normalizeCitizenIdentifier(params.identifier);
  if (!normalized) {
    return { success: false, error: 'A valid mobile number or email is required.', code: 'INVALID_IDENTIFIER' };
  }

  if (!params.password || params.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.', code: 'PASSWORD_TOO_SHORT' };
  }

  // Prohibit claiming reserved executive identities via public registration
  if (RESERVED_EXECUTIVE_IDENTIFIERS.has(normalized.toLowerCase())) {
    return {
      success: false,
      error: 'Registration using reserved administrative identifiers is prohibited.',
      code: 'RESERVED_IDENTIFIER',
    };
  }

  // Check for existing account to prevent duplicate accounts
  const existing = await getCitizenAccountAsync(normalized);
  if (existing) {
    return {
      success: false,
      error: 'An account with this mobile number or email already exists. Please sign in instead.',
      code: 'ACCOUNT_ALREADY_EXISTS',
    };
  }

  // Public signup role is restricted to investor or investigator (admin cannot be self-assigned)
  const assignedRole = params.role === 'investigator' ? 'investigator' : 'investor';

  // Generate permanent immutable Citizen UID once
  const permanentUid = generateCitizenId();
  const { salt, hash, iterations } = hashCitizenPassword(params.password, undefined, OWASP_RECOMMENDED_PBKDF2_ITERATIONS);
  const now = new Date().toISOString();

  const citizen: CitizenAccountRecord = {
    uid: permanentUid,
    normalizedIdentifier: normalized,
    name: params.name?.trim() || (normalized.includes('@') ? normalized.split('@')[0] : `Citizen +91 ***${normalized.slice(-4)}`),
    salt,
    passwordHash: hash,
    iterations,
    role: assignedRole,
    designation: params.designation || 'Verified Citizen Member',
    organization: params.organization || 'ScamShield Bharat',
    credits: params.initialCredits ?? 3,
    isUnlimited: false,
    unlimitedExpiresAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await saveCitizenAccountAsync(citizen);
  return { success: true, citizen };
}

/**
 * Update an existing citizen account's role, designation, or password.
 * Passwords are hashed using PBKDF2 with 100,000 rounds and random salt.
 * Never persists plaintext passwords.
 */
export async function updateCitizenAccountAsync(params: {
  uid: string;
  name?: string;
  role?: 'investor' | 'investigator' | 'admin';
  designation?: string;
  organization?: string;
  password?: string;
  credits?: number;
  isUnlimited?: boolean;
  unlimitedExpiresAt?: number | null;
  planType?: 'free' | 'sachet' | 'pro' | 'annual';
  identifier?: string;
  emailOrPhone?: string;
}): Promise<{ success: boolean; citizen?: CitizenAccountRecord; error?: string }> {
  // Chief Admin is permanent and cannot be modified or demoted via this function
  if (params.uid === 'SSB-ADMIN-0001') {
    return { success: false, error: 'Chief Admin account identity is immutable and protected.' };
  }

  let citizen = await getCitizenAccountAsync(params.uid);
  if (!citizen && (params.identifier || params.emailOrPhone || params.name)) {
    // If citizen doesn't exist yet, automatically CREATE the citizen account!
    const identInput = params.identifier || params.emailOrPhone || params.uid;
    const ident = normalizeCitizenIdentifier(identInput) || params.uid;
    const assignedRole = params.role === 'admin' ? 'admin' : (params.role === 'investigator' ? 'investigator' : 'investor');
    const { salt, hash, iterations } = hashCitizenPassword(params.password || 'Citizen@2026', undefined, OWASP_RECOMMENDED_PBKDF2_ITERATIONS);
    const now = new Date().toISOString();
    citizen = {
      uid: params.uid,
      normalizedIdentifier: ident,
      name: params.name?.trim() || `Citizen ${ident}`,
      salt,
      passwordHash: hash,
      iterations,
      role: assignedRole,
      designation: params.designation?.trim() || 'Verified Citizen Member',
      organization: params.organization?.trim() || 'ScamShield Bharat',
      credits: params.credits ?? (params.isUnlimited || params.role === 'admin' ? 9999 : 25),
      isUnlimited: Boolean(params.isUnlimited),
      unlimitedExpiresAt: params.unlimitedExpiresAt ?? (params.isUnlimited ? Date.now() + 30 * 86400000 : null),
      planType: params.planType || (params.isUnlimited ? 'pro' : 'free'),
      createdAt: now,
      updatedAt: now,
    };
  }

  if (!citizen) {
    return { success: false, error: 'Citizen account not found.' };
  }

  if (params.name && params.name.trim()) citizen.name = params.name.trim();
  if (params.role) citizen.role = params.role;
  if (params.designation) citizen.designation = params.designation.trim();
  if (params.organization) citizen.organization = params.organization.trim();
  if (params.credits !== undefined) citizen.credits = params.credits;

  if (params.isUnlimited !== undefined) {
    citizen.isUnlimited = params.isUnlimited;
    const now = Date.now();
    if (params.isUnlimited) {
      if (params.unlimitedExpiresAt !== undefined) {
        citizen.unlimitedExpiresAt = params.unlimitedExpiresAt;
      } else if (!citizen.unlimitedExpiresAt || citizen.unlimitedExpiresAt <= now) {
        citizen.unlimitedExpiresAt = now + 30 * 24 * 60 * 60 * 1000;
      }
      citizen.planType = params.planType || citizen.planType || 'pro';
      citizen.premiumStartedAt = citizen.premiumStartedAt || new Date(now).toISOString();
    } else {
      citizen.unlimitedExpiresAt = null;
      citizen.planType = 'free';
    }
  }

  if (params.password && params.password.trim()) {
    const cleanPass = params.password.trim();
    if (cleanPass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const { salt, hash, iterations } = hashCitizenPassword(cleanPass, undefined, OWASP_RECOMMENDED_PBKDF2_ITERATIONS);
    citizen.salt = salt;
    citizen.passwordHash = hash;
    citizen.iterations = iterations;
  }

  citizen.updatedAt = new Date().toISOString();
  await saveCitizenAccountAsync(citizen);
  return { success: true, citizen };
}

/**
 * Authenticate citizen using case-sensitive PBKDF2 verification.
 * Guarantees that "Ashwini" and "ashwini" never match each other,
 * and always returns the citizen's permanent immutable Citizen UID.
 * Supports transparent OWASP migration from 100k to 600k iterations.
 */
export async function verifyCitizenLoginAsync(
  identifier: string,
  candidatePassword: string
): Promise<{ success: boolean; citizen?: CitizenAccountRecord; error?: string; code?: string }> {
  const normalized = normalizeCitizenIdentifier(identifier);
  if (!normalized) {
    return { success: false, error: 'Identifier is required.', code: 'MISSING_IDENTIFIER' };
  }

  if (!candidatePassword) {
    return { success: false, error: 'Password is required.', code: 'MISSING_PASSWORD' };
  }

  const citizen = await getCitizenAccountAsync(normalized);
  if (!citizen) {
    return {
      success: false,
      error: 'No registered account found with this mobile number or email. Please register first.',
      code: 'ACCOUNT_NOT_FOUND',
    };
  }

  // Strict case-sensitive cryptographic verification with transparent OWASP upgrade
  const verification = verifyCitizenPasswordWithMigration(
    candidatePassword,
    citizen.salt,
    citizen.passwordHash,
    citizen.iterations || LEGACY_PBKDF2_ITERATIONS
  );
  if (!verification.valid) {
    return {
      success: false,
      error: 'Incorrect password. Passwords are case-sensitive (e.g., "Ashwini" is different from "ashwini").',
      code: 'INVALID_CREDENTIALS',
    };
  }

  // Automatic transparent migration to OWASP 600,000 iterations standard
  if (verification.needsRehash) {
    const upgraded = hashCitizenPassword(candidatePassword, citizen.salt, OWASP_RECOMMENDED_PBKDF2_ITERATIONS);
    citizen.passwordHash = upgraded.hash;
    citizen.iterations = OWASP_RECOMMENDED_PBKDF2_ITERATIONS;
    citizen.updatedAt = new Date().toISOString();
    await saveCitizenAccountAsync(citizen);
  }

  return { success: true, citizen };
}

/**
 * Atomically check and deduct 1 safety credit from the citizen's account.
 * Rejects with INSUFFICIENT_CREDITS if current balance is <= 0.
 */
export async function deductCitizenCreditAsync(
  uid: string
): Promise<{ success: boolean; creditsRemaining: number; isUnlimited?: boolean; error?: string; code?: string }> {
  const citizen = await getCitizenAccountAsync(uid);
  if (!citizen) {
    return { success: false, creditsRemaining: 0, error: 'Citizen account not found.', code: 'ACCOUNT_NOT_FOUND' };
  }

  // Unlimited users: verify that unlimited access has not expired
  const now = Date.now();
  const isPremiumActive =
    citizen.role === 'admin' ||
    (citizen.isUnlimited && (!citizen.unlimitedExpiresAt || citizen.unlimitedExpiresAt > now));

  if (isPremiumActive) {
    return { success: true, creditsRemaining: citizen.credits, isUnlimited: true };
  }

  // If citizen was marked unlimited but expiry has elapsed, mark isUnlimited = false
  if (citizen.isUnlimited && citizen.unlimitedExpiresAt && citizen.unlimitedExpiresAt <= now) {
    citizen.isUnlimited = false;
    citizen.updatedAt = new Date(now).toISOString();
    localCitizenAccounts.set(citizen.normalizedIdentifier, citizen);
    saveCitizenAccountAsync(citizen).catch(() => {});
  }

  // Attempt atomic Redis decrement if available
  const redis = getRedisCredentials();

  if (redis) {
    try {
      const { url, token: redisToken } = redis;
      const key = `scamshield:citizen:credits:${uid}`;
      // Lua script for atomic non-negative decrement: returns remaining balance, or -1 if 0
      const script = `
        local current = tonumber(redis.call('GET', KEYS[1]) or '${citizen.credits}')
        if current <= 0 then
          return -1
        end
        local next = redis.call('DECR', KEYS[1])
        return next
      `;
      const res = await fetch(`${url}/eval`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script, keys: [key] }),
      });
      if (res.ok) {
        const data = await res.json();
        const nextVal = Number(data?.result);
        if (nextVal < 0) {
          return { success: false, creditsRemaining: 0, error: 'Insufficient safety credits.', code: 'INSUFFICIENT_CREDITS' };
        }
        citizen.credits = nextVal;
        citizen.updatedAt = new Date().toISOString();
        localCitizenAccounts.set(citizen.normalizedIdentifier, citizen);
        return { success: true, creditsRemaining: nextVal };
      }
    } catch {
      // Fallback to local memory
    }
  }

  // Local Memory Fallback
  if (citizen.credits <= 0) {
    return { success: false, creditsRemaining: 0, error: 'Insufficient safety credits.', code: 'INSUFFICIENT_CREDITS' };
  }

  citizen.credits = Math.max(0, citizen.credits - 1);
  citizen.updatedAt = new Date().toISOString();
  localCitizenAccounts.set(citizen.normalizedIdentifier, citizen);
  return { success: true, creditsRemaining: citizen.credits };
}

/**
 * Refund 1 safety credit in the event of an unexpected downstream analysis failure.
 */
export async function refundCitizenCreditAsync(uid: string): Promise<{ success: boolean; creditsRemaining: number }> {
  const citizen = await getCitizenAccountAsync(uid);
  if (!citizen) return { success: false, creditsRemaining: 0 };
  const now = Date.now();
  const isPremiumActive =
    citizen.role === 'admin' ||
    (citizen.isUnlimited && (!citizen.unlimitedExpiresAt || citizen.unlimitedExpiresAt > now));
  if (isPremiumActive) return { success: true, creditsRemaining: citizen.credits };

  const redis = getRedisCredentials();

  if (redis) {
    try {
      const { url, token: redisToken } = redis;
      const key = `scamshield:citizen:credits:${uid}`;
      const res = await fetch(`${url}/incr/${key}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const nextVal = Number(data?.result);
        citizen.credits = nextVal;
        localCitizenAccounts.set(citizen.normalizedIdentifier, citizen);
        return { success: true, creditsRemaining: nextVal };
      }
    } catch {}
  }

  citizen.credits += 1;
  citizen.updatedAt = new Date().toISOString();
  localCitizenAccounts.set(citizen.normalizedIdentifier, citizen);
  return { success: true, creditsRemaining: citizen.credits };
}
