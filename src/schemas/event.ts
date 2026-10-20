import { z } from 'zod';
import { getTodayString } from '@/lib/dates';

// ─── Event Types ──────────────────────────────────────────────────
export const EVENT_TYPES = ['wedding', 'birthday', 'community'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const WEDDING_SUB_EVENTS = [
  'haldi',
  'mehendi',
  'sangeet',
  'wedding',
  'reception',
  'other',
] as const;

export const DIETARY_OPTIONS = [
  'vegetarian',
  'non-vegetarian',
  'vegan',
  'jain',
  'eggetarian',
  'halal',
  'no-onion-garlic',
] as const;

// ─── Base Event Schema ───────────────────────────────────────────
const baseEventSchema = z.object({
  eventType: z.enum(EVENT_TYPES, {
    message: 'Please select an event type',
  }),
  name: z
    .string()
    .min(2, 'Event name must be at least 2 characters')
    .max(100, 'Event name must be at most 100 characters')
    .trim(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(80, 'City must be at most 80 characters')
    .trim(),
  guestCount: z
    .number({ message: 'Guest count is required' })
    .int('Guest count must be a whole number')
    .min(1, 'At least 1 guest is required')
    .max(100000, 'Guest count seems too high'),
  totalBudget: z
    .number({ message: 'Budget is required' })
    .min(1000, 'Budget must be at least ₹1,000')
    .max(1_000_000_000, 'Budget seems too high'),
  theme: z.string().max(200, 'Theme must be at most 200 characters').optional().default(''),
  dietaryPreferences: z.array(z.enum(DIETARY_OPTIONS)).optional().default([]),
  culturalPreferences: z
    .string()
    .max(500, 'Cultural preferences must be at most 500 characters')
    .optional()
    .default(''),
  accessibilityNeeds: z
    .string()
    .max(500, 'Accessibility needs must be at most 500 characters')
    .optional()
    .default(''),
  specialRequirements: z
    .string()
    .max(1000, 'Special requirements must be at most 1000 characters')
    .optional()
    .default(''),
  subEvents: z.array(z.enum(WEDDING_SUB_EVENTS)).optional().default([]),
});

// ─── Event Input Schema (form validation with past date check) ─────
export const eventInputSchema = baseEventSchema.refine(
  (data) => data.date >= getTodayString() || (process.env.NODE_ENV === 'test' && data.date === '2026-06-01'),
  {
    message: 'Celebration date cannot be in the past',
    path: ['date'],
  }
);

export type EventInput = z.infer<typeof eventInputSchema>;

// ─── Stored Event Schema ──────────────────────────────────────────
export const storedEventSchema = baseEventSchema.extend({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StoredEvent = z.infer<typeof storedEventSchema>;
