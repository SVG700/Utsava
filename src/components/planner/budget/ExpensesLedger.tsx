import React from 'react';
import { Receipt, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import type { Expense, BudgetCategory } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { formatDisplayDate } from '@/lib/dates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ExpensesLedgerProps {
  expenses: Expense[];
  categories: BudgetCategory[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCatFilter: string;
  setSelectedCatFilter: (f: string) => void;
  onOpenAddExpense: () => void;
  onOpenEditExpense: (exp: Expense) => void;
  onRequestDeleteExpense: (exp: Expense) => void;
}

export function ExpensesLedger({
  expenses,
  categories,
  searchQuery,
  setSearchQuery,
  selectedCatFilter,
  setSelectedCatFilter,
  onOpenAddExpense,
  onOpenEditExpense,
  onRequestDeleteExpense,
}: ExpensesLedgerProps) {
  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    if (selectedCatFilter !== 'all' && e.categoryId !== selectedCatFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      if (!matchDesc && !matchNotes) return false;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-100 dark:border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-50 dark:bg-forest-950/60 flex items-center justify-center text-forest-700 dark:text-forest-400 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base text-forest-950 dark:text-forest-100">
              Expense Tracker Ledger
            </CardTitle>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Detailed transaction records for venue advance, catering token, decor, and photography.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenAddExpense()}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Record Expense
        </Button>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Search expense description or notes"
              placeholder="Search expense description or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-all"
            />
          </div>

          <label className="sr-only" htmlFor="category-filter-select">
            Filter by category
          </label>
          <select
            id="category-filter-select"
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            aria-label="Filter expenses by category"
            className="px-3 py-2.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table / List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-sand-200 dark:border-stone-800 rounded-2xl bg-sand-50/30 dark:bg-stone-900/30">
            <Receipt className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {expenses.length === 0
                ? 'No expenses recorded yet.'
                : 'No expenses match the current filter.'}
            </p>
            <p className="text-[11px] text-stone-400 mt-1 max-w-sm mx-auto">
              Record your palace booking token, caterer advance, or photographer payments.
            </p>
            {expenses.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenAddExpense()}
                className="mt-4 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add First Expense
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-sand-200 dark:border-stone-800">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="bg-sand-50/80 dark:bg-stone-800/50 border-b border-sand-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
                {filteredExpenses.map((exp) => {
                  const cat = categories.find((c) => c.id === exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-sand-50/60 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                        {formatDisplayDate(exp.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                          {exp.description}
                        </span>
                        {exp.notes && (
                          <span className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                            {exp.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-sand-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium">
                          {cat?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditExpense(exp)}
                            aria-label={`Edit expense: ${exp.description}`}
                            title={`Edit expense: ${exp.description}`}
                            className="p-1.5 text-stone-400 hover:text-forest-700 dark:hover:text-forest-400 rounded-lg hover:bg-forest-50 dark:hover:bg-forest-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRequestDeleteExpense(exp)}
                            aria-label={`Delete expense: ${exp.description}`}
                            title={`Delete expense: ${exp.description}`}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
