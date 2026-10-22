import React from 'react';
import { CheckCheck, Clock, Plus, Search } from 'lucide-react';
import type { TaskPriority } from '@/schemas';
import type { TaskFilters, TaskStatusFilter } from '@/lib/timeline';
import { formatDisplayDate } from '@/lib/dates';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface TimelineToolbarProps {
  eventDate: string;
  summary: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionPercent: number;
  };
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onAddTask: () => void;
}

/** Header card with progress, status chips, search and priority filter. */
export function TimelineToolbar({
  eventDate,
  summary,
  filters,
  onFiltersChange,
  onAddTask,
}: TimelineToolbarProps) {
  const statusTabs: Array<{ id: TaskStatusFilter; label: string }> = [
    { id: 'all', label: `All (${summary.total})` },
    { id: 'pending', label: `Pending (${summary.pending})` },
    { id: 'completed', label: `Completed (${summary.completed})` },
    { id: 'overdue', label: `Overdue (${summary.overdue})` },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-950/60 flex items-center justify-center text-forest-700 dark:text-forest-400">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-forest-950 dark:text-forest-100">
                Smart Preparation Timeline
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Milestones automatically synchronized relative to your celebration date (
              {formatDisplayDate(eventDate)}).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sand-50 dark:bg-stone-800/60 border border-sand-200 dark:border-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300">
              <CheckCheck className="w-3.5 h-3.5 text-forest-600" />
              <span>{summary.completionPercent}% complete</span>
            </div>
            <Button size="sm" variant="primary" onClick={onAddTask} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-sand-100 dark:border-stone-800/80">
          <div
            className="flex flex-wrap items-center gap-1.5 text-xs"
            role="group"
            aria-label="Filter tasks by status"
          >
            {statusTabs.map((tab) => {
              const isActive = filters.status === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onFiltersChange({ ...filters, status: tab.id })}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    isActive
                      ? tab.id === 'overdue' && summary.overdue > 0
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-forest-900 text-white shadow-xs dark:bg-forest-600'
                      : 'bg-sand-100/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-sand-200/80 dark:hover:bg-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                aria-label="Search tasks"
                placeholder="Search tasks..."
                value={filters.query}
                onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs w-40 sm:w-48 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <select
              aria-label="Filter tasks by priority"
              value={filters.priority}
              onChange={(e) =>
                onFiltersChange({ ...filters, priority: e.target.value as TaskPriority | 'all' })
              }
              className="px-2.5 py-1.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
