import React from 'react';
import { Heart, PartyPopper, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatINR } from '@/lib/budget';
import { type EventInput, type EventType } from '@/schemas';

const POPULAR_INDIAN_CITIES = [
  'Bengaluru',
  'Jaipur',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Udaipur',
  'Goa',
  'Kolkata',
];

interface WizardStep1BasicsProps {
  formData: Partial<EventInput>;
  updateField: <K extends keyof EventInput>(field: K, value: EventInput[K]) => void;
  errors: Record<string, string>;
  minDate: string;
}

export function WizardStep1Basics({
  formData,
  updateField,
  errors,
  minDate,
}: WizardStep1BasicsProps) {
  return (
    <Card className="p-6 sm:p-8 space-y-6">
      {/* Event Type Cards */}
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
          Celebration Type <span className="text-[#134e3a] dark:text-[#2dd4bf]">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              type: 'wedding' as EventType,
              title: 'Wedding',
              desc: 'Multi-day Indian weddings with Haldi, Sangeet & Pheras',
              icon: Heart,
              color: 'text-rose-600 dark:text-rose-400',
            },
            {
              type: 'birthday' as EventType,
              title: 'Birthday',
              desc: 'Kids theme parties, milestones 1st, 18th & 50th jubilees',
              icon: PartyPopper,
              color: 'text-amber-600 dark:text-amber-400',
            },
            {
              type: 'community' as EventType,
              title: 'Community / Festival',
              desc: 'Puja pandals, Navratri Garba, anniversaries & corporate',
              icon: Users,
              color: 'text-emerald-600 dark:text-emerald-400',
            },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = formData.eventType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                aria-pressed={isSelected}
                onClick={() => updateField('eventType', item.type)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#134e3a] dark:border-[#2dd4bf] bg-[#e8f3ee]/50 dark:bg-[#152a22]/60 ring-2 ring-[#134e3a]/15 dark:ring-[#2dd4bf]/20 shadow-xs'
                    : 'border-[#e6e0d4] dark:border-[#2f3f36] bg-white dark:bg-[#18201c] hover:border-[#134e3a]/40 dark:hover:border-[#2dd4bf]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#134e3a] text-white dark:bg-[#2dd4bf] dark:text-[#042f2e]'
                        : 'bg-[#faf8f5] dark:bg-[#222d27] ' + item.color
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#134e3a] dark:bg-[#2dd4bf]" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1c2420] dark:text-[#f3f5f4]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#606d66] dark:text-[#94a19b] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.eventType && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{errors.eventType}</p>
        )}
      </div>

      {/* Event Name */}
      <Input
        id="event-name"
        label="Event Name"
        required
        placeholder={
          formData.eventType === 'wedding'
            ? 'e.g. Ananya & Rohan’s Wedding'
            : formData.eventType === 'birthday'
              ? 'e.g. Aarav’s 1st Birthday Safari'
              : 'e.g. Sharad Utsav Dandiya Night'
        }
        value={formData.name || ''}
        onChange={(e) => updateField('name', e.target.value)}
        error={errors.name}
        helperText="A personalized title for your celebration dashboard and coordinator prints."
      />

      {/* Date & City Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="event-date"
          label="Celebration Date"
          type="date"
          required
          min={minDate}
          value={formData.date || ''}
          onChange={(e) => updateField('date', e.target.value)}
          error={errors.date}
          helperText="All preparation milestones dynamically offset from this date."
        />

        <div className="space-y-1.5">
          <Input
            id="city-/-location"
            label="City / Location"
            required
            placeholder="e.g. Jaipur, Bengaluru, Mumbai"
            value={formData.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            error={errors.city}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-[#55635c] dark:text-[#94a19b] font-semibold uppercase tracking-wider self-center mr-1">
              Popular:
            </span>
            {POPULAR_INDIAN_CITIES.slice(0, 5).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => updateField('city', city)}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  formData.city === city
                    ? 'border-[#134e3a] dark:border-[#2dd4bf] bg-[#e8f3ee] text-[#134e3a] dark:bg-[#152a22] dark:text-[#34d399] font-semibold'
                    : 'border-[#e6e0d4] dark:border-[#2f3f36] bg-[#faf8f5] dark:bg-[#18201c] text-[#606d66] dark:text-[#94a19b] hover:border-[#134e3a]/40'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guests & Budget Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
        <Input
          id="guest-count"
          label="Expected Guest Count"
          type="number"
          required
          min={1}
          max={5000}
          value={formData.guestCount ?? ''}
          onChange={(e) => updateField('guestCount', Number(e.target.value) || 0)}
          error={errors.guestCount}
          helperText="Used to scale catering estimates, seating layouts, and live counter sizes."
        />

        <div className="space-y-1.5">
          <Input
            id="total-budget-(inr-₹)"
            label="Total Budget (INR ₹)"
            type="number"
            required
            min={1000}
            step="any"
            value={formData.totalBudget ?? ''}
            onChange={(e) => updateField('totalBudget', Number(e.target.value) || 0)}
            error={errors.totalBudget}
            helperText={
              formData.totalBudget
                ? `Formatted: ${formatINR(formData.totalBudget)}`
                : 'Min ₹1,000. Strictly converted to penny-perfect rupee allocations.'
            }
          />
        </div>
      </div>
    </Card>
  );
}
