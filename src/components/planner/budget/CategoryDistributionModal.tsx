import React from 'react';
import { Trash2 } from 'lucide-react';
import type { BudgetCategory } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface CategoryDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  tempCategories: BudgetCategory[];
  setTempCategories: React.Dispatch<React.SetStateAction<BudgetCategory[]>>;
  totalBudget: number;
  newCatName: string;
  setNewCatName: (n: string) => void;
  newCatPercentage: string;
  setNewCatPercentage: (p: string) => void;
  onAddCustomCategory: () => void;
  onRemoveCategory: (id: string) => void;
}

export function CategoryDistributionModal({
  isOpen,
  onClose,
  onSubmit,
  tempCategories,
  setTempCategories,
  totalBudget,
  newCatName,
  setNewCatName,
  newCatPercentage,
  setNewCatPercentage,
  onAddCustomCategory,
  onRemoveCategory,
}: CategoryDistributionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Budget Allocation Percentages"
      description="All percentages are automatically normalised to sum to exactly 100% and converted to rupee amounts in deterministic code."
      maxWidth="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
                  Est. {formatINR(Math.round((c.percentage / 100) * totalBudget))}
                </span>
              </div>
              <div className="flex items-center gap-1.5 w-24">
                <input
                  type="number"
                  aria-label={`Percentage for ${c.name}`}
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
                  onClick={() => onRemoveCategory(c.id)}
                  aria-label={`Remove category: ${c.name}`}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title={`Remove ${c.name} category`}
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
              aria-label="New category name"
              placeholder="Category name (e.g. Return Gifts)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100"
            />
            <input
              type="number"
              aria-label="New category percentage"
              step="any"
              min={0.1}
              max={50}
              placeholder="%"
              value={newCatPercentage}
              onChange={(e) => setNewCatPercentage(e.target.value)}
              className="w-16 px-2 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-right font-medium"
            />
            <Button type="button" size="sm" variant="secondary" onClick={onAddCustomCategory}>
              + Add
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-sand-200 dark:border-stone-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Normalise & Save Allocations
          </Button>
        </div>
      </form>
    </Modal>
  );
}
