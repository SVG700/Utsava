import React from 'react';
import type { BudgetCategory } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface ExpenseFormData {
  categoryId: string;
  amount: string;
  date: string;
  description: string;
  notes: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingExpenseId: string | null;
  categories: BudgetCategory[];
  expenseForm: ExpenseFormData;
  setExpenseForm: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  editingExpenseId,
  categories,
  expenseForm,
  setExpenseForm,
}: ExpenseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpenseId ? 'Edit Expense' : 'Add New Expense'}
      description="Track actual spend against your celebration category budgets."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="expense-category-select" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Category <span className="text-forest-700 dark:text-forest-400">*</span>
          </label>
          <select
            id="expense-category-select"
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
          id="description"
          label="Description"
          required
          placeholder="e.g. Mandap advance token, Sangeet sound deposit"
          value={expenseForm.description}
          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="amount-(inr-₹)"
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
            id="expense-date-input"
            label="Transaction Date"
            type="date"
            required
            value={expenseForm.date}
            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="expense-notes-input" className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            Notes (Optional)
          </label>
          <textarea
            id="expense-notes-input"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600"
            placeholder="Payment method, cheque number, receipt reference..."
            value={expenseForm.notes}
            onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-sand-200 dark:border-stone-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editingExpenseId ? 'Update Expense' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
