/**
 * Budget calculation utilities.
 * ALL arithmetic is deterministic — AI percentages are converted to rupee
 * amounts by this code and normalised to exactly 100%.
 */

import type { BudgetCategory, Expense } from '@/schemas';

/** Id of the fallback category that holds expenses whose category no longer exists. */
export const UNCATEGORISED_ID = 'cat-uncategorised';

/** Creates the zero-allocation fallback category. */
export function createUncategorisedCategory(): BudgetCategory {
  return {
    id: UNCATEGORISED_ID,
    name: 'Uncategorised',
    percentage: 0,
    estimatedAmount: 0,
    actualAmount: 0,
  };
}

/** Format a number as INR with en-IN grouping (e.g. ₹1,50,000). */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Normalise AI-suggested percentages so they sum to exactly 100.
 * Each percentage is scaled proportionally; if all are zero, distribute equally.
 */
export function normalisePercentages(percentages: number[]): number[] {
  if (percentages.length === 0) return [];

  const total = percentages.reduce((sum, p) => sum + p, 0);

  if (total === 0) {
    const equal = 100 / percentages.length;
    const result = percentages.map(() => Number(equal.toFixed(2)));
    // Fix floating-point drift for the equal-distribution case
    const drift = 100 - result.reduce((s, v) => s + v, 0);
    if (drift !== 0) {
      result[result.length - 1] = Number((result[result.length - 1] + drift).toFixed(2));
    }
    return result;
  }

  const factor = 100 / total;
  const normalised = percentages.map((p) => Number((p * factor).toFixed(2)));

  // Fix floating-point drift: adjust the largest bucket
  const drift = 100 - normalised.reduce((s, v) => s + v, 0);
  if (drift !== 0) {
    const maxIdx = normalised.indexOf(Math.max(...normalised));
    normalised[maxIdx] = Number((normalised[maxIdx] + drift).toFixed(2));
  }

  return normalised;
}

/**
 * Convert normalised percentages to rupee amounts for a given total budget.
 * Ensures amounts sum exactly to the total budget (penny-perfect).
 */
export function percentagesToAmounts(percentages: number[], totalBudget: number): number[] {
  if (percentages.length === 0) return [];

  const amounts = percentages.map((p) => Math.round((p / 100) * totalBudget));

  // Fix rounding drift
  const drift = totalBudget - amounts.reduce((s, v) => s + v, 0);
  if (drift !== 0) {
    const maxIdx = amounts.indexOf(Math.max(...amounts));
    amounts[maxIdx] += drift;
  }

  return amounts;
}

export function slugifyCategory(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'category';
}

/**
 * Build BudgetCategory objects from AI suggestions and a total budget.
 * Uses deterministic stable IDs based on category name slug.
 */
export function buildBudgetCategories(
  aiCategories: Array<{ category: string; percentage: number }>,
  totalBudget: number,
): BudgetCategory[] {
  const rawPercentages = aiCategories.map((c) => c.percentage);
  const normalised = normalisePercentages(rawPercentages);
  const amounts = percentagesToAmounts(normalised, totalBudget);

  const seenSlugs = new Map<string, number>();

  return aiCategories.map((c, i) => {
    const baseSlug = slugifyCategory(c.category);
    const count = seenSlugs.get(baseSlug) ?? 0;
    seenSlugs.set(baseSlug, count + 1);
    const id = count === 0 ? `cat-${baseSlug}` : `cat-${baseSlug}-${count}`;

    return {
      id,
      name: c.category,
      percentage: normalised[i],
      estimatedAmount: amounts[i],
      actualAmount: 0,
    };
  });
}

/**
 * Re-map existing expenses to the matching new categories by name.
 * Any unmatched expenses are assigned to an 'Uncategorised' category,
 * ensuring they are never silently mapped to an unintended category.
 */
export function remapExpensesToNewCategories(
  existingExpenses: Expense[],
  oldCategories: BudgetCategory[],
  newCategories: BudgetCategory[],
): { updatedExpenses: Expense[]; finalCategories: BudgetCategory[] } {
  if (existingExpenses.length === 0) {
    return { updatedExpenses: [], finalCategories: newCategories };
  }

  const oldCatMap = new Map<string, string>();
  for (const c of oldCategories) {
    oldCatMap.set(c.id, c.name.trim().toLowerCase());
  }

  const newCatMap = new Map<string, BudgetCategory>();
  for (const c of newCategories) {
    newCatMap.set(c.name.trim().toLowerCase(), c);
  }

  let hasUnmatched = false;
  const updatedExpenses: Expense[] = [];

  for (const exp of existingExpenses) {
    const oldName = oldCatMap.get(exp.categoryId);
    const matchedNew = oldName ? newCatMap.get(oldName) : undefined;

    if (matchedNew) {
      updatedExpenses.push({
        ...exp,
        categoryId: matchedNew.id,
      });
    } else {
      hasUnmatched = true;
      updatedExpenses.push({
        ...exp,
        categoryId: UNCATEGORISED_ID,
      });
    }
  }

  const finalCategories = [...newCategories];
  if (hasUnmatched && !finalCategories.some((c) => c.id === UNCATEGORISED_ID)) {
    finalCategories.push(createUncategorisedCategory());
  }

  return { updatedExpenses, finalCategories };
}

