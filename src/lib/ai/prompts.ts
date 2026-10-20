/**
 * System prompts and prompt builders for Utsava AI Celebration Planner.
 * Strictly adheres to Indian cultural contexts, deterministic schemas,
 * and safety guidelines (no inventing real vendor names/numbers).
 */

import type { BlueprintRequest, RefinementRequest, IdeasRequest } from '@/schemas';
import { getTodayString, daysUntilEvent } from '@/lib/dates';

/**
 * Core system instruction for the Utsava planner.
 */
export const UTSAVA_SYSTEM_INSTRUCTION = `
You are Utsava AI — an expert Indian celebration & event planning assistant for PromptWars 2026.
Your role is to help users organize weddings, birthdays, and community celebrations in India with realistic budgets, structured timelines, vendor category recommendations, and creative ideas.

CRITICAL RULES:
1. OUTPUT FORMAT: Return ONLY valid, parseable JSON conforming precisely to the requested schema. No markdown backticks, no explanatory text outside JSON.
2. INDIAN CULTURAL AWARENESS:
   - For Weddings: Support multi-day ceremonies (Haldi, Mehendi, Sangeet, Pheras/Mandap, Reception). Respect cultural rituals (e.g. Marwari, Punjabi, South Indian, Bengali, Maharashtrian).
   - For Birthdays: Distinguish between 1st birthdays, kids themed parties, 18th/21st milestones, and 50th/60th jubilee celebrations.
   - For Community Events: Tailor for Indian festivals (Ganesh Chaturthi, Diwali Mela, Navratri Dandiya, Holi Milan), apartment society gatherings, and college fests.
3. VENDOR PRIVACY & SAFETY:
   - NEVER invent or mention real vendor business names, real phone numbers, URLs, addresses, or fake customer reviews.
   - ONLY recommend vendor categories (e.g. "Catering", "Mandap & Floral Decor", "Traditional Shehnai / Live DJ", "Mehendi Artists", "Candid Photography").
   - Clearly mark all percentages and figures as suggestions/estimates.
4. BUDGET LOGIC:
   - Suggested budget percentages must realistically sum close to 100%.
   - Consider the event's guest count and city tier (e.g. Mumbai/Delhi vs Tier-2 cities).
5. INCLUSIVITY & SUSTAINABILITY:
   - Provide eco-friendly, budget-friendly, and accessible alternatives (e.g. wheelchair access, elder seating, dietary needs like Jain or No Onion-Garlic).
`.trim();

/**
 * Build the prompt for generating the comprehensive AI Event Blueprint.
 */
export function buildBlueprintPrompt(req: BlueprintRequest): string {
  const today = getTodayString();
  const daysRemaining = daysUntilEvent(req.date, today);

  const subEventsText =
    req.subEvents && req.subEvents.length > 0
      ? `Sub-events: ${req.subEvents.join(', ')}`
      : 'Single day celebration';

  const dietaryText =
    req.dietaryPreferences && req.dietaryPreferences.length > 0
      ? `Dietary requirements: ${req.dietaryPreferences.join(', ')}`
      : 'Standard catering';

  return `
Plan a comprehensive celebration blueprint for the following event in India:

EVENT DETAILS:
- Event Type: ${req.eventType}
- Event Name: "${req.name}"
- Today's Date (IST): ${today}
- Event Date: ${req.date}
- Days Remaining Until Event: ${daysRemaining} days
- City: ${req.city}
- Guest Count: ${req.guestCount}
- Total Budget: ₹${req.totalBudget.toLocaleString('en-IN')} INR
- Theme / Style: ${req.theme || 'Suggest a fitting Indian aesthetic'}
- ${subEventsText}
- ${dietaryText}
- Cultural Traditions: ${req.culturalPreferences || 'Contemporary Indian'}
- Accessibility & Senior Care: ${req.accessibilityNeeds || 'General accessibility'}
- Special Requirements: ${req.specialRequirements || 'None specified'}

TIMELINE REQUIREMENT:
All milestone tasks must have daysBeforeEvent between 0 and ${Math.max(0, daysRemaining)} so that milestone tasks are not in the past relative to today (${today}).

JSON SCHEMA TO RETURN (Strict JSON only, concise and practical):
{
  "themeAndDecor": {
    "mainTheme": "string (name of theme)",
    "colorPalette": ["string", "string", "string"],
    "decorIdeas": ["string", "string", "string", "string"],
    "description": "string (cohesive visual & aesthetic summary)"
  },
  "activities": [
    // 3 to 5 engaging activities scaled to guest count
    {
      "name": "string (e.g. Sangeet Antakshari, Live Dhol Entrance)",
      "description": "string",
      "estimatedDuration": "string (e.g. 1.5 hours)",
      "suitableFor": "string (e.g. All guests, Elders, Kids)"
    }
  ],
  "budgetAllocation": [
    // 6 to 8 core categories whose percentages sum exactly to 100
    {
      "category": "string (e.g. Venue & Mandap, Catering & Beverages, Photography & Film, Decor & Floral, Music & Entertainment, Invitations & Favors, Logistics)",
      "percentage": number (integer or decimal, realistic 5 to 40),
      "description": "string (guidance on what this category covers)"
    }
  ],
  "timeline": [
    // 6 to 8 chronological milestones before the event date
    {
      "title": "string (actionable milestone task)",
      "description": "string",
      "daysBeforeEvent": number (integer between 0 and ${Math.max(0, daysRemaining)}),
      "priority": "high" | "medium" | "low",
      "category": "string"
    }
  ],
  "vendorCategories": [
    // 5 to 7 vendor types needed
    {
      "category": "string (e.g. Catering, Mandap Decorator, Photographer, DJ/Sound, Henna Artist)",
      "description": "string",
      "estimatedBudgetPercentage": number,
      "tips": ["string (questions to ask this vendor before booking)"],
      "budgetCategory": "string (must match one of the categories from budgetAllocation above)"
    }
  ],
  "risksAndAssumptions": [
    // 3 to 4 key risks and assumptions
    "string"
  ],
  "missingInfo": [
    // 2 to 3 clarifying decisions needed
    "string"
  ],
  "alternatives": [
    // 3 to 4 realistic alternatives
    {
      "original": "string (traditional costly element)",
      "budgetFriendly": "string",
      "sustainable": "string",
      "accessible": "string"
    }
  ]
}
`.trim();
}

