import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/budget';
import { formatDisplayDate } from '@/lib/dates';
import type { EventInput } from '@/schemas';

interface WizardLivePreviewProps {
  formData: Partial<EventInput>;
}

export function WizardLivePreview({ formData }: WizardLivePreviewProps) {
  return (
    <Card className="p-6 border border-linen-135 dark:border-moss-790 shadow-card bg-white dark:bg-moss-885 rounded-3xl sticky top-24 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-linen-85 dark:border-moss-835">
        <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700 dark:text-mint-295 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Plan Preview
        </span>
        <Badge
          variant={
            formData.eventType === 'wedding'
              ? 'festive'
              : formData.eventType === 'birthday'
                ? 'warning'
                : 'forest'
          }
        >
          {formData.eventType || 'Event'}
        </Badge>
      </div>

      <div>
        <h3 className="font-extrabold text-base text-moss-875 dark:text-moss-45 line-clamp-1">
          {formData.name || 'Untitled Celebration'}
        </h3>
        <p className="text-xs text-moss-620 dark:text-moss-415 mt-0.5">
          {formData.city || 'City not set'} •{' '}
          {formData.date ? formatDisplayDate(formData.date) : 'Date not set'}
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-sand-50 dark:bg-moss-865 border border-sand-200 dark:border-moss-810 space-y-2 text-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-moss-620 dark:text-moss-415">Planned Budget:</span>
          <span className="font-bold text-sm text-forest-700 dark:text-mint-295">
            {formData.totalBudget ? formatINR(formData.totalBudget) : '—'}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-moss-620 dark:text-moss-415">Expected Guests:</span>
          <span className="font-semibold text-moss-875 dark:text-moss-45">
            {formData.guestCount ? `${formData.guestCount} guests` : '—'}
          </span>
        </div>
      </div>

      {formData.subEvents && formData.subEvents.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-moss-660 dark:text-moss-415 uppercase tracking-wider block">
            Included Ceremonies ({formData.subEvents.length}):
          </span>
          <div className="flex flex-wrap gap-1">
            {formData.subEvents.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-md bg-forest-50 text-forest-700 dark:bg-moss-860 dark:text-mint-295 font-medium capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Note */}
      <p className="text-[11px] text-moss-660 dark:text-moss-415 pt-2 border-t border-linen-85 dark:border-moss-835">
        🔒 Processed securely via Google Gemini. Saved locally on your device.
      </p>
    </Card>
  );
}
