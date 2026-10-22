import { describe, it, expect } from 'vitest';
import {
  applyGeneratedBlueprint,
  applyRefinement,
  buildVendorsFromBlueprint,
  changeEventDate,
  changeTotalBudget,
  REFINED_SECTION,
  type PlanState,
} from '@/lib/planUpdates';
import { buildBudgetCategories, UNCATEGORISED_ID } from '@/lib/budget';
import type { AIBlueprint, StoredEvent } from '@/schemas';

const event: StoredEvent = {
  id: '11111111-1111-4111-8111-111111111111',
  eventType: 'wedding',
  name: 'Test Wedding',
  date: '2027-02-14',
  city: 'Bengaluru',
  guestCount: 300,
  totalBudget: 1_000_000,
  theme: '',
  dietaryPreferences: [],
  culturalPreferences: '',
  accessibilityNeeds: '',
  specialRequirements: '',
  subEvents: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const blueprint = (overrides: Partial<AIBlueprint> = {}): AIBlueprint => ({
  themeAndDecor: {
    mainTheme: 'Silk',
    colorPalette: ['gold'],
    decorIdeas: ['jasmine'],
    description: 'd',
  },
  activities: [{ name: 'Sangeet', description: 'd', estimatedDuration: '2h', suitableFor: 'All' }],
  budgetAllocation: [
    { category: 'Venue', percentage: 60, description: 'v' },
    { category: 'Catering', percentage: 40, description: 'c' },
  ],
  timeline: [
    {
      title: 'Book venue',
      description: '',
      daysBeforeEvent: 60,
      priority: 'high',
      category: 'Venue',
    },
  ],
  vendorCategories: [
    {
      category: 'Venue Manager',
      description: '',
      estimatedBudgetPercentage: 60,
      tips: [],
      budgetCategory: 'Venue',
    },
  ],
  risksAndAssumptions: ['r'],
  missingInfo: ['m'],
  alternatives: [{ original: 'o', budgetFriendly: 'b', sustainable: 's', accessible: 'a' }],
  ...overrides,
});

const emptyPlan = (): PlanState => ({
  event,
  blueprint: null,
  categories: [],
  expenses: [],
  tasks: [],
  vendors: [],
});

describe('buildVendorsFromBlueprint', () => {
  it('links each vendor to the budget category the AI named', () => {
    const categories = buildBudgetCategories(blueprint().budgetAllocation, 1000);
    const [vendor] = buildVendorsFromBlueprint(blueprint().vendorCategories, categories);
    expect(vendor.budgetCategoryId).toBe('cat-venue');
    expect(vendor).toMatchObject({ source: 'ai', status: 'not-started', suggestedByAI: true });
  });
});

describe('applyGeneratedBlueprint', () => {
  it('builds categories summing to the budget, tasks and linked vendors', () => {
    const changes = applyGeneratedBlueprint(emptyPlan(), blueprint());
    expect(changes.categories?.reduce((s, c) => s + c.estimatedAmount, 0)).toBe(1_000_000);
    expect(changes.tasks).toHaveLength(1);
    expect(changes.tasks?.[0].dueDate).toBe('2026-12-16');
    expect(changes.vendors?.[0].budgetCategoryId).toBe('cat-venue');
  });

  it('keeps completed tasks and user vendor quotes across regeneration without duplicates', () => {
    const first = { ...emptyPlan(), ...applyGeneratedBlueprint(emptyPlan(), blueprint()) };
    const worked: PlanState = {
      ...first,
      tasks: first.tasks.map((t) => ({ ...t, completed: true })),
      vendors: first.vendors.map((v) => ({ ...v, quote: 250_000 })),
    };

    const second = applyGeneratedBlueprint(worked, blueprint());
    expect(second.tasks).toHaveLength(1);
    expect(second.tasks?.[0]).toMatchObject({ id: worked.tasks[0].id, completed: true });
    expect(second.vendors).toHaveLength(1);
    expect(second.vendors?.[0].quote).toBe(250_000);
  });
});

describe('applyRefinement', () => {
  it('updates the total budget and keeps unrelated parts untouched', () => {
    const plan = { ...emptyPlan(), ...applyGeneratedBlueprint(emptyPlan(), blueprint()) };
    const changes = applyRefinement(plan, {
      blueprint: plan.blueprint!,
      categories: null,
      totalBudget: 800_000,
    });
    expect(changes.event?.totalBudget).toBe(800_000);
    expect(changes.tasks).toBeUndefined();
    expect(changes.vendors).toBeUndefined();
  });

  it('re-maps expenses when a refinement renames budget categories', () => {
    const plan = { ...emptyPlan(), ...applyGeneratedBlueprint(emptyPlan(), blueprint()) };
    const withExpense: PlanState = {
      ...plan,
      expenses: [
        {
          id: 'e1',
          categoryId: 'cat-catering',
          description: 'Token',
          amount: 5000,
          date: '2026-10-01',
          notes: '',
        },
      ],
    };
    const refined = blueprint({
      budgetAllocation: [
        { category: 'Venue', percentage: 50, description: 'v' },
        { category: 'Gourmet Catering', percentage: 50, description: 'c' },
      ],
    });
    const changes = applyRefinement(withExpense, {
      blueprint: refined,
      categories: buildBudgetCategories(refined.budgetAllocation, event.totalBudget),
    });

    const categoryIds = changes.categories?.map((c) => c.id) ?? [];
    expect(changes.expenses?.[0].categoryId).toBe(UNCATEGORISED_ID);
    expect(categoryIds).toContain(UNCATEGORISED_ID);
  });

  it('rebuilds tasks only when the timeline section changed', () => {
    const plan = { ...emptyPlan(), ...applyGeneratedBlueprint(emptyPlan(), blueprint()) };
    const refined = blueprint({
      timeline: [
        {
          title: 'Book venue',
          description: '',
          daysBeforeEvent: 60,
          priority: 'high',
          category: 'Venue',
        },
        {
          title: 'Order invitations',
          description: '',
          daysBeforeEvent: 45,
          priority: 'medium',
          category: 'Invites',
        },
      ],
    });
    const changes = applyRefinement(plan, {
      blueprint: refined,
      categories: null,
      changedSections: [REFINED_SECTION.timeline],
    });
    expect(changes.tasks).toHaveLength(2);
  });
});

describe('changeEventDate and changeTotalBudget', () => {
  it('re-dates every task by its offset', () => {
    const plan = { ...emptyPlan(), ...applyGeneratedBlueprint(emptyPlan(), blueprint()) };
    const changes = changeEventDate(plan, '2027-03-01');
    expect(changes.event?.date).toBe('2027-03-01');
    expect(changes.tasks?.[0].dueDate).toBe('2026-12-31');
  });

  it('recomputes rupee targets for the new total', () => {
    const plan = { ...emptyPlan(), ...applyGeneratedBlueprint(emptyPlan(), blueprint()) };
    const changes = changeTotalBudget(plan, 500_000);
    expect(changes.categories?.map((c) => c.estimatedAmount)).toEqual([300_000, 200_000]);
  });
});
