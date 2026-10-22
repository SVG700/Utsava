import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetTab } from '@/components/planner/BudgetTab';
import type { StoredEvent, BudgetCategory, Expense } from '@/schemas';

describe('BudgetTab Component', () => {
  const sampleEvent: StoredEvent = {
    id: 'evt-test-123',
    eventType: 'wedding',
    name: 'Sharma Royal Wedding',
    date: '2026-12-15',
    city: 'Jaipur',
    guestCount: 300,
    totalBudget: 1000000,
    theme: 'Royal Rajasthani',
    dietaryPreferences: [],
    culturalPreferences: '',
    accessibilityNeeds: '',
    specialRequirements: '',
    subEvents: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const initialCategories: BudgetCategory[] = [
    {
      id: 'cat-venue',
      name: 'Venue & Stays',
      percentage: 50,
      estimatedAmount: 500000,
      actualAmount: 0,
    },
    {
      id: 'cat-catering',
      name: 'Catering',
      percentage: 30,
      estimatedAmount: 300000,
      actualAmount: 0,
    },
    {
      id: 'cat-decor',
      name: 'Decor & Flowers',
      percentage: 20,
      estimatedAmount: 200000,
      actualAmount: 0,
    },
  ];

  const sampleExpenses: Expense[] = [
    {
      id: 'exp-1',
      categoryId: 'cat-decor',
      description: 'Marigold floral stage booking',
      amount: 45000,
      date: '2026-06-01',
      notes: '',
    },
  ];

  it('renders budget KPIs and category breakdown', () => {
    render(
      <BudgetTab
        event={sampleEvent}
        categories={initialCategories}
        expenses={sampleExpenses}
        onUpdateCategories={vi.fn()}
        onUpdateExpenses={vi.fn()}
      />,
    );

    expect(screen.getByText('Category Allocations')).toBeDefined();
    expect(screen.getAllByText('Venue & Stays').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Decor & Flowers').length).toBeGreaterThan(0);
  });

  it('opens category distribution modal and removes a category with confirmation', () => {
    const onUpdateCategories = vi.fn();
    const onUpdateExpenses = vi.fn();

    render(
      <BudgetTab
        event={sampleEvent}
        categories={initialCategories}
        expenses={sampleExpenses}
        onUpdateCategories={onUpdateCategories}
        onUpdateExpenses={onUpdateExpenses}
      />,
    );

    // 1. Open Adjust Percentages modal
    const adjustBtn = screen.getByRole('button', { name: /adjust percentages/i });
    fireEvent.click(adjustBtn);

    expect(
      screen.getByRole('heading', { name: 'Adjust Budget Allocation Percentages' }),
    ).toBeDefined();

    // 2. Click Remove button on "Decor & Flowers" category
    const removeDecorBtn = screen.getByRole('button', {
      name: /remove category: decor & flowers/i,
    });
    fireEvent.click(removeDecorBtn);

    // 3. Confirmation modal opens
    expect(screen.getByRole('heading', { name: 'Remove Budget Category' })).toBeDefined();

    // 4. Confirm removal
    const confirmBtn = screen.getByRole('button', { name: /confirm removal/i });
    fireEvent.click(confirmBtn);

    // Removal only edits the draft: nothing is persisted before Save
    expect(onUpdateExpenses).not.toHaveBeenCalled();
    expect(onUpdateCategories).not.toHaveBeenCalled();

    // 5. Save the updated allocations
    const saveBtn = screen.getByRole('button', { name: /normalise & save allocations/i });
    fireEvent.click(saveBtn);

    // Expenses linked to decor were remapped to cat-uncategorised
    expect(onUpdateExpenses).toHaveBeenCalledTimes(1);
    const updatedExpenses: Expense[] = onUpdateExpenses.mock.calls[0][0];
    expect(updatedExpenses[0].categoryId).toBe('cat-uncategorised');

    // Saved categories drop Decor and include the Uncategorised category the expense now points to
    expect(onUpdateCategories).toHaveBeenCalledTimes(1);
    const savedCategories: BudgetCategory[] = onUpdateCategories.mock.calls[0][0];
    expect(savedCategories.some((c) => c.id === 'cat-decor')).toBe(false);
    expect(savedCategories.some((c) => c.id === 'cat-uncategorised')).toBe(true);
    expect(updatedExpenses.every((e) => savedCategories.some((c) => c.id === e.categoryId))).toBe(
      true,
    );

    // Total of normalised percentages is 100%
    const totalPercentage = savedCategories.reduce((sum, c) => sum + c.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 0);

    // Total estimated amount matches total budget
    const totalEst = savedCategories.reduce((sum, c) => sum + c.estimatedAmount, 0);
    expect(totalEst).toBe(sampleEvent.totalBudget);
  });

  it('leaves categories and expenses untouched when a removal is cancelled', () => {
    const onUpdateCategories = vi.fn();
    const onUpdateExpenses = vi.fn();

    render(
      <BudgetTab
        event={sampleEvent}
        categories={initialCategories}
        expenses={sampleExpenses}
        onUpdateCategories={onUpdateCategories}
        onUpdateExpenses={onUpdateExpenses}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /adjust percentages/i }));
    fireEvent.click(screen.getByRole('button', { name: /remove category: decor & flowers/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm removal/i }));

    // Abandon the draft instead of saving it
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(onUpdateCategories).not.toHaveBeenCalled();
    expect(onUpdateExpenses).not.toHaveBeenCalled();
  });
});
