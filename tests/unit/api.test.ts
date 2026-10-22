import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toBlueprintRequest,
  ApiError,
  apiGenerateBlueprint,
  apiRefinePlan,
  apiGenerateIdeas,
} from '@/lib/api';
import type { StoredEvent, AIBlueprint } from '@/schemas';

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

  describe('API fetch callers', () => {
    const sampleEvent: StoredEvent = {
      id: 'event-xyz',
      eventType: 'wedding',
      name: 'Sharma Wedding',
      date: '2026-11-20',
      city: 'Jaipur',
      guestCount: 300,
      totalBudget: 2500000,
      theme: 'Royal Palace',
      dietaryPreferences: [],
      culturalPreferences: '',
      accessibilityNeeds: '',
      specialRequirements: '',
      subEvents: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const originalFetch = global.fetch;

    beforeEach(() => {
      sessionStorage.clear();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('apiGenerateBlueprint makes POST request with headers and parses response', async () => {
      const mockResponse = { success: true, blueprint: { themeAndDecor: {} } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      sessionStorage.setItem('utsava_gemini_key', 'user-session-key');
      const res = await apiGenerateBlueprint(sampleEvent);

      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-blueprint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-gemini-key': 'user-session-key',
          }),
        }),
      );
    });

    it('apiGenerateBlueprint throws ApiError when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'RATE_LIMIT', message: 'Too many requests' }),
      });

      await expect(apiGenerateBlueprint(sampleEvent)).rejects.toThrow(ApiError);
    });

    it('apiRefinePlan makes POST request with currentPlan and userRequest', async () => {
      const mockPlan = {} as AIBlueprint;
      const mockResponse = { success: true, refinement: { refinementSummary: 'Updated' } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const res = await apiRefinePlan(sampleEvent, mockPlan, 'Cut decor budget');
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/refine-plan',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('apiGenerateIdeas makes POST request with section and existingIdeas', async () => {
      const mockResponse = { success: true, ideas: { section: 'food', ideas: [] } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const res = await apiGenerateIdeas(sampleEvent, 'food', ['Chaat']);
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-ideas',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });
});
