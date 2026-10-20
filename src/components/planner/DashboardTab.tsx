'use client';

import React from 'react';
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  Sparkles,
  Users,
  Palette,
  Leaf,
  ShieldAlert,
  ChevronRight,
  CalendarCheck2,
  Sliders,
  Plus,
} from 'lucide-react';
import type { StoredEvent, BudgetCategory, Expense, TimelineTask, Vendor, AIBlueprint } from '@/schemas';
import {
  formatINR,
  totalActualSpend,
  remainingBudget,
  utilisationPercent,
  overspentCategories,
  isOverBudget,
} from '@/lib/budget';
import { formatDisplayDate, isOverdue, getTodayString } from '@/lib/dates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PlannerTab } from './PlannerHeader';

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
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-sm flex items-start gap-3">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Budget Overview */}
        <Card className="hover:border-[#134e3a]/40 dark:hover:border-[#2dd4bf]/40 transition-all duration-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider">
                Budget Utilisation
              </span>
              <span className="p-2 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399]">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
                  {formatINR(spent)}
                </span>
                <span className="text-xs text-[#606d66] dark:text-[#94a19b] font-medium">
                  of {formatINR(event.totalBudget)}
                </span>
              </div>

              <ProgressBar
                value={utilPercent}
                variant={hasOverallOverspend ? 'danger' : utilPercent >= 85 ? 'warning' : 'primary'}
                className="mt-3"
                showPercent={false}
              />

              <div className="flex justify-between items-center text-xs mt-2.5 text-[#606d66] dark:text-[#94a19b] font-medium">
                <span>{utilPercent}% allocated</span>
                <span className={remaining < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-semibold'}>
                  {remaining >= 0 ? `${formatINR(remaining)} balance` : `${formatINR(Math.abs(remaining))} over`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('budget')}
              className="w-full text-xs font-semibold text-[#134e3a] dark:text-[#2dd4bf] hover:underline flex items-center justify-between pt-3 border-t border-[#f0ece2] dark:border-[#243029] cursor-pointer"
            >
              <span>Manage Expenses & Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardContent>
        </Card>

        {/* Metric 2: Timeline Progress */}
        <Card className="hover:border-[#134e3a]/40 dark:hover:border-[#2dd4bf]/40 transition-all duration-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider">
                Milestones & Timeline
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                <CalendarCheck2 className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
                  {completedTasks} <span className="text-base font-normal text-[#88968e]">/ {totalTasks}</span>
                </span>
                {overdueTasks.length > 0 && (
                  <Badge variant="danger" className="text-[10px]">
                    {overdueTasks.length} Overdue
                  </Badge>
                )}
              </div>

              <ProgressBar
                value={taskProgress}
                variant="success"
                className="mt-3"
                showPercent={false}
              />

              <div className="flex justify-between items-center text-xs mt-2.5 text-[#606d66] dark:text-[#94a19b] font-medium">
                <span>{taskProgress}% completed</span>
                <span>{totalTasks - completedTasks} tasks remaining</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="w-full text-xs font-semibold text-[#134e3a] dark:text-[#2dd4bf] hover:underline flex items-center justify-between pt-3 border-t border-[#f0ece2] dark:border-[#243029] cursor-pointer"
            >
              <span>View Milestone Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardContent>
        </Card>

        {/* Metric 3: Vendor Booking */}
        <Card className="hover:border-[#134e3a]/40 dark:hover:border-[#2dd4bf]/40 transition-all duration-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider">
                Vendor Readiness
              </span>
              <span className="p-2 rounded-xl bg-[#fbf4ea] dark:bg-[#281f13] text-[#ab7532] dark:text-[#f3c27a]">
                <Users className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
                  {bookedVendors} <span className="text-base font-normal text-[#88968e]">/ {totalVendors}</span>
                </span>
                <span className="text-xs text-[#606d66] dark:text-[#94a19b] font-medium">
                  Categories
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-0.5 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block">{bookedVendors}</span>
                  <span className="text-[10px] text-[#606d66] dark:text-[#94a19b]">Booked</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block">{shortlistedVendors}</span>
                  <span className="text-[10px] text-[#606d66] dark:text-[#94a19b]">Shortlisted</span>
                </div>
                <div className="p-2 rounded-xl bg-[#f0ece3] dark:bg-[#222d27] border border-[#e2ddd1] dark:border-[#2f3f36]">
                  <span className="text-xs font-bold text-[#2d3832] dark:text-[#d3ded8] block">{notStartedVendors}</span>
                  <span className="text-[10px] text-[#88968e]">Pending</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('vendors')}
              className="w-full text-xs font-semibold text-[#134e3a] dark:text-[#2dd4bf] hover:underline flex items-center justify-between pt-3 border-t border-[#f0ece2] dark:border-[#243029] cursor-pointer"
            >
              <span>Manage Vendor Quotes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Left 2-Cols + Right 1-Col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Blueprint & Styling */}
        <div className="lg:col-span-2 space-y-6">
          {blueprint ? (
            <>
              {/* Concept & Decor Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Theme & Styling Blueprint</CardTitle>
                      <CardDescription>Visual concept & aesthetic guidelines</CardDescription>
                    </div>
                  </div>
                  <Badge variant="forest">AI Recommended</Badge>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <h4 className="font-bold text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                      {blueprint.themeAndDecor.mainTheme}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] mt-1 leading-relaxed">
                      {blueprint.themeAndDecor.description}
                    </p>
                  </div>

                  {/* Color Palette */}
                  <div>
                    <span className="text-[11px] font-bold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider block mb-2">
                      Color Palette
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {blueprint.themeAndDecor.colorPalette.map((color, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-medium border bg-[#faf8f5] dark:bg-[#1f2924] border-[#e6e0d4] dark:border-[#2b3a32] text-[#2d3832] dark:text-[#d3ded8] capitalize shadow-2xs"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Decor Ideas */}
                  <div>
                    <span className="text-[11px] font-bold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider block mb-2">
                      Decor & Atmospheric Elements
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {blueprint.themeAndDecor.decorIdeas.map((idea, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-xl bg-[#faf8f5] dark:bg-[#1f2924] border border-[#e8e2d7] dark:border-[#2b3a32] flex items-start gap-2 text-[#2d3832] dark:text-[#d3ded8]"
                        >
                          <span className="text-[#134e3a] dark:text-[#2dd4bf] font-bold">•</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Scaled Celebration Activities */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Scaled Celebration Activities</CardTitle>
                      <CardDescription>Tailored for {event.guestCount} guests</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {blueprint.activities.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-[#e8e2d7] dark:border-[#283830] bg-[#faf8f5]/60 dark:bg-[#19221d]/60 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#1c2420] dark:text-[#f3f5f4]">
                            {act.name}
                          </h4>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#f0ece3] dark:bg-[#222d27] text-[#606d66] dark:text-[#94a19b] font-medium">
                            {act.estimatedDuration}
                          </span>
                        </div>
                        <p className="text-xs text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                          {act.description}
                        </p>
                        <span className="text-[11px] text-[#134e3a] dark:text-[#34d399] font-medium block">
                          Suitable for: {act.suitableFor}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sustainable & Budget Alternatives */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Eco-Friendly & Accessible Alternatives</CardTitle>
                      <CardDescription>Smart alternatives to high-cost traditional elements</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {blueprint.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 font-bold text-[#1c2420] dark:text-[#f3f5f4]">
                          <span className="text-rose-500 line-through font-normal">{alt.original}</span>
                          <span className="text-[#88968e]">→</span>
                          <span className="text-emerald-800 dark:text-emerald-400 font-semibold">Smart Alternatives:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36]">
                            <span className="text-[10px] font-bold text-[#ab7532] dark:text-[#eab368] block uppercase">
                              Budget-Friendly
                            </span>
                            <span className="text-[#2d3832] dark:text-[#d3ded8] mt-0.5 block leading-relaxed">
                              {alt.budgetFriendly}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36]">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                              Sustainable
                            </span>
                            <span className="text-[#2d3832] dark:text-[#d3ded8] mt-0.5 block leading-relaxed">
                              {alt.sustainable}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36]">
                            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 block uppercase">
                              Accessible
                            </span>
                            <span className="text-[#2d3832] dark:text-[#d3ded8] mt-0.5 block leading-relaxed">
                              {alt.accessible}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Blueprint Not Yet Generated State */
            <Card className="text-center p-8 sm:p-12 border-dashed border-[#dcd6c8] dark:border-[#2f3f36]">
              <div className="w-12 h-12 rounded-2xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                Generate Your AI Celebration Blueprint
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] max-w-md mx-auto mt-1 mb-6 leading-relaxed">
                Let Gemini design personalized themes, Indian ritual timeline tasks, budget percentages, and vendor requirements tailored for {event.city}.
              </p>
              <Button
                variant="primary"
                onClick={onGenerateBlueprint}
                isLoading={isGeneratingBlueprint}
                className="gap-2 shadow-soft"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Blueprint Now</span>
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column (1 Col): Deadlines, Contingencies & Quick Tools */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />
                <CardTitle className="text-sm">Upcoming Deadlines</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('timeline')}
                className="text-xs text-[#134e3a] dark:text-[#2dd4bf] hover:underline cursor-pointer font-medium"
              >
                View all ({totalTasks})
              </button>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-[#88968e] text-center py-4">
                  {totalTasks === 0 ? 'No tasks created yet.' : 'All upcoming tasks completed!'}
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((t) => {
                    const overdue = isOverdue(t.dueDate, today);
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          overdue
                            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                            : 'bg-[#faf8f5] dark:bg-[#1f2924] border-[#e8e2d7] dark:border-[#2b3a32]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#1c2420] dark:text-[#f3f5f4] line-clamp-1">
                            {t.title}
                          </span>
                          <Badge
                            variant={
                              t.priority === 'high'
                                ? 'danger'
                                : t.priority === 'medium'
                                ? 'warning'
                                : 'default'
                            }
                            className="text-[9px]"
                          >
                            {t.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#606d66] dark:text-[#94a19b]">
                          <span>Due: {formatDisplayDate(t.dueDate)}</span>
                          {overdue ? (
                            <span className="text-rose-600 font-bold">Overdue</span>
                          ) : (
                            <span>{t.daysBeforeEvent}d before event</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Risks & Assumptions */}
          {blueprint && blueprint.risksAndAssumptions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#ab7532] dark:text-[#eab368]" />
                  <CardTitle className="text-sm">Assumptions & Risks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs">
                  {blueprint.risksAndAssumptions.map((risk, i) => (
                    <li
                      key={i}
                      className="p-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#1f2924] text-[#2d3832] dark:text-[#d3ded8] border border-[#e8e2d7] dark:border-[#2b3a32] flex items-start gap-2"
                    >
                      <span className="text-[#ab7532] font-bold">!</span>
                      <span className="leading-relaxed">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick Action Shortcuts */}
          <Card className="bg-[#e8f3ee]/40 dark:bg-[#152a22]/30 border-[#cbe4d7] dark:border-[#1d4235]">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-xs font-bold text-[#134e3a] dark:text-[#34d399] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Quick Shortcuts
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('budget')}
                  className="w-full text-xs justify-start"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Expense
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('timeline')}
                  className="w-full text-xs justify-start"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('ideas')}
                  className="w-full text-xs justify-start"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Ideas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('refine')}
                  className="w-full text-xs justify-start"
                >
                  <Sliders className="w-3.5 h-3.5 mr-1" /> Refine
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
