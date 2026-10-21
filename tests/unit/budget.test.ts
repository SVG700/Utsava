import { describe, it, expect } from 'vitest';
import {
  formatINR,
  normalisePercentages,
  percentagesToAmounts,
  buildBudgetCategories,
  totalActualSpend,
  spendByCategory,
  remainingBudget,
  utilisationPercent,
  overspentCategories,
  isOverBudget,
  recalculateEstimates,
  slugifyCategory,
  mergeVendorsOnRegenerate,
  remapExpensesToNewCategories,
  findMatchingCategoryId,
} from '@/lib/budget';
import type { BudgetCategory, Expense, Vendor } from '@/schemas';

describe('formatINR', () => {
  it('formats amounts with INR symbol and en-IN grouping', () => {
    expect(formatINR(150000)).toBe('₹1,50,000');
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(10000000)).toBe('₹1,00,00,000');
  });

  it('rounds to nearest integer', () => {
    expect(formatINR(1500.7)).toBe('₹1,501');
    expect(formatINR(1500.3)).toBe('₹1,500');
  });

  it('handles zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });
});

describe('normalisePercentages', () => {
  it('normalises percentages to sum to 100', () => {
    const result = normalisePercentages([20, 30, 50]);
    expect(result.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1);
    expect(result).toEqual([20, 30, 50]);
  });

  it('scales up when total is less than 100', () => {
    const result = normalisePercentages([10, 20, 20]);
    expect(result.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1);
    expect(result[0]).toBeCloseTo(20, 0);
    expect(result[1]).toBeCloseTo(40, 0);
    expect(result[2]).toBeCloseTo(40, 0);
  });

  it('scales down when total exceeds 100', () => {
    const result = normalisePercentages([50, 50, 50]);
    expect(result.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1);
  });

  it('distributes equally when all are zero', () => {
    const result = normalisePercentages([0, 0, 0]);
    expect(result).toEqual([33.33, 33.33, 33.34]);
  });

  it('handles empty array', () => {
    expect(normalisePercentages([])).toEqual([]);
  });

  it('handles single item', () => {
    expect(normalisePercentages([40])).toEqual([100]);
  });
});

describe('percentagesToAmounts', () => {
  it('converts percentages to rupee amounts', () => {
    const result = percentagesToAmounts([50, 30, 20], 100000);
    expect(result).toEqual([50000, 30000, 20000]);
  });

  it('ensures amounts sum to total budget', () => {
    const result = percentagesToAmounts([33.33, 33.33, 33.34], 100000);
    expect(result.reduce((s, v) => s + v, 0)).toBe(100000);
  });

  it('handles empty array', () => {
    expect(percentagesToAmounts([], 100000)).toEqual([]);
  });
});

describe('buildBudgetCategories', () => {
  it('builds categories with normalised percentages and amounts', () => {
    const aiCategories = [
      { category: 'Venue', percentage: 30 },
      { category: 'Catering', percentage: 40 },
      { category: 'Decor', percentage: 20 },
    ];
    const result = buildBudgetCategories(aiCategories, 500000);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Venue');
    // Percentages normalise 30+40+20=90 → scaled to 100
    const totalEstimated = result.reduce((s, c) => s + c.estimatedAmount, 0);
    expect(totalEstimated).toBe(500000);
    expect(result.every((c) => c.actualAmount === 0)).toBe(true);
  });
});

