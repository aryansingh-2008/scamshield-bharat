import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createCitizenAccountAsync,
  getCitizenAccountAsync,
  getAllCitizenAccountsAsync,
  allotCitizenPremiumAsync,
  deductCitizenCreditAsync,
  ALLOWED_PREMIUM_DURATIONS,
  MAX_CUSTOM_PREMIUM_DAYS,
} from '../src/lib/server-citizen-auth';
import { signSessionToken } from '../src/lib/server-auth';
import { GET as getAdminCitizens } from '../src/app/api/admin/citizens/route';
import { POST as postAdminAction } from '../src/app/api/admin/action/route';
import { GET as getAuthSession } from '../src/app/api/auth/session/route';
import { POST as postAuthLogin } from '../src/app/api/auth/login/route';
import { NextRequest } from 'next/server';

describe('Admin Citizens Dashboard & Premium Allotment Suite', () => {
  const adminUser = {
    uid: 'SSB-ADMIN-0001',
    name: 'Aryan Singh (Chief Admin)',
    emailOrPhone: 'admin@scamshieldbharat.live',
    role: 'admin' as const,
    designation: 'Chief Cyber Safety Officer',
    organization: 'ScamShield Bharat',
    verified: true,
  };

  const citizenUser = {
    uid: 'SSB-2026-999001',
    name: 'Test Citizen',
    emailOrPhone: '9811223344',
    role: 'investor' as const,
    designation: 'Verified Citizen',
    organization: 'Self',
    verified: true,
  };

  const adminToken = signSessionToken(adminUser);
  const citizenToken = signSessionToken(citizenUser);

  describe('1. Registration-to-Dashboard Backend Persistence', () => {
    it('persists newly registered citizens in authoritative datastore and returns them via getAllCitizenAccountsAsync', async () => {
      const reg = await createCitizenAccountAsync({
        identifier: '9822334455',
        password: 'Password@2026',
        name: 'Sunil Verma',
      });

      expect(reg.success).toBe(true);
      expect(reg.citizen).toBeDefined();
      expect(reg.citizen?.uid).toMatch(/^SSB-\d{4}-\d{6}$/);

      // Verify retrieval from backend store
      const allAccounts = await getAllCitizenAccountsAsync();
      const found = allAccounts.find((c) => c.uid === reg.citizen?.uid);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Sunil Verma');
      expect(found?.normalizedIdentifier).toBe('9822334455');
      expect(found?.credits).toBe(3);
      expect(found?.isUnlimited).toBe(false);
    });

    it('prevents duplicate citizen registrations for the same mobile identifier', async () => {
      const first = await createCitizenAccountAsync({
        identifier: '9833445566',
        password: 'Password@2026',
        name: 'First User',
      });
      expect(first.success).toBe(true);

      const duplicate = await createCitizenAccountAsync({
        identifier: '+91 9833445566',
        password: 'DifferentPassword@2026',
        name: 'Second User',
      });
      expect(duplicate.success).toBe(false);
      expect(duplicate.code).toBe('ACCOUNT_ALREADY_EXISTS');
    });

    it('exposes newly registered citizens via GET /api/admin/citizens to authenticated admin', async () => {
      const newMobile = '9844556677';
      const created = await createCitizenAccountAsync({
        identifier: newMobile,
        password: 'SecurePass#9844',
        name: 'Pooja Agarwal',
      });
      expect(created.success).toBe(true);

      const req = new NextRequest('http://localhost:3000/api/admin/citizens', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const res = await getAdminCitizens(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.citizens)).toBe(true);

      const target = body.citizens.find((c: any) => c.uid === created.citizen?.uid);
      expect(target).toBeDefined();
      expect(target.name).toBe('Pooja Agarwal');
      expect(target.emailOrPhone).toBe('9844556677');
    });

    it('strictly strips password hashes and salts from GET /api/admin/citizens response', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/citizens', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const res = await getAdminCitizens(req);
      const body = await res.json();
      expect(res.status).toBe(200);

      for (const citizen of body.citizens) {
        expect(citizen.salt).toBeUndefined();
        expect(citizen.passwordHash).toBeUndefined();
        expect(citizen.iterations).toBeUndefined();
        expect(citizen.password).toBeUndefined();
      }
    });

    it('rejects unauthenticated requests to GET /api/admin/citizens with HTTP 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/citizens');
      const res = await getAdminCitizens(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.code).toBe('UNAUTHENTICATED');
    });

    it('rejects ordinary citizen/investor sessions from GET /api/admin/citizens with HTTP 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/citizens', {
        headers: {
          Authorization: `Bearer ${citizenToken}`,
        },
      });

      const res = await getAdminCitizens(req);
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.code).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('2. Premium Allotment Duration & Server-Side Expiry Calculation', () => {
    it('validates supported predefined duration options (7, 30, 90, 180, 365 days)', () => {
      expect(ALLOWED_PREMIUM_DURATIONS).toEqual([7, 30, 90, 180, 365]);
      expect(MAX_CUSTOM_PREMIUM_DAYS).toBe(3650);
    });

    it('grants new Premium access and calculates expiry strictly server-side', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9855667788',
        password: 'Password@2026',
        name: 'Ramesh Patel',
      });
      const uid = citizen.citizen!.uid;

      const beforeAllot = Date.now();
      const allot = await allotCitizenPremiumAsync({
        uid,
        days: 30,
        allottedBy: 'SSB-ADMIN-0001',
      });

      expect(allot.success).toBe(true);
      expect(allot.actionType).toBe('GRANTED');
      expect(allot.citizen?.isUnlimited).toBe(true);
      expect(allot.newExpiry).toBeGreaterThanOrEqual(beforeAllot + 30 * 86400000);
      expect(allot.newExpiry).toBeLessThanOrEqual(Date.now() + 30 * 86400000 + 1000);
      expect(allot.citizen?.premiumStartedAt).toBeDefined();

      // Datastore inspection
      const refreshed = await getCitizenAccountAsync(uid);
      expect(refreshed?.isUnlimited).toBe(true);
      expect(refreshed?.unlimitedExpiresAt).toBe(allot.newExpiry);
    });

    it('extends active Premium by adding duration to the existing expiry date without shortening access', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9866778899',
        password: 'Password@2026',
        name: 'Geeta Sen',
      });
      const uid = citizen.citizen!.uid;

      // 1. Initial 30-day grant
      const firstGrant = await allotCitizenPremiumAsync({
        uid,
        days: 30,
        allottedBy: 'SSB-ADMIN-0001',
      });
      const firstExpiry = firstGrant.newExpiry!;

      // 2. Extend by another 60 days while active
      const extension = await allotCitizenPremiumAsync({
        uid,
        days: 60,
        allottedBy: 'SSB-ADMIN-0001',
      });

      expect(extension.success).toBe(true);
      expect(extension.actionType).toBe('EXTENDED');
      expect(extension.previousExpiry).toBe(firstExpiry);
      expect(extension.newExpiry).toBe(firstExpiry + 60 * 86400000);

      // Verify datastore reflects cumulative duration
      const inStore = await getCitizenAccountAsync(uid);
      expect(inStore?.unlimitedExpiresAt).toBe(firstExpiry + 60 * 86400000);
    });

    it('allots Premium to an expired account by calculating new period from current server time', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9877889900',
        password: 'Password@2026',
        name: 'Anand Kumar',
      });
      const uid = citizen.citizen!.uid;

      // Manually simulate an expired Premium in the past
      const acct = (await getCitizenAccountAsync(uid))!;
      acct.isUnlimited = true;
      acct.unlimitedExpiresAt = Date.now() - 5 * 86400000; // Expired 5 days ago
      await allotCitizenPremiumAsync({
        uid,
        days: 14,
        allottedBy: 'SSB-ADMIN-0001',
      });

      const updated = await getCitizenAccountAsync(uid);
      expect(updated?.isUnlimited).toBe(true);
      // New expiry must be calculated from now, not from the past expired timestamp
      expect(updated?.unlimitedExpiresAt).toBeGreaterThan(Date.now() + 13 * 86400000);
      expect(updated?.unlimitedExpiresAt).toBeLessThanOrEqual(Date.now() + 14 * 86400000 + 1000);
    });

    it('rejects invalid custom durations (0, negative, non-integer, >3650 days)', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9888990011',
        password: 'Password@2026',
        name: 'Kavita Joshi',
      });
      const uid = citizen.citizen!.uid;

      // Zero days
      const resZero = await allotCitizenPremiumAsync({ uid, days: 0, allottedBy: 'admin' });
      expect(resZero.success).toBe(false);
      expect(resZero.code).toBe('INVALID_DURATION');

      // Negative days
      const resNeg = await allotCitizenPremiumAsync({ uid, days: -10, allottedBy: 'admin' });
      expect(resNeg.success).toBe(false);
      expect(resNeg.code).toBe('INVALID_DURATION');

      // Non-integer days
      const resFloat = await allotCitizenPremiumAsync({ uid, days: 15.5 as any, allottedBy: 'admin' });
      expect(resFloat.success).toBe(false);
      expect(resFloat.code).toBe('INVALID_DURATION');

      // Excessive days (>3650)
      const resExcess = await allotCitizenPremiumAsync({ uid, days: 5000, allottedBy: 'admin' });
      expect(resExcess.success).toBe(false);
      expect(resExcess.code).toBe('INVALID_DURATION');
    });

    it('enforces credit deduction once Premium access has expired', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9899001122',
        password: 'Password@2026',
        name: 'Deepak Roy',
        initialCredits: 2,
      });
      const uid = citizen.citizen!.uid;

      // 1. Allot 1-day Premium
      await allotCitizenPremiumAsync({ uid, days: 1, allottedBy: 'admin' });

      // Active Premium: No credits deducted
      const deduct1 = await deductCitizenCreditAsync(uid);
      expect(deduct1.success).toBe(true);
      expect(deduct1.isUnlimited).toBe(true);
      expect(deduct1.creditsRemaining).toBe(2);

      // 2. Simulate expiry in the past
      const acct = (await getCitizenAccountAsync(uid))!;
      acct.unlimitedExpiresAt = Date.now() - 1000; // Expired 1 second ago

      // Post-Expiry: Must deduct 1 safety credit
      const deduct2 = await deductCitizenCreditAsync(uid);
      expect(deduct2.success).toBe(true);
      expect(deduct2.isUnlimited).toBeUndefined();
      expect(deduct2.creditsRemaining).toBe(1);

      // Second post-expiry scan: Deducts remaining credit
      const deduct3 = await deductCitizenCreditAsync(uid);
      expect(deduct3.success).toBe(true);
      expect(deduct3.creditsRemaining).toBe(0);

      // Third post-expiry scan: Rejects with INSUFFICIENT_CREDITS
      const deduct4 = await deductCitizenCreditAsync(uid);
      expect(deduct4.success).toBe(false);
      expect(deduct4.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('handles ALLOT_PREMIUM via POST /api/admin/action for authorized admin', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9800112233',
        password: 'Password@2026',
        name: 'Monika Das',
      });
      const uid = citizen.citizen!.uid;

      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'ALLOT_PREMIUM',
          payload: {
            uid,
            days: 90,
          },
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.action).toBe('ALLOT_PREMIUM');
      expect(body.actionType).toBe('GRANTED');
      expect(body.newExpiry).toBeDefined();

      const inStore = await getCitizenAccountAsync(uid);
      expect(inStore?.isUnlimited).toBe(true);
      expect(inStore?.unlimitedExpiresAt).toBe(body.newExpiry);
    });

    it('strictly denies unauthorized users from executing ALLOT_PREMIUM via /api/admin/action', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${citizenToken}`, // ordinary citizen session
        },
        body: JSON.stringify({
          action: 'ALLOT_PREMIUM',
          payload: {
            uid: citizenUser.uid,
            days: 365,
          },
        }),
      });

      const res = await postAdminAction(req);
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.code).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('3. Citizen Session & End-to-End Premium Activation Propagation', () => {
    it('activates 7-day Premium for a 25-credit citizen and reflects immediately in /api/auth/session', async () => {
      // 1. Create citizen with 25 credits
      const citizen = await createCitizenAccountAsync({
        identifier: '9877001122',
        password: 'Password@2026',
        name: 'Aryan Sharma',
        initialCredits: 25,
      });
      expect(citizen.success).toBe(true);
      const uid = citizen.citizen!.uid;

      // Initial state: 25 credits, not unlimited
      const initialAcct = await getCitizenAccountAsync(uid);
      expect(initialAcct?.credits).toBe(25);
      expect(initialAcct?.isUnlimited).toBe(false);

      // 2. Admin allots 7 days of Premium
      const allotReq = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'ALLOT_PREMIUM',
          payload: { uid, days: 7 },
        }),
      });
      const allotRes = await postAdminAction(allotReq);
      expect(allotRes.status).toBe(200);

      // 3. Citizen session reflects Premium status
      const userToken = signSessionToken({
        uid,
        name: 'Aryan Sharma',
        emailOrPhone: '9877001122',
        role: 'investor',
        designation: 'Verified Citizen Member',
        organization: 'ScamShield Bharat',
        verified: true,
      });

      const sessionReq = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const sessionRes = await getAuthSession(sessionReq);
      expect(sessionRes.status).toBe(200);

      const sessionBody = await sessionRes.json();
      expect(sessionBody.authenticated).toBe(true);
      expect(sessionBody.user.isUnlimited).toBe(true);
      expect(sessionBody.user.unlimitedExpiresAt).toBeGreaterThan(Date.now());
      expect(sessionBody.user.credits).toBe(25);

      // 4. Verification that 25-credit limit no longer deducts credits
      const deductResult = await deductCitizenCreditAsync(uid);
      expect(deductResult.success).toBe(true);
      expect(deductResult.isUnlimited).toBe(true);
      expect(deductResult.creditsRemaining).toBe(25); // preserved at 25 without deduction!
    });

    it('persists Premium across re-login (/api/auth/login)', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9877112233',
        password: 'Pass#2026Active',
        name: 'Pooja Nair',
        initialCredits: 25,
      });
      const uid = citizen.citizen!.uid;

      // Admin allots 30 days Premium
      await allotCitizenPremiumAsync({ uid, days: 30, allottedBy: 'SSB-ADMIN-0001' });

      // Citizen signs in
      const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: '9877112233',
          password: 'Pass#2026Active',
        }),
      });

      const loginRes = await postAuthLogin(loginReq);
      expect(loginRes.status).toBe(200);

      const loginBody = await loginRes.json();
      expect(loginBody.success).toBe(true);
      expect(loginBody.user.isUnlimited).toBe(true);
      expect(loginBody.user.unlimitedExpiresAt).toBeGreaterThan(Date.now());
      expect(loginBody.user.credits).toBe(25);
    });

    it('updates citizen entitlements and unlimited status via APPOINT_POST', async () => {
      const citizen = await createCitizenAccountAsync({
        identifier: '9877223344',
        password: 'Secret#2026Post',
        name: 'Karan Patel',
        initialCredits: 10,
      });
      const uid = citizen.citizen!.uid;

      // Admin alters role with Unlimited Pro Pass checked and 25 credits
      const appointReq = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'APPOINT_POST',
          payload: {
            uid,
            name: 'Karan Patel (Vice President)',
            role: 'admin',
            designation: 'Vice President',
            organization: 'ScamShield Bharat',
            credits: 25,
            isUnlimited: true,
          },
        }),
      });

      const appointRes = await postAdminAction(appointReq);
      expect(appointRes.status).toBe(200);

      const inStore = await getCitizenAccountAsync(uid);
      expect(inStore?.name).toBe('Karan Patel (Vice President)');
      expect(inStore?.role).toBe('admin');
      expect(inStore?.credits).toBe(25);
      expect(inStore?.isUnlimited).toBe(true);
      expect(inStore?.unlimitedExpiresAt).toBeGreaterThan(Date.now());
    });

    it('creates a new citizen account via APPOINT_POST when citizen does not exist previously', async () => {
      const newUid = 'SSB-2026-889911';
      const appointReq = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'APPOINT_POST',
          payload: {
            uid: newUid,
            name: 'Meena Kumari',
            emailOrPhone: '9899887766',
            role: 'investor',
            designation: 'Advisory Member',
            organization: 'ScamShield Bharat',
            credits: 30,
            isUnlimited: true,
            password: 'Meena@Secure2026',
          },
        }),
      });

      const appointRes = await postAdminAction(appointReq);
      expect(appointRes.status).toBe(200);

      const inStore = await getCitizenAccountAsync(newUid);
      expect(inStore).toBeDefined();
      expect(inStore?.name).toBe('Meena Kumari');
      expect(inStore?.normalizedIdentifier).toBe('9899887766');
      expect(inStore?.isUnlimited).toBe(true);
      expect(inStore?.credits).toBe(30);
    });

    it('allots Premium to seeded citizen Rohan Gupta (SSB-2026-102948)', async () => {
      const allotReq = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'ALLOT_PREMIUM',
          payload: {
            uid: 'SSB-2026-102948',
            days: 30,
          },
        }),
      });

      const allotRes = await postAdminAction(allotReq);
      expect(allotRes.status).toBe(200);

      const inStore = await getCitizenAccountAsync('SSB-2026-102948');
      expect(inStore?.isUnlimited).toBe(true);
      expect(inStore?.unlimitedExpiresAt).toBeGreaterThan(Date.now());
    });

    it('allows unauthenticated client session to query Pro status by ?uid=SSB-...', async () => {
      const sessionReq = new NextRequest('http://localhost:3000/api/auth/session?uid=SSB-2026-102948');
      const sessionRes = await getAuthSession(sessionReq);
      expect(sessionRes.status).toBe(200);

      const data = await sessionRes.json();
      expect(data.authenticated).toBe(false);
      expect(data.user).toBeDefined();
      expect(data.user.uid).toBe('SSB-2026-102948');
      expect(data.user.isUnlimited).toBe(true);
    });

    it('approves UTR transaction and updates citizen Pro status on server via APPROVE_UTR', async () => {
      const utrReq = new NextRequest('http://localhost:3000/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'APPROVE_UTR',
          payload: {
            utr: '439281029999',
            userUid: 'SSB-2026-784210',
            planId: 'pro',
            notes: 'Approved via GPay',
          },
        }),
      });

      const utrRes = await postAdminAction(utrReq);
      expect(utrRes.status).toBe(200);

      const inStore = await getCitizenAccountAsync('SSB-2026-784210');
      expect(inStore?.isUnlimited).toBe(true);
      expect(inStore?.unlimitedExpiresAt).toBeGreaterThan(Date.now());
    });
  });
});
