'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import type { BudgetCategory, Expense, TimelineTask, Vendor } from '@/schemas';
import {
  applyRefinement,
  changeEventDate,
  changeTotalBudget,
  type RefinementChanges,
} from '@/lib/planUpdates';
import { usePlannerData } from '@/hooks/usePlannerData';
import { useBlueprintGeneration } from '@/hooks/useBlueprintGeneration';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PlannerHeader, type PlannerTab } from './PlannerHeader';
import { DashboardTab } from './DashboardTab';
import { GenerationProgressModal } from './GenerationProgressModal';

function TabLoadingFallback({ label }: { label: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
      <div className="w-8 h-8 border-2 border-forest-700 dark:border-mint-285 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

// Non-default tabs are code-split and loaded on first visit.
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

/** Event workspace: loads the plan, renders the active tab and routes edits to storage. */
export function MainPlanner({ eventId }: MainPlannerProps) {
  const isNew = useSearchParams().get('new') === 'true';
  const { plan, commit } = usePlannerData(eventId);
  const generation = useBlueprintGeneration(plan, commit);
  const [activeTab, setActiveTab] = useState<PlannerTab>('dashboard');

  const eventName = plan?.event.name;
  useEffect(() => {
    document.title = eventName
      ? `${eventName} — Utsava AI Planner`
      : 'Utsava — AI Celebration Planner';
  }, [eventName]);

  // A freshly created event gets its blueprint generated automatically.
  const shouldAutoGenerate =
    isNew &&
    plan !== null &&
    !plan.blueprint &&
    !generation.isGenerating &&
    !generation.apiKeyMissing;
  const { generate } = generation;
  useEffect(() => {
    if (!shouldAutoGenerate) return;
    const timer = setTimeout(generate, 50);
    return () => clearTimeout(timer);
  }, [shouldAutoGenerate, generate]);

  if (!plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-forest-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-stone-500">Loading your celebration plan...</p>
      </div>
    );
  }

  const { event, blueprint, categories, expenses, tasks, vendors } = plan;

  const updateCategories = (next: BudgetCategory[]) => commit({ categories: next });
  const updateExpenses = (next: Expense[]) => commit({ expenses: next });
  const updateTasks = (next: TimelineTask[]) => commit({ tasks: next });
  const updateVendors = (next: Vendor[]) => commit({ vendors: next });

  const addTaskFromIdea = (task: Omit<TimelineTask, 'id'>) =>
    commit((current) => ({
      tasks: [{ ...task, id: uuidv4(), source: 'user' }, ...current.tasks],
    }));

  const applyRefinedPlan = (
    updatedBlueprint: RefinementChanges['blueprint'],
    updatedCategories: RefinementChanges['categories'],
    _summary: string,
    refinedTotalBudget?: number,
    changedSections?: string[],
  ) =>
    commit((current) =>
      applyRefinement(current, {
        blueprint: updatedBlueprint,
        categories: updatedCategories,
        totalBudget: refinedTotalBudget,
        changedSections,
      }),
    );

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <PlannerHeader
        event={event}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasBlueprint={Boolean(blueprint)}
        isGeneratingBlueprint={generation.isGenerating}
        onGenerateBlueprint={generation.generate}
        onUpdateEventDate={(date) => commit((current) => changeEventDate(current, date))}
        onUpdateTotalBudget={(total) => commit((current) => changeTotalBudget(current, total))}
        apiKeyMissing={generation.apiKeyMissing}
      />

      <GenerationProgressModal isOpen={generation.isGenerating} eventName={event.name} />

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
              onGenerateBlueprint={generation.generate}
              isGeneratingBlueprint={generation.isGenerating}
            />
          )}
          {activeTab === 'budget' && (
            <BudgetTab
              event={event}
              categories={categories}
              expenses={expenses}
              onUpdateCategories={updateCategories}
              onUpdateExpenses={updateExpenses}
            />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab event={event} tasks={tasks} onUpdateTasks={updateTasks} />
          )}
          {activeTab === 'vendors' && (
            <VendorsTab
              event={event}
              blueprint={blueprint}
              categories={categories}
              vendors={vendors}
              onUpdateVendors={updateVendors}
            />
          )}
          {activeTab === 'ideas' && <IdeasTab event={event} onAddTask={addTaskFromIdea} />}
          {activeTab === 'refine' && (
            <RefineTab
              event={event}
              blueprint={blueprint}
              tasks={tasks}
              onApplyRefinedPlan={applyRefinedPlan}
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

      <Modal
        isOpen={Boolean(generation.errorMessage)}
        onClose={generation.clearError}
        title="AI Assistant Message"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {generation.errorMessage}
          </p>
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={generation.clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
