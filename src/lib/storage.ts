/**
 * localStorage persistence module.
 * Encapsulates all storage access behind a clean interface so it can
 * be swapped for IndexedDB / a backend later.
 */

import type { StoredEvent } from '@/schemas';
import type { BudgetCategory, Expense, TimelineTask, Vendor } from '@/schemas';
import type { AIBlueprint } from '@/schemas';

// ─── Storage Keys ─────────────────────────────────────────────────
const KEYS = {
  events: 'utsava_events',
  blueprint: (eventId: string) => `utsava_blueprint_${eventId}`,
  categories: (eventId: string) => `utsava_categories_${eventId}`,
  expenses: (eventId: string) => `utsava_expenses_${eventId}`,
  tasks: (eventId: string) => `utsava_tasks_${eventId}`,
  vendors: (eventId: string) => `utsava_vendors_${eventId}`,
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
    console.error('Failed to save to localStorage:', e);
  }
}

function removeItem(key: string): void {
  if (!isLocalStorageAvailable()) return;
  window.localStorage.removeItem(key);
}

// ─── Events CRUD ──────────────────────────────────────────────────

export function getAllEvents(): StoredEvent[] {
  return getItem<StoredEvent[]>(KEYS.events) ?? [];
}

export function getEvent(id: string): StoredEvent | null {
  const events = getAllEvents();
  return events.find((e) => e.id === id) ?? null;
}

export function saveEvent(event: StoredEvent): void {
  const events = getAllEvents();
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) {
    events[idx] = event;
  } else {
    events.push(event);
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
}

// ─── Blueprint ────────────────────────────────────────────────────

export function getBlueprint(eventId: string): AIBlueprint | null {
  return getItem<AIBlueprint>(KEYS.blueprint(eventId));
}

export function saveBlueprint(eventId: string, blueprint: AIBlueprint): void {
  setItem(KEYS.blueprint(eventId), blueprint);
}

// ─── Budget Categories ────────────────────────────────────────────

export function getCategories(eventId: string): BudgetCategory[] {
  return getItem<BudgetCategory[]>(KEYS.categories(eventId)) ?? [];
}

export function saveCategories(eventId: string, categories: BudgetCategory[]): void {
  setItem(KEYS.categories(eventId), categories);
}

// ─── Expenses ─────────────────────────────────────────────────────

export function getExpenses(eventId: string): Expense[] {
  return getItem<Expense[]>(KEYS.expenses(eventId)) ?? [];
}

export function saveExpenses(eventId: string, expenses: Expense[]): void {
  setItem(KEYS.expenses(eventId), expenses);
}

// ─── Timeline Tasks ──────────────────────────────────────────────

export function getTasks(eventId: string): TimelineTask[] {
  return getItem<TimelineTask[]>(KEYS.tasks(eventId)) ?? [];
}

export function saveTasks(eventId: string, tasks: TimelineTask[]): void {
  setItem(KEYS.tasks(eventId), tasks);
}

// ─── Vendors ──────────────────────────────────────────────────────

export function getVendors(eventId: string): Vendor[] {
  return getItem<Vendor[]>(KEYS.vendors(eventId)) ?? [];
}

export function saveVendors(eventId: string, vendors: Vendor[]): void {
  setItem(KEYS.vendors(eventId), vendors);
}
