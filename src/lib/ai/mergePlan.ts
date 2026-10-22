/**
 * Plan refinement merge logic.
 * Merges partial AI changes into an existing AIBlueprint without
 * mutating or touching unrelated sections.
 */

import type { AIBlueprint, AIRefinement, BudgetCategory } from '@/schemas';
import { buildBudgetCategories } from '@/lib/budget';
import { getChangedSections } from '@/lib/deepCompare';

const MIN_TOTAL_BUDGET = 1000;

type BudgetAllocation = AIBlueprint['budgetAllocation'];

/**
 * Accepts the budget allocation either as the schema array or as a
 * `{ category: percentage }` record (an alternative shape some model replies use).
 */
function toAllocationArray(allocation: unknown): BudgetAllocation | undefined {
  if (Array.isArray(allocation)) return allocation as BudgetAllocation;
  if (allocation && typeof allocation === 'object') {
    return Object.entries(allocation).map(([category, percentage]) => ({
      category,
      percentage: Number(percentage),
      description: `Allocation for ${category}`,
    }));
  }
  return undefined;
}

/** Returns the refinement with its budget allocation in array form. */
export function normaliseRefinement(refinement: AIRefinement): AIRefinement {
  return { ...refinement, budgetAllocation: toAllocationArray(refinement.budgetAllocation) };
}

/** Outcome of applying a refinement to the current blueprint. */
export interface ResolvedRefinement {
  blueprint: AIBlueprint;
  /** Rebuilt categories when the allocation or total budget changed, otherwise null. */
  categories: BudgetCategory[] | null;
  totalBudget?: number;
  changedSections: string[];
  summary: string;
}

/**
 * Merges a refinement into the blueprint and works out what really changed.
 * Returns null when the refinement would not change anything.
 */
export function resolveRefinement(
  current: AIBlueprint,
  rawRefinement: AIRefinement,
  currentTotalBudget: number,
): ResolvedRefinement | null {
  const refinement = normaliseRefinement(rawRefinement);
  const changedSections = getChangedSections(current, refinement, currentTotalBudget);
  if (changedSections.length === 0) return null;

  const blueprint = mergeBlueprintRefinement(current, refinement);
  const totalBudget =
    refinement.totalBudget && refinement.totalBudget >= MIN_TOTAL_BUDGET
      ? refinement.totalBudget
      : undefined;
  const categories =
    refinement.budgetAllocation || totalBudget
      ? buildBudgetCategories(blueprint.budgetAllocation, totalBudget ?? currentTotalBudget)
      : null;

  return {
    blueprint,
    categories,
    totalBudget,
    changedSections,
    summary: refinement.refinementSummary,
  };
}

/** Merges only the sections present in the refinement; everything else is kept as-is. */
export function mergeBlueprintRefinement(
  currentPlan: AIBlueprint,
  refinement: AIRefinement,
): AIBlueprint {
  return {
    themeAndDecor: refinement.themeAndDecor
      ? {
          mainTheme: refinement.themeAndDecor.mainTheme ?? currentPlan.themeAndDecor.mainTheme,
          colorPalette:
            refinement.themeAndDecor.colorPalette ?? currentPlan.themeAndDecor.colorPalette,
          decorIdeas: refinement.themeAndDecor.decorIdeas ?? currentPlan.themeAndDecor.decorIdeas,
          description:
            refinement.themeAndDecor.description ?? currentPlan.themeAndDecor.description,
        }
      : currentPlan.themeAndDecor,
    activities: refinement.activities ?? currentPlan.activities,
    budgetAllocation:
      toAllocationArray(refinement.budgetAllocation) ?? currentPlan.budgetAllocation,
    timeline: refinement.timeline ?? currentPlan.timeline,
    vendorCategories: refinement.vendorCategories ?? currentPlan.vendorCategories,
    risksAndAssumptions: refinement.risksAndAssumptions ?? currentPlan.risksAndAssumptions,
    missingInfo: refinement.missingInfo ?? currentPlan.missingInfo,
    alternatives: refinement.alternatives ?? currentPlan.alternatives,
  };
}
