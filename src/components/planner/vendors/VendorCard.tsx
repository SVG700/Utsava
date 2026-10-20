import React from 'react';
import { Phone, Edit2, Trash2, Sparkles } from 'lucide-react';
import type { Vendor, VendorStatus, AIBlueprint, BudgetCategory } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { Card, CardContent } from '@/components/ui/Card';

interface VendorCardProps {
  vendor: Vendor;
  categories: BudgetCategory[];
  blueprint: AIBlueprint | null;
  onStatusChange: (vendorId: string, status: VendorStatus) => void;
  onOpenEdit: (vendor: Vendor) => void;
  onRequestDelete: (vendor: Vendor) => void;
}

export function VendorCard({
  vendor: v,
  categories,
  blueprint,
  onStatusChange,
  onOpenEdit,
  onRequestDelete,
}: VendorCardProps) {
  const matchCat = categories.find((c) =>
    v.budgetCategoryId
      ? c.id === v.budgetCategoryId
      : c.name.toLowerCase() === v.category.toLowerCase()
  );
  const estBudget = matchCat?.estimatedAmount;

  // Find AI tips from blueprint
  const aiCategory = blueprint?.vendorCategories?.find(
    (vc) => vc.category.toLowerCase() === v.category.toLowerCase()
  );

  // Quote vs Target comparison
  let quoteDiffText: string | null = null;
  let isQuoteOver = false;
  if (v.quote !== undefined && estBudget !== undefined) {
    const diff = v.quote - estBudget;
    if (diff > 0) {
      quoteDiffText = `₹${diff.toLocaleString('en-IN')} above target`;
      isQuoteOver = true;
    } else if (diff < 0) {
      quoteDiffText = `₹${Math.abs(diff).toLocaleString('en-IN')} within target`;
    } else {
      quoteDiffText = `Matches target exactly`;
    }
  }

  return (
    <Card className="hover:border-forest-300 dark:hover:border-forest-700 transition-all flex flex-col justify-between shadow-soft">
      <CardContent className="p-5 space-y-3.5">
        {/* Category & Status Row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-forest-400 block">
              Category
            </span>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              {v.category}
            </h3>
            {estBudget !== undefined && (
              <span className="text-[11px] text-stone-500">
                Target Budget: <strong className="font-semibold text-stone-700 dark:text-stone-300">{formatINR(estBudget)}</strong>
              </span>
            )}
          </div>

          <label className="sr-only" htmlFor={`vendor-status-${v.id}`}>
            Status for {v.category} vendor
          </label>
          <select
            id={`vendor-status-${v.id}`}
            value={v.status}
            onChange={(e) =>
              onStatusChange(v.id, e.target.value as VendorStatus)
            }
            aria-label={`Status for ${v.category} vendor`}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-forest-600 ${
              v.status === 'booked'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : v.status === 'shortlisted'
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-sand-100 text-stone-700 border-sand-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
            }`}
          >
            <option value="not-started">Pending</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="booked">Booked</option>
          </select>
        </div>

        {/* User-entered Vendor Data */}
        <div className="p-3.5 rounded-xl bg-sand-50/70 dark:bg-stone-900/60 border border-sand-200/80 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-stone-400">
              Vendor Information
            </span>
            <button
              onClick={() => onOpenEdit(v)}
              aria-label={`Edit vendor: ${v.name || v.category}`}
              title={`Edit vendor: ${v.name || v.category}`}
              className="text-forest-700 dark:text-forest-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
            >
              <Edit2 className="w-3 h-3" /> Edit Info
            </button>
          </div>

          <div>
            <span className="text-stone-500 block text-[11px]">Vendor Name:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {v.name || 'Not yet chosen (click Edit)'}
            </span>
          </div>

          {v.contact && (
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <Phone className="w-3 h-3 text-stone-400" />
              <span>{v.contact}</span>
            </div>
          )}

          {v.quote !== undefined ? (
            <div className="pt-1 flex items-baseline justify-between">
              <div>
                <span className="text-stone-500 block text-[11px]">Quote:</span>
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  {formatINR(v.quote)}
                </span>
              </div>
              {quoteDiffText && (
                <span
                  className={`text-[11px] font-semibold ${
                    isQuoteOver
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {quoteDiffText}
                </span>
              )}
            </div>
          ) : null}

          {v.notes && (
            <p className="text-[11px] text-stone-500 italic pt-1.5 border-t border-sand-200/60 dark:border-stone-800">
              &ldquo;{v.notes}&rdquo;
            </p>
          )}
        </div>

        {/* AI Interview Tips / Questions */}
        {aiCategory && aiCategory.tips && aiCategory.tips.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] font-bold text-forest-800 dark:text-forest-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-forest-600" /> AI Interview Tips:
            </span>
            <ul className="text-[11px] text-stone-600 dark:text-stone-400 space-y-1 list-disc pl-4">
              {aiCategory.tips.slice(0, 2).map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <div className="p-3 bg-sand-50/50 dark:bg-stone-900/50 border-t border-sand-100 dark:border-stone-800 flex justify-end gap-2">
        <button
          onClick={() => onRequestDelete(v)}
          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title={`Remove ${v.category} category`}
          aria-label={`Delete vendor category: ${v.category}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
