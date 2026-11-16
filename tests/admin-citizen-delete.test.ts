import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createCitizenAccountAsync,
  getCitizenAccountAsync,
  getAllCitizenAccountsAsync,
  deleteCitizenAccountAsync,
  resetCitizenStoreForTesting,
} from '../src/lib/server-citizen-auth';
import {
  signSessionToken,
  verifySessionTokenAsync,
  clearLocalAuthCaches,
  SESSION_COOKIE_NAME,
} from '../src/lib/server-auth';
import { POST as postAdminAction } from '../src/app/api/admin/action/route';
import { DELETE as deleteAdminCitizens } from '../src/app/api/admin/citizens/route';
import { GET as getAuthSession } from '../src/app/api/auth/session/route';
import { NextRequest } from 'next/server';

describe('Admin Citizen Account Deletion & Revocation Suite', () => {
  const chiefAdminUser = {
    uid: 'SSB-ADMIN-0001',
    name: 'Aryan Singh (Chief Admin)',
    emailOrPhone: 'admin@scamshieldbharat.live',
    role: 'admin' as const,
    designation: 'Chief Cyber Safety Officer',
    organization: 'ScamShield Bharat',
    verified: true,
  };

  const ordinaryCitizenUser = {
    uid: 'SSB-2026-888001',
    name: 'Regular Citizen',
    emailOrPhone: '9811002233',
    role: 'investor' as const,
    designation: 'Citizen Member',
    organization: 'ScamShield Bharat',
    verified: true,
  };

  const chiefAdminToken = signSessionToken(chiefAdminUser);
  const ordinaryCitizenToken = signSessionToken(ordinaryCitizenUser);

  beforeEach(() => {
    resetCitizenStoreForTesting();
    clearLocalAuthCaches();
  });

  describe('1. Authorized Server-Side Citizen Deletion', () => {
    it('deletes citizen account via POST /api/admin/action when requested by Chief Admin', async () => {
      // 1. Create a synthetic test citizen
      const reg = await createCitizenAccountAsync({
        identifier: '9870001122',
        password: 'TestPassword@2026',
        name: 'Tarun Verma',
      });
      expect(reg.success).toBe(true);
      const targetUid = reg.citizen!.uid;

      // Confirm existence prior to deletion
      const before = await getCitizenAccountAsync(targetUid);
      expect(before).not.toBeNull();
      expect(before?.name).toBe('Tarun Verma');

      // 2. Dispatch DELETE_CITIZEN action
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chiefAdminToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid: targetUid },
        }),
      });

      const res = await postAdminAction(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('DELETE_CITIZEN');
      expect(data.uid).toBe(targetUid);

      // 3. Confirm deletion in authoritative datastore
      const after = await getCitizenAccountAsync(targetUid);
      expect(after).toBeNull();

      const allAccounts = await getAllCitizenAccountsAsync();
      const inList = allAccounts.find((c) => c.uid === targetUid);
      expect(inList).toBeUndefined();
    });

    it('deletes citizen account via DELETE /api/admin/citizens endpoint', async () => {
      const reg = await createCitizenAccountAsync({
        identifier: '9870003344',
        password: 'TestPassword@2026',
        name: 'Geeta Nair',
      });
      expect(reg.success).toBe(true);
      const targetUid = reg.citizen!.uid;

      const req = new NextRequest(`http://localhost:3000/api/admin/citizens?uid=${targetUid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${chiefAdminToken}`,
        },
      });

      const res = await deleteAdminCitizens(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.uid).toBe(targetUid);

      const after = await getCitizenAccountAsync(targetUid);
      expect(after).toBeNull();
    });
  });

  describe('2. Authorization Checks & Security Boundaries', () => {
    it('rejects unauthenticated deletion requests with HTTP 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid: 'SSB-2026-999999' },
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(401);
    });

    it('rejects deletion requests from ordinary citizen or investor accounts with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ordinaryCitizenToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid: 'SSB-2026-999999' },
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('FORBIDDEN_ROLE');
    });

    it('rejects DELETE /api/admin/citizens from ordinary citizen accounts with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/citizens?uid=SSB-2026-999999', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ordinaryCitizenToken}`,
        },
      });

      const res = await deleteAdminCitizens(req);
      expect(res.status).toBe(403);
    });

    it('rejects requests with missing or empty target UID with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chiefAdminToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: {},
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('MISSING_UID');
    });
  });

  describe('3. Immutable Executive Account Protection', () => {
    it('strictly forbids deletion of Chief Admin (SSB-ADMIN-0001)', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chiefAdminToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid: 'SSB-ADMIN-0001' },
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('PROTECTED_ACCOUNT');

      // Verify Chief Admin is fully intact
      const chief = await getCitizenAccountAsync('SSB-ADMIN-0001');
      expect(chief).not.toBeNull();
      expect(chief?.role).toBe('admin');
      expect(chief?.isUnlimited).toBe(true);
    });

    it('strictly forbids deletion of President (SSB-PRESIDENT-0001)', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chiefAdminToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid: 'SSB-PRESIDENT-0001' },
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('PROTECTED_ACCOUNT');

      const president = await getCitizenAccountAsync('SSB-PRESIDENT-0001');
      expect(president).not.toBeNull();
      expect(president?.role).toBe('admin');
    });

    it('strictly forbids deletion via direct deleteCitizenAccountAsync call on protected identifiers', async () => {
      const deleteChief = await deleteCitizenAccountAsync('SSB-ADMIN-0001');
      expect(deleteChief.success).toBe(false);
      expect(deleteChief.code).toBe('PROTECTED_ACCOUNT');

      const deletePresident = await deleteCitizenAccountAsync('SSB-PRESIDENT-0001');
      expect(deletePresident.success).toBe(false);
      expect(deletePresident.code).toBe('PROTECTED_ACCOUNT');

      const deleteReserved = await deleteCitizenAccountAsync('admin@scamshieldbharat.live');
      expect(deleteReserved.success).toBe(false);
      expect(deleteReserved.code).toBe('PROTECTED_ACCOUNT');
    });
  });

  describe('4. Active Session Revocation & Login Invalidation', () => {
    it('revokes active JWT session token immediately upon deletion', async () => {
      // 1. Create a citizen and issue session token
      const reg = await createCitizenAccountAsync({
        identifier: '9870005566',
        password: 'Password@2026',
        name: 'Ramesh Patel',
      });
      const citizen = reg.citizen!;
      const citizenSessionToken = signSessionToken({
        uid: citizen.uid,
        name: citizen.name,
        emailOrPhone: citizen.normalizedIdentifier,
        role: citizen.role,
        verified: true,
      });

      // 2. Token is initially valid
      const verifyBefore = await verifySessionTokenAsync(citizenSessionToken);
      expect(verifyBefore.valid).toBe(true);
      expect(verifyBefore.user?.uid).toBe(citizen.uid);

      // 3. Delete citizen account
      const del = await deleteCitizenAccountAsync(citizen.uid);
      expect(del.success).toBe(true);

      // 4. Token must be immediately rejected
      const verifyAfter = await verifySessionTokenAsync(citizenSessionToken);
      expect(verifyAfter.valid).toBe(false);
      expect(verifyAfter.error).toBe('REVOKED_TOKEN');
    });

    it('returns accountDeleted: true from /api/auth/session for deleted citizen', async () => {
      const reg = await createCitizenAccountAsync({
        identifier: '9870007788',
        password: 'Password@2026',
        name: 'Kavita Joshi',
      });
      const citizen = reg.citizen!;
      const citizenSessionToken = signSessionToken({
        uid: citizen.uid,
        name: citizen.name,
        emailOrPhone: citizen.normalizedIdentifier,
        role: citizen.role,
        verified: true,
      });

      // Delete citizen
      await deleteCitizenAccountAsync(citizen.uid);

      // Call session endpoint with token
      const reqWithCookie = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${citizenSessionToken}`,
        },
      });

      const resCookie = await getAuthSession(reqWithCookie);
      const dataCookie = await resCookie.json();

      expect(dataCookie.authenticated).toBe(false);
      expect(dataCookie.user).toBeNull();
      expect(dataCookie.accountDeleted).toBe(true);
      expect(resCookie.cookies.get(SESSION_COOKIE_NAME)?.value === '' || resCookie.cookies.get(SESSION_COOKIE_NAME)?.maxAge === 0).toBe(true);

      // Call session endpoint with ?uid query
      const reqWithUid = new NextRequest(`http://localhost:3000/api/auth/session?uid=${citizen.uid}`);
      const resUid = await getAuthSession(reqWithUid);
      const dataUid = await resUid.json();

      expect(dataUid.authenticated).toBe(false);
      expect(dataUid.user).toBeNull();
      expect(dataUid.accountDeleted).toBe(true);
      expect(resUid.cookies.get(SESSION_COOKIE_NAME)?.value === '' || resUid.cookies.get(SESSION_COOKIE_NAME)?.maxAge === 0).toBe(true);
    });
  });

  describe('5. Cross-Device Polling & Non-Resurrection', () => {
    it('ensures deleted account does not reappear across repeated getAllCitizenAccountsAsync calls', async () => {
      const reg = await createCitizenAccountAsync({
        identifier: '9870009900',
        password: 'Password@2026',
        name: 'Amitabh Sen',
      });
      const targetUid = reg.citizen!.uid;

      // Delete
      await deleteCitizenAccountAsync(targetUid);

      // Repeated reads simulating polling intervals
      for (let i = 0; i < 5; i++) {
        const accounts = await getAllCitizenAccountsAsync();
        const found = accounts.find((c) => c.uid === targetUid);
        expect(found).toBeUndefined();

        const singleLookup = await getCitizenAccountAsync(targetUid);
        expect(singleLookup).toBeNull();
      }
    });
  });

  describe('6. Idempotency & Repeated Deletions', () => {
    it('handles repeated deletion requests for the same citizen safely and idempotently', async () => {
      const reg = await createCitizenAccountAsync({
        identifier: '9870001234',
        password: 'Password@2026',
        name: 'Deepak Chopra',
      });
      const targetUid = reg.citizen!.uid;

      // First deletion
      const firstDel = await deleteCitizenAccountAsync(targetUid);
      expect(firstDel.success).toBe(true);
      expect(firstDel.alreadyDeleted).toBeUndefined();

      // Second deletion (idempotent)
      const secondDel = await deleteCitizenAccountAsync(targetUid);
      expect(secondDel.success).toBe(true);
      expect(secondDel.alreadyDeleted).toBe(true);

      // Third deletion via HTTP POST /api/admin/action
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chiefAdminToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid: targetUid },
        }),
      });

      const res = await postAdminAction(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alreadyDeleted).toBe(true);
    });

    it('safely handles deletion requests for non-existent UIDs without crashing or corrupting store', async () => {
      const nonExistentUid = 'SSB-2026-999999';
      const result = await deleteCitizenAccountAsync(nonExistentUid);
      expect(result.success).toBe(true);
      expect(result.alreadyDeleted).toBe(true);
    });
  });

  describe('7. Isolation: Deleting Citizen A Never Impacts Citizen B', () => {
    it('preserves other citizen records when deleting a specific target', async () => {
      const userA = await createCitizenAccountAsync({
        identifier: '9870000001',
        password: 'PasswordA@2026',
        name: 'User Alpha',
      });
      const userB = await createCitizenAccountAsync({
        identifier: '9870000002',
        password: 'PasswordB@2026',
        name: 'User Beta',
      });

      expect(userA.success).toBe(true);
      expect(userB.success).toBe(true);

      const uidA = userA.citizen!.uid;
      const uidB = userB.citizen!.uid;

      // Delete User A
      const delA = await deleteCitizenAccountAsync(uidA);
      expect(delA.success).toBe(true);

      // Verify User A is deleted
      const checkA = await getCitizenAccountAsync(uidA);
      expect(checkA).toBeNull();

      // Verify User B is completely untouched and intact
      const checkB = await getCitizenAccountAsync(uidB);
      expect(checkB).not.toBeNull();
      expect(checkB?.name).toBe('User Beta');
      expect(checkB?.normalizedIdentifier).toBe('9870000002');
    });
  });

  describe('8. Redis Deletion Reliability & Error Propagation', () => {
    const originalFetch = global.fetch;
    const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    afterEach(() => {
      global.fetch = originalFetch;
      if (originalRedisUrl !== undefined) {
        process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
      } else {
        delete process.env.UPSTASH_REDIS_REST_URL;
      }
      if (originalRedisToken !== undefined) {
        process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
      } else {
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
      }
    });

    it('surfaces failure and does not delete account when Upstash returns HTTP 500', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-secret-token';

      const reg = await createCitizenAccountAsync({
        identifier: '9870004455',
        password: 'Password@2026',
        name: 'Failure Test Citizen',
      });
      const uid = reg.citizen!.uid;

      // Mock fetch to simulate Upstash HTTP 500 error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      } as any);

      // Attempt deletion via deleteCitizenAccountAsync
      const result = await deleteCitizenAccountAsync(uid);
      expect(result.success).toBe(false);
      expect(result.code).toBe('REDIS_HTTP_ERROR');

      // Attempt deletion via POST /api/admin/action
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chiefAdminToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid },
        }),
      });

      const res = await postAdminAction(req);
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('REDIS_HTTP_ERROR');

      // Account must still exist in memory because Redis failed
      const check = await getCitizenAccountAsync(uid);
      expect(check).not.toBeNull();
      expect(check?.name).toBe('Failure Test Citizen');
    });

    it('surfaces failure and rejects deletion when Redis network times out', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-secret-token';

      const reg = await createCitizenAccountAsync({
        identifier: '9870005566',
        password: 'Password@2026',
        name: 'Timeout Test Citizen',
      });
      const uid = reg.citizen!.uid;

      // Mock fetch to simulate network timeout / AbortError
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortErr);

      const result = await deleteCitizenAccountAsync(uid);
      expect(result.success).toBe(false);
      expect(result.code).toBe('REDIS_TIMEOUT');

      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chiefAdminToken}`,
        },
        body: JSON.stringify({
          action: 'DELETE_CITIZEN',
          payload: { uid },
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(504);
    });

    it('surfaces failure when pipeline contains command-level error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-secret-token';

      const reg = await createCitizenAccountAsync({
        identifier: '9870006677',
        password: 'Password@2026',
        name: 'Command Error Citizen',
      });
      const uid = reg.citizen!.uid;

      // Mock fetch returning HTTP 200 but one command having an error
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          { result: 1 },
          { error: 'ERR write command failed on read-only replica' },
        ],
      } as any);

      const result = await deleteCitizenAccountAsync(uid);
      expect(result.success).toBe(false);
      expect(result.code).toBe('REDIS_COMMAND_ERROR');
    });
  });

  describe('9. Session Cookie Deletion on Every Revocation / Deletion Branch', () => {
    it('deletes cookie when session token is valid but citizen record is deleted', async () => {
      // User creates account and obtains session token
      const reg = await createCitizenAccountAsync({
        identifier: '9870007799',
        password: 'Password@2026',
        name: 'Valid Token Deleted Acct',
      });
      const citizen = reg.citizen!;
      const token = signSessionToken({
        uid: citizen.uid,
        name: citizen.name,
        emailOrPhone: citizen.normalizedIdentifier,
        role: citizen.role,
        verified: true,
      });

      // Manually delete account from store
      await deleteCitizenAccountAsync(citizen.uid);

      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const res = await getAuthSession(req);
      const data = await res.json();

      expect(data.authenticated).toBe(false);
      expect(data.accountDeleted).toBe(true);
      expect(res.cookies.get(SESSION_COOKIE_NAME)?.value === '' || res.cookies.get(SESSION_COOKIE_NAME)?.maxAge === 0).toBe(true);
    });

    it('preserves normal unauthenticated guest requests without deleting cookies', async () => {
      const guestReq = new NextRequest('http://localhost:3000/api/auth/session');
      const res = await getAuthSession(guestReq);
      const data = await res.json();

      expect(data.authenticated).toBe(false);
      expect(data.user).toBeNull();
      expect(data.accountDeleted).toBeUndefined();
      expect(res.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
    });
  });

  describe('10. Protection Against Unauthenticated Profile Disclosure & UID Impersonation', () => {
    it('never discloses citizen profile to unauthenticated caller requesting ?uid=', async () => {
      const reg = await createCitizenAccountAsync({
        identifier: '9870009988',
        password: 'Password@2026',
        name: 'Secret Profile User',
      });
      const targetUid = reg.citizen!.uid;

      // An unauthenticated attacker queries /api/auth/session?uid=targetUid
      const req = new NextRequest(`http://localhost:3000/api/auth/session?uid=${targetUid}`);
      const res = await getAuthSession(req);
      const data = await res.json();

      // Must be unauthenticated and user must be null
      expect(data.authenticated).toBe(false);
      expect(data.user).toBeNull();
    });

    it('rejects UID mismatch when authenticated citizen requests another citizen UID', async () => {
      const regTarget = await createCitizenAccountAsync({
        identifier: '9870001133',
        password: 'Password@2026',
        name: 'Target Citizen',
      });
      const targetUid = regTarget.citizen!.uid;

      // Ordinary citizen attempts to pass someone else's UID in query parameter
      const req = new NextRequest(`http://localhost:3000/api/auth/session?uid=${targetUid}`, {
        headers: {
          Authorization: `Bearer ${ordinaryCitizenToken}`,
        },
      });

      const res = await getAuthSession(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('UID_MISMATCH');
    });

    it('permits authenticated citizen to query their own UID and receive live entitlements', async () => {
      const reg = await createCitizenAccountAsync({
        identifier: '9870002244',
        password: 'Password@2026',
        name: 'Entitled Citizen',
      });
      const citizen = reg.citizen!;
      const token = signSessionToken({
        uid: citizen.uid,
        name: citizen.name,
        emailOrPhone: citizen.normalizedIdentifier,
        role: citizen.role,
        verified: true,
      });

      const req = new NextRequest(`http://localhost:3000/api/auth/session?uid=${citizen.uid}`, {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const res = await getAuthSession(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user).not.toBeNull();
      expect(data.user.uid).toBe(citizen.uid);
      expect(data.user.name).toBe('Entitled Citizen');
    });
  });

  describe('11. Safe Re-registration After Deletion (Tombstone Isolation)', () => {
    it('allows re-registration with previously deleted mobile identifier while keeping old UID permanently tombstoned', async () => {
      const mobile = '9870003355';

      // 1. Initial registration
      const reg1 = await createCitizenAccountAsync({
        identifier: mobile,
        password: 'OriginalPassword@2026',
        name: 'Original User',
      });
      expect(reg1.success).toBe(true);
      const oldUid = reg1.citizen!.uid;
      const oldToken = signSessionToken({
        uid: oldUid,
        name: 'Original User',
        emailOrPhone: mobile,
        role: 'investor',
        verified: true,
      });

      // 2. Delete the account
      const del = await deleteCitizenAccountAsync(oldUid);
      expect(del.success).toBe(true);

      // Verify old UID is tombstoned and cannot be retrieved
      const checkOld = await getCitizenAccountAsync(oldUid);
      expect(checkOld).toBeNull();

      // Old session token is rejected
      const verifyOldToken = await verifySessionTokenAsync(oldToken);
      expect(verifyOldToken.valid).toBe(false);
      expect(verifyOldToken.error).toBe('REVOKED_TOKEN');

      // 3. Re-register with the same mobile identifier
      const reg2 = await createCitizenAccountAsync({
        identifier: mobile,
        password: 'NewPassword@2026',
        name: 'Recreated User',
      });
      expect(reg2.success).toBe(true);
      const newUid = reg2.citizen!.uid;
      expect(newUid).not.toBe(oldUid); // Must receive a new UID

      // 4. Verify new account can be retrieved by mobile
      const checkNew = await getCitizenAccountAsync(mobile);
      expect(checkNew).not.toBeNull();
      expect(checkNew?.uid).toBe(newUid);
      expect(checkNew?.name).toBe('Recreated User');

      // 5. Old deleted UID remains permanently dead
      const checkOldAgain = await getCitizenAccountAsync(oldUid);
      expect(checkOldAgain).toBeNull();

      // 6. Old session token remains revoked and rejected
      const verifyOldAgain = await verifySessionTokenAsync(oldToken);
      expect(verifyOldAgain.valid).toBe(false);

      // 7. New token for the new UID is valid and accepted
      const newToken = signSessionToken({
        uid: newUid,
        name: 'Recreated User',
        emailOrPhone: mobile,
        role: 'investor',
        verified: true,
      });
      const verifyNewToken = await verifySessionTokenAsync(newToken);
      expect(verifyNewToken.valid).toBe(true);
      expect(verifyNewToken.user?.uid).toBe(newUid);
    });
  });
});
