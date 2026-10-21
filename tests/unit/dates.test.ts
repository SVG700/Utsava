import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  formatDisplayDate,
  daysBetween,
  calculateDueDate,
  buildTimelineTasks,
  recalculateTaskDates,
  isOverdue,
  sortTasks,
  daysUntilEvent,
  mergeTasksOnRegenerate,
  getTodayString,
} from '@/lib/dates';
import type { TimelineTask } from '@/schemas';

describe('parseDate', () => {
  it('parses a valid YYYY-MM-DD string', () => {
    const date = parseDate('2026-03-15');
    expect(date).not.toBeNull();
    expect(date!.getUTCFullYear()).toBe(2026);
    expect(date!.getUTCMonth()).toBe(2); // March = 2
    expect(date!.getUTCDate()).toBe(15);
  });

  it('returns null for invalid format', () => {
    expect(parseDate('15-03-2026')).toBeNull();
    expect(parseDate('2026/03/15')).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
  });

  it('returns null for invalid dates (e.g. Feb 31)', () => {
    expect(parseDate('2026-02-31')).toBeNull();
    expect(parseDate('2026-13-01')).toBeNull();
    expect(parseDate('2026-00-01')).toBeNull();
  });

  it('handles leap year correctly', () => {
    expect(parseDate('2024-02-29')).not.toBeNull();
    expect(parseDate('2025-02-29')).toBeNull();
  });
});

describe('formatDate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    const date = new Date(Date.UTC(2026, 2, 15));
    expect(formatDate(date)).toBe('2026-03-15');
  });

  it('zero-pads month and day', () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    expect(formatDate(date)).toBe('2026-01-05');
  });
});

describe('formatDisplayDate', () => {
  it('formats for display', () => {
    const result = formatDisplayDate('2026-03-15');
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });

  it('returns original string for invalid dates', () => {
    expect(formatDisplayDate('invalid')).toBe('invalid');
  });
});

describe('daysBetween', () => {
  it('calculates days between two dates', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
    expect(daysBetween('2026-03-15', '2026-03-15')).toBe(0);
    expect(daysBetween('2026-03-15', '2026-03-10')).toBe(-5);
  });

  it('returns 0 for invalid dates', () => {
    expect(daysBetween('invalid', '2026-01-01')).toBe(0);
  });
});

describe('calculateDueDate', () => {
  it('calculates due date before event', () => {
    expect(calculateDueDate('2026-03-15', 30)).toBe('2026-02-13');
    expect(calculateDueDate('2026-03-15', 0)).toBe('2026-03-15');
  });

  it('handles negative days (after event)', () => {
    expect(calculateDueDate('2026-03-15', -1)).toBe('2026-03-16');
  });
});

describe('buildTimelineTasks', () => {
  it('builds tasks with computed due dates', () => {
    const aiTimeline = [
      { title: 'Book venue', description: 'Find and book', daysBeforeEvent: 90, priority: 'high' as const },
      { title: 'Send invites', description: 'Print and send', daysBeforeEvent: 30, priority: 'medium' as const },
    ];

    const tasks = buildTimelineTasks(aiTimeline, '2026-06-15');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe('Book venue');
    expect(tasks[0].dueDate).toBe('2026-03-17');
    expect(tasks[0].completed).toBe(false);
    expect(tasks[1].dueDate).toBe('2026-05-16');
  });
});

describe('recalculateTaskDates', () => {
  it('recalculates all due dates when event date changes', () => {
    const tasks: TimelineTask[] = [
      {
        id: '1',
        title: 'Book venue',
        description: '',
        dueDate: '2026-03-17',
        daysBeforeEvent: 90,
        priority: 'high',
        completed: true,
        category: '',
      },
      {
        id: '2',
        title: 'Send invites',
        description: '',
        dueDate: '2026-05-16',
        daysBeforeEvent: 30,
        priority: 'medium',
        completed: false,
        category: '',
      },
    ];

    // Move event from June 15 to July 15 (+30 days)
    const result = recalculateTaskDates(tasks, '2026-07-15');
    expect(result[0].dueDate).toBe('2026-04-16');
    expect(result[1].dueDate).toBe('2026-06-15');
    // Completed status preserved
    expect(result[0].completed).toBe(true);
    expect(result[1].completed).toBe(false);
  });
});

