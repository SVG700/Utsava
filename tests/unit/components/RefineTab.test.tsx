import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RefineTab } from '@/components/planner/RefineTab';
import type { StoredEvent, AIBlueprint } from '@/schemas';
import * as apiModule from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    apiRefinePlan: vi.fn(),
  };
});

describe('RefineTab Component', () => {
  const sampleEvent: StoredEvent = {
    id: 'evt-test-123',
    eventType: 'birthday',
    name: 'Aarav 30th Birthday',
    date: '2026-12-25',
    city: 'Bengaluru',
    guestCount: 50,
    totalBudget: 150000,
    theme: 'Outdoor Garden',
    dietaryPreferences: [],
    culturalPreferences: '',
    accessibilityNeeds: '',
    specialRequirements: '',
    subEvents: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const sampleBlueprint: AIBlueprint = {
    themeAndDecor: {
      mainTheme: 'Outdoor Garden',
      colorPalette: ['Emerald', 'Gold'],
      decorIdeas: ['Fairy lights'],
      description: 'Garden aesthetic',
    },
    activities: [
      {
        name: 'Live Music',
        description: 'Acoustic guitar',
        estimatedDuration: '1 hour',
        suitableFor: 'All',
      },
    ],
    budgetAllocation: [
      { category: 'Venue', percentage: 50, description: 'Lawn' },
      { category: 'Catering', percentage: 50, description: 'Dinner' },
    ],
    timeline: [],
    vendorCategories: [],
    risksAndAssumptions: [],
    missingInfo: [],
    alternatives: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows no "Sections updated" when the plan is unchanged, and renders neutral notice', async () => {
    const onApplyRefinedPlan = vi.fn();

    // Refinement returns identical plan sections (no real changes)
    vi.mocked(apiModule.apiRefinePlan).mockResolvedValueOnce({
      success: true,
      refinement: {
        changedSections: ['themeAndDecor'],
        themeAndDecor: {
          mainTheme: 'Outdoor Garden',
          colorPalette: ['Emerald', 'Gold'],
          decorIdeas: ['Fairy lights'],
          description: 'Garden aesthetic',
        },
        refinementSummary: 'Reviewed plan, keeping current setup unchanged.',
      },
    });

    render(
      <RefineTab
        event={sampleEvent}
        blueprint={sampleBlueprint}
        tasks={[]}
        onApplyRefinedPlan={onApplyRefinedPlan}
      />,
    );

    const input = screen.getByLabelText(/refinement request/i);
    fireEvent.change(input, { target: { value: 'Make no changes to the plan' } });

    const submitBtn = screen.getByRole('button', { name: /^refine$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Must not call onApplyRefinedPlan when no sections actually changed
      expect(onApplyRefinedPlan).not.toHaveBeenCalled();
    });

    // Verify "Sections updated" is NOT in the document
    expect(screen.queryByText(/sections updated:/i)).toBeNull();

    // Verify neutral notice is displayed
    expect(screen.getByText(/no changes could be applied to your plan/i)).toBeDefined();
  });

  it('renders neutral notice when API returns 422 NO_CHANGES', async () => {
    vi.mocked(apiModule.apiRefinePlan).mockRejectedValueOnce(
      new apiModule.ApiError(
        'No changes could be applied to your plan. Try a more specific request.',
        'NO_CHANGES',
        422,
      ),
    );

    render(
      <RefineTab
        event={sampleEvent}
        blueprint={sampleBlueprint}
        tasks={[]}
        onApplyRefinedPlan={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/refinement request/i);
    fireEvent.change(input, { target: { value: 'Unknown command' } });

    const submitBtn = screen.getByRole('button', { name: /^refine$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/no changes could be applied to your plan/i)).toBeDefined();
    });

    // Must not show "Sections updated"
    expect(screen.queryByText(/sections updated:/i)).toBeNull();
  });
});
