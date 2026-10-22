/**
 * In-memory sliding-window rate limiter per client IP and global bucket.
 * Used to protect server-side GenAI route handlers from abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();
let globalTimestamps: number[] = [];

// Clean up stale entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, record] of ipMap.entries()) {
        record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
        if (record.timestamps.length === 0) {
          ipMap.delete(ip);
        }
      }
      globalTimestamps = globalTimestamps.filter((ts) => now - ts < 60000);
    },
    5 * 60 * 1000,
  );
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Derives the client IP from the platform host headers.
 * Uses request.ip if set by the hosting platform, or x-real-ip header.
 * Falls back to a single global bucket ('global') if none are available.
 */
export function getClientIp(req: Request): string {
  const platformIp = (req as unknown as { ip?: string }).ip;
  if (platformIp && platformIp.trim().length > 0) {
    return platformIp.trim();
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim().length > 0) {
    return xRealIp.trim();
  }

  return 'global';
}

/**
 * Check if a request from this IP is permitted.
 * Includes both a per-IP sliding window and a global bucket cap.
 * @param ip Client IP address (or 'global')
 * @param maxRequests Maximum requests allowed per IP within the window (default 15)
 * @param windowMs Window duration in milliseconds (default 60,000ms = 1 min)
 * @param globalCap Total maximum requests permitted globally across all IPs per window (default 100)
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 15,
  windowMs: number = 60000,
  globalCap: number = 100,
): RateLimitResult {
  const now = Date.now();

  // 1. Check Global Cap across all callers
  globalTimestamps = globalTimestamps.filter((ts) => now - ts < windowMs);
  if (globalTimestamps.length >= globalCap) {
    const oldestGlobal = globalTimestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldestGlobal));
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  // 2. Check Per-IP sliding window
  const effectiveMax = ip === 'global' ? Math.min(maxRequests * 2, globalCap) : maxRequests;
  const record = ipMap.get(ip) ?? { timestamps: [] };
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= effectiveMax) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  ipMap.set(ip, record);
  globalTimestamps.push(now);

  return {
    success: true,
    remaining: effectiveMax - record.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Resets rate limit counters (used in testing).
 */
export function _resetRateLimits(): void {
  ipMap.clear();
  globalTimestamps = [];
}