describe('isOverdue', () => {
  it('returns true when task is past due', () => {
    expect(isOverdue('2026-01-01', '2026-01-02')).toBe(true);
  });

  it('returns false when task is not due yet', () => {
    expect(isOverdue('2026-01-02', '2026-01-01')).toBe(false);
  });

  it('returns false when task is due today', () => {
    expect(isOverdue('2026-01-01', '2026-01-01')).toBe(false);
  });
});

describe('sortTasks', () => {
  it('sorts by due date then priority', () => {
    const tasks: TimelineTask[] = [
      { id: '3', title: 'C', description: '', dueDate: '2026-02-01', daysBeforeEvent: 30, priority: 'low', completed: false, category: '' },
      { id: '1', title: 'A', description: '', dueDate: '2026-01-01', daysBeforeEvent: 60, priority: 'medium', completed: false, category: '' },
      { id: '2', title: 'B', description: '', dueDate: '2026-01-01', daysBeforeEvent: 60, priority: 'high', completed: false, category: '' },
    ];

    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe('2'); // earliest date + high priority
    expect(sorted[1].id).toBe('1'); // earliest date + medium priority
    expect(sorted[2].id).toBe('3'); // later date
  });
});

describe('daysUntilEvent', () => {
  it('returns positive for future events', () => {
    expect(daysUntilEvent('2026-03-15', '2026-01-15')).toBe(59);
  });

  it('returns negative for past events', () => {
    expect(daysUntilEvent('2026-01-01', '2026-01-15')).toBe(-14);
  });
});

describe('getTodayString', () => {
  it('returns YYYY-MM-DD formatted date string', () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const parsed = parseDate(today);
    expect(parsed).not.toBeNull();
  });

  it('respects UTSAVA_TODAY environment variable override if set', () => {
    const original = process.env.UTSAVA_TODAY;
    try {
      process.env.UTSAVA_TODAY = '2026-11-15';
      expect(getTodayString()).toBe('2026-11-15');
    } finally {
      if (original !== undefined) {
        process.env.UTSAVA_TODAY = original;
      } else {
        delete process.env.UTSAVA_TODAY;
      }
    }
  });
});

describe('mergeTasksOnRegenerate', () => {
  it('preserves completed status of existing tasks when AI regenerates', () => {
    const existing: TimelineTask[] = [
      {
        id: 'task-1',
        title: 'Book Wedding Hall',
        description: 'Selected Palace',
        dueDate: '2026-08-01',
        daysBeforeEvent: 120,
        priority: 'high',
        completed: true,
        category: 'Venue',
      },
      {
        id: 'task-user-custom',
        title: 'Buy Silver Coins For Family',
        description: 'Custom family gift',
        dueDate: '2026-11-01',
        daysBeforeEvent: 30,
        priority: 'medium',
        completed: false,
        category: 'Gifts',
      },
    ];

    const newAiTasks: Omit<TimelineTask, 'id'>[] = [
      {
        title: 'Book Wedding Hall',
        description: 'New AI generated description',
        dueDate: '2026-08-01',
        daysBeforeEvent: 120,
        priority: 'high',
        completed: false,
        category: 'Venue',
      },
      {
        title: 'Hire Sangeet Choreographer',
        description: 'Dance practice',
        dueDate: '2026-10-01',
        daysBeforeEvent: 60,
        priority: 'medium',
        completed: false,
        category: 'Entertainment',
      },
    ];

    const merged = mergeTasksOnRegenerate(existing, newAiTasks);

    // Should have 3 tasks: merged Wedding Hall (completed: true, id: task-1), new Choreographer, and preserved user custom task
    expect(merged).toHaveLength(3);

    const hallTask = merged.find((t) => t.title === 'Book Wedding Hall');
    expect(hallTask).toBeDefined();
    expect(hallTask?.completed).toBe(true);
    expect(hallTask?.id).toBe('task-1');

    const customTask = merged.find((t) => t.id === 'task-user-custom');
    expect(customTask).toBeDefined();
    expect(customTask?.title).toBe('Buy Silver Coins For Family');

    const choreoTask = merged.find((t) => t.title === 'Hire Sangeet Choreographer');
    expect(choreoTask).toBeDefined();
    expect(choreoTask?.completed).toBe(false);
  });
});
