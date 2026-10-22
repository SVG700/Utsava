'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type {
  StoredEvent,
  BudgetCategory,
  Expense,
  TimelineTask,
  Vendor,
  AIBlueprint,
} from '@/schemas';
import {
  formatINR,
  totalActualSpend,
  remainingBudget,
  utilisationPercent,
  overspentCategories,
  isOverBudget,
} from '@/lib/budget';
import { isOverdue, getTodayString } from '@/lib/dates';
import { Button } from '@/components/ui/Button';
import type { PlannerTab } from './header/PlannerTabs';
import { DashboardMetrics } from './dashboard/DashboardMetrics';
import { DashboardBlueprintView } from './dashboard/DashboardBlueprintView';
import { DashboardDeadlines } from './dashboard/DashboardDeadlines';

interface DashboardTabProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  categories: BudgetCategory[];
  expenses: Expense[];
  tasks: TimelineTask[];
  vendors: Vendor[];
  onNavigateTab: (tab: PlannerTab) => void;
  onGenerateBlueprint: () => void;
  isGeneratingBlueprint: boolean;
}

export function DashboardTab({
  event,
  blueprint,
  categories,
  expenses,
  tasks,
  vendors,
  onNavigateTab,
  onGenerateBlueprint,
  isGeneratingBlueprint,
}: DashboardTabProps) {
  const today = getTodayString();

  // Budget calculations (Pure deterministic code)
  const spent = totalActualSpend(expenses);
  const remaining = remainingBudget(event.totalBudget, expenses);
  const utilPercent = utilisationPercent(event.totalBudget, expenses);
  const overspentCats = overspentCategories(categories, expenses);
  const hasOverallOverspend = isOverBudget(event.totalBudget, expenses);

  // Task metrics
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter((t) => !t.completed && isOverdue(t.dueDate, today));
  const upcomingTasks = [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  // Vendor metrics
  const bookedVendors = vendors.filter((v) => v.status === 'booked').length;
  const shortlistedVendors = vendors.filter((v) => v.status === 'shortlisted').length;
  const notStartedVendors = vendors.filter((v) => v.status === 'not-started').length;
  const totalVendors = vendors.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Overspend Warning Banner */}
      {(hasOverallOverspend || overspentCats.length > 0) && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-sm flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200">
              Budget Overspend Warning
            </h4>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
              {hasOverallOverspend
                ? `Total expenses exceed your budget by ${formatINR(Math.abs(remaining))}.`
                : `${overspentCats.length} category (${overspentCats.map((c) => c.categoryName).join(', ')}) exceeded estimated allocation.`}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab('budget')}
            className="text-xs text-rose-800 border-rose-300 hover:bg-rose-100 dark:text-rose-200 shrink-0"
          >
            Review Budget
          </Button>
        </div>
      )}

      {/* Top 3 Metric Cards */}
      <DashboardMetrics
        spent={spent}
        totalBudget={event.totalBudget}
        utilPercent={utilPercent}
        remaining={remaining}
        hasOverallOverspend={hasOverallOverspend}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        taskProgress={taskProgress}
        overdueTasksCount={overdueTasks.length}
        bookedVendors={bookedVendors}
        shortlistedVendors={shortlistedVendors}
        notStartedVendors={notStartedVendors}
        totalVendors={totalVendors}
        onNavigateTab={onNavigateTab}
      />

      {/* Main Grid: Left 2-Cols + Right 1-Col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardBlueprintView
            event={event}
            blueprint={blueprint}
            onGenerateBlueprint={onGenerateBlueprint}
            isGeneratingBlueprint={isGeneratingBlueprint}
          />
        </div>

        <div>
          <DashboardDeadlines
            upcomingTasks={upcomingTasks}
            totalTasks={totalTasks}
            today={today}
            blueprint={blueprint}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>
    </div>
  );
}