/**
 * Build the prompt for refining an existing blueprint based on user instructions.
 */
export function buildRefinementPrompt(req: RefinementRequest): string {
  return `
The user wants to refine their celebration plan for "${req.eventDetails.name}" (${req.eventDetails.eventType} in ${req.eventDetails.city}).

CURRENT PLAN SUMMARY:
- Total Budget: ₹${req.eventDetails.totalBudget.toLocaleString('en-IN')} INR
- Main Theme: ${req.currentPlan.themeAndDecor.mainTheme}
- Budget Categories: ${req.currentPlan.budgetAllocation.map((b) => `${b.category} (${b.percentage}%)`).join(', ')}
- Total Tasks: ${req.currentPlan.timeline.length}
- Vendor Categories: ${req.currentPlan.vendorCategories.map((v) => v.category).join(', ')}

USER'S REFINEMENT REQUEST:
"${req.userRequest}"

INSTRUCTIONS:
1. Return ONLY the JSON sections that are modified by the user's request.
2. Section shapes must strictly conform to these exact shapes:
   - "totalBudget": number (optional, only include if user explicitly requested changing total budget, e.g. 1200000)
   - "budgetAllocation": [ { "category": string, "percentage": number, "description": string } ] (sum of percentages must be 100)
   - "themeAndDecor": { "mainTheme"?: string, "colorPalette"?: string[], "decorIdeas"?: string[], "description"?: string }
   - "activities": [ { "name": string, "description": string, "estimatedDuration": string, "suitableFor": string } ]
   - "timeline": [ { "title": string, "description": string, "daysBeforeEvent": number, "priority": "high" | "medium" | "low", "category": string } ]
   - "vendorCategories": [ { "category": string, "description": string, "estimatedBudgetPercentage": number, "tips": string[], "budgetCategory": string } ]
   - "alternatives": [ { "original": string, "budgetFriendly": string, "sustainable": string, "accessible": string } ]
   - "risksAndAssumptions": string[]
   - "missingInfo": string[]
3. ALWAYS include "refinementSummary": "Clear 1-2 sentence description of what was adjusted".
4. Return valid JSON only.
`.trim();
}

/**
 * Build the prompt for generating personalized ideas in Idea Studio.
 */
export function buildIdeasPrompt(req: IdeasRequest): string {
  const existingNotes =
    req.existingIdeas && req.existingIdeas.length > 0
      ? `\nExisting ideas already shown (DO NOT repeat these titles): ${req.existingIdeas.join(', ')}`
      : '';

  return `
Generate 4-6 personalized, creative ideas for the "${req.section}" section of an Indian celebration.${existingNotes}

EVENT DETAILS:
- Type: ${req.eventDetails.eventType}
- Name: "${req.eventDetails.name}"
- City: ${req.eventDetails.city}
- Guests: ${req.eventDetails.guestCount}
- Total Budget: ₹${req.eventDetails.totalBudget.toLocaleString('en-IN')} INR
- Cultural context: ${req.eventDetails.culturalPreferences || 'Contemporary Indian'}
- Section to generate ideas for: ${req.section} (one of: theme, food, activities, decor, return-gifts)

JSON SCHEMA TO RETURN (Strict JSON only):
{
  "section": "${req.section}",
  "ideas": [
    {
      "title": "string (catchy, creative title)",
      "description": "string (rich practical description tailored to Indian events)",
      "estimatedCost": "string (e.g. '₹150-₹250 per guest' or '₹15,000 lump sum')",
      "sustainability": "string (eco-friendly aspect or tip)"
    }
  ]
}
`.trim();
}
