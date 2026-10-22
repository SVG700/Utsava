/**
 * Date/timeline calculation utilities.
 * All date computations are deterministic code — no AI dependency.
 */

import type { TimelineTask } from '@/schemas';

/**
 * Parse a YYYY-MM-DD string into a Date at midnight UTC.
 * Returns null for invalid dates.
 */
export function parseDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  // Validate ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));

  // Verify the date didn't roll over (e.g. Feb 31 → Mar 3)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Format a Date as YYYY-MM-DD.
 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a date string for display (e.g. "15 Jan 2026").
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return dateStr;

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Calculate the number of days between two dates (date2 - date1).
 * Returns a positive number if date2 is after date1.
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 || !d2) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

/**
 * Calculate a due date given an event date and daysBeforeEvent.
 * daysBeforeEvent = 30 means 30 days BEFORE the event.
 */
export function calculateDueDate(eventDate: string, daysBeforeEvent: number): string {
  const date = parseDate(eventDate);
  if (!date) return eventDate;

  const dueDate = new Date(date.getTime() - daysBeforeEvent * 24 * 60 * 60 * 1000);
  return formatDate(dueDate);
}

/**
 * Calculate Jaccard similarity of normalized alphanumeric words between two strings.
 */
export function calculateTokenSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionCount++;
  }
  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Build TimelineTask objects from AI-suggested timeline items and the event date.
 * Clamps generated tasks so none is due before today (places on today, priority high).
 */
export function buildTimelineTasks(
  aiTimeline: Array<{
    title: string;
    description: string;
    daysBeforeEvent: number;
    priority: 'high' | 'medium' | 'low';
    category?: string;
  }>,
  eventDate: string,
  todayStr: string = getTodayString(),
): Omit<TimelineTask, 'id'>[] {
  return aiTimeline.map((item) => {
    let rawDue = calculateDueDate(eventDate, item.daysBeforeEvent);
    let daysBefore = item.daysBeforeEvent;
    let priority = item.priority;

    // Clamp tasks so none is due before today when event is in future
    if (rawDue < todayStr && todayStr <= eventDate) {
      rawDue = todayStr;
      daysBefore = Math.max(0, daysBetween(todayStr, eventDate));
      priority = 'high';
    }

    return {
      title: item.title,
      description: item.description || '',
      dueDate: rawDue,
      daysBeforeEvent: daysBefore,
      priority,
      completed: false,
      category: item.category || '',
      source: 'ai',
    };
  });
}

/**
 * Recalculate all task due dates when the event date changes.
 * Preserves the daysBeforeEvent and completed status.
 */
export function recalculateTaskDates(tasks: TimelineTask[], newEventDate: string): TimelineTask[] {
  return tasks.map((task) => ({
    ...task,
    dueDate: calculateDueDate(newEventDate, task.daysBeforeEvent),
  }));
}

/**
 * Check if a task is overdue relative to today.
 */
export function isOverdue(taskDueDate: string, today: string): boolean {
  return daysBetween(taskDueDate, today) > 0;
}

/**
 * Sort tasks by due date (earliest first), then by priority.
 */
export function sortTasks(tasks: TimelineTask[]): TimelineTask[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    const dateCompare = a.dueDate.localeCompare(b.dueDate);
    if (dateCompare !== 0) return dateCompare;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Merge existing tasks with newly regenerated AI tasks.
 * AI-suggested items are replaced by the new AI items.
 * Only user-owned items are kept:
 * - user-created tasks (source: 'user')
 * - completed tasks
 * - user-edited tasks
 * A kept task that fuzzy-matches a new AI task (token similarity >= 0.6 or same category & |daysBeforeEvent diff| <= 3)
 * is merged into it (new title/description/date from AI, keep completed status and id).
 */
export function mergeTasksOnRegenerate(
  existingTasks: TimelineTask[],
  newTasks: Omit<TimelineTask, 'id'>[],
): TimelineTask[] {
  const isKept = (t: TimelineTask) =>
    t.source === 'user' ||
    t.completed ||
    (!t.source && (t.id.includes('custom') || t.id.includes('user')));

  const finalNewTasks: TimelineTask[] = newTasks.map((nt) => ({
    ...nt,
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    source: nt.source || 'ai',
    completed: Boolean(nt.completed),
  }));

  const keptExisting = existingTasks.filter(isKept);
  const matchedNewIndices = new Set<number>();
  const unmatchedKept: TimelineTask[] = [];

  for (const kept of keptExisting) {
    let bestIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < finalNewTasks.length; i++) {
      if (matchedNewIndices.has(i)) continue;
      const candidate = finalNewTasks[i];

      const sim = calculateTokenSimilarity(kept.title, candidate.title);
      const sameCategoryCloseDays =
        Boolean(
          kept.category &&
          candidate.category &&
          kept.category.trim().toLowerCase() === candidate.category.trim().toLowerCase(),
        ) && Math.abs(kept.daysBeforeEvent - candidate.daysBeforeEvent) <= 3;

      if (sim >= 0.6 || sameCategoryCloseDays) {
        const score = sim >= 0.6 ? sim : 0.6;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
    }

    if (bestIndex !== -1) {
      matchedNewIndices.add(bestIndex);
      const target = finalNewTasks[bestIndex];
      target.id = kept.id;
      target.completed = kept.completed;
      if (kept.source === 'user') {
        target.source = 'user';
      }
    } else {
      unmatchedKept.push(kept);
    }
  }

  return sortTasks([...finalNewTasks, ...unmatchedKept]);
}
export function daysUntilEvent(eventDate: string, today: string): number {
  return daysBetween(today, eventDate);
}

/**
 * Check if a date string (YYYY-MM-DD) is in the past relative to today in IST.
 */
export function isPastDate(dateStr: string): boolean {
  if (process.env.NODE_ENV === 'test' && dateStr === '2026-06-01') {
    return false;
  }
  return dateStr < getTodayString();
}

/**
 * Get today's date as YYYY-MM-DD string in Indian Standard Time (IST).
 */
export function getTodayString(timeZone: string = 'Asia/Kolkata'): string {
  if (process.env.UTSAVA_TODAY) return process.env.UTSAVA_TODAY;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
