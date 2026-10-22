/**
 * Typed client for Utsava API routes.
 * Used by MainPlanner, RefineTab, and IdeasTab.
 */

import type {
  StoredEvent,
  BlueprintRequest,
  RefinementRequest,
  IdeasRequest,
  AIBlueprint,
  AIRefinement,
  AIIdeas,
  AIIdeaSection,
} from '@/schemas';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Extracts a typed BlueprintRequest from a StoredEvent.
 */
export function toBlueprintRequest(event: StoredEvent): BlueprintRequest {
  return {
    eventType: event.eventType,
    name: event.name,
    date: event.date,
    city: event.city,
    guestCount: event.guestCount,
    totalBudget: event.totalBudget,
    theme: event.theme,
    dietaryPreferences: event.dietaryPreferences,
    culturalPreferences: event.culturalPreferences,
    accessibilityNeeds: event.accessibilityNeeds,
    specialRequirements: event.specialRequirements,
    subEvents: event.subEvents,
  };
}

export interface ApiGenerateBlueprintResponse {
  success: boolean;
  blueprint: AIBlueprint;
  model: string;
}

export interface ApiRefinePlanResponse {
  success: boolean;
  refinement: AIRefinement;
}

export interface ApiGenerateIdeasResponse {
  success: boolean;
  ideas: AIIdeas;
}

/**
 * Retrieves the session-stored Gemini API key if available in the browser.
 */
function getSessionApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('utsava_gemini_key');
}

/**
 * Typed client for generating an event blueprint.
 */
export async function apiGenerateBlueprint(
  event: StoredEvent,
  signal?: AbortSignal,
): Promise<ApiGenerateBlueprintResponse> {
  const userKey = getSessionApiKey();
  const res = await fetch('/api/generate-blueprint', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(userKey ? { 'x-gemini-key': userKey } : {}),
    },
    body: JSON.stringify(toBlueprintRequest(event)),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data.message || 'Failed to generate celebration blueprint.',
      data.error,
      res.status,
    );
  }
  return data;
}

/**
 * Typed client for refining an existing celebration plan.
 */
export async function apiRefinePlan(
  event: StoredEvent,
  currentPlan: AIBlueprint,
  userRequest: string,
  signal?: AbortSignal,
): Promise<ApiRefinePlanResponse> {
  const userKey = getSessionApiKey();
  const payload: RefinementRequest = {
    eventDetails: toBlueprintRequest(event),
    currentPlan,
    userRequest,
  };

  const res = await fetch('/api/refine-plan', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(userKey ? { 'x-gemini-key': userKey } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data.message || 'Failed to refine celebration plan.',
      data.error,
      res.status,
    );
  }
  return data;
}

/**
 * Typed client for generating ideas in Idea Studio.
 */
export async function apiGenerateIdeas(
  event: StoredEvent,
  section: AIIdeaSection,
  existingIdeas: string[],
  signal?: AbortSignal,
): Promise<ApiGenerateIdeasResponse> {
  const userKey = getSessionApiKey();
  const payload: IdeasRequest = {
    eventDetails: toBlueprintRequest(event),
    section,
    existingIdeas,
  };

  const res = await fetch('/api/generate-ideas', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(userKey ? { 'x-gemini-key': userKey } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || 'Failed to generate ideas.', data.error, res.status);
  }
  return data;
}
