import { z } from 'zod';
import { EVENT_TYPES } from './event';
import { isPastDate } from '@/lib/dates';

// Helper to truncate free-text fields instead of rejecting whole responses
const trunc = (max: number, min = 1) =>
  min > 0
    ? z
        .string()
        .min(min)
        .transform((s) => s.slice(0, max))
    : z.string().transform((s) => s.slice(0, max));

// ─── AI Blueprint Response Schema ────────────────────────────────
// This validates the structured JSON returned by Gemini.

export const aiBudgetAllocationSchema = z.object({
  category: trunc(100),
  percentage: z.number().min(0).max(100),
  description: trunc(500),
});

export const aiTimelineItemSchema = z.object({
  title: trunc(200),
  description: trunc(500, 0),
  daysBeforeEvent: z.number().int().min(0).max(365),
  priority: z.enum(['high', 'medium', 'low']),
  category: trunc(100, 0).optional().default(''),
});

export const aiVendorCategorySchema = z.object({
  category: trunc(100),
  description: trunc(500, 0),
  estimatedBudgetPercentage: z.number().min(0).max(100),
  tips: z.array(trunc(300)).min(1).max(10),
  budgetCategory: trunc(100, 0).optional().default(''),
});

export const aiAlternativeSchema = z.object({
  original: trunc(300),
  budgetFriendly: trunc(300),
  sustainable: trunc(300),
  accessible: trunc(300),
});

export const aiBlueprintSchema = z.object({
  themeAndDecor: z.object({
    mainTheme: trunc(150),
    colorPalette: z.array(trunc(50)).min(1).max(10),
    decorIdeas: z.array(trunc(300)).min(1).max(15),
    description: trunc(1000),
  }),
  activities: z
    .array(
      z.object({
        name: trunc(150),
        description: trunc(500),
        estimatedDuration: trunc(100),
        suitableFor: trunc(150),
      }),
    )
    .min(1)
    .max(20),
  budgetAllocation: z.array(aiBudgetAllocationSchema).min(1).max(20),
  timeline: z.array(aiTimelineItemSchema).min(1).max(50),
  vendorCategories: z.array(aiVendorCategorySchema).min(1).max(20),
  risksAndAssumptions: z.array(trunc(300)).min(1).max(15),
  missingInfo: z.array(trunc(300)).max(15),
  alternatives: z.array(aiAlternativeSchema).min(1).max(15),
});

export type AIBlueprint = z.infer<typeof aiBlueprintSchema>;

// ─── AI Refinement Response Schema ───────────────────────────────
export const REFINEMENT_SECTIONS = [
  'themeAndDecor',
  'activities',
  'budgetAllocation',
  'timeline',
  'vendorCategories',
  'risksAndAssumptions',
  'missingInfo',
  'alternatives',
  'totalBudget',
] as const;

export type RefinementSection = (typeof REFINEMENT_SECTIONS)[number];

export const aiRefinementBudgetAllocationSchema = z.union([
  z.array(aiBudgetAllocationSchema).min(1).max(20),
  z.record(z.string(), z.number()).transform((rec) =>
    Object.entries(rec).map(([cat, pct]) => ({
      category: cat.slice(0, 100),
      percentage: pct,
      description: `Allocation for ${cat}`.slice(0, 500),
    })),
  ),
]);

// Partial blueprint for refinement — only changed sections returned.
export const aiRefinementSchema = z.object({
  changedSections: z.array(z.enum(REFINEMENT_SECTIONS)).min(1),
  totalBudget: z.number().min(1000).max(1_000_000_000).optional(),
  themeAndDecor: z
    .object({
      mainTheme: trunc(150).optional(),
      colorPalette: z.array(trunc(50)).min(1).max(10).optional(),
      decorIdeas: z.array(trunc(300)).min(1).max(15).optional(),
      description: trunc(1000).optional(),
    })
    .optional(),
  activities: z
    .array(
      z.object({
        name: trunc(150),
        description: trunc(500),
        estimatedDuration: trunc(100),
        suitableFor: trunc(150),
      }),
    )
    .min(1)
    .max(20)
    .optional(),
  budgetAllocation: aiRefinementBudgetAllocationSchema.optional(),
  timeline: z.array(aiTimelineItemSchema).min(1).max(50).optional(),
  vendorCategories: z.array(aiVendorCategorySchema).min(1).max(20).optional(),
  risksAndAssumptions: z.array(trunc(300)).min(1).max(15).optional(),
  missingInfo: z.array(trunc(300)).max(15).optional(),
  alternatives: z.array(aiAlternativeSchema).min(1).max(15).optional(),
  refinementSummary: z
    .string()
    .min(1)
    .transform((s) => s.slice(0, 1000)),
});

export type AIRefinement = z.infer<typeof aiRefinementSchema>;

// ─── AI Ideas Response Schema ────────────────────────────────────
export const AI_IDEA_SECTIONS = ['theme', 'food', 'activities', 'decor', 'return-gifts'] as const;
export type AIIdeaSection = (typeof AI_IDEA_SECTIONS)[number];

export const aiIdeasSchema = z.object({
  section: z.enum(AI_IDEA_SECTIONS),
  ideas: z
    .array(
      z.object({
        title: trunc(150),
        description: trunc(500),
        estimatedCost: trunc(100),
        sustainability: trunc(300, 0).optional().default(''),
      }),
    )
    .min(1)
    .max(20),
});

export type AIIdeas = z.infer<typeof aiIdeasSchema>;

// ─── API Request Schemas (server-side validation) ────────────────
export const baseBlueprintRequestSchema = z.object({
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

export const blueprintRequestSchema = baseBlueprintRequestSchema.refine(
  (data) => !isPastDate(data.date),
  {
    message: 'Celebration date cannot be in the past',
    path: ['date'],
  },
);

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
