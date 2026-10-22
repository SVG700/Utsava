'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import {
  getEvent,
  saveEvent,
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
import {
  buildBudgetCategories,
  recalculateEstimates,
  remapExpensesToNewCategories,
  findMatchingCategoryId,
  mergeVendorsOnRegenerate,
} from '@/lib/budget';
import { buildTimelineTasks, recalculateTaskDates, mergeTasksOnRegenerate } from '@/lib/dates';
import type {
  StoredEvent,
  AIBlueprint,
  BudgetCategory,
  Expense,
  TimelineTask,
  Vendor,
} from '@/schemas';
import { PlannerHeader, type PlannerTab } from './PlannerHeader';
import { DashboardTab } from './DashboardTab';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiGenerateBlueprint, ApiError } from '@/lib/api';
import { GenerationProgressModal } from './GenerationProgressModal';

function TabLoadingFallback({ label }: { label: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
      <div className="w-8 h-8 border-2 border-[#134e3a] dark:border-[#2dd4bf] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

const BudgetTab = dynamic(() => import('./BudgetTab').then((m) => m.BudgetTab), {
  loading: () => <TabLoadingFallback label="Loading Budget Planner..." />,
});
const TimelineTab = dynamic(() => import('./TimelineTab').then((m) => m.TimelineTab), {
  loading: () => <TabLoadingFallback label="Loading Timeline..." />,
});
const VendorsTab = dynamic(() => import('./VendorsTab').then((m) => m.VendorsTab), {
  loading: () => <TabLoadingFallback label="Loading Vendor Directory..." />,
});
const IdeasTab = dynamic(() => import('./IdeasTab').then((m) => m.IdeasTab), {
  loading: () => <TabLoadingFallback label="Loading Idea Studio..." />,
});
const RefineTab = dynamic(() => import('./RefineTab').then((m) => m.RefineTab), {
  loading: () => <TabLoadingFallback label="Loading AI Copilot..." />,
});
const ExportTab = dynamic(() => import('./ExportTab').then((m) => m.ExportTab), {
  loading: () => <TabLoadingFallback label="Loading Export..." />,
});

interface MainPlannerProps {
  eventId: string;
}

export function MainPlanner({ eventId }: MainPlannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [event, setEvent] = useState<StoredEvent | null>(null);
  const [blueprint, setBlueprint] = useState<AIBlueprint | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [activeTab, setActiveTab] = useState<PlannerTab>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort ongoing network request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Load event & stored state from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadedEvent = getEvent(eventId);
      if (!loadedEvent) {
        router.push('/');
        return;
      }

      const loadedBlueprint = getBlueprint(eventId);
      const loadedCats = getCategories(eventId);
      const loadedExpenses = getExpenses(eventId);
      const loadedTasks = getTasks(eventId);
      const loadedVendors = getVendors(eventId);

      setEvent(loadedEvent);
      setBlueprint(loadedBlueprint);
      setCategories(loadedCats);
      setExpenses(loadedExpenses);
      setTasks(loadedTasks);
      setVendors(loadedVendors);
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [eventId, router]);

  useEffect(() => {
    if (event?.name) {
      document.title = `${event.name} — Utsava AI Planner`;
    } else {
      document.title = 'Utsava — AI Celebration Planner';
    }
  }, [event?.name]);

  // Generate / Regenerate Blueprint from API
  const handleGenerateBlueprint = useCallback(async () => {
    if (!event || isGenerating) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const data = await apiGenerateBlueprint(event, controller.signal);
      const generatedBlueprint: AIBlueprint = data.blueprint;

      // 1. Save blueprint
      saveBlueprint(event.id, generatedBlueprint);
      setBlueprint(generatedBlueprint);

      // 2. Build budget categories with stable slug IDs and re-map expenses
      const computedCats = buildBudgetCategories(
        generatedBlueprint.budgetAllocation,
        event.totalBudget,
      );
      const { updatedExpenses, finalCategories } = remapExpensesToNewCategories(
        expenses,
        categories,
        computedCats,
      );
      saveCategories(event.id, finalCategories);
      setCategories(finalCategories);
      saveExpenses(event.id, updatedExpenses);
      setExpenses(updatedExpenses);

      // 3. Build and merge timeline tasks, strictly preserving completed and user-added tasks
      const rawTasks = buildTimelineTasks(generatedBlueprint.timeline, event.date);
      const preservedTasks = mergeTasksOnRegenerate(tasks, rawTasks);
      saveTasks(event.id, preservedTasks);
      setTasks(preservedTasks);

      // 4. Build vendor categories with budgetCategoryId link and preserve user vendors
      const rawVendors: Vendor[] = generatedBlueprint.vendorCategories.map((vc) => ({
        id: uuidv4(),
        category: vc.category,
        budgetCategoryId: findMatchingCategoryId(vc.budgetCategory || vc.category, finalCategories),
        name: '',
        contact: '',
        status: 'not-started',
        notes: '',
        suggestedByAI: true,
        source: 'ai',
      }));
      const preservedVendors = mergeVendorsOnRegenerate(vendors, rawVendors, finalCategories);
      saveVendors(event.id, preservedVendors);
      setVendors(preservedVendors);

      setApiKeyMissing(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error generating blueprint:', err);
      if (err instanceof ApiError && err.code === 'MISSING_API_KEY') {
        setApiKeyMissing(true);
        setErrorMessage(
          'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file to enable AI generation.',
        );
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Network error or service unavailable. Please check your connection and retry.',
        );
      }
    } finally {
      setIsGenerating(false);
    }
  }, [event, isGenerating, expenses, categories, tasks, vendors]);

  // Auto-trigger blueprint generation if event was just created and no blueprint exists
  useEffect(() => {
    if (isNew && event && !blueprint && !isGenerating && !apiKeyMissing && loading === false) {
      const timer = setTimeout(() => {
        handleGenerateBlueprint();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isNew, event, blueprint, isGenerating, apiKeyMissing, loading, handleGenerateBlueprint]);

  // Handle Event Date Change (Recalculate tasks)
  const handleUpdateEventDate = (newDate: string) => {
    if (!event) return;
    const updatedEvent = { ...event, date: newDate, updatedAt: new Date().toISOString() };
    saveEvent(updatedEvent);
    setEvent(updatedEvent);

    // Recalculate tasks automatically via lib/dates.ts
    const recalculated = recalculateTaskDates(tasks, newDate);
    saveTasks(event.id, recalculated);
    setTasks(recalculated);
  };

  // Handle Total Budget Edit (Recalculates category allocations deterministically)
  const handleUpdateTotalBudget = (newTotalBudget: number) => {
    if (!event) return;
    const updatedEvent = {
      ...event,
      totalBudget: newTotalBudget,
      updatedAt: new Date().toISOString(),
    };
    saveEvent(updatedEvent);
    setEvent(updatedEvent);

    // Recalculate categories with recalculateEstimates
    const recalculated = recalculateEstimates(categories, newTotalBudget);
    saveCategories(event.id, recalculated);
    setCategories(recalculated);
  };

  // State update handlers that sync with localStorage
  const handleUpdateCategories = (newCats: BudgetCategory[]) => {
    if (!event) return;
    saveCategories(event.id, newCats);
    setCategories(newCats);
  };

  const handleUpdateExpenses = (newExpenses: Expense[]) => {
    if (!event) return;
    saveExpenses(event.id, newExpenses);
    setExpenses(newExpenses);
  };

  const handleUpdateTasks = (newTasks: TimelineTask[]) => {
    if (!event) return;
    saveTasks(event.id, newTasks);
    setTasks(newTasks);
  };

  const handleUpdateVendors = (newVendors: Vendor[]) => {
    if (!event) return;
    saveVendors(event.id, newVendors);
    setVendors(newVendors);
  };

  // Add task from Idea Studio
  const handleAddTask = (newTaskData: Omit<TimelineTask, 'id'>) => {
    if (!event) return;
    const newTask: TimelineTask = {
      ...newTaskData,
      id: uuidv4(),
      source: 'user',
    };
    const updated = [newTask, ...tasks];
    saveTasks(event.id, updated);
    setTasks(updated);
  };

  // Apply Refined Plan
  const handleApplyRefinedPlan = (
    updatedBlueprint: AIBlueprint,
    updatedCategories: BudgetCategory[] | null,
    summary: string,
    refinedTotalBudget?: number,
    changedSections?: string[],
  ) => {
    if (!event) return;

    let currentEvent = event;
    if (refinedTotalBudget && refinedTotalBudget >= 1000) {
      currentEvent = {
        ...event,
        totalBudget: refinedTotalBudget,
        updatedAt: new Date().toISOString(),
      };
      saveEvent(currentEvent);
      setEvent(currentEvent);
    }

    saveBlueprint(currentEvent.id, updatedBlueprint);
    setBlueprint(updatedBlueprint);

    let activeCategories = categories;
    if (updatedCategories) {
      const finalCats = recalculateEstimates(updatedCategories, currentEvent.totalBudget);
      saveCategories(currentEvent.id, finalCats);
      setCategories(finalCats);
      activeCategories = finalCats;
    }

    // When refinement includes a timeline, rebuild tasks preserving completion by title
    if (changedSections?.includes('Timeline')) {
      const newTasks = buildTimelineTasks(updatedBlueprint.timeline, currentEvent.date);
      const mergedTasks = mergeTasksOnRegenerate(tasks, newTasks);
      saveTasks(currentEvent.id, mergedTasks);
      setTasks(mergedTasks);
    }

    // When refinement includes vendorCategories, merge into vendors without losing user data
    if (changedSections?.includes('Vendor Categories')) {
      const rawVendors: Vendor[] = updatedBlueprint.vendorCategories.map((vc) => {
        const matchingCatId = vc.budgetCategory
          ? (activeCategories.find((c) => c.name.toLowerCase() === vc.budgetCategory?.toLowerCase())
              ?.id ?? findMatchingCategoryId(vc.category, activeCategories))
          : findMatchingCategoryId(vc.category, activeCategories);
        return {
          id: uuidv4(),
          category: vc.category,
          budgetCategoryId: matchingCatId,
          name: '',
          contact: '',
          status: 'not-started',
          notes: '',
          suggestedByAI: true,
          source: 'ai',
        };
      });
      const mergedVendors = mergeVendorsOnRegenerate(vendors, rawVendors, activeCategories);
      saveVendors(currentEvent.id, mergedVendors);
      setVendors(mergedVendors);
    }
  };

  if (loading || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-forest-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-stone-500">Loading your celebration plan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Planner Header with countdown, actions, tabs */}
      <PlannerHeader
        event={event}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasBlueprint={Boolean(blueprint)}
        isGeneratingBlueprint={isGenerating}
        onGenerateBlueprint={handleGenerateBlueprint}
        onUpdateEventDate={handleUpdateEventDate}
        onUpdateTotalBudget={handleUpdateTotalBudget}
        apiKeyMissing={apiKeyMissing}
      />

      {/* Generation Staged Progress Modal */}
      <GenerationProgressModal isOpen={isGenerating} eventName={event.name} />

      {/* Main Tab Content Container */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="focus:outline-none"
        >
          {activeTab === 'dashboard' && (
            <DashboardTab
              event={event}
              blueprint={blueprint}
              categories={categories}
              expenses={expenses}
              tasks={tasks}
              vendors={vendors}
              onNavigateTab={setActiveTab}
              onGenerateBlueprint={handleGenerateBlueprint}
              isGeneratingBlueprint={isGenerating}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetTab
              event={event}
              categories={categories}
              expenses={expenses}
              onUpdateCategories={handleUpdateCategories}
              onUpdateExpenses={handleUpdateExpenses}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab event={event} tasks={tasks} onUpdateTasks={handleUpdateTasks} />
          )}

          {activeTab === 'vendors' && (
            <VendorsTab
              event={event}
              blueprint={blueprint}
              categories={categories}
              vendors={vendors}
              onUpdateVendors={handleUpdateVendors}
            />
          )}

          {activeTab === 'ideas' && <IdeasTab event={event} onAddTask={handleAddTask} />}

          {activeTab === 'refine' && (
            <RefineTab
              event={event}
              blueprint={blueprint}
              tasks={tasks}
              onApplyRefinedPlan={handleApplyRefinedPlan}
            />
          )}

          {activeTab === 'export' && (
            <ExportTab
              event={event}
              blueprint={blueprint}
              categories={categories}
              expenses={expenses}
              tasks={tasks}
              vendors={vendors}
            />
          )}
        </div>
      </main>

      {/* Error Feedback Modal */}
      <Modal
        isOpen={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
        title="AI Assistant Message"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setErrorMessage(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
