/**
 * localStorage persistence module.
 * Encapsulates all storage access behind a clean interface.
 * Validates every read with Zod schemas to ensure data integrity and drop invalid records.
 */

import { logger } from '@/lib/logger';
import { z } from 'zod';
import {
  storedEventSchema,
  budgetCategorySchema,
  expenseSchema,
  timelineTaskSchema,
  vendorSchema,
  type StoredEvent,
  type BudgetCategory,
  type Expense,
  type TimelineTask,
  type Vendor,
  type AIBlueprint,
  type AIIdeas,
} from '@/schemas';

export interface RefinementHistoryRecord {
  id: string;
  timestamp: string;
  userPrompt: string;
  summary: string;
  changedSections: string[];
}

// ─── Storage Keys ─────────────────────────────────────────────────
const KEYS = {
  events: 'utsava_events',
  blueprint: (eventId: string) => `utsava_blueprint_${eventId}`,
  categories: (eventId: string) => `utsava_categories_${eventId}`,
  expenses: (eventId: string) => `utsava_expenses_${eventId}`,
  tasks: (eventId: string) => `utsava_tasks_${eventId}`,
  vendors: (eventId: string) => `utsava_vendors_${eventId}`,
  refinementHistory: (eventId: string) => `utsava_refinement_${eventId}`,
  ideas: (eventId: string) => `utsava_ideas_${eventId}`,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────

function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = '__utsava_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function getItem<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    logger.error('Failed to save to localStorage:', e);
  }
}

function removeItem(key: string): void {
  if (!isLocalStorageAvailable()) return;
  window.localStorage.removeItem(key);
}

// ─── Events CRUD ──────────────────────────────────────────────────

export function getAllEvents(): StoredEvent[] {
  const raw = getItem<unknown[]>(KEYS.events);
  if (!Array.isArray(raw)) return [];
  const valid: StoredEvent[] = [];
  for (const item of raw) {
    const parsed = storedEventSchema.safeParse(item);
    if (parsed.success) {
      valid.push(parsed.data);
    }
  }
  return valid;
}

export function getEvent(id: string): StoredEvent | null {
  const events = getAllEvents();
  return events.find((e) => e.id === id) ?? null;
}

export function saveEvent(event: StoredEvent): void {
  const parsed = storedEventSchema.safeParse(event);
  if (!parsed.success) return;

  const events = getAllEvents();
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) {
    events[idx] = parsed.data;
  } else {
    events.push(parsed.data);
  }
  setItem(KEYS.events, events);
}

export function deleteEvent(id: string): void {
  const events = getAllEvents().filter((e) => e.id !== id);
  setItem(KEYS.events, events);
  // Clean up related data
  removeItem(KEYS.blueprint(id));
  removeItem(KEYS.categories(id));
  removeItem(KEYS.expenses(id));
  removeItem(KEYS.tasks(id));
  removeItem(KEYS.vendors(id));
  removeItem(KEYS.refinementHistory(id));
  removeItem(KEYS.ideas(id));
}

// ─── Blueprint ────────────────────────────────────────────────────

const storageBlueprintSchema = z
  .object({
    themeAndDecor: z
      .object({
        mainTheme: z.string().min(1),
      })
      .passthrough(),
  })
  .passthrough();

export function getBlueprint(eventId: string): AIBlueprint | null {
  const raw = getItem<unknown>(KEYS.blueprint(eventId));
  if (!raw) return null;
  const parsed = storageBlueprintSchema.safeParse(raw);
  return parsed.success ? (raw as AIBlueprint) : null;
}

export function saveBlueprint(eventId: string, blueprint: AIBlueprint): void {
  const parsed = storageBlueprintSchema.safeParse(blueprint);
  if (parsed.success) {
    setItem(KEYS.blueprint(eventId), blueprint);
  }
}

// ─── Budget Categories ────────────────────────────────────────────

export function getCategories(eventId: string): BudgetCategory[] {
  const raw = getItem<unknown[]>(KEYS.categories(eventId));
  if (!Array.isArray(raw)) return [];
  const valid: BudgetCategory[] = [];
  for (const item of raw) {
    const parsed = budgetCategorySchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

export function saveCategories(eventId: string, categories: BudgetCategory[]): void {
  const valid = categories.filter((c) => budgetCategorySchema.safeParse(c).success);
  setItem(KEYS.categories(eventId), valid);
}

// ─── Expenses ─────────────────────────────────────────────────────

export function getExpenses(eventId: string): Expense[] {
  const raw = getItem<unknown[]>(KEYS.expenses(eventId));
  if (!Array.isArray(raw)) return [];
  const valid: Expense[] = [];
  for (const item of raw) {
    const parsed = expenseSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

export function saveExpenses(eventId: string, expenses: Expense[]): void {
  const valid = expenses.filter((e) => expenseSchema.safeParse(e).success);
  setItem(KEYS.expenses(eventId), valid);
}

// ─── Timeline Tasks ──────────────────────────────────────────────

export function getTasks(eventId: string): TimelineTask[] {
  const raw = getItem<unknown[]>(KEYS.tasks(eventId));
  if (!Array.isArray(raw)) return [];
  const valid: TimelineTask[] = [];
  for (const item of raw) {
    const parsed = timelineTaskSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

export function saveTasks(eventId: string, tasks: TimelineTask[]): void {
  const valid = tasks.filter((t) => timelineTaskSchema.safeParse(t).success);
  setItem(KEYS.tasks(eventId), valid);
}

// ─── Vendors ──────────────────────────────────────────────────────

export function getVendors(eventId: string): Vendor[] {
  const raw = getItem<unknown[]>(KEYS.vendors(eventId));
  if (!Array.isArray(raw)) return [];
  const valid: Vendor[] = [];
  for (const item of raw) {
    const parsed = vendorSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

export function saveVendors(eventId: string, vendors: Vendor[]): void {
  const valid = vendors.filter((v) => vendorSchema.safeParse(v).success);
  setItem(KEYS.vendors(eventId), valid);
}

// ─── Refinement History ───────────────────────────────────────────

export function getRefinementHistory(eventId: string): RefinementHistoryRecord[] {
  const raw = getItem<RefinementHistoryRecord[]>(KEYS.refinementHistory(eventId));
  if (!Array.isArray(raw)) return [];
  return raw;
}

export function saveRefinementHistory(eventId: string, history: RefinementHistoryRecord[]): void {
  setItem(KEYS.refinementHistory(eventId), history);
}

// ─── Idea Studio Ideas ────────────────────────────────────────────

export function getEventIdeas(eventId: string): Record<string, AIIdeas['ideas']> {
  const raw = getItem<Record<string, AIIdeas['ideas']>>(KEYS.ideas(eventId));
  if (!raw || typeof raw !== 'object') return {};
  return raw;
}

export function saveEventIdeas(eventId: string, ideas: Record<string, AIIdeas['ideas']>): void {
  setItem(KEYS.ideas(eventId), ideas);
}
