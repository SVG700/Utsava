'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getBlueprint,
  getCategories,
  getEvent,
  getExpenses,
  getTasks,
  getVendors,
  saveBlueprint,
  saveCategories,
  saveEvent,
  saveExpenses,
  saveTasks,
  saveVendors,
} from '@/lib/storage';
import type { PlanState } from '@/lib/planUpdates';

/** A partial plan update, or a function deriving one from the latest plan. */
export type PlanUpdate = Partial<PlanState> | ((current: PlanState) => Partial<PlanState>);

/** Writes only the provided parts of the plan to local storage. */
function persist(eventId: string, changes: Partial<PlanState>): void {
  if (changes.event) saveEvent(changes.event);
  if (changes.blueprint) saveBlueprint(eventId, changes.blueprint);
  if (changes.categories) saveCategories(eventId, changes.categories);
  if (changes.expenses) saveExpenses(eventId, changes.expenses);
  if (changes.tasks) saveTasks(eventId, changes.tasks);
  if (changes.vendors) saveVendors(eventId, changes.vendors);
}

function loadPlan(eventId: string): PlanState | null {
  const event = getEvent(eventId);
  if (!event) return null;
  return {
    event,
    blueprint: getBlueprint(eventId),
    categories: getCategories(eventId),
    expenses: getExpenses(eventId),
    tasks: getTasks(eventId),
    vendors: getVendors(eventId),
  };
}

/**
 * Loads an event's plan from browser storage and exposes `commit`, which persists
 * a partial update and merges it into React state. Updater functions always see the
 * latest plan, so slow AI responses never overwrite edits made while they ran.
 * Redirects home if the event does not exist.
 */
export function usePlannerData(eventId: string) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanState | null>(null);
  const latest = useRef<PlanState | null>(null);

  useEffect(() => {
    // Deferred so localStorage is only read after hydration.
    const timer = setTimeout(() => {
      const loaded = loadPlan(eventId);
      if (!loaded) {
        router.push('/');
        return;
      }
      latest.current = loaded;
      setPlan(loaded);
    }, 0);
    return () => clearTimeout(timer);
  }, [eventId, router]);

  const commit = useCallback(
    (update: PlanUpdate) => {
      const current = latest.current;
      if (!current) return;
      const changes = typeof update === 'function' ? update(current) : update;
      persist(eventId, changes);
      latest.current = { ...current, ...changes };
      setPlan(latest.current);
    },
    [eventId],
  );

  return { plan, commit };
}
