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
 * Days from `today` until the event (negative once the event has passed).
 */
export function daysUntilEvent(eventDate: string, today: string): number {
  return daysBetween(today, eventDate);
}

/**
 * Check if a date string (YYYY-MM-DD) is in the past relative to today in IST.
 */
export function isPastDate(dateStr: string): boolean {
  return dateStr < getTodayString();
}

/**
 * Get today's date as YYYY-MM-DD string in Indian Standard Time (IST).
 */
export function getTodayString(timeZone: string = 'Asia/Kolkata'): string {
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
