import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IdeasTab } from '@/components/planner/IdeasTab';
import { saveEventIdeas } from '@/lib/storage';
import { calculateDueDate } from '@/lib/dates';
import type { StoredEvent } from '@/schemas';

describe('IdeasTab Component', () => {
  const sampleEvent: StoredEvent = {
    id: 'evt-ideas-test-123',
    eventType: 'wedding',
    name: 'Kapoor Wedding Celebrations',
    date: '2026-11-20',
    city: 'Delhi',
    guestCount: 250,
    totalBudget: 1500000,
    theme: 'Traditional Elegance',
    dietaryPreferences: [],
    culturalPreferences: '',
    accessibilityNeeds: '',
    specialRequirements: '',
    subEvents: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const sampleIdeas = [
    {
      title: 'Artisanal Banarasi Chaat Bar',
      description: 'Live interactive chaat counter with organic clay kulhads',
      estimatedCost: '₹35,000 for 250 guests',
      sustainability: 'Biodegradable clay crockery and zero single-use plastic',
    },
    {
      title: 'Live Tawa Mithai Station',
      description: 'Fresh warm jalebi and rabri station with saffron garnish',
      estimatedCost: '₹28,000 for 250 guests',
      sustainability: 'Locally sourced A2 dairy and traditional earthen bowls',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    saveEventIdeas(sampleEvent.id, {
      food: sampleIdeas,
    });
  });

  it('renders existing ideas from storage for the active section', () => {
    render(<IdeasTab event={sampleEvent} onAddTask={vi.fn()} />);

    expect(screen.getByText('Artisanal Banarasi Chaat Bar')).toBeDefined();
    expect(screen.getByText('Live Tawa Mithai Station')).toBeDefined();
    expect(
      screen.getByText('Biodegradable clay crockery and zero single-use plastic'),
    ).toBeDefined();
  });

  it('invokes onAddTask callback with valid due date and changes button state to added', () => {
    const onAddTask = vi.fn();
    render(<IdeasTab event={sampleEvent} onAddTask={onAddTask} />);

    // Click the first "Add to Timeline" button
    const addButtons = screen.getAllByRole('button', { name: /add to timeline/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    // Verify onAddTask was called with valid dueDate calculated 14 days before event.date
    expect(onAddTask).toHaveBeenCalledTimes(1);
    const taskPayload = onAddTask.mock.calls[0][0];

    const expectedDueDate = calculateDueDate(sampleEvent.date, 14);
    expect(taskPayload).toEqual({
      title: 'Plan idea: Artisanal Banarasi Chaat Bar',
      description: 'Live interactive chaat counter with organic clay kulhads',
      dueDate: expectedDueDate,
      daysBeforeEvent: 14,
      priority: 'medium',
      completed: false,
      category: 'food',
    });

    // Date should be valid YYYY-MM-DD
    expect(taskPayload.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(taskPayload.dueDate).toBe('2026-11-06'); // 2026-11-20 minus 14 days

    // The clicked button should now say "Added to Tasks" and be disabled
    expect(screen.getByRole('button', { name: /added to tasks/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /added to tasks/i })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
