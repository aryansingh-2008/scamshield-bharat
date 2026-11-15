import { describe, it, expect, beforeEach, vi } from 'vitest';

// Allow testing server-only module in Vitest Node runner
vi.mock('server-only', () => ({}));

import {
  createCitizenAccountAsync,
  getCitizenAccountAsync,
  deductCitizenCreditAsync,
  refundCitizenCreditAsync,
  saveCitizenAccountAsync,
  resetCitizenStoreForTesting,
} from '../src/lib/server-citizen-auth';

describe('Credit Persistence and Atomic Accounting Suite', () => {
  beforeEach(() => {
    resetCitizenStoreForTesting();
  });

  it('deducts credits authoritatively on the server down to zero', async () => {
    const created = await createCitizenAccountAsync({
      identifier: '9811122233',
      password: 'StrongPassword@123',
      name: 'Credit Test User',
      initialCredits: 3,
    });
    const uid = created.citizen!.uid;

    // First scan: 3 -> 2
    const d1 = await deductCitizenCreditAsync(uid);
    expect(d1.success).toBe(true);
    expect(d1.creditsRemaining).toBe(2);

    // Second scan: 2 -> 1
    const d2 = await deductCitizenCreditAsync(uid);
    expect(d2.success).toBe(true);
    expect(d2.creditsRemaining).toBe(1);

    // Third scan: 1 -> 0
    const d3 = await deductCitizenCreditAsync(uid);
    expect(d3.success).toBe(true);
    expect(d3.creditsRemaining).toBe(0);

    // Fourth scan: rejected due to insufficient balance
    const d4 = await deductCitizenCreditAsync(uid);
    expect(d4.success).toBe(false);
    expect(d4.code).toBe('INSUFFICIENT_CREDITS');
    expect(d4.creditsRemaining).toBe(0);

    // Verify stored account reflects zero balance permanently
    const stored = await getCitizenAccountAsync(uid);
    expect(stored?.credits).toBe(0);
  });

  it('refunds credit when an operation or downstream analysis fails', async () => {
    const created = await createCitizenAccountAsync({
      identifier: '9822233344',
      password: 'StrongPassword@123',
      initialCredits: 1,
    });
    const uid = created.citizen!.uid;

    // Deduct before starting processing
    const deducted = await deductCitizenCreditAsync(uid);
    expect(deducted.success).toBe(true);
    expect(deducted.creditsRemaining).toBe(0);

    // Downstream failed or empty scan -> refund
    const refunded = await refundCitizenCreditAsync(uid);
    expect(refunded.success).toBe(true);
    expect(refunded.creditsRemaining).toBe(1);

    const stored = await getCitizenAccountAsync(uid);
    expect(stored?.credits).toBe(1);
  });

  it('preserves unlimited Pro pass access without consuming credits', async () => {
    const created = await createCitizenAccountAsync({
      identifier: '9833344455',
      password: 'StrongPassword@123',
      initialCredits: 10,
    });
    const account = created.citizen!;
    account.isUnlimited = true;
    account.unlimitedExpiresAt = Date.now() + 86400000;
    await saveCitizenAccountAsync(account);

    const d1 = await deductCitizenCreditAsync(account.uid);
    expect(d1.success).toBe(true);
    expect(d1.isUnlimited).toBe(true);

    const stored = await getCitizenAccountAsync(account.uid);
    expect(stored?.credits).toBe(10);
  });

  it('never resets spent credits back to 3 on repeated lookups or session reloads', async () => {
    const created = await createCitizenAccountAsync({
      identifier: '9844455566',
      password: 'StrongPassword@123',
      initialCredits: 3,
    });
    const uid = created.citizen!.uid;

    // Use 2 credits
    await deductCitizenCreditAsync(uid);
    await deductCitizenCreditAsync(uid);

    // Simulate multiple independent requests / reloads
    for (let i = 0; i < 5; i++) {
      const reloaded = await getCitizenAccountAsync(uid);
      expect(reloaded?.credits).toBe(1);
    }
  });
});
