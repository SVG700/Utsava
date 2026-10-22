import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isGeminiConfigured,
  getModelName,
  generateBlueprintWithGemini,
  refinePlanWithGemini,
  generateIdeasWithGemini,
  GeminiError,
  blueprintJsonSchema,
  refinementJsonSchema,
  ideasJsonSchema,
  sanitizeSchemaForGemini,
} from '@/lib/ai/client';
import type { BlueprintRequest, RefinementRequest, IdeasRequest, AIBlueprint } from '@/schemas';

const mocks = vi.hoisted(() => {
  return {
    generateContent: vi.fn(),
  };
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mocks.generateContent,
      };
    },
  };
});

describe('Gemini AI Client (src/lib/ai/client.ts)', () => {
  const originalEnv = process.env;

  const sampleBlueprintData = {
    themeAndDecor: {
      mainTheme: 'Royal Heritage Palace',
      colorPalette: ['#c48a3f', '#134e3a', '#b91c1c'],
      decorIdeas: ['Marigold flower entrance', 'Brass urlis with floating diyas'],
      description: 'Grand royal traditional ambiance.',
    },
    activities: [
      {
        name: 'Royal Welcome Ceremony',
        description: 'Traditional welcoming with live Shehnai and floral garlands.',
        estimatedDuration: '45 mins',
        suitableFor: 'All guests',
      },
    ],
    budgetAllocation: [
      { category: 'Venue & Mandap', percentage: 40, description: 'Palace lawns' },
      { category: 'Catering & Feasts', percentage: 40, description: 'Royal feast' },
      { category: 'Decor & Ambience', percentage: 20, description: 'Floral setup' },
    ],
    timeline: [
      {
        title: 'Book Palace Venue',
        description: 'Sign contract and pay initial token advance.',
        daysBeforeEvent: 90,
        priority: 'high',
        category: 'Venue & Mandap',
      },
    ],
    vendorCategories: [
      {
        category: 'Venue & Mandap',
        description: 'Palace venue coordinator',
        estimatedBudgetPercentage: 40,
        tips: ['Confirm sound curfew hours'],
      },
    ],
    risksAndAssumptions: ['Weather contingencies in open courtyard.'],
    missingInfo: ['Guest flight schedules'],
    alternatives: [
      {
        original: 'Imported Lilies',
        budgetFriendly: 'Local Mogra and Genda Phool',
        sustainable: 'Potted plants for guests to take home',
        accessible: 'Low floral pedestals ensuring unobstructed pathways',
      },
    ],
  };

  const sampleBlueprintRequest: BlueprintRequest = {
    eventType: 'wedding',
    name: 'Ananya & Rohan Royal Wedding',
    date: '2026-11-20',
    city: 'Jaipur',
    guestCount: 250,
    totalBudget: 2000000,
    theme: '',
    dietaryPreferences: [],
    culturalPreferences: '',
    accessibilityNeeds: '',
    specialRequirements: '',
    subEvents: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-server-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isGeminiConfigured', () => {
    it('returns true when valid key is provided via param or env', () => {
      expect(isGeminiConfigured('custom-key-123')).toBe(true);
      expect(isGeminiConfigured()).toBe(true);
    });

    it('returns false when key is empty, undefined or placeholder', () => {
      delete process.env.GEMINI_API_KEY;
      expect(isGeminiConfigured()).toBe(false);
      expect(isGeminiConfigured('')).toBe(false);
      expect(isGeminiConfigured('your_api_key_here')).toBe(false);
    });
  });

  describe('getModelName', () => {
    it('returns GEMINI_MODEL if configured, otherwise defaults to gemini-3.5-flash', () => {
      process.env.GEMINI_MODEL = 'gemini-1.5-pro';
      expect(getModelName()).toBe('gemini-1.5-pro');

      delete process.env.GEMINI_MODEL;
      expect(getModelName()).toBe('gemini-3.5-flash');
    });
  });

  describe('generateBlueprintWithGemini', () => {
    it('successfully generates and validates blueprint on clean JSON response', async () => {
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleBlueprintData) }],
            },
          },
        ],
      });

      const result = await generateBlueprintWithGemini(sampleBlueprintRequest);
      expect(result.themeAndDecor.mainTheme).toBe('Royal Heritage Palace');
      expect(result.budgetAllocation).toHaveLength(3);
      expect(mocks.generateContent).toHaveBeenCalledTimes(1);
    });

    it('successfully strips markdown code block wrappers (```json ... ```)', async () => {
      const wrappedResponse = `\`\`\`json\n${JSON.stringify(sampleBlueprintData)}\n\`\`\``;
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: wrappedResponse }],
            },
          },
        ],
      });

      const result = await generateBlueprintWithGemini(sampleBlueprintRequest);
      expect(result.themeAndDecor.mainTheme).toBe('Royal Heritage Palace');
      expect(result.timeline).toHaveLength(1);
    });

    it('retries when first response fails JSON parsing and succeeds on second attempt', async () => {
      // First attempt: invalid non-JSON output
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: 'Here is your plan: { invalid json...' }],
            },
          },
        ],
      });
      // Second attempt: valid clean JSON
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleBlueprintData) }],
            },
          },
        ],
      });

      const result = await generateBlueprintWithGemini(sampleBlueprintRequest);
      expect(result.themeAndDecor.mainTheme).toBe('Royal Heritage Palace');
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    });

    it('retries when first response fails schema validation and succeeds on second attempt', async () => {
      // First attempt: valid JSON but missing required fields
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ themeAndDecor: { mainTheme: '' } }) }],
            },
          },
        ],
      });
      // Second attempt: valid schema compliant JSON
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleBlueprintData) }],
            },
          },
        ],
      });

      const result = await generateBlueprintWithGemini(sampleBlueprintRequest);
      expect(result.themeAndDecor.mainTheme).toBe('Royal Heritage Palace');
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    });

    it('falls back to gemini-3.5-flash-lite when primary model hits 429 quota exhaustion', async () => {
      // First attempt: 429 Quota exhausted error
      mocks.generateContent.mockRejectedValueOnce(
        new Error('Resource has been exhausted (e.g. check quota) 429'),
      );
      // Second attempt (fallback model): succeeds
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleBlueprintData) }],
            },
          },
        ],
      });

      const result = await generateBlueprintWithGemini(sampleBlueprintRequest);
      expect(result.themeAndDecor.mainTheme).toBe('Royal Heritage Palace');
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
      expect(mocks.generateContent.mock.calls[1][0].model).toBe('gemini-3.5-flash-lite');
    });

    it('still falls back to flash-lite when the quota error follows a 503 retry', async () => {
      // Observed live: primary model busy (503), the retry then hits the daily quota (429).
      mocks.generateContent.mockRejectedValueOnce(new Error('503 UNAVAILABLE: high demand'));
      mocks.generateContent.mockRejectedValueOnce(new Error('429 You exceeded your current quota'));
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [{ content: { parts: [{ text: JSON.stringify(sampleBlueprintData) }] } }],
      });

      const result = await generateBlueprintWithGemini(sampleBlueprintRequest);
      expect(result.themeAndDecor.mainTheme).toBe('Royal Heritage Palace');
      expect(mocks.generateContent).toHaveBeenCalledTimes(3);
      expect(mocks.generateContent.mock.calls[2][0].model).toBe('gemini-3.5-flash-lite');
    });

    it('reports SERVICE_BUSY when Gemini stays overloaded after all retries', async () => {
      vi.useFakeTimers();
      mocks.generateContent.mockRejectedValue(new Error('503 UNAVAILABLE: high demand'));

      const outcome = generateBlueprintWithGemini(sampleBlueprintRequest).catch((err) => err);
      await vi.runAllTimersAsync();
      const err = await outcome;

      expect(err).toBeInstanceOf(GeminiError);
      expect((err as GeminiError).code).toBe('SERVICE_BUSY');
      expect((err as GeminiError).statusCode).toBe(503);
      expect((err as GeminiError).message).toMatch(/high demand/);
      expect(mocks.generateContent).toHaveBeenCalledTimes(4); // first call + 3 backoff retries
    });

    it('throws GeminiError with TIMEOUT when request is aborted or timed out', async () => {
      mocks.generateContent.mockRejectedValue(new Error('This operation was aborted by timeout'));

      try {
        await generateBlueprintWithGemini(sampleBlueprintRequest);
        expect.unreachable();
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(GeminiError);
        expect((err as GeminiError).code).toBe('TIMEOUT');
        expect((err as GeminiError).statusCode).toBe(504);
      }
    });

    it('throws GeminiError with MISSING_KEY when API key is completely absent', async () => {
      delete process.env.GEMINI_API_KEY;

      try {
        await generateBlueprintWithGemini(sampleBlueprintRequest);
        expect.unreachable();
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(GeminiError);
        expect((err as GeminiError).code).toBe('MISSING_KEY');
        expect((err as GeminiError).statusCode).toBe(503);
      }
    });

    it('retries once without responseJsonSchema when Gemini returns 400 INVALID_ARGUMENT', async () => {
      // First attempt fails with 400 INVALID_ARGUMENT
      mocks.generateContent.mockRejectedValueOnce(
        new Error('400 Invalid argument: responseJsonSchema contains unsupported keyword'),
      );
      // Second attempt succeeds without schema
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleBlueprintData) }],
            },
          },
        ],
      });

      const result = await generateBlueprintWithGemini(sampleBlueprintRequest);
      expect(result.themeAndDecor.mainTheme).toBe('Royal Heritage Palace');
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
      expect(mocks.generateContent.mock.calls[0][0].config.responseJsonSchema).toBeDefined();
      expect(mocks.generateContent.mock.calls[1][0].config.responseJsonSchema).toBeUndefined();
    });

    it('maps generic upstream API errors to fixed safe message without leaking upstream error details', async () => {
      mocks.generateContent.mockRejectedValue(
        new Error(
          'Google upstream internal failure: {"error": {"code": 500, "message": "Backend crash with key 123"}}',
        ),
      );

      try {
        await generateBlueprintWithGemini(sampleBlueprintRequest);
        expect.unreachable();
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(GeminiError);
        expect((err as GeminiError).code).toBe('API_ERROR');
        expect((err as GeminiError).message).toBe('AI service error. Please try again.');
        expect((err as GeminiError).message).not.toContain('Google');
        expect((err as GeminiError).message).not.toContain('Backend crash');
      }
    });
  });

  describe('refinePlanWithGemini', () => {
    const sampleRefineRequest: RefinementRequest = {
      eventDetails: sampleBlueprintRequest,
      currentPlan: sampleBlueprintData as unknown as AIBlueprint,
      userRequest: 'Make decor 100% eco-friendly and add clay diyas',
    };

    const sampleRefinementResponse = {
      changedSections: ['themeAndDecor'],
      refinementSummary: 'Updated decor to eco-friendly and added clay diyas.',
      themeAndDecor: {
        mainTheme: 'Royal Eco Palace',
        colorPalette: ['#134e3a', '#c48a3f'],
        decorIdeas: ['Clay diyas', 'Banana leaf garlands'],
        description: 'Eco-conscious royal celebration ambiance.',
      },
    };

    it('successfully processes refinement plan with Gemini', async () => {
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleRefinementResponse) }],
            },
          },
        ],
      });

      const result = await refinePlanWithGemini(sampleRefineRequest);
      expect(result.refinementSummary).toContain('eco-friendly');
      expect(result.themeAndDecor?.decorIdeas).toContain('Clay diyas');
    });

    it('retries on schema validation failure during plan refinement', async () => {
      // First attempt fails schema validation (missing refinementSummary)
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ themeAndDecor: { mainTheme: 'X' } }) }],
            },
          },
        ],
      });
      // Second attempt succeeds
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleRefinementResponse) }],
            },
          },
        ],
      });

      const result = await refinePlanWithGemini(sampleRefineRequest);
      expect(result.refinementSummary).toContain('eco-friendly');
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    });

    it('retries once and throws 422 NO_CHANGES if changedSections is empty on both attempts', async () => {
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    changedSections: [],
                    refinementSummary: 'No changes made.',
                  }),
                },
              ],
            },
          },
        ],
      });
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    changedSections: [],
                    refinementSummary: 'Still no changes.',
                  }),
                },
              ],
            },
          },
        ],
      });

      try {
        await refinePlanWithGemini(sampleRefineRequest);
        expect.unreachable();
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(GeminiError);
        expect((err as GeminiError).code).toBe('NO_CHANGES');
        expect((err as GeminiError).statusCode).toBe(422);
        expect((err as GeminiError).message).toBe(
          'No changes could be applied to your plan. Try a more specific request.',
        );
        expect(mocks.generateContent).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe('generateIdeasWithGemini', () => {
    const sampleIdeasRequest: IdeasRequest = {
      eventDetails: sampleBlueprintRequest,
      section: 'activities',
      existingIdeas: ['interactive icebreakers'],
    };

    const sampleIdeasResponse = {
      section: 'activities',
      ideas: [
        {
          title: 'Royal Dhol Flash Mob',
          description: 'Surprise traditional dhol performance by cousins.',
          estimatedCost: 'Moderate (₹15,000)',
          sustainability: 'Zero-waste musical celebration',
        },
      ],
    };

    it('successfully generates celebration ideas with Gemini', async () => {
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleIdeasResponse) }],
            },
          },
        ],
      });

      const result = await generateIdeasWithGemini(sampleIdeasRequest);
      expect(result.section).toBe('activities');
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].title).toBe('Royal Dhol Flash Mob');
    });

    it('retries on schema failure during idea generation', async () => {
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: 'not json' }],
            },
          },
        ],
      });
      mocks.generateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(sampleIdeasResponse) }],
            },
          },
        ],
      });

      const result = await generateIdeasWithGemini(sampleIdeasRequest);
      expect(result.ideas).toHaveLength(1);
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Gemini JSON Schemas Sanitization', () => {
    const forbiddenKeywords = new Set([
      'minLength',
      'maxLength',
      'minItems',
      'maxItems',
      'minimum',
      'maximum',
      '$schema',
      'default',
    ]);

    function findForbiddenKeys(schema: unknown, forbidden: Set<string>): string[] {
      const matches: string[] = [];
      function walk(current: unknown, path: string) {
        if (Array.isArray(current)) {
          current.forEach((item, index) => walk(item, `${path}[${index}]`));
        } else if (current !== null && typeof current === 'object') {
          for (const [key, val] of Object.entries(current as Record<string, unknown>)) {
            if (forbidden.has(key)) {
              matches.push(`${path}.${key}`);
            }
            walk(val, `${path}.${key}`);
          }
        }
      }
      walk(schema, 'root');
      return matches;
    }

    it('ensures blueprintJsonSchema contains none of the forbidden keywords', () => {
      expect(findForbiddenKeys(blueprintJsonSchema, forbiddenKeywords)).toEqual([]);
    });

    it('ensures refinementJsonSchema contains none of the forbidden keywords', () => {
      expect(findForbiddenKeys(refinementJsonSchema, forbiddenKeywords)).toEqual([]);
    });

    it('ensures ideasJsonSchema contains none of the forbidden keywords', () => {
      expect(findForbiddenKeys(ideasJsonSchema, forbiddenKeywords)).toEqual([]);
    });

    it('sanitizeSchemaForGemini recursively strips all forbidden keywords', () => {
      const dirtySchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 50, default: 'Untitled' },
          count: { type: 'number', minimum: 1, maximum: 100 },
          tags: { type: 'array', minItems: 1, maxItems: 10, items: { type: 'string' } },
          nested: {
            type: 'object',
            properties: {
              subfield: { type: 'string', minLength: 1 },
            },
          },
        },
      };
      const cleaned = sanitizeSchemaForGemini(dirtySchema);
      expect(findForbiddenKeys(cleaned, forbiddenKeywords)).toEqual([]);
    });
  });
});
