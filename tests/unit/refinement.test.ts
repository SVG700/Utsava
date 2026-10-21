import { describe, it, expect } from 'vitest';
import { mergeBlueprintRefinement } from '@/lib/ai/mergePlan';
import { deepEqual, getChangedSections } from '@/lib/deepCompare';
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
        budgetCategory: 'Venue',
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

  it('merges record-shaped budget allocation by transforming to array without losing data', () => {
    const rawRefinement = {
      budgetAllocation: {
        'Royal Palace Venue': 35,
        'Gourmet Catering': 45,
        'Floral Decor': 20,
      },
      refinementSummary: 'Updated allocations using raw record shape',
    } as unknown as AIRefinement;

    const updated = mergeBlueprintRefinement(initialPlan, rawRefinement);
    expect(updated.budgetAllocation).toHaveLength(3);
    expect(updated.budgetAllocation[0].category).toBe('Royal Palace Venue');
    expect(updated.budgetAllocation[0].percentage).toBe(35);
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

describe('deepEqual and getChangedSections', () => {
  it('deepEqual compares nested objects and arrays correctly', () => {
    expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })).toBe(true);
    expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 4] })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('getChangedSections only includes sections that actually changed', () => {
    const mockPlan: AIBlueprint = {
      themeAndDecor: {
        mainTheme: 'Theme A',
        colorPalette: ['#fff'],
        decorIdeas: ['Drapes'],
        description: 'Desc',
      },
      activities: [{ name: 'Game', description: 'Desc', estimatedDuration: '1h', suitableFor: 'All' }],
      budgetAllocation: [{ category: 'Venue', percentage: 100, description: 'Venue' }],
      timeline: [],
      vendorCategories: [],
      risksAndAssumptions: ['Risk 1'],
      missingInfo: [],
      alternatives: [],
    };

    // Refinement returns identical theme, but altered budgetAllocation
    const refinement: AIRefinement = {
      themeAndDecor: {
        mainTheme: 'Theme A',
        colorPalette: ['#fff'],
        decorIdeas: ['Drapes'],
        description: 'Desc',
      },
      budgetAllocation: [
        { category: 'Venue', percentage: 60, description: 'Venue' },
        { category: 'Catering', percentage: 40, description: 'Catering' },
      ],
      refinementSummary: 'Updated budget allocation only',
    };

    const changed = getChangedSections(mockPlan, refinement, 100000);
    // Theme & Decor should NOT be listed because its content is identical
    expect(changed).toContain('Budget Allocation');
    expect(changed).not.toContain('Theme & Decor');
  });
});
