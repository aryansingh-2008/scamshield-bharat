/**
 * In-Memory Sliding-Window Rate Limiter
 * 
 * NOTE: This is an instance-local in-memory rate limiter designed for single-node
 * or single-container request burst protection. It performs lazy, request-time cleanup
 * of expired entries on each check without requiring long-lived background timers.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

interface ClientRecord {
  timestamps: number[];
}

const clientMap = new Map<string, ClientRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests / min / IP
let lastCleanupTime = 0;
const CLEANUP_INTERVAL_MS = 60 * 1000; // Run inline cleanup at most once every 60s

// Lazy request-time cleanup of stale IP records
function cleanupStaleEntries(now: number) {
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS && clientMap.size < 1000) {
    return;
  }
  lastCleanupTime = now;
  clientMap.forEach((record, ip) => {
    record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);
    if (record.timestamps.length === 0) {
      clientMap.delete(ip);
    }
  });
}

export function checkRateLimit(clientIp: string): RateLimitResult {
  const now = Date.now();
  cleanupStaleEntries(now);

  const cleanIp = clientIp || 'anonymous_client';

  let record = clientMap.get(cleanIp);
  if (!record) {
    record = { timestamps: [] };
    clientMap.set(cleanIp, record);
  }

  // Filter timestamps within active sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = MAX_REQUESTS_PER_WINDOW - record.timestamps.length;
  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining,
    resetSeconds: 60,
  };
}