describe('expense calculations', () => {
  const expenses: Expense[] = [
    {
      id: '1',
      categoryId: 'cat-0',
      description: 'Venue booking',
      amount: 50000,
      date: '2026-01-15',
      notes: '',
    },
    {
      id: '2',
      categoryId: 'cat-0',
      description: 'Venue extras',
      amount: 10000,
      date: '2026-01-16',
      notes: '',
    },
    {
      id: '3',
      categoryId: 'cat-1',
      description: 'Caterer advance',
      amount: 30000,
      date: '2026-01-17',
      notes: '',
    },
  ];

  it('calculates total actual spend', () => {
    expect(totalActualSpend(expenses)).toBe(90000);
  });

  it('calculates spend by category', () => {
    const result = spendByCategory(expenses);
    expect(result['cat-0']).toBe(60000);
    expect(result['cat-1']).toBe(30000);
  });

  it('calculates remaining budget', () => {
    expect(remainingBudget(500000, expenses)).toBe(410000);
  });

  it('calculates utilisation percent', () => {
    expect(utilisationPercent(500000, expenses)).toBe(18);
  });

  it('handles zero budget for utilisation', () => {
    expect(utilisationPercent(0, expenses)).toBe(0);
  });
});

describe('overspentCategories', () => {
  const categories: BudgetCategory[] = [
    { id: 'cat-0', name: 'Venue', percentage: 50, estimatedAmount: 50000, actualAmount: 0 },
    { id: 'cat-1', name: 'Catering', percentage: 30, estimatedAmount: 30000, actualAmount: 0 },
  ];

  it('detects overspent categories', () => {
    const expenses: Expense[] = [
      { id: '1', categoryId: 'cat-0', description: 'V', amount: 60000, date: '2026-01-15', notes: '' },
    ];
    const result = overspentCategories(categories, expenses);
    expect(result).toHaveLength(1);
    expect(result[0].categoryId).toBe('cat-0');
    expect(result[0].overspend).toBe(10000);
  });

  it('returns empty when no overspend', () => {
    const expenses: Expense[] = [
      { id: '1', categoryId: 'cat-0', description: 'V', amount: 40000, date: '2026-01-15', notes: '' },
    ];
    expect(overspentCategories(categories, expenses)).toHaveLength(0);
  });
});

describe('isOverBudget', () => {
  it('returns true when total spend exceeds budget', () => {
    const expenses: Expense[] = [
      { id: '1', categoryId: 'cat-0', description: 'V', amount: 600000, date: '2026-01-15', notes: '' },
    ];
    expect(isOverBudget(500000, expenses)).toBe(true);
  });

  it('returns false when within budget', () => {
    const expenses: Expense[] = [
      { id: '1', categoryId: 'cat-0', description: 'V', amount: 400000, date: '2026-01-15', notes: '' },
    ];
    expect(isOverBudget(500000, expenses)).toBe(false);
  });
});

describe('recalculateEstimates', () => {
  it('recalculates from current percentages with new total', () => {
    const categories: BudgetCategory[] = [
      { id: 'cat-0', name: 'Venue', percentage: 50, estimatedAmount: 50000, actualAmount: 0 },
      { id: 'cat-1', name: 'Catering', percentage: 50, estimatedAmount: 50000, actualAmount: 0 },
    ];
    const result = recalculateEstimates(categories, 200000);
    expect(result[0].estimatedAmount).toBe(100000);
    expect(result[1].estimatedAmount).toBe(100000);
    expect(result[0].estimatedAmount + result[1].estimatedAmount).toBe(200000);
  });

  it('guarantees 100% budget allocation with prime budgets without rounding drift', () => {
    const primeBudget = 1333333;
    const categories: BudgetCategory[] = [
      { id: 'cat-venue', name: 'Venue', percentage: 33.33, estimatedAmount: 0, actualAmount: 0 },
      { id: 'cat-catering', name: 'Catering', percentage: 33.33, estimatedAmount: 0, actualAmount: 0 },
      { id: 'cat-decor', name: 'Decor', percentage: 33.34, estimatedAmount: 0, actualAmount: 0 },
    ];
    const recalculated = recalculateEstimates(categories, primeBudget);
    const sum = recalculated.reduce((acc, cat) => acc + cat.estimatedAmount, 0);
    expect(sum).toBe(primeBudget);

    const built = buildBudgetCategories(
      [
        { category: 'Venue', percentage: 33.33 },
        { category: 'Catering', percentage: 33.33 },
        { category: 'Decor', percentage: 33.34 },
      ],
      primeBudget
    );
    const builtSum = built.reduce((acc, cat) => acc + cat.estimatedAmount, 0);
    expect(builtSum).toBe(primeBudget);
  });
});

