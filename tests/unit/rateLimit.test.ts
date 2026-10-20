import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIp, _resetRateLimits } from '@/lib/rateLimit';

beforeEach(() => {
  _resetRateLimits();
});

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

describe('getClientIp', () => {
  it('prefers platform request.ip if present', () => {
    const req = { ip: '1.2.3.4', headers: new Headers() } as unknown as Request;
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('extracts x-real-ip header if platform ip is missing', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '5.6.7.8');
    const req = { headers } as unknown as Request;
    expect(getClientIp(req)).toBe('5.6.7.8');
  });

  it('falls back to "global" bucket when no IP headers are present', () => {
    const req = { headers: new Headers() } as unknown as Request;
    expect(getClientIp(req)).toBe('global');
  });
});

describe('global rate limit cap', () => {
  it('enforces global limit across multiple callers', () => {
    const globalCap = 4;
    expect(checkRateLimit('ip-1', 10, 10000, globalCap).success).toBe(true);
    expect(checkRateLimit('ip-2', 10, 10000, globalCap).success).toBe(true);
    expect(checkRateLimit('ip-3', 10, 10000, globalCap).success).toBe(true);
    expect(checkRateLimit('ip-4', 10, 10000, globalCap).success).toBe(true);

    const blocked = checkRateLimit('ip-5', 10, 10000, globalCap);
    expect(blocked.success).toBe(false);
  });
});
