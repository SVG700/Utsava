'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Receipt,
  PieChart,
  Search,
  Wallet,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import type { StoredEvent, BudgetCategory, Expense } from '@/schemas';
import {
  formatINR,
  totalActualSpend,
  spendByCategory,
  remainingBudget,
  utilisationPercent,
  overspentCategories,
  isOverBudget,
  normalisePercentages,
  percentagesToAmounts,
} from '@/lib/budget';
import { formatDisplayDate, getTodayString } from '@/lib/dates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface BudgetTabProps {
  event: StoredEvent;
  categories: BudgetCategory[];
  expenses: Expense[];
  onUpdateCategories: (categories: BudgetCategory[]) => void;
  onUpdateExpenses: (expenses: Expense[]) => void;
}

export function BudgetTab({
  event,
  categories,
  expenses,
  onUpdateCategories,
  onUpdateExpenses,
}: BudgetTabProps) {
  const today = getTodayString();

  // Search & Filter state
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add/Edit Expense Modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [undoExpense, setUndoExpense] = useState<Expense | null>(null);
  const [categoryToRemove, setCategoryToRemove] = useState<{ id: string; name: string } | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('cat-uncategorised');
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    categoryId: categories[0]?.id || '',
    description: '',
    amount: '',
    date: today,
    notes: '',
  });

  // Edit Category Modal state
  const [isEditCatsModalOpen, setIsEditCatsModalOpen] = useState(false);
  const [tempCategories, setTempCategories] = useState<BudgetCategory[]>([]);

  // Add Custom Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatPercentage, setNewCatPercentage] = useState('10');

  // Pure deterministic calculations
  const totalSpend = totalActualSpend(expenses);
  const remaining = remainingBudget(event.totalBudget, expenses);
  const util = utilisationPercent(event.totalBudget, expenses);
  const categorySpends = spendByCategory(expenses);
  const overspent = overspentCategories(categories, expenses);
  const overBudget = isOverBudget(event.totalBudget, expenses);

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = selectedCatFilter === 'all' || e.categoryId === selectedCatFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Open expense modal for create
  const handleOpenAddExpense = (catId?: string) => {
    setEditingExpenseId(null);
    setExpenseForm({
      categoryId: catId || categories[0]?.id || '',
      description: '',
      amount: '',
      date: today,
      notes: '',
    });
    setIsExpenseModalOpen(true);
  };

  // Open expense modal for edit
  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      categoryId: exp.categoryId,
      description: exp.description,
      amount: String(exp.amount),
      date: exp.date,
      notes: exp.notes || '',
    });
    setIsExpenseModalOpen(true);
  };

  // Save Expense (Add or Edit)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expenseForm.amount);
    if (!expenseForm.description.trim() || isNaN(amountNum) || amountNum < 0) return;

    if (editingExpenseId) {
      const updated = expenses.map((exp) =>
        exp.id === editingExpenseId
          ? {
              ...exp,
              categoryId: expenseForm.categoryId,
              description: expenseForm.description.trim(),
              amount: amountNum,
              date: expenseForm.date,
              notes: expenseForm.notes.trim(),
            }
          : exp
      );
      onUpdateExpenses(updated);
    } else {
      const newExp: Expense = {
        id: uuidv4(),
        categoryId: expenseForm.categoryId,
        description: expenseForm.description.trim(),
        amount: amountNum,
        date: expenseForm.date,
        notes: expenseForm.notes.trim(),
      };
      onUpdateExpenses([newExp, ...expenses]);
    }
    setIsExpenseModalOpen(false);
  };

  // Delete Expense with Confirmation and Undo
  const handleRequestDeleteExpense = (exp: Expense) => {
    setExpenseToDelete(exp);
  };

  const handleConfirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    const exp = expenseToDelete;
    onUpdateExpenses(expenses.filter((e) => e.id !== exp.id));
    setExpenseToDelete(null);
    setUndoExpense(exp);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoExpense(null);
    }, 8000);
  };

  const handleUndoDeleteExpense = () => {
    if (!undoExpense) return;
    onUpdateExpenses([undoExpense, ...expenses]);
    setUndoExpense(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  // Open Edit Categories Modal
  const handleOpenEditCategories = () => {
    setTempCategories([...categories]);
    setIsEditCatsModalOpen(true);
  };

  // Save Category Changes with deterministic normalisation
  const handleSaveCategories = (e: React.FormEvent) => {
    e.preventDefault();
    const percentages = tempCategories.map((c) => c.percentage);
    const normalised = normalisePercentages(percentages);
    const amounts = percentagesToAmounts(normalised, event.totalBudget);

    const updated = tempCategories.map((c, i) => ({
      ...c,
      percentage: normalised[i],
      estimatedAmount: amounts[i],
    }));

    onUpdateCategories(updated);
    setIsEditCatsModalOpen(false);
  };

  // Add custom new category
  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;
    const p = Number(newCatPercentage) || 10;
    const newCat: BudgetCategory = {
      id: `custom-cat-${Date.now()}`,
      name: newCatName.trim(),
      percentage: p,
      estimatedAmount: 0,
      actualAmount: 0,
    };
    const combined = [...tempCategories, newCat];
    const normalised = normalisePercentages(combined.map((c) => c.percentage));
    const amounts = percentagesToAmounts(normalised, event.totalBudget);
    const updated = combined.map((c, i) => ({
      ...c,
      percentage: normalised[i],
      estimatedAmount: amounts[i],
    }));
    setTempCategories(updated);
    setNewCatName('');
  };

  // Execute actual removal of a category from tempCategories
  const executeRemoveCategory = (catId: string) => {
    if (tempCategories.length <= 1) return;
    const remainingCats = tempCategories.filter((c) => c.id !== catId);
    const normalised = normalisePercentages(remainingCats.map((c) => c.percentage));
    const amounts = percentagesToAmounts(normalised, event.totalBudget);
    setTempCategories(
      remainingCats.map((c, i) => ({
        ...c,
        percentage: normalised[i],
        estimatedAmount: amounts[i],
      }))
    );
  };

  // Handle remove category request: if expenses exist, prompt reassign/confirm
  const handleRemoveCategory = (catId: string) => {
    if (tempCategories.length <= 1) return;
    const cat = tempCategories.find((c) => c.id === catId);
    const linkedExpenses = expenses.filter((e) => e.categoryId === catId);

    if (linkedExpenses.length > 0 && cat) {
      setCategoryToRemove({ id: cat.id, name: cat.name });
      setReassignTargetCatId('cat-uncategorised');
    } else {
      executeRemoveCategory(catId);
    }
  };

  // Confirm reassigning expenses before category removal
  const handleConfirmReassignAndRemove = () => {
    if (!categoryToRemove) return;

    let targetId = reassignTargetCatId;
    let targetCategories = [...tempCategories];

    // If target is Uncategorised and it doesn't exist yet, add it with 0%
    if (targetId === 'cat-uncategorised') {
      const exists = targetCategories.some((c) => c.id === 'cat-uncategorised');
      if (!exists) {
        targetCategories.push({
          id: 'cat-uncategorised',
          name: 'Uncategorised',
          percentage: 0,
          estimatedAmount: 0,
          actualAmount: 0,
        });
      }
    }

    // Reassign all expenses currently in categoryToRemove.id to targetId
    const updatedExpenses = expenses.map((e) =>
      e.categoryId === categoryToRemove.id ? { ...e, categoryId: targetId } : e
    );
    onUpdateExpenses(updatedExpenses);

    // Remove category from list
    const remainingCats = targetCategories.filter((c) => c.id !== categoryToRemove.id);
    const normalised = normalisePercentages(remainingCats.map((c) => c.percentage));
    const amounts = percentagesToAmounts(normalised, event.totalBudget);
    const finalCats = remainingCats.map((c, i) => ({
      ...c,
      percentage: normalised[i],
      estimatedAmount: amounts[i],
    }));

    setTempCategories(finalCats);
    setCategoryToRemove(null);
  };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Financial KPI Dashboard */}
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
            {formatINR(event.totalBudget)}
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
            <span>{expenses.length} recorded payments</span>
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
              {remaining < 0 ? <AlertTriangle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
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
                util > 100 ? 'text-rose-600' : util >= 85 ? 'text-amber-700' : 'text-forest-900 dark:text-forest-300'
              }`}
            >
              {util}%
            </p>
            <span className="text-xs text-stone-500">of total</span>
          </div>
          <ProgressBar value={util} showPercent={false} />
        </div>
      </div>

      {/* Overspend Warning Alerts */}
      {(overBudget || overspent.length > 0) && (
        <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-2 shadow-soft animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Budget Alert Notice</span>
          </div>
          {overBudget && (
            <p className="leading-relaxed">
              Your celebration spend has exceeded your overall planned budget by{' '}
              <strong className="font-bold underline">{formatINR(Math.abs(remaining))}</strong>.
              Review your vendor contracts or reallocate from unspent categories below.
            </p>
          )}
          {overspent.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {overspent.map((o) => (
                <li key={o.categoryId}>
                  <strong>{o.categoryName}</strong> is over budget by{' '}
                  <span className="font-semibold text-rose-700 dark:text-rose-400">
                    {formatINR(o.overspend)}
                  </span>{' '}
                  (Spent {formatINR(o.actual)} vs Allocated {formatINR(o.estimated)}).
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Category Allocations Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-100 dark:border-stone-800/80">
          <div>
            <CardTitle className="flex items-center gap-2 text-forest-950 dark:text-forest-100">
              <PieChart className="w-5 h-5 text-forest-700 dark:text-forest-400" />
              Category Allocations
            </CardTitle>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Deterministic allocation scaled to {formatINR(event.totalBudget)} (Normalised to 100%)
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditCategories}
              className="text-xs gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Percentages
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddExpense()}
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
                      onClick={() => handleOpenAddExpense(cat.id)}
                      className="text-xs p-1.5 rounded-lg text-stone-400 hover:text-forest-700 hover:bg-forest-50 dark:hover:bg-forest-950/40 transition-colors"
                      title="Add expense to this category"
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

      {/* Expense Tracker Ledger */}
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
            onClick={() => handleOpenAddExpense()}
            className="text-xs gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Record Expense
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search expense description or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-all"
              />
            </div>

            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
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
                  onClick={() => handleOpenAddExpense()}
                  className="mt-4 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add First Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-sand-200 dark:border-stone-800">
              <table className="w-full text-left text-xs">
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
                              onClick={() => handleOpenEditExpense(exp)}
                              className="p-1.5 text-stone-400 hover:text-forest-700 dark:hover:text-forest-400 rounded-lg hover:bg-forest-50 dark:hover:bg-forest-950/40 transition-colors"
                              title="Edit expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRequestDeleteExpense(exp)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete expense"
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

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpenseId ? 'Edit Expense' : 'Add New Expense'}
        description="Track actual spend against your celebration category budgets."
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Category <span className="text-forest-700 dark:text-forest-400">*</span>
            </label>
            <select
              value={expenseForm.categoryId}
              onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Target: {formatINR(c.estimatedAmount)})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Description"
            required
            placeholder="e.g. Mandap advance token, Sangeet sound deposit"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (INR ₹)"
              type="number"
              step="any"
              required
              min={0}
              placeholder="e.g. 50000"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />

            <Input
              label="Transaction Date"
              type="date"
              required
              value={expenseForm.date}
              onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600"
              placeholder="Payment method, cheque number, receipt reference..."
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-sand-200 dark:border-stone-800">
            <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingExpenseId ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Category Allocations Modal */}
      <Modal
        isOpen={isEditCatsModalOpen}
        onClose={() => setIsEditCatsModalOpen(false)}
        title="Adjust Budget Allocation Percentages"
        description="All percentages are automatically normalised to sum to exactly 100% and converted to rupee amounts in deterministic code."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCategories} className="space-y-4">
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {tempCategories.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-sand-200 dark:border-stone-800 bg-sand-50/50 dark:bg-stone-900/50"
              >
                <div className="flex-1">
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 block">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Est. {formatINR(Math.round((c.percentage / 100) * event.totalBudget))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 w-24">
                  <input
                    type="number"
                    step="any"
                    min={0.1}
                    max={100}
                    value={c.percentage}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const copy = [...tempCategories];
                      copy[idx] = { ...copy[idx], percentage: val };
                      setTempCategories(copy);
                    }}
                    className="w-16 px-2 py-1.5 rounded-lg border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-right font-medium"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
                {tempCategories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(c.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom category row */}
          <div className="pt-3 border-t border-sand-200 dark:border-stone-800 space-y-2">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Add Custom Category
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name (e.g. Return Gifts)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100"
              />
              <input
                type="number"
                step="any"
                min={0.1}
                max={50}
                placeholder="%"
                value={newCatPercentage}
                onChange={(e) => setNewCatPercentage(e.target.value)}
                className="w-16 px-2 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-right font-medium"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddCustomCategory}>
                + Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-sand-200 dark:border-stone-800">
            <Button type="button" variant="outline" onClick={() => setIsEditCatsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Normalise & Save Allocations
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Expense Deletion Modal */}
      <Modal
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        title="Confirm Expense Deletion"
        description="Are you sure you want to remove this expense record? You can also undo this action immediately after."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {expenseToDelete && (
            <div className="p-3 rounded-xl bg-sand-50 dark:bg-stone-900 border border-sand-200 dark:border-stone-800 text-xs space-y-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">{expenseToDelete.description}</p>
              <p className="text-stone-500">Amount: <strong className="text-stone-900 dark:text-stone-100">{formatINR(expenseToDelete.amount)}</strong></p>
              <p className="text-stone-500">Date: {formatDisplayDate(expenseToDelete.date)}</p>
            </div>
          )}
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setExpenseToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDeleteExpense}>
              Delete Expense
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Removal & Expense Reassignment Modal */}
      <Modal
        isOpen={Boolean(categoryToRemove)}
        onClose={() => setCategoryToRemove(null)}
        title={`Reassign Expenses from "${categoryToRemove?.name}"`}
        description="This category contains recorded expenses. Choose where to reassign them before removing the category, or move them to 'Uncategorised'."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Reassign Expenses To
            </label>
            <select
              value={reassignTargetCatId}
              onChange={(e) => setReassignTargetCatId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            >
              <option value="cat-uncategorised">Uncategorised (Default safe bucket)</option>
              {tempCategories
                .filter((c) => c.id !== categoryToRemove?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-sand-200 dark:border-stone-800">
            <Button variant="outline" size="sm" onClick={() => setCategoryToRemove(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmReassignAndRemove}>
              Reassign & Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Undo Notification for Deleted Expense */}
      {undoExpense && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-4 py-3 rounded-2xl shadow-xl border border-stone-800 dark:border-stone-200 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-medium">
            Expense "{undoExpense.description}" deleted
          </span>
          <button
            onClick={handleUndoDeleteExpense}
            className="text-xs font-bold text-emerald-400 dark:text-emerald-700 hover:underline cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
