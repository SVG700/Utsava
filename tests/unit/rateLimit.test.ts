import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rateLimit';

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const ip = '192.168.1.1';
    const result1 = checkRateLimit(ip, 5, 10000);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(4);

    const result2 = checkRateLimit(ip, 5, 10000);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(3);
  });

  it('blocks requests exceeding limit', () => {
    const ip = '192.168.1.2';
    // Consume limit of 3
    checkRateLimit(ip, 3, 10000);
    checkRateLimit(ip, 3, 10000);
    checkRateLimit(ip, 3, 10000);

    // 4th request must fail
    const blocked = checkRateLimit(ip, 3, 10000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it('isolates rate limits by IP address', () => {
    const ipA = '10.0.0.1';
    const ipB = '10.0.0.2';

    checkRateLimit(ipA, 1, 10000);
    const blockedA = checkRateLimit(ipA, 1, 10000);
    expect(blockedA.success).toBe(false);

    // ipB should still succeed
    const allowedB = checkRateLimit(ipB, 1, 10000);
    expect(allowedB.success).toBe(true);
  });
});