/**
 * Find matching budget category id using exact match or token overlap.
 */
export function findMatchingCategoryId(
  suggestedBudgetCategory: string | undefined,
  categories: BudgetCategory[],
): string | undefined {
  if (!suggestedBudgetCategory || categories.length === 0) return undefined;

  const cleanTarget = suggestedBudgetCategory.trim().toLowerCase();

  // 1. Exact match
  const exact = categories.find((c) => c.name.trim().toLowerCase() === cleanTarget);
  if (exact) return exact.id;

  // 2. Token overlap fuzzy fallback
  const targetTokens = new Set(cleanTarget.split(/\W+/).filter(Boolean));
  let bestMatch: BudgetCategory | null = null;
  let maxOverlap = 0;

  for (const cat of categories) {
    const catTokens = cat.name.trim().toLowerCase().split(/\W+/).filter(Boolean);
    const overlap = catTokens.filter((t) => targetTokens.has(t)).length;
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestMatch = cat;
    }
  }

  return maxOverlap > 0 && bestMatch ? bestMatch.id : undefined;
}

/**
 * Calculate the total actual spend from a list of expenses.
 */
export function totalActualSpend(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate actual spend per category from expenses.
 */
export function spendByCategory(expenses: Expense[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.categoryId] = (map[e.categoryId] ?? 0) + e.amount;
  }
  return map;
}

/**
 * Calculate the remaining budget.
 */
export function remainingBudget(totalBudget: number, expenses: Expense[]): number {
  return totalBudget - totalActualSpend(expenses);
}

/**
 * Calculate utilisation percentage (0-100+).
 * Can exceed 100% if overspent.
 */
export function utilisationPercent(totalBudget: number, expenses: Expense[]): number {
  if (totalBudget <= 0) return 0;
  return Number(((totalActualSpend(expenses) / totalBudget) * 100).toFixed(1));
}

/**
 * Check which categories are overspent.
 * Returns an array of { categoryId, categoryName, estimated, actual, overspend }.
 */
export function overspentCategories(
  categories: BudgetCategory[],
  expenses: Expense[],
): Array<{
  categoryId: string;
  categoryName: string;
  estimated: number;
  actual: number;
  overspend: number;
}> {
  const byCat = spendByCategory(expenses);
  return categories
    .filter((c) => (byCat[c.id] ?? 0) > c.estimatedAmount)
    .map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      estimated: c.estimatedAmount,
      actual: byCat[c.id] ?? 0,
      overspend: (byCat[c.id] ?? 0) - c.estimatedAmount,
    }));
}

/**
 * Check if the overall budget is overspent.
 */
export function isOverBudget(totalBudget: number, expenses: Expense[]): boolean {
  return totalActualSpend(expenses) > totalBudget;
}

/**
 * Update estimated amounts when categories change but total budget stays the same.
 * Recalculates from current percentages.
 */
export function recalculateEstimates(
  categories: BudgetCategory[],
  totalBudget: number,
): BudgetCategory[] {
  const percentages = categories.map((c) => c.percentage);
  const normalised = normalisePercentages(percentages);
  const amounts = percentagesToAmounts(normalised, totalBudget);

  return categories.map((c, i) => ({
    ...c,
    percentage: normalised[i],
    estimatedAmount: amounts[i],
  }));
}

/**
 * Applies edited category allocations in one consistent step.
 * Percentages are normalised to 100% and converted to rupees; expenses whose category
 * was removed move to "Uncategorised", which is added (at 0%) only when needed.
 */
export function reconcileCategoryEdits(
  editedCategories: BudgetCategory[],
  expenses: Expense[],
  totalBudget: number,
): { categories: BudgetCategory[]; expenses: Expense[]; expensesChanged: boolean } {
  const keptIds = new Set(editedCategories.map((c) => c.id));
  const orphaned = expenses.some((e) => !keptIds.has(e.categoryId));

  const withFallback =
    orphaned && !keptIds.has(UNCATEGORISED_ID)
      ? [...editedCategories, createUncategorisedCategory()]
      : editedCategories;

  const percentages = normalisePercentages(withFallback.map((c) => c.percentage));
  const amounts = percentagesToAmounts(percentages, totalBudget);
  const categories = withFallback.map((c, i) => ({
    ...c,
    percentage: percentages[i],
    estimatedAmount: amounts[i],
    actualAmount: c.actualAmount ?? 0,
  }));

  return {
    categories,
    expenses: orphaned
      ? expenses.map((e) =>
          keptIds.has(e.categoryId) ? e : { ...e, categoryId: UNCATEGORISED_ID },
        )
      : expenses,
    expensesChanged: orphaned,
  };
}
