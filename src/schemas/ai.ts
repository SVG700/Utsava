import { z } from 'zod';
import { EVENT_TYPES } from './event';

// ─── AI Blueprint Response Schema ────────────────────────────────
// This validates the structured JSON returned by Gemini.

export const aiBudgetAllocationSchema = z.object({
  category: z.string().min(1).max(100),
  percentage: z.number().min(0).max(100),
  description: z.string().min(1).max(500),
});

export const aiTimelineItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500),
  daysBeforeEvent: z.number().int().min(0).max(365),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string().max(100).optional().default(''),
});

export const aiVendorCategorySchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().max(500),
  estimatedBudgetPercentage: z.number().min(0).max(100),
  tips: z.array(z.string().min(1).max(300)).min(1).max(10),
  budgetCategory: z.string().min(1).max(100).optional().default(''),
});

export const aiAlternativeSchema = z.object({
  original: z.string().min(1).max(300),
  budgetFriendly: z.string().min(1).max(300),
  sustainable: z.string().min(1).max(300),
  accessible: z.string().min(1).max(300),
});

export const aiBlueprintSchema = z.object({
  themeAndDecor: z.object({
    mainTheme: z.string().min(1).max(150),
    colorPalette: z.array(z.string().min(1).max(50)).min(1).max(10),
    decorIdeas: z.array(z.string().min(1).max(300)).min(1).max(15),
    description: z.string().min(1).max(1000),
  }),
  activities: z
    .array(
      z.object({
        name: z.string().min(1).max(150),
        description: z.string().min(1).max(500),
        estimatedDuration: z.string().min(1).max(100),
        suitableFor: z.string().min(1).max(150),
      })
    )
    .min(1)
    .max(20),
  budgetAllocation: z.array(aiBudgetAllocationSchema).min(1).max(20),
  timeline: z.array(aiTimelineItemSchema).min(1).max(50),
  vendorCategories: z.array(aiVendorCategorySchema).min(1).max(20),
  risksAndAssumptions: z.array(z.string().min(1).max(300)).min(1).max(15),
  missingInfo: z.array(z.string().min(1).max(300)).max(15),
  alternatives: z.array(aiAlternativeSchema).min(1).max(15),
});

export type AIBlueprint = z.infer<typeof aiBlueprintSchema>;

// ─── AI Refinement Response Schema ───────────────────────────────
export const aiRefinementBudgetAllocationSchema = z.union([
  z.array(aiBudgetAllocationSchema).min(1).max(20),
  z.record(z.string(), z.number()).transform((rec) =>
    Object.entries(rec).map(([cat, pct]) => ({
      category: cat,
      percentage: pct,
      description: `Allocation for ${cat}`,
    }))
  ),
]);

// Partial blueprint for refinement — only changed sections returned.
export const aiRefinementSchema = z.object({
  totalBudget: z.number().min(1000).max(1_000_000_000).optional(),
  themeAndDecor: z
    .object({
      mainTheme: z.string().min(1).max(150).optional(),
      colorPalette: z.array(z.string().min(1).max(50)).min(1).max(10).optional(),
      decorIdeas: z.array(z.string().min(1).max(300)).min(1).max(15).optional(),
      description: z.string().min(1).max(1000).optional(),
    })
    .optional(),
  activities: z
    .array(
      z.object({
        name: z.string().min(1).max(150),
        description: z.string().min(1).max(500),
        estimatedDuration: z.string().min(1).max(100),
        suitableFor: z.string().min(1).max(150),
      })
    )
    .min(1)
    .max(20)
    .optional(),
  budgetAllocation: aiRefinementBudgetAllocationSchema.optional(),
  timeline: z.array(aiTimelineItemSchema).min(1).max(50).optional(),
  vendorCategories: z.array(aiVendorCategorySchema).min(1).max(20).optional(),
  risksAndAssumptions: z.array(z.string().min(1).max(300)).min(1).max(15).optional(),
  missingInfo: z.array(z.string().min(1).max(300)).max(15).optional(),
  alternatives: z.array(aiAlternativeSchema).min(1).max(15).optional(),
  refinementSummary: z.string().min(1).max(1000),
});

export type AIRefinement = z.infer<typeof aiRefinementSchema>;

// ─── AI Ideas Response Schema ────────────────────────────────────
export const AI_IDEA_SECTIONS = [
  'theme',
  'food',
  'activities',
  'decor',
  'return-gifts',
] as const;
export type AIIdeaSection = (typeof AI_IDEA_SECTIONS)[number];

export const aiIdeasSchema = z.object({
  section: z.enum(AI_IDEA_SECTIONS),
  ideas: z
    .array(
      z.object({
        title: z.string().min(1).max(150),
        description: z.string().min(1).max(500),
        estimatedCost: z.string().min(1).max(100),
        sustainability: z.string().max(300).optional().default(''),
      })
    )
    .min(1)
    .max(20),
});

export type AIIdeas = z.infer<typeof aiIdeasSchema>;

// ─── API Request Schemas (server-side validation) ────────────────
export const blueprintRequestSchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  name: z.string().min(1).max(100),
  date: z.string().min(1).max(20),
  city: z.string().min(1).max(80),
  guestCount: z.number().int().min(1).max(100000),
  totalBudget: z.number().min(1000).max(1_000_000_000),
  theme: z.string().max(200).optional().default(''),
  dietaryPreferences: z.array(z.string().max(50)).max(10).optional().default([]),
  culturalPreferences: z.string().max(500).optional().default(''),
  accessibilityNeeds: z.string().max(500).optional().default(''),
  specialRequirements: z.string().max(1000).optional().default(''),
  subEvents: z.array(z.string().max(50)).max(10).optional().default([]),
});

export type BlueprintRequest = z.infer<typeof blueprintRequestSchema>;

export const refinementRequestSchema = z.object({
  eventDetails: blueprintRequestSchema,
  currentPlan: aiBlueprintSchema,
  userRequest: z.string().min(1).max(1000),
});

export type RefinementRequest = z.infer<typeof refinementRequestSchema>;

export const ideasRequestSchema = z.object({
  eventDetails: blueprintRequestSchema,
  section: z.enum(AI_IDEA_SECTIONS),
  existingIdeas: z.array(z.string()).max(50).optional().default([]),
});

export type IdeasRequest = z.infer<typeof ideasRequestSchema>;
