import React from 'react';
import { PieChart, SlidersHorizontal, Plus } from 'lucide-react';
import type { BudgetCategory } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface CategoryBreakdownProps {
  categories: BudgetCategory[];
  categorySpends: Record<string, number>;
  totalBudget: number;
  onOpenEditCategories: () => void;
  onOpenAddExpense: (categoryId?: string) => void;
}

export function CategoryBreakdown({
  categories,
  categorySpends,
  totalBudget,
  onOpenEditCategories,
  onOpenAddExpense,
}: CategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-100 dark:border-stone-800/80">
        <div>
          <CardTitle className="flex items-center gap-2 text-forest-950 dark:text-forest-100">
            <PieChart className="w-5 h-5 text-forest-700 dark:text-forest-400" />
            Category Allocations
          </CardTitle>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Deterministic allocation scaled to {formatINR(totalBudget)} (Normalised to 100%)
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenEditCategories}
            className="text-xs gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Percentages
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenAddExpense()}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const actual = categorySpends[cat.id] ?? 0;
            const catRemaining = cat.estimatedAmount - actual;
            const catUtil =
              cat.estimatedAmount > 0
                ? Math.round((actual / cat.estimatedAmount) * 100)
                : 0;
            const isCatOver = actual > cat.estimatedAmount;

            return (
              <div
                key={cat.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCatOver
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-sand-200 dark:border-stone-800 bg-sand-50/50 dark:bg-stone-900/50 hover:border-forest-400 dark:hover:border-forest-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {cat.name}
                    </h4>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {cat.percentage}% of overall budget
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenAddExpense(cat.id)}
                    aria-label={`Add expense to ${cat.name}`}
                    title={`Add expense to ${cat.name}`}
                    className="text-xs p-1.5 rounded-lg text-stone-400 hover:text-forest-700 hover:bg-forest-50 dark:hover:bg-forest-950/40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-stone-500">Spent:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {formatINR(actual)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-stone-500">Target Allocation:</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {formatINR(cat.estimatedAmount)}
                    </span>
                  </div>

                  <ProgressBar value={catUtil} showPercent={false} />

                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="font-medium text-stone-500">{catUtil}% utilised</span>
                    <span
                      className={`font-semibold ${
                        isCatOver
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {isCatOver
                        ? `Over by ${formatINR(Math.abs(catRemaining))}`
                        : `${formatINR(catRemaining)} left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
