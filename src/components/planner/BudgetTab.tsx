'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle } from 'lucide-react';
import type { StoredEvent, BudgetCategory, Expense } from '@/schemas';
import {
  formatINR,
  totalActualSpend,
  remainingBudget,
  utilisationPercent,
  overspentCategories,
  isOverBudget,
  spendByCategory,
  normalisePercentages,
  percentagesToAmounts,
} from '@/lib/budget';
import { getTodayString, formatDisplayDate } from '@/lib/dates';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BudgetKpis } from './budget/BudgetKpis';
import { CategoryBreakdown } from './budget/CategoryBreakdown';
import { ExpensesLedger } from './budget/ExpensesLedger';
import { ExpenseModal, type ExpenseFormData } from './budget/ExpenseModal';
import { CategoryDistributionModal } from './budget/CategoryDistributionModal';

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

  // Filters & State
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditCatsModalOpen, setIsEditCatsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Undo and deletion confirmation state
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [undoExpense, setUndoExpense] = useState<Expense | null>(null);
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Forms
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    categoryId: categories[0]?.id || '',
    amount: '',
    date: today,
    description: '',
    notes: '',
  });

  const [tempCategories, setTempCategories] = useState<BudgetCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPercentage, setNewCatPercentage] = useState('');

  // Calculations
  const totalSpend = totalActualSpend(expenses);
  const remaining = remainingBudget(event.totalBudget, expenses);
  const util = utilisationPercent(event.totalBudget, expenses);
  const overspent = overspentCategories(categories, expenses);
  const overBudget = isOverBudget(event.totalBudget, expenses);
  const categorySpends = spendByCategory(expenses);

  // Open Expense Modal
  const handleOpenAddExpense = (catId?: unknown) => {
    const validCatId = typeof catId === 'string' && catId ? catId : categories[0]?.id || '';
    setEditingExpenseId(null);
    setExpenseForm({
      categoryId: validCatId,
      amount: '',
      date: today,
      description: '',
      notes: '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      categoryId: expense.categoryId,
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description,
      notes: expense.notes || '',
    });
    setIsExpenseModalOpen(true);
  };

  // Open Edit Categories Modal
  const handleOpenEditCategories = () => {
    setTempCategories([...categories]);
    setNewCatName('');
    setNewCatPercentage('');
    setIsEditCatsModalOpen(true);
  };

  // Save Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Math.round(Number(expenseForm.amount));
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (editingExpenseId) {
      const updated = expenses.map((exp) =>
        exp.id === editingExpenseId
          ? {
              ...exp,
              categoryId: expenseForm.categoryId,
              amount: amountNum,
              date: expenseForm.date,
              description: expenseForm.description.trim(),
              notes: expenseForm.notes.trim(),
            }
          : exp,
      );
      onUpdateExpenses(updated);
    } else {
      const newExpense: Expense = {
        id: uuidv4(),
        categoryId: expenseForm.categoryId,
        amount: amountNum,
        date: expenseForm.date,
        description: expenseForm.description.trim(),
        notes: expenseForm.notes.trim(),
      };
      onUpdateExpenses([...expenses, newExpense]);
    }

    setIsExpenseModalOpen(false);
  };

  // Delete Expense with confirmation and undo
  const handleRequestDeleteExpense = (exp: Expense) => {
    setExpenseToDelete(exp);
  };

  const handleConfirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    const toDelete = expenseToDelete;
    const remainingExps = expenses.filter((e) => e.id !== toDelete.id);
    onUpdateExpenses(remainingExps);
    setExpenseToDelete(null);

    // Setup undo notification for 6 seconds
    setUndoExpense(toDelete);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoExpense(null);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (!undoExpense) return;
    onUpdateExpenses([...expenses, undoExpense]);
    setUndoExpense(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  // Save Category Allocations
  const handleSaveCategories = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCategories.length === 0) return;

    const rawPercentages = tempCategories.map((c) => c.percentage);
    const normalised = normalisePercentages(rawPercentages);
    const amounts = percentagesToAmounts(normalised, event.totalBudget);

    const updatedWithAmounts: BudgetCategory[] = tempCategories.map((c, i) => ({
      ...c,
      percentage: normalised[i],
      estimatedAmount: amounts[i],
      actualAmount: c.actualAmount ?? 0,
    }));

    onUpdateCategories(updatedWithAmounts);
    setIsEditCatsModalOpen(false);
  };

  // Add Custom Category in modal
  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;
    const p = Number(newCatPercentage) || 5;
    const slugId = `cat-${newCatName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;
    const newCat: BudgetCategory = {
      id: slugId,
      name: newCatName.trim(),
      percentage: p,
      estimatedAmount: Math.round((p / 100) * event.totalBudget),
      actualAmount: 0,
    };
    setTempCategories([...tempCategories, newCat]);
    setNewCatName('');
    setNewCatPercentage('');
  };

  // Category removal with confirmation and reassignment to cat-uncategorised
  const handleRemoveCategory = (catId: string) => {
    if (tempCategories.length <= 1) return;
    setCategoryToRemove(catId);
  };

  const handleConfirmRemoveCategory = () => {
    if (!categoryToRemove) return;
    const id = categoryToRemove;
    setTempCategories(tempCategories.filter((c) => c.id !== id));

    const needsReassignment = expenses.some((e) => e.categoryId === id);
    if (needsReassignment) {
      let finalCats = [...categories.filter((c) => c.id !== id)];
      let uncategorisedCat = finalCats.find((c) => c.id === 'cat-uncategorised');
      if (!uncategorisedCat) {
        uncategorisedCat = {
          id: 'cat-uncategorised',
          name: 'Uncategorised',
          percentage: 0,
          estimatedAmount: 0,
          actualAmount: 0,
        };
        finalCats = [...finalCats, uncategorisedCat];
        onUpdateCategories(finalCats);
      }
      const reassignedExpenses = expenses.map((e) =>
        e.categoryId === id ? { ...e, categoryId: 'cat-uncategorised' } : e,
      );
      onUpdateExpenses(reassignedExpenses);
    }
    setCategoryToRemove(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Financial KPI Dashboard */}
      <BudgetKpis
        totalBudget={event.totalBudget}
        totalSpend={totalSpend}
        remaining={remaining}
        util={util}
        expensesCount={expenses.length}
      />

      {/* Overspend Warning Alerts */}
      {(overBudget || overspent.length > 0) && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-2 shadow-soft animate-in fade-in"
        >
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
      <CategoryBreakdown
        categories={categories}
        categorySpends={categorySpends}
        totalBudget={event.totalBudget}
        onOpenEditCategories={handleOpenEditCategories}
        onOpenAddExpense={handleOpenAddExpense}
      />

      {/* Expense Tracker Ledger */}
      <ExpensesLedger
        expenses={expenses}
        categories={categories}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCatFilter={selectedCatFilter}
        setSelectedCatFilter={setSelectedCatFilter}
        onOpenAddExpense={handleOpenAddExpense}
        onOpenEditExpense={handleOpenEditExpense}
        onRequestDeleteExpense={handleRequestDeleteExpense}
      />

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleSaveExpense}
        editingExpenseId={editingExpenseId}
        categories={categories}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
      />

      {/* Adjust Category Allocations Modal */}
      <CategoryDistributionModal
        isOpen={isEditCatsModalOpen}
        onClose={() => setIsEditCatsModalOpen(false)}
        onSubmit={handleSaveCategories}
        tempCategories={tempCategories}
        setTempCategories={setTempCategories}
        totalBudget={event.totalBudget}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        newCatPercentage={newCatPercentage}
        setNewCatPercentage={setNewCatPercentage}
        onAddCustomCategory={handleAddCustomCategory}
        onRemoveCategory={handleRemoveCategory}
      />

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
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {expenseToDelete.description}
              </p>
              <p className="text-stone-500">
                Amount:{' '}
                <strong className="text-stone-900 dark:text-stone-100">
                  {formatINR(expenseToDelete.amount)}
                </strong>
              </p>
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

      {/* Confirm Category Deletion Modal with Expense Reassignment */}
      <Modal
        isOpen={Boolean(categoryToRemove)}
        onClose={() => setCategoryToRemove(null)}
        title="Remove Budget Category"
        description="Expenses currently assigned to this category will be automatically reassigned to an 'Uncategorised' category so your records remain intact."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={() => setCategoryToRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmRemoveCategory}>
            Confirm Removal
          </Button>
        </div>
      </Modal>

      {/* Floating Undo Notification */}
      {undoExpense && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-4 py-3 rounded-2xl shadow-xl border border-stone-800 dark:border-stone-200 animate-in fade-in slide-in-from-bottom-2"
        >
          <span className="text-xs font-medium">
            Expense &ldquo;{undoExpense.description}&rdquo; ({formatINR(undoExpense.amount)})
            deleted
          </span>
          <button
            onClick={handleUndoDelete}
            className="text-xs font-bold text-emerald-400 dark:text-emerald-700 hover:underline cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
