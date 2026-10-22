import { describe, it, expect } from 'vitest';
import { normaliseRefinement, resolveRefinement } from '@/lib/ai/mergePlan';
import type { AIBlueprint, AIRefinement } from '@/schemas';

const plan: AIBlueprint = {
  themeAndDecor: {
    mainTheme: 'Silk',
    colorPalette: ['gold'],
    decorIdeas: ['jasmine'],
    description: 'd',
  },
  activities: [{ name: 'Sangeet', description: 'd', estimatedDuration: '2h', suitableFor: 'All' }],
  budgetAllocation: [
    { category: 'Venue', percentage: 50, description: 'v' },
    { category: 'Catering', percentage: 50, description: 'c' },
  ],
  timeline: [
    { title: 'Book venue', description: '', daysBeforeEvent: 60, priority: 'high', category: '' },
  ],
  vendorCategories: [
    {
      category: 'Venue',
      description: '',
      estimatedBudgetPercentage: 50,
      tips: [],
      budgetCategory: 'Venue',
    },
  ],
  risksAndAssumptions: ['r'],
  missingInfo: ['m'],
  alternatives: [{ original: 'o', budgetFriendly: 'b', sustainable: 's', accessible: 'a' }],
};

const refinement = (fields: Partial<AIRefinement>): AIRefinement =>
  ({ refinementSummary: 'Updated.', changedSections: [], ...fields }) as AIRefinement;

describe('normaliseRefinement', () => {
  it('converts a { category: percentage } record into allocation items', () => {
    const raw = refinement({
      budgetAllocation: { Venue: 40, Catering: 60 } as unknown as AIRefinement['budgetAllocation'],
    });
    expect(normaliseRefinement(raw).budgetAllocation).toEqual([
      { category: 'Venue', percentage: 40, description: 'Allocation for Venue' },
      { category: 'Catering', percentage: 60, description: 'Allocation for Catering' },
    ]);
  });
});

describe('resolveRefinement', () => {
  it('returns null when the refinement changes nothing', () => {
    const same = refinement({ themeAndDecor: { ...plan.themeAndDecor } });
    expect(resolveRefinement(plan, same, 100_000)).toBeNull();
  });

  it('merges a theme change and leaves the budget alone', () => {
    const result = resolveRefinement(
      plan,
      refinement({ themeAndDecor: { mainTheme: 'Eco Silk' } }),
      100_000,
    );
    expect(result?.blueprint.themeAndDecor.mainTheme).toBe('Eco Silk');
    expect(result?.blueprint.themeAndDecor.decorIdeas).toEqual(['jasmine']);
    expect(result?.categories).toBeNull();
    expect(result?.changedSections).toContain('Theme & Decor');
  });

  it('rebuilds categories for a new total budget', () => {
    const result = resolveRefinement(plan, refinement({ totalBudget: 80_000 }), 100_000);
    expect(result?.totalBudget).toBe(80_000);
    expect(result?.categories?.map((c) => c.estimatedAmount)).toEqual([40_000, 40_000]);
  });

  it('ignores a total budget below the minimum', () => {
    const result = resolveRefinement(
      plan,
      refinement({ totalBudget: 500, themeAndDecor: { mainTheme: 'New' } }),
      100_000,
    );
    expect(result?.totalBudget).toBeUndefined();
  });
});
