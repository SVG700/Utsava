import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatINR } from '@/lib/budget';
import { formatDisplayDate } from '@/lib/dates';
import { DIETARY_OPTIONS, type EventInput } from '@/schemas';

interface WizardStep3ReviewProps {
  formData: Partial<EventInput>;
  toggleDietary: (item: (typeof DIETARY_OPTIONS)[number]) => void;
}

export function WizardStep3Review({ formData, toggleDietary }: WizardStep3ReviewProps) {
  return (
    <Card className="p-6 sm:p-8 space-y-6">
      {/* Dietary Preferences Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1c2420] dark:text-[#f3f5f4]">
          Dietary Preferences
        </h3>
        <p className="text-xs text-[#606d66] dark:text-[#94a19b]">
          Select culinary customs to calibrate your feast and catering percentages.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIETARY_OPTIONS.map((item) => {
            const isChecked = (formData.dietaryPreferences || []).includes(item);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={isChecked}
                onClick={() => toggleDietary(item)}
                className={`p-2.5 rounded-xl border text-xs font-semibold capitalize flex items-center justify-between transition-all cursor-pointer ${
                  isChecked
                    ? 'border-[#134e3a] dark:border-[#2dd4bf] bg-[#e8f3ee] text-[#134e3a] dark:bg-[#152a22] dark:text-[#34d399]'
                    : 'border-[#e6e0d4] dark:border-[#2f3f36] bg-white dark:bg-[#18201c] text-[#606d66] dark:text-[#94a19b]'
                }`}
              >
                <span>{item.replace(/-/g, ' ')}</span>
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                    isChecked
                      ? 'bg-[#134e3a] text-white dark:bg-[#2dd4bf] dark:text-[#042f2e]'
                      : 'border-[#dcd6c8] dark:border-[#2f3f36]'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 pt-4 border-t border-[#f0ece2] dark:border-[#243029]">
        <h3 className="font-bold text-lg text-[#1c2420] dark:text-[#f3f5f4]">
          Review Your Celebration Blueprint Inputs
        </h3>
        <p className="text-xs text-[#606d66] dark:text-[#94a19b]">
          Confirm your celebration parameters before Utsava generates your custom plan.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#1a221e] border border-[#e8e2d7] dark:border-[#26332b] text-xs">
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">Event Type</span>
          <strong className="text-stone-900 dark:text-stone-100 font-bold block mt-0.5 truncate capitalize">{formData.eventType || 'Event'}</strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">City & Date</span>
          <strong className="text-stone-900 dark:text-stone-100 font-bold block mt-0.5">{formData.city} • {formData.date ? formatDisplayDate(formData.date) : '—'}</strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">Guest Count</span>
          <strong className="text-stone-900 dark:text-stone-100 font-bold block mt-0.5">{formData.guestCount} Guests</strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">Planned Budget</span>
          <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold block mt-0.5">{formData.totalBudget ? formatINR(formData.totalBudget) : '—'}</strong>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {formData.theme && (
          <div className="p-3.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-white dark:bg-[#18201c]">
            <span className="text-[10px] text-stone-400 font-semibold uppercase block">Theme & Ambience</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">{formData.theme}</span>
          </div>
        )}

        {formData.culturalPreferences && (
          <div className="p-3.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-white dark:bg-[#18201c]">
            <span className="text-[10px] text-stone-400 font-semibold uppercase block">Cultural Rituals</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">{formData.culturalPreferences}</span>
          </div>
        )}

        {formData.accessibilityNeeds && (
          <div className="p-3.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-white dark:bg-[#18201c]">
            <span className="text-[10px] text-stone-400 font-semibold uppercase block">Accessibility Needs</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">{formData.accessibilityNeeds}</span>
          </div>
        )}
      </div>

      {/* Privacy Honesty Callout */}
      <div className="p-4 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] border border-[#cbe4d7] dark:border-[#1d4235] text-xs text-[#134e3a] dark:text-[#34d399] leading-relaxed">
        <strong>Privacy & Security Guarantee:</strong> Processed securely via Google Gemini API; your data is never used to train public models or sold to third parties. All celebration records are saved locally inside your browser.
      </div>
    </Card>
  );
}
