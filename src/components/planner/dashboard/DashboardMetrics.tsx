import React from 'react';
import { IndianRupee, CalendarCheck2, Users, ChevronRight } from 'lucide-react';
import { formatINR } from '@/lib/budget';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { PlannerTab } from '../PlannerHeader';

interface DashboardMetricsProps {
  spent: number;
  totalBudget: number;
  utilPercent: number;
  remaining: number;
  hasOverallOverspend: boolean;
  completedTasks: number;
  totalTasks: number;
  taskProgress: number;
  overdueTasksCount: number;
  bookedVendors: number;
  shortlistedVendors: number;
  notStartedVendors: number;
  totalVendors: number;
  onNavigateTab: (tab: PlannerTab) => void;
}

export function DashboardMetrics({
  spent,
  totalBudget,
  utilPercent,
  remaining,
  hasOverallOverspend,
  completedTasks,
  totalTasks,
  taskProgress,
  overdueTasksCount,
  bookedVendors,
  shortlistedVendors,
  notStartedVendors,
  totalVendors,
  onNavigateTab,
}: DashboardMetricsProps) {
  return (
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
                of {formatINR(totalBudget)}
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
              {overdueTasksCount > 0 && (
                <Badge variant="danger" className="text-[10px]">
                  {overdueTasksCount} Overdue
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
  );
}
