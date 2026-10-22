/**
 * Pure helpers for filtering and summarising timeline tasks.
 */

import { v4 as uuidv4 } from 'uuid';
import type { TaskPriority, TimelineTask } from '@/schemas';
import { isOverdue, sortTasks } from './dates';
import { calculateTokenSimilarity } from './text';

/** Minimum title similarity for two tasks to be treated as the same milestone. */
const TASK_MATCH_THRESHOLD = 0.6;
/** Same-category tasks within this many days are treated as the same milestone. */
const TASK_MATCH_DAY_TOLERANCE = 3;

export type TaskStatusFilter = 'all' | 'pending' | 'completed' | 'overdue';

/** Active filters in the Smart Timeline toolbar. */
export interface TaskFilters {
  status: TaskStatusFilter;
  priority: TaskPriority | 'all';
  query: string;
}

/** True when an incomplete task's due date is before `today`. */
export function isTaskOverdue(task: TimelineTask, today: string): boolean {
  return !task.completed && isOverdue(task.dueDate, today);
}

function matchesQuery(task: TimelineTask, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [task.title, task.description, task.category].some((field) =>
    field?.toLowerCase().includes(q),
  );
}

/** Sorts tasks by due date/priority and applies status, priority and text filters. */
export function filterTasks(
  tasks: TimelineTask[],
  filters: TaskFilters,
  today: string,
): TimelineTask[] {
  return sortTasks(tasks).filter((task) => {
    if (filters.status === 'pending' && task.completed) return false;
    if (filters.status === 'completed' && !task.completed) return false;
    if (filters.status === 'overdue' && !isTaskOverdue(task, today)) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    return matchesQuery(task, filters.query);
  });
}

/** Completion and overdue counts for the timeline header. */
export function summarizeTasks(tasks: TimelineTask[], today: string) {
  const completed = tasks.filter((t) => t.completed).length;
  return {
    total: tasks.length,
    completed,
    pending: tasks.length - completed,
    overdue: tasks.filter((t) => isTaskOverdue(t, today)).length,
    completionPercent: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

/** Tasks the user owns: created or edited by them, or already completed. */
function isUserOwnedTask(task: TimelineTask): boolean {
  return (
    task.source === 'user' ||
    task.completed ||
    (!task.source && (task.id.includes('custom') || task.id.includes('user')))
  );
}

/** Similarity score if `a` and `b` describe the same milestone, otherwise null. */
function taskMatchScore(a: TimelineTask, b: TimelineTask): number | null {
  const similarity = calculateTokenSimilarity(a.title, b.title);
  if (similarity >= TASK_MATCH_THRESHOLD) return similarity;

  const categoryA = a.category?.trim().toLowerCase();
  const sameCategory = Boolean(categoryA) && categoryA === b.category?.trim().toLowerCase();
  const closeDays = Math.abs(a.daysBeforeEvent - b.daysBeforeEvent) <= TASK_MATCH_DAY_TOLERANCE;
  return sameCategory && closeDays ? TASK_MATCH_THRESHOLD : null;
}

/**
 * Merges a regenerated AI timeline into the existing one without duplicates.
 * AI-suggested tasks are replaced by the new AI tasks; user-owned tasks are kept.
 * A kept task that matches a new AI task is merged into it (AI wording and date,
 * but the user's id and completion status), so the list never grows on regeneration.
 */
export function mergeTasksOnRegenerate(
  existingTasks: TimelineTask[],
  newTasks: Omit<TimelineTask, 'id'>[],
): TimelineTask[] {
  const merged: TimelineTask[] = newTasks.map((task) => ({
    ...task,
    id: uuidv4(),
    source: task.source || 'ai',
    completed: Boolean(task.completed),
  }));
  const claimed = new Set<number>();
  const unmatchedUserTasks: TimelineTask[] = [];

  for (const kept of existingTasks.filter(isUserOwnedTask)) {
    let bestIndex = -1;
    let bestScore = -1;
    merged.forEach((candidate, i) => {
      if (claimed.has(i)) return;
      const score = taskMatchScore(kept, candidate);
      if (score !== null && score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    if (bestIndex === -1) {
      unmatchedUserTasks.push(kept);
      continue;
    }
    claimed.add(bestIndex);
    const target = merged[bestIndex];
    target.id = kept.id;
    target.completed = kept.completed;
    if (kept.source === 'user') target.source = 'user';
  }

  return sortTasks([...merged, ...unmatchedUserTasks]);
}
