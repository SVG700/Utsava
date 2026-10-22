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
    <Card className="p-6 border border-[#e6e0d4] dark:border-[#2f3f36] shadow-card bg-white dark:bg-[#18201c] rounded-3xl sticky top-24 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#f0ece2] dark:border-[#243029]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#134e3a] dark:text-[#34d399] flex items-center gap-1.5">
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
        <h3 className="font-extrabold text-base text-[#1c2420] dark:text-[#f3f5f4] line-clamp-1">
          {formData.name || 'Untitled Celebration'}
        </h3>
        <p className="text-xs text-[#606d66] dark:text-[#94a19b] mt-0.5">
          {formData.city || 'City not set'} •{' '}
          {formData.date ? formatDisplayDate(formData.date) : 'Date not set'}
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-[#1f2924] border border-[#e8e2d7] dark:border-[#2b3a32] space-y-2 text-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-[#606d66] dark:text-[#94a19b]">Planned Budget:</span>
          <span className="font-bold text-sm text-[#134e3a] dark:text-[#34d399]">
            {formData.totalBudget ? formatINR(formData.totalBudget) : '—'}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[#606d66] dark:text-[#94a19b]">Expected Guests:</span>
          <span className="font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
            {formData.guestCount ? `${formData.guestCount} guests` : '—'}
          </span>
        </div>
      </div>

      {formData.subEvents && formData.subEvents.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#55635c] dark:text-[#94a19b] uppercase tracking-wider block">
            Included Ceremonies ({formData.subEvents.length}):
          </span>
          <div className="flex flex-wrap gap-1">
            {formData.subEvents.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[#e8f3ee] text-[#134e3a] dark:bg-[#152a22] dark:text-[#34d399] font-medium capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Note */}
      <p className="text-[11px] text-[#55635c] dark:text-[#94a19b] pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
        🔒 Processed securely via Google Gemini. Saved locally on your device.
      </p>
    </Card>
  );
}
