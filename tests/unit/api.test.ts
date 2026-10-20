import { describe, it, expect } from 'vitest';
import { toBlueprintRequest, ApiError } from '@/lib/api';
import type { StoredEvent } from '@/schemas';

describe('API client helpers (src/lib/api.ts)', () => {
  it('correctly extracts BlueprintRequest from StoredEvent', () => {
    const event: StoredEvent = {
      id: 'test-event-123',
      eventType: 'wedding',
      name: 'Rohit & Priya Wedding',
      date: '2026-11-20',
      city: 'Jaipur',
      guestCount: 300,
      totalBudget: 2500000,
      theme: 'Royal Palace',
      dietaryPreferences: ['vegetarian', 'jain'],
      culturalPreferences: 'Marwari traditions',
      accessibilityNeeds: 'Wheelchair ramp',
      specialRequirements: 'Eco-friendly flowers',
      subEvents: ['haldi', 'mehendi', 'wedding'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const req = toBlueprintRequest(event);

    expect(req).toEqual({
      eventType: 'wedding',
      name: 'Rohit & Priya Wedding',
      date: '2026-11-20',
      city: 'Jaipur',
      guestCount: 300,
      totalBudget: 2500000,
      theme: 'Royal Palace',
      dietaryPreferences: ['vegetarian', 'jain'],
      culturalPreferences: 'Marwari traditions',
      accessibilityNeeds: 'Wheelchair ramp',
      specialRequirements: 'Eco-friendly flowers',
      subEvents: ['haldi', 'mehendi', 'wedding'],
    });

    // Ensures internal persistence fields like id, createdAt, updatedAt are omitted
    expect((req as Record<string, unknown>).id).toBeUndefined();
    expect((req as Record<string, unknown>).createdAt).toBeUndefined();
    expect((req as Record<string, unknown>).updatedAt).toBeUndefined();
  });

  it('ApiError constructs with message, code, and status code', () => {
    const err = new ApiError('Service unavailable', 'RATE_LIMIT', 429);
    expect(err.message).toBe('Service unavailable');
    expect(err.code).toBe('RATE_LIMIT');
    expect(err.status).toBe(429);
    expect(err.name).toBe('ApiError');
  });
});
