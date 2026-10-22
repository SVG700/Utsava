/**
 * Deep comparison utilities to detect genuine differences in AI-refined sections.
 */

import type { AIBlueprint, AIRefinement } from '@/schemas';

/**
 * Deep equality comparison between two arbitrary values.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Returns an array of human-readable section names that actually changed
 * between the current blueprint and refinement using deep comparison.
 */
export function getChangedSections(
  currentPlan: AIBlueprint,
  refinement: AIRefinement,
  currentTotalBudget?: number,
): string[] {
  const changed: string[] = [];

  if (
    refinement.totalBudget !== undefined &&
    currentTotalBudget !== undefined &&
    refinement.totalBudget !== currentTotalBudget
  ) {
    changed.push('Total Budget');
  }

  if (refinement.themeAndDecor) {
    const mergedTheme = {
      mainTheme: refinement.themeAndDecor.mainTheme ?? currentPlan.themeAndDecor.mainTheme,
      colorPalette: refinement.themeAndDecor.colorPalette ?? currentPlan.themeAndDecor.colorPalette,
      decorIdeas: refinement.themeAndDecor.decorIdeas ?? currentPlan.themeAndDecor.decorIdeas,
      description: refinement.themeAndDecor.description ?? currentPlan.themeAndDecor.description,
    };
    if (!deepEqual(currentPlan.themeAndDecor, mergedTheme)) {
      changed.push('Theme & Decor');
    }
  }

  if (
    refinement.budgetAllocation &&
    !deepEqual(currentPlan.budgetAllocation, refinement.budgetAllocation)
  ) {
    changed.push('Budget Allocation');
  }

  if (refinement.activities && !deepEqual(currentPlan.activities, refinement.activities)) {
    changed.push('Activities');
  }

  if (refinement.timeline && !deepEqual(currentPlan.timeline, refinement.timeline)) {
    changed.push('Timeline');
  }

  if (
    refinement.vendorCategories &&
    !deepEqual(currentPlan.vendorCategories, refinement.vendorCategories)
  ) {
    changed.push('Vendor Categories');
  }

  if (refinement.alternatives && !deepEqual(currentPlan.alternatives, refinement.alternatives)) {
    changed.push('Alternatives');
  }

  if (
    refinement.risksAndAssumptions &&
    !deepEqual(currentPlan.risksAndAssumptions, refinement.risksAndAssumptions)
  ) {
    changed.push('Risks & Assumptions');
  }

  if (refinement.missingInfo && !deepEqual(currentPlan.missingInfo, refinement.missingInfo)) {
    changed.push('Decisions Needed');
  }

  return changed;
}