describe('slugifyCategory & slug category IDs', () => {
  it('converts category names into clean url-friendly slugs', () => {
    expect(slugifyCategory('Food & Catering')).toBe('food-catering');
    expect(slugifyCategory('Theme, Decor & Ambience')).toBe('theme-decor-ambience');
    expect(slugifyCategory('  DJ / Music  ')).toBe('dj-music');
  });

  it('buildBudgetCategories generates stable slug-based IDs', () => {
    const categories = buildBudgetCategories(
      [
        { category: 'Venue Booking', percentage: 50 },
        { category: 'Catering & Dining', percentage: 50 },
      ],
      100000
    );

    expect(categories[0].id).toBe('cat-venue-booking');
    expect(categories[1].id).toBe('cat-catering-dining');
  });

  it('disambiguates duplicate category slugs cleanly', () => {
    const categories = buildBudgetCategories(
      [
        { category: 'Decor', percentage: 50 },
        { category: 'Decor', percentage: 50 },
      ],
      100000
    );

    expect(categories[0].id).toBe('cat-decor');
    expect(categories[1].id).toBe('cat-decor-1');
  });
});

describe('mergeVendorsOnRegenerate', () => {
  it('preserves user customizations and custom vendors across regeneration', () => {
    const existingVendors: Vendor[] = [
      {
        id: 'v-1',
        category: 'Catering',
        name: 'Royal Caterers',
        contact: '+91 9876543210',
        quote: 250000,
        status: 'booked',
        notes: 'Signed contract',
        suggestedByAI: true,
      },
      {
        id: 'v-custom',
        category: 'Fireworks',
        name: 'Local Pyrotechnics',
        contact: 'fireworks@local.in',
        quote: 30000,
        status: 'shortlisted',
        notes: 'Permission pending',
        suggestedByAI: false,
      },
    ];

    const newBlueprintVendors: Vendor[] = [
      {
        id: 'new-1',
        category: 'Catering',
        name: '',
        contact: '',
        status: 'not-started',
        notes: '',
        suggestedByAI: true,
      },
      {
        id: 'new-2',
        category: 'Photography',
        name: '',
        contact: '',
        status: 'not-started',
        notes: '',
        suggestedByAI: true,
      },
    ];

    const merged = mergeVendorsOnRegenerate(existingVendors, newBlueprintVendors);

    // Catering preserved user details and original ID
    const catering = merged.find((v) => v.category === 'Catering');
    expect(catering).toBeDefined();
    expect(catering?.id).toBe('v-1');
    expect(catering?.name).toBe('Royal Caterers');
    expect(catering?.contact).toBe('+91 9876543210');
    expect(catering?.quote).toBe(250000);
    expect(catering?.status).toBe('booked');
    expect(catering?.notes).toBe('Signed contract');

    // New AI suggested vendor included
    const photo = merged.find((v) => v.category === 'Photography');
    expect(photo).toBeDefined();

    // User-added custom vendor retained
    const fireworks = merged.find((v) => v.category === 'Fireworks');
    expect(fireworks).toBeDefined();
    expect(fireworks?.id).toBe('v-custom');
    expect(fireworks?.name).toBe('Local Pyrotechnics');
  });
});

