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
        <h3 className="text-sm font-bold text-moss-875 dark:text-moss-45">Dietary Preferences</h3>
        <p className="text-xs text-moss-620 dark:text-moss-415">
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
                    ? 'border-forest-700 dark:border-mint-285 bg-forest-50 text-forest-700 dark:bg-moss-860 dark:text-mint-295'
                    : 'border-linen-135 dark:border-moss-790 bg-white dark:bg-moss-885 text-moss-620 dark:text-moss-415'
                }`}
              >
                <span>{item.replace(/-/g, ' ')}</span>
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                    isChecked
                      ? 'bg-forest-700 text-white dark:bg-mint-285 dark:text-mint-850'
                      : 'border-linen-180 dark:border-moss-790'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 pt-4 border-t border-linen-85 dark:border-moss-835">
        <h3 className="font-bold text-lg text-moss-875 dark:text-moss-45">
          Review Your Celebration Blueprint Inputs
        </h3>
        <p className="text-xs text-moss-620 dark:text-moss-415">
          Confirm your celebration parameters before Utsava generates your custom plan.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-sand-50 dark:bg-moss-875 border border-sand-200 dark:border-moss-830 text-xs">
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">
            Event Type
          </span>
          <strong className="text-stone-900 dark:text-stone-100 font-bold block mt-0.5 truncate capitalize">
            {formData.eventType || 'Event'}
          </strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">
            City & Date
          </span>
          <strong className="text-stone-900 dark:text-stone-100 font-bold block mt-0.5">
            {formData.city} • {formData.date ? formatDisplayDate(formData.date) : '—'}
          </strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">
            Guest Count
          </span>
          <strong className="text-stone-900 dark:text-stone-100 font-bold block mt-0.5">
            {formData.guestCount} Guests
          </strong>
        </div>
        <div>
          <span className="text-stone-400 block text-[10px] uppercase font-semibold">
            Planned Budget
          </span>
          <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold block mt-0.5">
            {formData.totalBudget ? formatINR(formData.totalBudget) : '—'}
          </strong>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {formData.theme && (
          <div className="p-3.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-white dark:bg-moss-885">
            <span className="text-[10px] text-stone-400 font-semibold uppercase block">
              Theme & Ambience
            </span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">{formData.theme}</span>
          </div>
        )}

        {formData.culturalPreferences && (
          <div className="p-3.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-white dark:bg-moss-885">
            <span className="text-[10px] text-stone-400 font-semibold uppercase block">
              Cultural Rituals
            </span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">
              {formData.culturalPreferences}
            </span>
          </div>
        )}

        {formData.accessibilityNeeds && (
          <div className="p-3.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-white dark:bg-moss-885">
            <span className="text-[10px] text-stone-400 font-semibold uppercase block">
              Accessibility Needs
            </span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">
              {formData.accessibilityNeeds}
            </span>
          </div>
        )}
      </div>

      {/* Privacy Honesty Callout */}
      <div className="p-4 rounded-xl bg-forest-50 dark:bg-moss-860 border border-moss-145 dark:border-moss-795 text-xs text-forest-700 dark:text-mint-295 leading-relaxed">
        <strong>Privacy & Security Guarantee:</strong> Processed securely via Google Gemini API;
        your data is never used to train public models or sold to third parties. All celebration
        records are saved locally inside your browser.
      </div>
    </Card>
  );
}
