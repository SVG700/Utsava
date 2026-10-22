import { describe, it, expect } from 'vitest';
import { reconcileCategoryEdits, UNCATEGORISED_ID } from '@/lib/budget';
import { filterTasks, summarizeTasks, type TaskFilters } from '@/lib/timeline';
import { calculateTokenSimilarity } from '@/lib/text';
import type { BudgetCategory, Expense, TimelineTask } from '@/schemas';

const category = (id: string, percentage: number): BudgetCategory => ({
  id,
  name: id,
  percentage,
  estimatedAmount: 0,
  actualAmount: 0,
});

const expense = (id: string, categoryId: string): Expense => ({
  id,
  categoryId,
  description: id,
  amount: 1000,
  date: '2026-10-01',
  notes: '',
});

describe('reconcileCategoryEdits', () => {
  it('normalises percentages and converts them to rupees that sum to the budget', () => {
    const { categories, expensesChanged } = reconcileCategoryEdits(
      [category('cat-a', 30), category('cat-b', 30)],
      [expense('e1', 'cat-a')],
      100_000,
    );
    expect(categories.map((c) => c.percentage)).toEqual([50, 50]);
    expect(categories.reduce((sum, c) => sum + c.estimatedAmount, 0)).toBe(100_000);
    expect(expensesChanged).toBe(false);
  });

  it('moves orphaned expenses to Uncategorised and adds that category at 0%', () => {
    const result = reconcileCategoryEdits(
      [category('cat-a', 100)],
      [expense('e1', 'cat-a'), expense('e2', 'cat-removed')],
      50_000,
    );
    expect(result.expensesChanged).toBe(true);
    expect(result.expenses.find((e) => e.id === 'e2')?.categoryId).toBe(UNCATEGORISED_ID);
    expect(result.expenses.find((e) => e.id === 'e1')?.categoryId).toBe('cat-a');
    const fallback = result.categories.find((c) => c.id === UNCATEGORISED_ID);
    expect(fallback).toMatchObject({ percentage: 0, estimatedAmount: 0 });
  });

  it('does not add a second Uncategorised category when one already exists', () => {
    const result = reconcileCategoryEdits(
      [category('cat-a', 100), category(UNCATEGORISED_ID, 0)],
      [expense('e1', 'cat-gone')],
      10_000,
    );
    expect(result.categories.filter((c) => c.id === UNCATEGORISED_ID)).toHaveLength(1);
  });
});

describe('filterTasks and summarizeTasks', () => {
  const today = '2026-10-10';
  const task = (id: string, dueDate: string, extra: Partial<TimelineTask> = {}): TimelineTask => ({
    id,
    title: `Task ${id}`,
    description: '',
    dueDate,
    daysBeforeEvent: 10,
    priority: 'medium',
    completed: false,
    category: '',
    ...extra,
  });
  const tasks = [
    task('late', '2026-10-01'),
    task('done', '2026-10-02', { completed: true }),
    task('soon', '2026-10-20', { priority: 'high', category: 'Catering' }),
  ];
  const all: TaskFilters = { status: 'all', priority: 'all', query: '' };

  it('returns all tasks sorted by due date', () => {
    expect(filterTasks(tasks, all, today).map((t) => t.id)).toEqual(['late', 'done', 'soon']);
  });

  it('filters overdue, completed and pending tasks', () => {
    expect(filterTasks(tasks, { ...all, status: 'overdue' }, today).map((t) => t.id)).toEqual([
      'late',
    ]);
    expect(filterTasks(tasks, { ...all, status: 'completed' }, today).map((t) => t.id)).toEqual([
      'done',
    ]);
    expect(filterTasks(tasks, { ...all, status: 'pending' }, today)).toHaveLength(2);
  });

  it('filters by priority and by text in title, description or category', () => {
    expect(filterTasks(tasks, { ...all, priority: 'high' }, today).map((t) => t.id)).toEqual([
      'soon',
    ]);
    expect(filterTasks(tasks, { ...all, query: 'catering' }, today).map((t) => t.id)).toEqual([
      'soon',
    ]);
  });

  it('summarises completion and overdue counts', () => {
    expect(summarizeTasks(tasks, today)).toEqual({
      total: 3,
      completed: 1,
      pending: 2,
      overdue: 1,
      completionPercent: 33,
    });
    expect(summarizeTasks([], today).completionPercent).toBe(0);
  });
});

describe('calculateTokenSimilarity', () => {
  it('is 1 for identical word sets regardless of case and punctuation', () => {
    expect(calculateTokenSimilarity('Book Venue!', 'book, venue')).toBe(1);
  });

  it('computes Jaccard overlap of words', () => {
    expect(calculateTokenSimilarity('book the venue', 'book the caterer')).toBeCloseTo(0.5);
  });

  it('handles empty strings', () => {
    expect(calculateTokenSimilarity('', '')).toBe(1);
    expect(calculateTokenSimilarity('venue', '')).toBe(0);
  });
});
