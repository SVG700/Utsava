/**
 * Plan refinement merge logic.
 * Merges partial AI changes into an existing AIBlueprint without
 * mutating or touching unrelated sections.
 */

import type { AIBlueprint, AIRefinement } from '@/schemas';

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
    budgetAllocation: Array.isArray(refinement.budgetAllocation)
      ? refinement.budgetAllocation
      : refinement.budgetAllocation && typeof refinement.budgetAllocation === 'object'
        ? Object.entries(refinement.budgetAllocation).map(([cat, pct]) => ({
            category: cat,
            percentage: Number(pct),
            description: `Allocation for ${cat}`,
          }))
        : currentPlan.budgetAllocation,
    timeline: refinement.timeline ?? currentPlan.timeline,
    vendorCategories: refinement.vendorCategories ?? currentPlan.vendorCategories,
    risksAndAssumptions: refinement.risksAndAssumptions ?? currentPlan.risksAndAssumptions,
    missingInfo: refinement.missingInfo ?? currentPlan.missingInfo,
    alternatives: refinement.alternatives ?? currentPlan.alternatives,
  };
}
