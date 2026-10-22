/**
 * Pure state transitions for a celebration plan. Each function takes the current
 * plan and returns only the parts that change, so the caller can persist exactly those.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AIBlueprint,
  BudgetCategory,
  Expense,
  StoredEvent,
  TimelineTask,
  Vendor,
} from '@/schemas';
import {
  buildBudgetCategories,
  findMatchingCategoryId,
  recalculateEstimates,
  remapExpensesToNewCategories,
} from './budget';
import { buildTimelineTasks, recalculateTaskDates } from './dates';
import { mergeTasksOnRegenerate } from './timeline';
import { mergeVendorsOnRegenerate } from './vendors';

/** Everything stored for one event. */
export interface PlanState {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  categories: BudgetCategory[];
  expenses: Expense[];
  tasks: TimelineTask[];
  vendors: Vendor[];
}

/** Display names of refinement sections (as shown in the Refine tab). */
export const REFINED_SECTION = {
  timeline: 'Timeline',
  vendorCategories: 'Vendor Categories',
} as const;

/** Changes produced by a refinement, as reported by the Refine tab. */
export interface RefinementChanges {
  blueprint: AIBlueprint;
  categories: BudgetCategory[] | null;
  totalBudget?: number;
  changedSections?: string[];
}

const MIN_TOTAL_BUDGET = 1000;

const touch = (event: StoredEvent, changes: Partial<StoredEvent>): StoredEvent => ({
  ...event,
  ...changes,
  updatedAt: new Date().toISOString(),
});

/** Creates vendor checklist cards from AI vendor suggestions, linked to budget categories. */
export function buildVendorsFromBlueprint(
  vendorCategories: AIBlueprint['vendorCategories'],
  categories: BudgetCategory[],
): Vendor[] {
  return vendorCategories.map((suggestion) => ({
    id: uuidv4(),
    category: suggestion.category,
    budgetCategoryId:
      findMatchingCategoryId(suggestion.budgetCategory, categories) ??
      findMatchingCategoryId(suggestion.category, categories),
    name: '',
    contact: '',
    status: 'not-started',
    notes: '',
    suggestedByAI: true,
    source: 'ai',
  }));
}

/**
 * Replaces the plan with a freshly generated blueprint while keeping user work:
 * expenses are re-mapped to the new categories, and completed/user tasks and
 * vendors with user data are merged instead of duplicated.
 */
export function applyGeneratedBlueprint(
  state: PlanState,
  blueprint: AIBlueprint,
): Partial<PlanState> {
  const { event } = state;
  const newCategories = buildBudgetCategories(blueprint.budgetAllocation, event.totalBudget);
  const { updatedExpenses, finalCategories } = remapExpensesToNewCategories(
    state.expenses,
    state.categories,
    newCategories,
  );

  return {
    blueprint,
    categories: finalCategories,
    expenses: updatedExpenses,
    tasks: mergeTasksOnRegenerate(state.tasks, buildTimelineTasks(blueprint.timeline, event.date)),
    vendors: mergeVendorsOnRegenerate(
      state.vendors,
      buildVendorsFromBlueprint(blueprint.vendorCategories, finalCategories),
      finalCategories,
    ),
  };
}

/** Applies an AI refinement, rebuilding only the parts of the plan it changed. */
export function applyRefinement(state: PlanState, changes: RefinementChanges): Partial<PlanState> {
  const result: Partial<PlanState> = { blueprint: changes.blueprint };

  const event =
    changes.totalBudget && changes.totalBudget >= MIN_TOTAL_BUDGET
      ? touch(state.event, { totalBudget: changes.totalBudget })
      : state.event;
  if (event !== state.event) result.event = event;

  let categories = state.categories;
  if (changes.categories) {
    const rebuilt = recalculateEstimates(changes.categories, event.totalBudget);
    const remapped = remapExpensesToNewCategories(state.expenses, state.categories, rebuilt);
    categories = remapped.finalCategories;
    result.categories = categories;
    result.expenses = remapped.updatedExpenses;
  }

  const changed = new Set(changes.changedSections ?? []);
  if (changed.has(REFINED_SECTION.timeline)) {
    result.tasks = mergeTasksOnRegenerate(
      state.tasks,
      buildTimelineTasks(changes.blueprint.timeline, event.date),
    );
  }
  if (changed.has(REFINED_SECTION.vendorCategories)) {
    result.vendors = mergeVendorsOnRegenerate(
      state.vendors,
      buildVendorsFromBlueprint(changes.blueprint.vendorCategories, categories),
      categories,
    );
  }
  return result;
}

/** Moves the event date; every milestone keeps its offset and is re-dated. */
export function changeEventDate(state: PlanState, newDate: string): Partial<PlanState> {
  return {
    event: touch(state.event, { date: newDate }),
    tasks: recalculateTaskDates(state.tasks, newDate),
  };
}

/** Changes the total budget; category percentages are kept and rupee targets recomputed. */
export function changeTotalBudget(state: PlanState, totalBudget: number): Partial<PlanState> {
  return {
    event: touch(state.event, { totalBudget }),
    categories: recalculateEstimates(state.categories, totalBudget),
  };
}
