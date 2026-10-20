import { describe, it, expect } from 'vitest';
import { mergeBlueprintRefinement } from '@/lib/ai/mergePlan';
import type { AIBlueprint, AIRefinement } from '@/schemas';

describe('mergeBlueprintRefinement', () => {
  const initialPlan: AIBlueprint = {
    themeAndDecor: {
      mainTheme: 'Royal Rajasthani',
      colorPalette: ['gold', 'red'],
      decorIdeas: ['Marigold entrance'],
      description: 'Traditional style',
    },
    activities: [
      {
        name: 'Sangeet Antakshari',
        description: 'Singing competition',
        estimatedDuration: '2 hours',
        suitableFor: 'All guests',
      },
    ],
    budgetAllocation: [
      { category: 'Venue', percentage: 40, description: 'Palace venue' },
      { category: 'Catering', percentage: 40, description: 'Marwari feast' },
      { category: 'Decor', percentage: 20, description: 'Traditional mandap' },
    ],
    timeline: [
      {
        title: 'Book venue',
        description: 'Confirm palace banquet',
        daysBeforeEvent: 90,
        priority: 'high',
        category: 'Venue',
      },
    ],
    vendorCategories: [
      {
        category: 'Venue',
        description: 'Banquet manager',
        estimatedBudgetPercentage: 40,
        tips: ['Check monsoon cover'],
      },
    ],
    risksAndAssumptions: ['Heat during afternoon pheras'],
    missingInfo: ['Guest flight timings'],
    alternatives: [
      {
        original: 'Imported florals',
        budgetFriendly: 'Local marigold garlands',
        sustainable: 'Potted plants',
        accessible: 'Wide entrance walkways',
      },
    ],
  };

  it('merges only changed sections without touching unrelated sections', () => {
    const refinement: AIRefinement = {
      budgetAllocation: [
        { category: 'Venue', percentage: 30, description: 'Scaled down venue' },
        { category: 'Catering', percentage: 50, description: 'Expanded gourmet menu' },
        { category: 'Decor', percentage: 20, description: 'Traditional mandap' },
      ],
      refinementSummary: 'Shifted 10% budget from Venue to Catering.',
    };

    const updated = mergeBlueprintRefinement(initialPlan, refinement);

    // Budget was updated
    expect(updated.budgetAllocation[0].percentage).toBe(30);
    expect(updated.budgetAllocation[1].percentage).toBe(50);

    // Unrelated sections were strictly preserved
    expect(updated.themeAndDecor).toEqual(initialPlan.themeAndDecor);
    expect(updated.activities).toEqual(initialPlan.activities);
    expect(updated.timeline).toEqual(initialPlan.timeline);
    expect(updated.vendorCategories).toEqual(initialPlan.vendorCategories);
    expect(updated.risksAndAssumptions).toEqual(initialPlan.risksAndAssumptions);
    expect(updated.alternatives).toEqual(initialPlan.alternatives);
  });

  it('merges new theme and decor when updated', () => {
    const refinement: AIRefinement = {
      themeAndDecor: {
        mainTheme: 'Eco-Friendly Terracotta & Jasmine',
        colorPalette: ['earthy-brown', 'mogra-white', 'sage-green'],
        decorIdeas: ['Clay pots with mogra garlands', 'Bamboo lanterns'],
        description: 'Zero plastic sustainable aesthetic',
      },
      refinementSummary: 'Updated theme to sustainable terracotta.',
    };

    const updated = mergeBlueprintRefinement(initialPlan, refinement);

    expect(updated.themeAndDecor.mainTheme).toBe('Eco-Friendly Terracotta & Jasmine');
    expect(updated.budgetAllocation).toEqual(initialPlan.budgetAllocation);
  });
});
