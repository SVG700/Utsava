import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { WEDDING_SUB_EVENTS, type EventInput } from '@/schemas';

interface WizardStep2ThemeProps {
  formData: Partial<EventInput>;
  updateField: <K extends keyof EventInput>(field: K, value: EventInput[K]) => void;
  toggleSubEvent: (sub: (typeof WEDDING_SUB_EVENTS)[number]) => void;
}

export function WizardStep2Theme({
  formData,
  updateField,
  toggleSubEvent,
}: WizardStep2ThemeProps) {
  return (
    <Card className="p-6 sm:p-8 space-y-6">
      {/* Indian Wedding Sub-Events */}
      {formData.eventType === 'wedding' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1c2420] dark:text-[#f3f5f4]">
              Indian Wedding Sub-Events
            </h3>
            <span className="text-xs text-[#606d66] dark:text-[#94a19b]">
              {(formData.subEvents || []).length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { key: 'haldi', label: 'Haldi Ceremony', desc: 'Turmeric ritual & floral jewelry' },
              { key: 'mehendi', label: 'Mehendi Soirée', desc: 'Henna artists & folk music' },
              { key: 'sangeet', label: 'Sangeet Night', desc: 'Choreography, DJ & cocktails' },
              { key: 'wedding', label: 'Pheras / Mandap', desc: 'Vedic ceremony & sacred fire' },
              { key: 'reception', label: 'Grand Reception', desc: 'Formal dining & guest portraits' },
              { key: 'other', label: 'Welcome Dinner / Pooja', desc: 'Ganesh puja or pool party' },
            ].map((sub) => {
              const isChecked = (formData.subEvents || []).includes(
                sub.key as (typeof WEDDING_SUB_EVENTS)[number]
              );
              return (
                <button
                  key={sub.key}
                  type="button"
                  aria-pressed={isChecked}
                  onClick={() =>
                    toggleSubEvent(sub.key as (typeof WEDDING_SUB_EVENTS)[number])
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isChecked
                      ? 'border-[#134e3a] dark:border-[#2dd4bf] bg-[#e8f3ee]/60 dark:bg-[#152a22]/50 text-[#134e3a] dark:text-[#34d399]'
                      : 'border-[#e6e0d4] dark:border-[#2f3f36] bg-white dark:bg-[#18201c] text-[#606d66] dark:text-[#94a19b]'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <span>{sub.label}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                        isChecked
                          ? 'bg-[#134e3a] text-white dark:bg-[#2dd4bf] dark:text-[#042f2e]'
                          : 'border-[#dcd6c8] dark:border-[#2f3f36]'
                      }`}
                    >
                      {isChecked ? '✓' : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#88968e] block mt-0.5 line-clamp-1">
                    {sub.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Theme Concept */}
      <div className="space-y-1.5 pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
        <Input
          id="wizard-theme-input"
          label="Aesthetic Concept & Theme"
          placeholder={
            formData.eventType === 'wedding'
              ? 'e.g. Royal Rajasthani Palace Ambience with Mogra & Marigold'
              : 'e.g. Vintage Boho Garden Soirée'
          }
          value={formData.theme || ''}
          onChange={(e) => updateField('theme', e.target.value)}
          helperText="Gemini will design matching color palettes, floral suggestions, and styling rules."
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] text-[#88968e] font-semibold uppercase tracking-wider self-center mr-1">
            Suggestions:
          </span>
          {[
            'Royal Rajasthani Heritage',
            'South Indian Temple Floral',
            'Modern Minimalist Pastel',
            'Eco-Friendly Zero-Plastic',
            'Bollywood Retro Glam',
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateField('theme', s)}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-[#e6e0d4] dark:border-[#2f3f36] bg-[#faf8f5] dark:bg-[#18201c] hover:border-[#134e3a]/40 text-[#606d66] dark:text-[#94a19b] transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cultural Traditions & Regional Customs */}
      <div className="space-y-1.5 pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
        <label htmlFor="wizard-cultural-pref" className="block text-xs sm:text-sm font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
          Cultural Traditions & Regional Rituals (Optional)
        </label>
        <textarea
          id="wizard-cultural-pref"
          rows={2}
          placeholder="e.g. Marwari customs with traditional Baithak, live Shehnai at dawn, and Jain midnight snack counter"
          value={formData.culturalPreferences || ''}
          onChange={(e) => updateField('culturalPreferences', e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcd6c8] dark:border-[#2f3f36] bg-white dark:bg-[#18201c] text-[#1c2420] dark:text-[#f3f5f4] text-xs placeholder:text-[#596660] focus:outline-none focus:ring-2 focus:ring-[#134e3a]/15 focus:border-[#134e3a] dark:focus:border-[#2dd4bf] transition-all"
        />
      </div>

      {/* Accessibility & Senior Care */}
      <div className="space-y-1.5 pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
        <Input
          id="wizard-accessibility-input"
          label="Accessibility & Senior Care Needs (Optional)"
          placeholder="e.g. Wheelchair ramp to mandap, golf cart for elderly guests"
          value={formData.accessibilityNeeds || ''}
          onChange={(e) => updateField('accessibilityNeeds', e.target.value)}
          helperText="Gemini will prioritize step-free layouts and accessible restrooms in vendor scopes."
        />
      </div>

      {/* Special Requirements */}
      <div className="space-y-1.5 pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
        <Input
          id="wizard-special-req-input"
          label="Special Requirements or Constraints (Optional)"
          placeholder="e.g. Strict 10 PM sound curfew, eco-friendly banana leaf dining only"
          value={formData.specialRequirements || ''}
          onChange={(e) => updateField('specialRequirements', e.target.value)}
          helperText="Any venue rules, noise curfews, or sustainability mandates."
        />
      </div>
    </Card>
  );
}
