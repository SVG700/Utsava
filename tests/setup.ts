import { afterEach, beforeEach, vi } from 'vitest';

/**
 * Pins "today" for every unit test so date-dependent rules (past-date validation,
 * overdue tasks, days remaining) are deterministic and never expire with the calendar.
 * Only `Date` is faked; real timers keep working.
 */
export const FIXED_NOW = new Date('2026-10-01T06:30:00.000Z'); // 2026-10-01 12:00 IST

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});
