'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

const MIN_TOTAL_BUDGET = 1000;

function DialogActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2.5 pt-2">
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" size="sm">
        {submitLabel}
      </Button>
    </div>
  );
}

/** Returns an error message for an invalid or past event date, otherwise null. */
export function validateEventDate(date: string, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Please enter a valid date in YYYY-MM-DD format.';
  if (date < today) return 'Celebration date cannot be in the past.';
  return null;
}

interface EditDateDialogProps {
  isOpen: boolean;
  currentDate: string;
  today: string;
  onClose: () => void;
  onSave: (date: string) => void;
}

/** Changes the event date; milestones keep their offsets. Re-mount (key) per open. */
export function EditDateDialog({
  isOpen,
  currentDate,
  today,
  onClose,
  onSave,
}: EditDateDialogProps) {
  const [date, setDate] = useState(currentDate);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateEventDate(date, today);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(date);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Celebration Date"
      description="Updating the date automatically offsets and recalculates all preparation milestone due dates."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="new-event-date"
          label="New Celebration Date"
          type="date"
          required
          value={date}
          min={today}
          onChange={(e) => {
            setDate(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          helperText={`Earliest selectable date is today (${today})`}
        />
        <div className="p-3 rounded-xl bg-forest-50 dark:bg-moss-860 border border-moss-145 dark:border-moss-795 text-xs text-forest-700 dark:text-mint-295">
          All preparation timeline deadlines will be shifted based on their relative days before the
          event.
        </div>
        <DialogActions onCancel={onClose} submitLabel="Save & Recalculate" />
      </form>
    </Modal>
  );
}

interface EditBudgetDialogProps {
  isOpen: boolean;
  currentBudget: number;
  onClose: () => void;
  onSave: (totalBudget: number) => void;
}

/** Changes the total budget; category percentages are kept. Re-mount (key) per open. */
export function EditBudgetDialog({
  isOpen,
  currentBudget,
  onClose,
  onSave,
}: EditBudgetDialogProps) {
  const [value, setValue] = useState(String(currentBudget));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < MIN_TOTAL_BUDGET) {
      setError('Total budget must be at least ₹1,000.');
      return;
    }
    onSave(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Total Event Budget"
      description="Recalculates all category allocations in code using current percentage distributions."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="new-total-budget"
          label="Total Budget (INR ₹)"
          type="number"
          required
          min={MIN_TOTAL_BUDGET}
          step="any"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          helperText="Minimum allowed celebration budget is ₹1,000"
        />
        <DialogActions onCancel={onClose} submitLabel="Update Budget & Recalculate" />
      </form>
    </Modal>
  );
}

interface RegenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirms regeneration and explains which user data is preserved. */
export function RegenerateDialog({ isOpen, onClose, onConfirm }: RegenerateDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Regenerate Celebration Plan?"
      description="Refresh AI recommendations while preserving your completed tasks, vendor details, and expense records."
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            What will be preserved:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All completed tasks and user-added custom tasks</li>
            <li>Vendor names, contact numbers, quotes, and booking statuses</li>
            <li>All recorded expenses (re-mapped to matching categories)</li>
          </ul>
        </div>
        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onConfirm}>
            Yes, Regenerate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
