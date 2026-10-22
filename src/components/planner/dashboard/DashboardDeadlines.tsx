import React from 'react';
import { Clock, ShieldAlert, Sliders, Plus, Sparkles } from 'lucide-react';
import type { TimelineTask, AIBlueprint } from '@/schemas';
import { formatDisplayDate, isOverdue } from '@/lib/dates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PlannerTab } from '../PlannerHeader';

interface DashboardDeadlinesProps {
  upcomingTasks: TimelineTask[];
  totalTasks: number;
  today: string;
  blueprint: AIBlueprint | null;
  onNavigateTab: (tab: PlannerTab) => void;
}

export function DashboardDeadlines({
  upcomingTasks,
  totalTasks,
  today,
  blueprint,
  onNavigateTab,
}: DashboardDeadlinesProps) {
  return (
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
  );
}
