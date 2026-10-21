import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the AI client functions
const mockAiClient = vi.hoisted(() => ({
  generateBlueprintWithGemini: vi.fn(),
  refinePlanWithGemini: vi.fn(),
  generateIdeasWithGemini: vi.fn(),
  isGeminiConfigured: vi.fn().mockReturnValue(true),
  GeminiError: class extends Error {
    code: string;
    statusCode: number;
    constructor(code: string, message: string, statusCode = 500) {
      super(message);
      this.name = 'GeminiError';
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

vi.mock('@/lib/ai/client', () => ({
  generateBlueprintWithGemini: mockAiClient.generateBlueprintWithGemini,
  refinePlanWithGemini: mockAiClient.refinePlanWithGemini,
  generateIdeasWithGemini: mockAiClient.generateIdeasWithGemini,
  isGeminiConfigured: mockAiClient.isGeminiConfigured,
  GeminiError: mockAiClient.GeminiError,
}));

// Import route handlers
import { POST as handleGenerateBlueprint } from '@/app/api/generate-blueprint/route';
import { POST as handleRefinePlan } from '@/app/api/refine-plan/route';
import { POST as handleGenerateIdeas } from '@/app/api/generate-ideas/route';

describe('API Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiClient.isGeminiConfigured.mockReturnValue(true);
  });

  const validBlueprintBody = {
    eventType: 'wedding',
    name: 'Sharma Wedding',
    date: '2026-12-15',
    city: 'Jaipur',
    guestCount: 300,
    totalBudget: 1500000,
    theme: 'Royal Rajasthani',
    dietaryPreferences: ['vegetarian'],
    culturalPreferences: 'Marwari',
    accessibilityNeeds: '',
    specialRequirements: '',
    subEvents: ['sangeet', 'wedding'],
  };

  const sampleBlueprintResponse = {
    themeAndDecor: {
      mainTheme: 'Royal Rajasthani',
      colorPalette: ['Gold', 'Maroon'],
      decorIdeas: ['Marigold floral arches'],
      description: 'A regal royal wedding.',
    },
    activities: [
      {
        name: 'Sangeet Night',
        description: 'Musical celebrations',
        estimatedDuration: '4 hours',
        suitableFor: 'All guests',
      },
    ],
    budgetAllocation: [
      { category: 'Venue', percentage: 40, description: 'Palace booking' },
      { category: 'Catering', percentage: 60, description: 'Royal banquet' },
    ],
    timeline: [
      {
        title: 'Book Palace',
        description: 'Reserve dates',
        daysBeforeEvent: 120,
        priority: 'high',
        category: 'Venue',
      },
    ],
    vendorCategories: [
      {
        category: 'Venue',
        description: 'Palace venue coordinator',
        estimatedBudgetPercentage: 40,
        tips: ['Confirm guest room blocks early'],
        budgetCategory: 'Venue',
      },
    ],
    risksAndAssumptions: ['Assumes dry winter season in Jaipur.'],
    missingInfo: [],
    alternatives: [
      {
        original: 'Imported crystal chandeliers',
        budgetFriendly: 'Handcrafted brass hanging lanterns',
        sustainable: 'Terracotta lamps and fairy lights',
        accessible: 'Ground-level lighting avoid overhead glare',
      },
    ],
  };

  describe('/api/generate-blueprint', () => {
    it('returns 413 when Content-Length exceeds 64 KB', async () => {
      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: {
          'content-length': String(70 * 1024),
          'content-type': 'application/json',
        },
        body: JSON.stringify(validBlueprintBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('returns 503 when API key is missing', async () => {
      mockAiClient.isGeminiConfigured.mockReturnValueOnce(false);

      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBlueprintBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe('MISSING_API_KEY');
    });

    it('returns 400 when body is malformed JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid-json{{{',
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('MALFORMED_JSON');
    });

    it('returns 400 when body fails schema validation', async () => {
      const invalidBody = { ...validBlueprintBody, totalBudget: 50 }; // min budget is 1000
      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invalidBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('INVALID_REQUEST');
      expect(json.details).toBeDefined();
    });

    it('returns 200 with generated blueprint on valid request', async () => {
      mockAiClient.generateBlueprintWithGemini.mockResolvedValueOnce(sampleBlueprintResponse);

      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBlueprintBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.blueprint.themeAndDecor.mainTheme).toBe('Royal Rajasthani');
    });

    it('returns sanitized error response when GeminiError is thrown without leaking secrets', async () => {
      mockAiClient.generateBlueprintWithGemini.mockRejectedValueOnce(
        new mockAiClient.GeminiError('QUOTA_EXCEEDED', 'Gemini quota reached', 429)
      );

      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBlueprintBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toBe('QUOTA_EXCEEDED');
      expect(json.message).toBe('Gemini quota reached');
    });

    it('returns generic 500 without leaking unexpected error details or secrets', async () => {
      mockAiClient.generateBlueprintWithGemini.mockRejectedValueOnce(
        new Error('Fatal database connection error with secret key AIzaSyABC123XYZ')
      );

      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBlueprintBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('INTERNAL_ERROR');
      // Must not leak the secret key
      expect(JSON.stringify(json)).not.toContain('AIzaSyABC123XYZ');
    });

    it('returns 400 when date is in the past (e.g. 2020-01-01)', async () => {
      const pastBody = { ...validBlueprintBody, date: '2020-01-01' };
      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(pastBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('INVALID_REQUEST');
      expect(JSON.stringify(json.details)).toContain('Celebration date cannot be in the past');
    });

    it('never leaks upstream Google error JSON in response body when Gemini API call fails', async () => {
      mockAiClient.generateBlueprintWithGemini.mockRejectedValueOnce(
        new mockAiClient.GeminiError('API_ERROR', 'AI service error. Please try again.', 502)
      );

      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBlueprintBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(502);
      const json = await res.json();
      const stringified = JSON.stringify(json);

      expect(json.error).toBe('API_ERROR');
      expect(json.message).toBe('AI service error. Please try again.');
      expect(stringified).not.toContain('INVALID_ARGUMENT');
      expect(stringified).not.toContain('generativelanguage.googleapis.com');
      expect(stringified).not.toContain('"code": 400');
    });

    it('proves raw Google error JSON is not leaked in response body if an unhandled upstream error reaches route handler', async () => {
      const googleRawErrorJson = JSON.stringify({
        error: {
          code: 400,
          message: 'API key not valid. Please pass a valid API key.',
          status: 'INVALID_ARGUMENT',
          details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID' }],
        },
      });

      mockAiClient.generateBlueprintWithGemini.mockRejectedValueOnce(
        new Error(`[GoogleGenerativeAI Error]: ${googleRawErrorJson}`)
      );

      const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBlueprintBody),
      });

      const res = await handleGenerateBlueprint(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      const stringified = JSON.stringify(json);

      expect(json.error).toBe('INTERNAL_ERROR');
      expect(json.message).toBe('Failed to generate blueprint. Please try again later.');
      expect(stringified).not.toContain('API_KEY_INVALID');
      expect(stringified).not.toContain('INVALID_ARGUMENT');
      expect(stringified).not.toContain('API key not valid');
      expect(stringified).not.toContain('GoogleGenerativeAI Error');
    });
  });

  describe('/api/refine-plan', () => {
    const validRefineBody = {
      eventDetails: validBlueprintBody,
      currentPlan: sampleBlueprintResponse,
      userRequest: 'Reduce decor budget by 10% and shift to catering',
    };

    it('returns 413 when Content-Length exceeds 64 KB', async () => {
      const req = new NextRequest('http://localhost:3000/api/refine-plan', {
        method: 'POST',
        headers: {
          'content-length': String(80 * 1024),
          'content-type': 'application/json',
        },
        body: JSON.stringify(validRefineBody),
      });

      const res = await handleRefinePlan(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('returns 503 when API key is missing', async () => {
      mockAiClient.isGeminiConfigured.mockReturnValueOnce(false);

      const req = new NextRequest('http://localhost:3000/api/refine-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validRefineBody),
      });

      const res = await handleRefinePlan(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe('MISSING_API_KEY');
    });

    it('returns 400 when JSON is malformed', async () => {
      const req = new NextRequest('http://localhost:3000/api/refine-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '<<<not-json>>>',
      });

      const res = await handleRefinePlan(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('MALFORMED_JSON');
    });

    it('returns 400 when schema validation fails', async () => {
      const invalidRefine = { ...validRefineBody, userRequest: '' }; // empty userRequest
      const req = new NextRequest('http://localhost:3000/api/refine-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invalidRefine),
      });

      const res = await handleRefinePlan(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('INVALID_REQUEST');
    });

    it('returns 200 with refinement on valid request', async () => {
      mockAiClient.refinePlanWithGemini.mockResolvedValueOnce({
        refinementSummary: 'Adjusted decor and catering split.',
      });

      const req = new NextRequest('http://localhost:3000/api/refine-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validRefineBody),
      });

      const res = await handleRefinePlan(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.refinement.refinementSummary).toContain('Adjusted decor');
    });
  });

  describe('/api/generate-ideas', () => {
    const validIdeasBody = {
      eventDetails: validBlueprintBody,
      section: 'activities',
      existingIdeas: ['Antakshari competition'],
    };

    const sampleIdeas = {
      section: 'activities',
      ideas: [
        {
          title: 'Royal Dhol Entry Flashmob',
          description: 'Surprise traditional dhol performance during sangeet entry',
          estimatedCost: '₹25,000 - ₹35,000',
          sustainability: 'Live local acoustic artists with zero electronic waste',
        },
      ],
    };

    it('returns 413 when Content-Length exceeds 64 KB', async () => {
      const req = new NextRequest('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: {
          'content-length': String(90 * 1024),
          'content-type': 'application/json',
        },
        body: JSON.stringify(validIdeasBody),
      });

      const res = await handleGenerateIdeas(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('returns 503 when API key is missing', async () => {
      mockAiClient.isGeminiConfigured.mockReturnValueOnce(false);

      const req = new NextRequest('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validIdeasBody),
      });

      const res = await handleGenerateIdeas(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe('MISSING_API_KEY');
    });

    it('returns 400 when body is malformed JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid-json-body-here',
      });

      const res = await handleGenerateIdeas(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('MALFORMED_JSON');
    });

    it('returns 400 when section is invalid', async () => {
      const invalidBody = { ...validIdeasBody, section: 'not-a-valid-section' };
      const req = new NextRequest('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invalidBody),
      });

      const res = await handleGenerateIdeas(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('INVALID_REQUEST');
    });

    it('returns 200 with ideas on valid request', async () => {
      mockAiClient.generateIdeasWithGemini.mockResolvedValueOnce(sampleIdeas);

      const req = new NextRequest('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validIdeasBody),
      });

      const res = await handleGenerateIdeas(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.ideas.section).toBe('activities');
      expect(json.ideas.ideas).toHaveLength(1);
    });
  });
});
