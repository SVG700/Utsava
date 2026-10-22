import React from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { formatINR } from '@/lib/budget';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface BudgetKpisProps {
  totalBudget: number;
  totalSpend: number;
  remaining: number;
  util: number;
  expensesCount: number;
}

export function BudgetKpis({
  totalBudget,
  totalSpend,
  remaining,
  util,
  expensesCount,
}: BudgetKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Budget Card */}
      <div className="rounded-2xl border border-sand-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-5 shadow-soft transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Total Budget
          </span>
          <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-950/60 flex items-center justify-center text-forest-700 dark:text-forest-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {formatINR(totalBudget)}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
          <span>Target celebration limit</span>
        </div>
      </div>

      {/* Actual Spend Card */}
      <div className="rounded-2xl border border-sand-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-5 shadow-soft transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Actual Spent
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-400">
          {formatINR(totalSpend)}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
          <span>{expensesCount} recorded payments</span>
        </div>
      </div>

      {/* Remaining Balance Card */}
      <div className="rounded-2xl border border-sand-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-5 shadow-soft transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Remaining Balance
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              remaining < 0
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {remaining < 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
          </div>
        </div>
        <p
          className={`text-2xl font-bold tracking-tight ${
            remaining < 0
              ? 'text-rose-700 dark:text-rose-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {remaining < 0 ? `-${formatINR(Math.abs(remaining))}` : formatINR(remaining)}
        </p>
        <div className="mt-2 text-xs text-stone-500">
          <span>{remaining < 0 ? 'Over target allocation' : 'Available uncommitted funds'}</span>
        </div>
      </div>

      {/* Budget Utilised Card */}
      <div className="rounded-2xl border border-sand-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-5 shadow-soft transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Budget Utilised
          </span>
          <div className="w-8 h-8 rounded-xl bg-sand-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <p
            className={`text-2xl font-bold tracking-tight ${
              util > 100
                ? 'text-rose-600'
                : util >= 85
                  ? 'text-amber-700'
                  : 'text-forest-900 dark:text-forest-300'
            }`}
          >
            {util}%
          </p>
          <span className="text-xs text-stone-500">of total</span>
        </div>
        <ProgressBar value={util} showPercent={false} />
      </div>
    </div>
  );
}