describe('remapExpensesToNewCategories', () => {
  const oldCategories: BudgetCategory[] = [
    { id: 'cat-venue', name: 'Venue', percentage: 40, estimatedAmount: 200000, actualAmount: 100000 },
    { id: 'cat-catering', name: 'Catering', percentage: 35, estimatedAmount: 175000, actualAmount: 50000 },
    { id: 'cat-decor', name: 'Decor', percentage: 25, estimatedAmount: 125000, actualAmount: 30000 },
  ];

  const newCategories: BudgetCategory[] = [
    { id: 'cat-venue', name: 'Venue', percentage: 50, estimatedAmount: 250000, actualAmount: 0 },
    { id: 'cat-catering-royal', name: 'Catering', percentage: 30, estimatedAmount: 150000, actualAmount: 0 },
    { id: 'cat-music', name: 'Music & Sound', percentage: 20, estimatedAmount: 100000, actualAmount: 0 },
  ];

  it('maps existing expenses to new categories by matching category name', () => {
    const existingExpenses: Expense[] = [
      { id: 'e-1', categoryId: 'cat-venue', description: 'Hall advance', amount: 80000, date: '2026-04-01', notes: '' },
      { id: 'e-2', categoryId: 'cat-catering', description: 'Food advance', amount: 45000, date: '2026-04-02', notes: '' },
    ];

    const { updatedExpenses, finalCategories } = remapExpensesToNewCategories(
      existingExpenses,
      oldCategories,
      newCategories
    );

    expect(updatedExpenses).toHaveLength(2);
    // Hall matched Venue
    expect(updatedExpenses[0].categoryId).toBe('cat-venue');
    // Food matched Catering with new ID cat-catering-royal
    expect(updatedExpenses[1].categoryId).toBe('cat-catering-royal');
    // No uncategorised needed
    expect(finalCategories.some((c) => c.id === 'cat-uncategorised')).toBe(false);
  });

  it('safely moves unmatched expenses to an Uncategorised category without deleting or misassigning', () => {
    const existingExpenses: Expense[] = [
      { id: 'e-1', categoryId: 'cat-venue', description: 'Hall advance', amount: 80000, date: '2026-04-01', notes: '' },
      { id: 'e-decor', categoryId: 'cat-decor', description: 'Floral stage booking', amount: 30000, date: '2026-04-03', notes: '' },
    ];

    const { updatedExpenses, finalCategories } = remapExpensesToNewCategories(
      existingExpenses,
      oldCategories,
      newCategories // note: newCategories does NOT have Decor
    );

    expect(updatedExpenses).toHaveLength(2);
    expect(updatedExpenses[0].categoryId).toBe('cat-venue');

    // Decor expense was routed to cat-uncategorised
    expect(updatedExpenses[1].categoryId).toBe('cat-uncategorised');
    expect(updatedExpenses[1].description).toBe('Floral stage booking');
    expect(updatedExpenses[1].amount).toBe(30000);

    // Uncategorised category was dynamically added to finalCategories
    const uncat = finalCategories.find((c) => c.id === 'cat-uncategorised');
    expect(uncat).toBeDefined();
    expect(uncat?.name).toBe('Uncategorised');
    expect(uncat?.percentage).toBe(0);
  });
});

describe('findMatchingCategoryId', () => {
  const categories: BudgetCategory[] = [
    { id: 'cat-palace-venue', name: 'Palace Venue', percentage: 40, estimatedAmount: 400000, actualAmount: 0 },
    { id: 'cat-catering', name: 'Catering & Beverages', percentage: 35, estimatedAmount: 350000, actualAmount: 0 },
    { id: 'cat-decor', name: 'Floral Decor', percentage: 25, estimatedAmount: 250000, actualAmount: 0 },
  ];

  it('finds exact category by name (case-insensitive)', () => {
    expect(findMatchingCategoryId('Palace Venue', categories)).toBe('cat-palace-venue');
    expect(findMatchingCategoryId('palace venue', categories)).toBe('cat-palace-venue');
  });

  it('finds best matching category via token overlap', () => {
    expect(findMatchingCategoryId('Decor', categories)).toBe('cat-decor');
    expect(findMatchingCategoryId('Catering', categories)).toBe('cat-catering');
  });

  it('returns undefined if no match or empty input', () => {
    expect(findMatchingCategoryId('', categories)).toBeUndefined();
    expect(findMatchingCategoryId(undefined, categories)).toBeUndefined();
    expect(findMatchingCategoryId('Pyrotechnics Fireworks', categories)).toBeUndefined();
  });
});
