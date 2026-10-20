/**
 * In-memory sliding-window rate limiter per client IP.
 * Used to protect server-side GenAI route handlers from abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();

// Clean up stale IPs periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check if a request from this IP is permitted.
 * @param ip Client IP address
 * @param maxRequests Maximum requests allowed within the window (default 15)
 * @param windowMs Window duration in milliseconds (default 60,000ms = 1 min)
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 15,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const record = ipMap.get(ip) ?? { timestamps: [] };

  // Retain only timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
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

  return {
    success: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}
