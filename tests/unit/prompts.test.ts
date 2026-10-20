import { describe, it, expect } from 'vitest';
import {
  UTSAVA_SYSTEM_INSTRUCTION,
  buildBlueprintPrompt,
  buildRefinementPrompt,
  buildIdeasPrompt,
} from '@/lib/ai/prompts';
import { getTodayString } from '@/lib/dates';
import type { BlueprintRequest, RefinementRequest, IdeasRequest, AIBlueprint } from '@/schemas';

describe('AI Prompts', () => {
  const sampleRequest: BlueprintRequest = {
    eventType: 'wedding',
    name: 'Sharma Wedding',
    date: '2026-11-20',
    city: 'Jaipur',
    guestCount: 300,
    totalBudget: 2000000,
    theme: 'Royal Rajasthani',
    dietaryPreferences: ['vegetarian', 'jain'],
    culturalPreferences: 'Marwari rituals',
    accessibilityNeeds: 'Wheelchair access',
    specialRequirements: 'Eco-friendly flowers',
    subEvents: ['haldi', 'mehendi', 'sangeet', 'wedding', 'reception'],
  };

  it('system instructions contain Indian celebration guidelines and vendor safety rules', () => {
    expect(UTSAVA_SYSTEM_INSTRUCTION).toContain('Utsava AI');
    expect(UTSAVA_SYSTEM_INSTRUCTION).toContain('NEVER invent or mention real vendor business names');
    expect(UTSAVA_SYSTEM_INSTRUCTION).toContain('Weddings: Support multi-day ceremonies');
    expect(UTSAVA_SYSTEM_INSTRUCTION).toContain('JSON');
  });

  it('builds blueprint prompt with all cultural details and budget', () => {
    const prompt = buildBlueprintPrompt(sampleRequest);
    expect(prompt).toContain('Sharma Wedding');
    expect(prompt).toContain('Jaipur');
    expect(prompt).toContain('300');
    expect(prompt).toContain('₹20,00,000');
    expect(prompt).toContain('Royal Rajasthani');
    expect(prompt).toContain('haldi, mehendi, sangeet, wedding, reception');
    expect(prompt).toContain('vegetarian, jain');
    expect(prompt).toContain('JSON SCHEMA TO RETURN');
  });

  it('blueprint prompt includes today date in IST and days remaining', () => {
    const prompt = buildBlueprintPrompt(sampleRequest);
    const today = getTodayString();
    expect(prompt).toContain(`Today's Date (IST): ${today}`);
    expect(prompt).toContain('Days Remaining Until Event:');
  });

  it('builds refinement prompt with user instruction', () => {
    const mockPlan: AIBlueprint = {
      themeAndDecor: {
        mainTheme: 'Pastel Floral',
        colorPalette: ['pink', 'gold'],
        decorIdeas: ['Floral canopy'],
        description: 'Floral theme',
      },
      activities: [],
      budgetAllocation: [{ category: 'Venue', percentage: 40, description: 'Venue' }],
      timeline: [],
      vendorCategories: [],
      risksAndAssumptions: [],
      missingInfo: [],
      alternatives: [],
    };

    const refinementReq: RefinementRequest = {
      eventDetails: sampleRequest,
      currentPlan: mockPlan,
      userRequest: 'Reduce venue budget by 10% and add sustainable decor ideas',
    };

    const prompt = buildRefinementPrompt(refinementReq);
    expect(prompt).toContain('Reduce venue budget by 10%');
    expect(prompt).toContain('Pastel Floral');
    expect(prompt).toContain('refinementSummary');
  });

  it('builds ideas prompt with section and cultural context', () => {
    const ideasReq: IdeasRequest = {
      eventDetails: sampleRequest,
      section: 'food',
      existingIdeas: [],
    };

    const prompt = buildIdeasPrompt(ideasReq);
    expect(prompt).toContain('"food"');
    expect(prompt).toContain('Jaipur');
    expect(prompt).toContain('Marwari rituals');
  });
});
