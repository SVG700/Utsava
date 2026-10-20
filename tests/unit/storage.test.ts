import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllEvents,
  getEvent,
  saveEvent,
  deleteEvent,
  getBlueprint,
  saveBlueprint,
  getCategories,
  saveCategories,
  getExpenses,
  saveExpenses,
  getTasks,
  saveTasks,
  getVendors,
  saveVendors,
} from '@/lib/storage';
import type { StoredEvent, AIBlueprint, BudgetCategory, Expense, TimelineTask, Vendor } from '@/schemas';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key in store) {
      delete store[key];
    }
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

// Set up the mock before all tests
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

const testEvent: StoredEvent = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  eventType: 'wedding',
  name: 'Test Wedding',
  date: '2026-06-15',
  city: 'Mumbai',
  guestCount: 200,
  totalBudget: 500000,
  theme: '',
  dietaryPreferences: [],
  culturalPreferences: '',
  accessibilityNeeds: '',
  specialRequirements: '',
  subEvents: [],
};

describe('Event CRUD', () => {
  it('returns empty array when no events exist', () => {
    expect(getAllEvents()).toEqual([]);
  });

  it('saves and retrieves an event', () => {
    saveEvent(testEvent);
    const events = getAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(testEvent.id);
  });

  it('gets a single event by id', () => {
    saveEvent(testEvent);
    const event = getEvent(testEvent.id);
    expect(event).not.toBeNull();
    expect(event!.name).toBe('Test Wedding');
  });

  it('returns null for non-existent event', () => {
    expect(getEvent('non-existent')).toBeNull();
  });

  it('updates an existing event', () => {
    saveEvent(testEvent);
    const updated = { ...testEvent, name: 'Updated Wedding' };
    saveEvent(updated);
    const events = getAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('Updated Wedding');
  });

  it('deletes an event and its related data', () => {
    saveEvent(testEvent);
    saveBlueprint(testEvent.id, {} as AIBlueprint);
    saveCategories(testEvent.id, []);
    saveExpenses(testEvent.id, []);
    saveTasks(testEvent.id, []);
    saveVendors(testEvent.id, []);

    deleteEvent(testEvent.id);

    expect(getAllEvents()).toHaveLength(0);
    expect(getBlueprint(testEvent.id)).toBeNull();
    expect(getCategories(testEvent.id)).toEqual([]);
    expect(getExpenses(testEvent.id)).toEqual([]);
    expect(getTasks(testEvent.id)).toEqual([]);
    expect(getVendors(testEvent.id)).toEqual([]);
  });
});

describe('Blueprint storage', () => {
  it('saves and retrieves a blueprint', () => {
    const blueprint = { themeAndDecor: { mainTheme: 'Test' } } as AIBlueprint;
    saveBlueprint('event-1', blueprint);
    const result = getBlueprint('event-1');
    expect(result).not.toBeNull();
    expect(result!.themeAndDecor.mainTheme).toBe('Test');
  });

  it('returns null for missing blueprint', () => {
    expect(getBlueprint('non-existent')).toBeNull();
  });
});

describe('Categories storage', () => {
  it('saves and retrieves categories', () => {
    const cats: BudgetCategory[] = [
      { id: 'cat-0', name: 'Venue', percentage: 30, estimatedAmount: 150000, actualAmount: 0 },
    ];
    saveCategories('event-1', cats);
    expect(getCategories('event-1')).toEqual(cats);
  });
});

describe('Expenses storage', () => {
  it('saves and retrieves expenses', () => {
    const expenses: Expense[] = [
      { id: '1', categoryId: 'cat-0', description: 'Test', amount: 50000, date: '2026-01-15', notes: '' },
    ];
    saveExpenses('event-1', expenses);
    expect(getExpenses('event-1')).toEqual(expenses);
  });
});

describe('Tasks storage', () => {
  it('saves and retrieves tasks', () => {
    const tasks: TimelineTask[] = [
      { id: '1', title: 'Task 1', description: '', dueDate: '2026-01-15', daysBeforeEvent: 90, priority: 'high', completed: false, category: '' },
    ];
    saveTasks('event-1', tasks);
    expect(getTasks('event-1')).toEqual(tasks);
  });
});

describe('Vendors storage', () => {
  it('saves and retrieves vendors', () => {
    const vendors: Vendor[] = [
      { id: '1', category: 'Venue', status: 'not-started', name: '', contact: '', notes: '', suggestedByAI: false },
    ];
    saveVendors('event-1', vendors);
    expect(getVendors('event-1')).toEqual(vendors);
  });
});
