'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  PartyPopper,
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Accessibility,
  Utensils,
  MapPin,
  Leaf,
} from 'lucide-react';
import {
  eventInputSchema,
  WEDDING_SUB_EVENTS,
  DIETARY_OPTIONS,
  type EventType,
  type EventInput,
  type StoredEvent,
} from '@/schemas';
import { formatINR } from '@/lib/budget';
import { getTodayString } from '@/lib/dates';
import { saveEvent } from '@/lib/storage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

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

export function EventWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<EventInput>>({
    eventType: 'wedding',
    name: '',
    date: '',
    city: '',
    guestCount: 250,
    totalBudget: 1500000,
    theme: '',
    dietaryPreferences: ['vegetarian'],
    culturalPreferences: '',
    accessibilityNeeds: '',
    specialRequirements: '',
    subEvents: ['haldi', 'mehendi', 'sangeet', 'wedding', 'reception'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minDate, setMinDate] = useState('');

  React.useEffect(() => {
    const t = setTimeout(() => {
      setMinDate(getTodayString());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const updateField = <K extends keyof EventInput>(field: K, value: EventInput[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'eventType') {
        if (value === 'wedding') {
          next.subEvents = ['haldi', 'mehendi', 'sangeet', 'wedding', 'reception'];
          if (!prev.totalBudget || prev.totalBudget < 500000) next.totalBudget = 1500000;
          if (!prev.guestCount || prev.guestCount < 100) next.guestCount = 300;
        } else if (value === 'birthday') {
          next.subEvents = [];
          if (!prev.totalBudget || prev.totalBudget > 300000) next.totalBudget = 60000;
          if (!prev.guestCount || prev.guestCount > 100) next.guestCount = 50;
        } else if (value === 'community') {
          next.subEvents = [];
          if (!prev.totalBudget || prev.totalBudget < 100000) next.totalBudget = 350000;
          if (!prev.guestCount || prev.guestCount < 100) next.guestCount = 200;
        }
      }
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleSubEvent = (sub: (typeof WEDDING_SUB_EVENTS)[number]) => {
    const current = formData.subEvents || [];
    const next = current.includes(sub)
      ? current.filter((s) => s !== sub)
      : [...current, sub];
    updateField('subEvents', next);
  };

  const toggleDietary = (item: (typeof DIETARY_OPTIONS)[number]) => {
    const current = formData.dietaryPreferences || [];
    const next = current.includes(item)
      ? current.filter((d) => d !== item)
      : [...current, item];
    updateField('dietaryPreferences', next);
  };

  const validateStep = (currentStep: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.eventType) stepErrors.eventType = 'Please select an event type';
      if (!formData.name || formData.name.trim().length < 2) {
        stepErrors.name = 'Event name must be at least 2 characters';
      }
      if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
        stepErrors.date = 'Please enter a valid date (YYYY-MM-DD)';
      }
      if (!formData.city || formData.city.trim().length < 2) {
        stepErrors.city = 'Please enter the celebration city';
      }
      if (!formData.guestCount || formData.guestCount < 1) {
        stepErrors.guestCount = 'Guest count must be at least 1';
      }
      if (!formData.totalBudget || formData.totalBudget < 1000) {
        stepErrors.totalBudget = 'Budget must be at least ₹1,000';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = eventInputSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (path) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const newEvent: StoredEvent = {
        ...result.data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveEvent(newEvent);
      router.push(`/events/${newEvent.id}?new=true`);
    } catch (err) {
      console.error('Failed to create event:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <Badge variant="forest">Celebration Setup</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
          Craft Your Celebration Plan
        </h1>
        <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] font-normal leading-relaxed">
          Provide your event details. Utsava’s GenAI will generate a customized blueprint with penny-perfect INR budgets, milestone timelines, and vendor requirements.
        </p>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {[
            { num: 1, title: 'Basics & Budget' },
            { num: 2, title: 'Traditions & Format' },
            { num: 3, title: 'Preferences & Review' },
          ].map((s) => (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => {
                  if (s.num < step || validateStep(step)) setStep(s.num);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  step === s.num
                    ? 'bg-[#134e3a] text-white shadow-soft dark:bg-[#2dd4bf] dark:text-[#042f2e]'
                    : step > s.num
                    ? 'bg-[#e8f3ee] text-[#134e3a] dark:bg-[#1a2e26] dark:text-[#34d399]'
                    : 'bg-[#f0ece3] text-[#788880] dark:bg-[#222d27] dark:text-[#6a7a72]'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/10 dark:bg-white/10 font-bold">
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {s.num < 3 && <div className="w-4 sm:w-8 h-0.5 bg-[#e6e0d4] dark:border-[#2f3f36]" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} noValidate>
            {/* STEP 1: Basic Details & Budget */}
            {step === 1 && (
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
                        title: 'Community',
                        desc: 'Ganesh Utsav, Diwali Mela, society galas & cultural fests',
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
                          onClick={() => updateField('eventType', item.type)}
                          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#134e3a] bg-[#e8f3ee] dark:border-[#2dd4bf] dark:bg-[#152a22] shadow-xs ring-2 ring-[#134e3a]/15 dark:ring-[#2dd4bf]/20'
                              : 'border-[#e6e0d4] dark:border-[#2f3f36] bg-white dark:bg-[#18201c] hover:border-[#b8ad96]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={`w-5 h-5 ${item.color}`} />
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />}
                          </div>
                          <h4 className="font-bold text-[#1c2420] dark:text-[#f3f5f4] text-sm">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[#606d66] dark:text-[#94a19b] mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {errors.eventType && (
                    <p role="alert" className="text-xs text-rose-600 font-medium">{errors.eventType}</p>
                  )}
                </div>

                {/* Event Name */}
                <Input
                  label="Event Name"
                  required
                  placeholder={
                    formData.eventType === 'wedding'
                      ? 'e.g. Ananya & Rohan Royal Wedding'
                      : formData.eventType === 'birthday'
                      ? "e.g. Aarav's 5th Superhero Birthday"
                      : 'e.g. Vasant Vihar Diwali Mela 2026'
                  }
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  error={errors.name}
                />

                {/* Date & City Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Celebration Date"
                    type="date"
                    required
                    min={minDate || undefined}
                    value={formData.date || ''}
                    onChange={(e) => updateField('date', e.target.value)}
                    error={errors.date}
                    helperText="Timeline due dates automatically calculate from this date"
                  />

                  <div>
                    <Input
                      label="City / Location"
                      required
                      placeholder="e.g. Jaipur, Bengaluru, Mumbai"
                      value={formData.city || ''}
                      onChange={(e) => updateField('city', e.target.value)}
                      error={errors.city}
                    />
                    {/* Quick City Pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_INDIAN_CITIES.slice(0, 5).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateField('city', c)}
                          className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                            formData.city === c
                              ? 'bg-[#134e3a] border-[#134e3a] text-white font-medium dark:bg-[#2dd4bf] dark:text-[#042f2e]'
                              : 'bg-[#faf8f5] dark:bg-[#222d27] border-[#e6e0d4] dark:border-[#2f3f36] text-[#606d66] dark:text-[#94a19b] hover:border-[#b8ad96]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Guest Count & Budget (INR) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Estimated Guest Count"
                    type="number"
                    required
                    min={1}
                    max={100000}
                    value={formData.guestCount ?? ''}
                    onChange={(e) => updateField('guestCount', Number(e.target.value))}
                    error={errors.guestCount}
                    helperText="Used to accurately scale venue capacity and catering plates"
                  />

                  <div>
                    <Input
                      label="Total Budget (INR ₹)"
                      type="number"
                      required
                      min={1000}
                      step={5000}
                      value={formData.totalBudget ?? ''}
                      onChange={(e) => updateField('totalBudget', Number(e.target.value))}
                      error={errors.totalBudget}
                    />
                    {formData.totalBudget ? (
                      <p className="text-xs font-semibold text-[#134e3a] dark:text-[#34d399] mt-1.5 flex items-center gap-1">
                        <span>Formatted: {formatINR(formData.totalBudget)}</span>
                        {formData.totalBudget >= 10000000
                          ? `(${(formData.totalBudget / 10000000).toFixed(2)} Cr)`
                          : formData.totalBudget >= 100000
                          ? `(${(formData.totalBudget / 100000).toFixed(2)} Lakhs)`
                          : ''}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t border-[#f0ece2] dark:border-[#243029]">
                  <Button type="button" variant="primary" onClick={handleNext} className="gap-2">
                    <span>Next: Format & Traditions</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 2: Indian Format & Sub-Events */}
            {step === 2 && (
              <Card className="p-6 sm:p-8 space-y-6">
                {formData.eventType === 'wedding' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-[#1c2420] dark:text-[#f3f5f4]">
                        Indian Wedding Sub-Events
                      </h3>
                      <p className="text-xs text-[#606d66] dark:text-[#94a19b] mt-0.5">
                        Choose your celebration events. Timelines and vendor checklists will align to these dates.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { key: 'haldi' as const, label: 'Haldi Ceremony', tag: 'Morning turmeric' },
                        { key: 'mehendi' as const, label: 'Mehendi Function', tag: 'Henna & music' },
                        { key: 'sangeet' as const, label: 'Sangeet Night', tag: 'Dance performances' },
                        { key: 'wedding' as const, label: 'Wedding / Pheras', tag: 'Main ceremony' },
                        { key: 'reception' as const, label: 'Grand Reception', tag: 'Formal dinner' },
                        { key: 'other' as const, label: 'Other Rituals', tag: 'Puja / Cocktail' },
                      ].map((sub) => {
                        const isChecked = (formData.subEvents || []).includes(sub.key);
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            onClick={() => toggleSubEvent(sub.key)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'border-[#134e3a] bg-[#e8f3ee] dark:border-[#2dd4bf] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] font-medium shadow-xs'
                                : 'border-[#e6e0d4] dark:border-[#2f3f36] bg-white dark:bg-[#18201c] text-[#606d66] dark:text-[#94a19b] hover:border-[#b8ad96]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">{sub.label}</span>
                              <span
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                  isChecked
                                    ? 'bg-[#134e3a] border-[#134e3a] text-white dark:bg-[#2dd4bf] dark:text-[#042f2e]'
                                    : 'border-[#b8ad96]'
                                }`}
                              >
                                {isChecked && '✓'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#88968e] block mt-1">{sub.tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Theme & Style */}
                <Input
                  label="Theme & Style Vision"
                  placeholder={
                    formData.eventType === 'wedding'
                      ? 'e.g. Royal Rajasthani Palace, Pastel Florals, Traditional South Indian Temple'
                      : formData.eventType === 'birthday'
                      ? 'e.g. Jungle Safari, Retro Bollywood, Neon Glow, Elegant Gold & Ivory'
                      : 'e.g. Traditional Diyas & Marigold, Cultural Folk Dance, Contemporary Mela'
                  }
                  value={formData.theme || ''}
                  onChange={(e) => updateField('theme', e.target.value)}
                  helperText="Leave blank for AI to recommend evocative themes matching your city and budget"
                />

                {/* Cultural & Regional Traditions */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-[#2d3832] dark:text-[#d3ded8]">
                    Cultural Traditions & Customs
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcd6c8] dark:border-[#2f3f37] bg-white dark:bg-[#18201c] text-[#1c2420] dark:text-[#f3f5f4] text-sm focus:outline-none focus:ring-2 focus:ring-[#134e3a]/15 dark:focus:ring-[#2dd4bf]/20 focus:border-[#134e3a] dark:focus:border-[#2dd4bf] transition-all placeholder:text-[#88968e]"
                    placeholder="e.g. Kannada-Tamil Brahmin traditions, Punjabi-Gujarati fusion, Marwari Jain rituals"
                    value={formData.culturalPreferences || ''}
                    onChange={(e) => updateField('culturalPreferences', e.target.value)}
                  />
                  <p className="text-xs text-[#75837c] dark:text-[#94a19b]">
                    Guides AI caterer plate suggestions, ritual timelines, and vendor requirements.
                  </p>
                </div>

                {/* Step Actions */}
                <div className="flex justify-between pt-4 border-t border-[#f0ece2] dark:border-[#243029]">
                  <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button type="button" variant="primary" onClick={handleNext} className="gap-2">
                    <span>Next: Preferences & Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 3: Dietary, Accessibility, Special & Review */}
            {step === 3 && (
              <Card className="p-6 sm:p-8 space-y-6">
                {/* Dietary Preferences */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-[#1c2420] dark:text-[#f3f5f4] flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />
                    Dietary Preferences
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'vegetarian' as const, label: 'Pure Vegetarian' },
                      { key: 'non-vegetarian' as const, label: 'Non-Vegetarian' },
                      { key: 'jain' as const, label: 'Jain Friendly' },
                      { key: 'vegan' as const, label: 'Vegan Options' },
                      { key: 'no-onion-garlic' as const, label: 'No Onion / Garlic' },
                      { key: 'halal' as const, label: 'Halal Certified' },
                      { key: 'eggetarian' as const, label: 'Eggetarian' },
                    ].map((diet) => {
                      const isChecked = (formData.dietaryPreferences || []).includes(diet.key);
                      return (
                        <button
                          key={diet.key}
                          type="button"
                          onClick={() => toggleDietary(diet.key)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#134e3a] border-[#134e3a] text-white font-medium dark:bg-[#2dd4bf] dark:text-[#042f2e]'
                              : 'bg-[#faf8f5] dark:bg-[#222d27] border-[#e6e0d4] dark:border-[#2f3f36] text-[#606d66] dark:text-[#94a19b] hover:border-[#b8ad96]'
                          }`}
                        >
                          {diet.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accessibility & Senior Care */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-[#2d3832] dark:text-[#d3ded8] flex items-center gap-1.5">
                    <Accessibility className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />
                    Accessibility & Senior Care Needs
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcd6c8] dark:border-[#2f3f37] bg-white dark:bg-[#18201c] text-[#1c2420] dark:text-[#f3f5f4] text-sm focus:outline-none focus:ring-2 focus:ring-[#134e3a]/15 dark:focus:ring-[#2dd4bf]/20 focus:border-[#134e3a] dark:focus:border-[#2dd4bf] transition-all placeholder:text-[#88968e]"
                    placeholder="e.g. Wheelchair ramp to mandap, quiet relaxation room for elderly grandparents"
                    value={formData.accessibilityNeeds || ''}
                    onChange={(e) => updateField('accessibilityNeeds', e.target.value)}
                  />
                </div>

                {/* Special Requirements */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-[#2d3832] dark:text-[#d3ded8] flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />
                    Sustainability & Special Goals
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dcd6c8] dark:border-[#2f3f37] bg-white dark:bg-[#18201c] text-[#1c2420] dark:text-[#f3f5f4] text-sm focus:outline-none focus:ring-2 focus:ring-[#134e3a]/15 dark:focus:ring-[#2dd4bf]/20 focus:border-[#134e3a] dark:focus:border-[#2dd4bf] transition-all placeholder:text-[#88968e]"
                    placeholder="e.g. Zero-plastic event, potted plant giveaways, banana leaf dining, seed-paper invites"
                    value={formData.specialRequirements || ''}
                    onChange={(e) => updateField('specialRequirements', e.target.value)}
                  />
                </div>

                {/* Review Card */}
                <div className="p-4 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] border border-[#cbe4d7] dark:border-[#1d4235] space-y-2">
                  <h4 className="text-xs font-bold text-[#134e3a] dark:text-[#34d399] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for AI Generation
                  </h4>
                  <p className="text-xs text-[#606d66] dark:text-[#94a19b]">
                    Clicking below will trigger Google Gemini to draft your personalized celebration plan. You can adjust all sections afterwards in the interactive dashboard.
                  </p>
                </div>

                {/* Final Submit Actions */}
                <div className="flex justify-between pt-4 border-t border-[#f0ece2] dark:border-[#243029]">
                  <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="gap-2 shadow-card"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Save & Generate Plan</span>
                  </Button>
                </div>
              </Card>
            )}
          </form>
        </div>

        {/* Live Event Summary Preview Column */}
        <div className="lg:col-span-4 sticky top-24">
          <Card className="p-6 border border-[#e6e0d4] dark:border-[#2f3f36] shadow-card bg-white dark:bg-[#18201c] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0ece2] dark:border-[#243029]">
              <span className="text-xs font-bold text-[#134e3a] dark:text-[#34d399] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Event Summary
              </span>
              <Badge variant="forest" className="capitalize">
                {formData.eventType || 'Event'}
              </Badge>
            </div>

            {/* Event Name & City */}
            <div>
              <h3 className="text-base font-bold text-[#1c2420] dark:text-[#f3f5f4] line-clamp-1">
                {formData.name || 'Untitled Celebration'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#606d66] dark:text-[#94a19b] mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#134e3a] dark:text-[#2dd4bf]" />
                <span>{formData.city || 'City not set'}</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#faf8f5] dark:bg-[#1f2924] border border-[#e8e2d7] dark:border-[#2b3a32] text-xs">
              <div>
                <span className="text-[#88968e] block">Date:</span>
                <span className="font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
                  {formData.date || 'TBD'}
                </span>
              </div>
              <div>
                <span className="text-[#88968e] block">Guests:</span>
                <span className="font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
                  {formData.guestCount || 0} guests
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
                <span className="text-[#88968e] block">Total Budget (INR):</span>
                <span className="font-extrabold text-sm text-[#134e3a] dark:text-[#34d399]">
                  {formData.totalBudget ? formatINR(formData.totalBudget) : '₹0'}
                </span>
              </div>
            </div>

            {/* Sub-Events Tags */}
            {formData.eventType === 'wedding' && (formData.subEvents || []).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider block">
                  Sub-Events ({formData.subEvents?.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {formData.subEvents?.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] capitalize px-2 py-0.5 rounded-md bg-[#e8f3ee] text-[#134e3a] dark:bg-[#152a22] dark:text-[#34d399] border border-[#cbe4d7] dark:border-[#1d4235]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Tags */}
            {(formData.dietaryPreferences || []).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider block">
                  Dietary Selections
                </span>
                <div className="flex flex-wrap gap-1">
                  {formData.dietaryPreferences?.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] capitalize px-2 py-0.5 rounded-md bg-[#f0ece3] text-[#2d3832] dark:bg-[#222d27] dark:text-[#d3ded8] border border-[#e2ddd1] dark:border-[#2f3f36]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy note */}
            <p className="text-[11px] text-[#88968e] pt-2 border-t border-[#f0ece2] dark:border-[#243029]">
              🔒 Saved locally on your device. Never shared with third parties.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
