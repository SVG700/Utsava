import { describe, it, expect } from 'vitest';
import { eventInputSchema, storedEventSchema } from '@/schemas';
import { aiBlueprintSchema, aiRefinementSchema, aiIdeasSchema } from '@/schemas';
import { budgetCategorySchema, expenseSchema, timelineTaskSchema, vendorSchema } from '@/schemas';

describe('eventInputSchema', () => {
  const validInput = {
    eventType: 'wedding',
    name: 'Sharma Wedding',
    date: '2026-12-15',
    city: 'Mumbai',
    guestCount: 500,
    totalBudget: 1500000,
    theme: 'Royal Rajasthani',
    dietaryPreferences: ['vegetarian', 'jain'],
    culturalPreferences: 'Hindu Marwari traditions',
    accessibilityNeeds: '',
    specialRequirements: '',
    subEvents: ['haldi', 'mehendi', 'sangeet', 'wedding', 'reception'],
  };

  it('accepts valid input', () => {
    const result = eventInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing event type', () => {
    const result = eventInputSchema.safeParse({ ...validInput, eventType: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects too-short name', () => {
    const result = eventInputSchema.safeParse({ ...validInput, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = eventInputSchema.safeParse({ ...validInput, date: '15-12-2026' });
    expect(result.success).toBe(false);
  });

  it('rejects past event dates', () => {
    const result = eventInputSchema.safeParse({ ...validInput, date: '2024-01-01' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Event date cannot be in the past');
    }
  });

  it('rejects zero guests', () => {
    const result = eventInputSchema.safeParse({ ...validInput, guestCount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects budget under 1000', () => {
    const result = eventInputSchema.safeParse({ ...validInput, totalBudget: 500 });
    expect(result.success).toBe(false);
  });

  it('accepts minimal input with defaults', () => {
    const minimal = {
      eventType: 'birthday',
      name: 'Birthday',
      date: '2026-06-01',
      city: 'Delhi',
      guestCount: 20,
      totalBudget: 50000,
    };
    const result = eventInputSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dietaryPreferences).toEqual([]);
      expect(result.data.subEvents).toEqual([]);
    }
  });
});

describe('storedEventSchema', () => {
  it('requires id, createdAt, updatedAt', () => {
    const result = storedEventSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      eventType: 'community',
      name: 'Diwali Mela',
      date: '2026-11-01',
      city: 'Jaipur',
      guestCount: 200,
      totalBudget: 300000,
    });
    expect(result.success).toBe(true);
  });
});

describe('aiBlueprintSchema', () => {
  const validBlueprint = {
    themeAndDecor: {
      mainTheme: 'Royal Rajasthani',
      colorPalette: ['gold', 'red', 'maroon'],
      decorIdeas: ['Marigold entrance', 'Mirror work'],
      description: 'Elegant Rajasthani theme',
    },
    activities: [
      {
        name: 'Sangeet Night',
        description: 'Dance performances',
        estimatedDuration: '3 hours',
        suitableFor: 'All ages',
      },
    ],
    budgetAllocation: [
      { category: 'Venue', percentage: 30, description: 'Venue rental' },
      { category: 'Catering', percentage: 40, description: 'Food and beverage' },
    ],
    timeline: [
      { title: 'Book venue', description: 'Find and book', daysBeforeEvent: 90, priority: 'high' },
    ],
    vendorCategories: [
      {
        category: 'Venue',
        description: 'Wedding venue',
        estimatedBudgetPercentage: 30,
        tips: ['Visit multiple venues'],
      },
    ],
    risksAndAssumptions: ['Weather dependent outdoor events'],
    missingInfo: ['Exact venue location'],
    alternatives: [
      {
        original: 'Imported flowers',
        budgetFriendly: 'Local marigold garlands',
        sustainable: 'Potted plants as decor',
        accessible: 'Low-height arrangements',
      },
    ],
  };

  it('accepts valid blueprint', () => {
    const result = aiBlueprintSchema.safeParse(validBlueprint);
    expect(result.success).toBe(true);
  });

  it('rejects missing theme', () => {
    const rest = { ...validBlueprint } as Record<string, unknown>;
    delete rest.themeAndDecor;
    const result = aiBlueprintSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid percentage', () => {
    const invalid = {
      ...validBlueprint,
      budgetAllocation: [{ category: 'Venue', percentage: 150, description: 'Too high' }],
    };
    const result = aiBlueprintSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('aiRefinementSchema', () => {
  it('accepts partial changes with summary', () => {
    const result = aiRefinementSchema.safeParse({
      budgetAllocation: [{ category: 'Venue', percentage: 25, description: 'Reduced' }],
      refinementSummary: 'Reduced venue budget by 5%',
    });
    expect(result.success).toBe(true);
  });

  it('requires refinementSummary', () => {
    const result = aiRefinementSchema.safeParse({
      budgetAllocation: [{ category: 'Venue', percentage: 25, description: 'Reduced' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('aiIdeasSchema', () => {
  it('accepts valid ideas', () => {
    const result = aiIdeasSchema.safeParse({
      section: 'food',
      ideas: [
        {
          title: 'Street food stalls',
          description: 'Chaat, pani puri, etc.',
          estimatedCost: '₹50,000 for 200 guests',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid section', () => {
    const result = aiIdeasSchema.safeParse({
      section: 'invalid-section',
      ideas: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('plan schemas', () => {
  it('validates budget category', () => {
    const result = budgetCategorySchema.safeParse({
      id: 'cat-0',
      name: 'Venue',
      percentage: 30,
      estimatedAmount: 150000,
      actualAmount: 120000,
    });
    expect(result.success).toBe(true);
  });

  it('validates expense', () => {
    const result = expenseSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      categoryId: 'cat-0',
      description: 'Venue booking advance',
      amount: 50000,
      date: '2026-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('validates timeline task', () => {
    const result = timelineTaskSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Book venue',
      dueDate: '2026-03-15',
      daysBeforeEvent: 90,
      priority: 'high',
      completed: false,
    });
    expect(result.success).toBe(true);
  });

  it('validates vendor', () => {
    const result = vendorSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      category: 'Venue',
      status: 'shortlisted',
    });
    expect(result.success).toBe(true);
  });
});
