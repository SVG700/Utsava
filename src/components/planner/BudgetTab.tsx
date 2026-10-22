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
  reconcileCategoryEdits,
  slugifyCategory,
} from '@/lib/budget';
import { getTodayString, formatDisplayDate } from '@/lib/dates';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UndoToast } from '@/components/ui/UndoToast';
import { useUndo } from '@/hooks/useUndo';
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

const UNDO_WINDOW_MS = 6000;

/** Budget Manager tab: KPIs, category allocations and the expense ledger. */
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

  // Deletion confirmation and undo
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);
  const undo = useUndo<Expense>(UNDO_WINDOW_MS);

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
    onUpdateExpenses(expenses.filter((e) => e.id !== expenseToDelete.id));
    undo.offer(expenseToDelete);
    setExpenseToDelete(null);
  };

  const handleUndoDelete = () => {
    if (!undo.item) return;
    onUpdateExpenses([...expenses, undo.item]);
    undo.dismiss();
  };

  // Save Category Allocations
  const handleSaveCategories = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCategories.length === 0) return;

    const result = reconcileCategoryEdits(tempCategories, expenses, event.totalBudget);
    onUpdateCategories(result.categories);
    if (result.expensesChanged) onUpdateExpenses(result.expenses);
    setIsEditCatsModalOpen(false);
  };

  // Add Custom Category in modal
  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;
    const p = Number(newCatPercentage) || 5;
    const slugId = `cat-${slugifyCategory(newCatName)}`;
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

  // Removing a category only edits the draft; expenses are reassigned when the draft is saved.
  const handleRemoveCategory = (catId: string) => {
    if (tempCategories.length <= 1) return;
    setCategoryToRemove(catId);
  };

  const handleConfirmRemoveCategory = () => {
    if (!categoryToRemove) return;
    setTempCategories(tempCategories.filter((c) => c.id !== categoryToRemove));
    setCategoryToRemove(null);
  };

  return (
    <div className="space-y-8">
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
          className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-2 shadow-soft"
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
        description="When you save these allocations, expenses assigned to this category move to an 'Uncategorised' category so your records remain intact."
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

      {undo.item && (
        <UndoToast onUndo={handleUndoDelete}>
          Expense &ldquo;{undo.item.description}&rdquo; ({formatINR(undo.item.amount)}) deleted
        </UndoToast>
      )}
    </div>
  );
}
