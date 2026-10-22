'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import {
  eventInputSchema,
  WEDDING_SUB_EVENTS,
  DIETARY_OPTIONS,
  type EventInput,
  type StoredEvent,
} from '@/schemas';
import { getTodayString } from '@/lib/dates';
import { saveEvent } from '@/lib/storage';
import { Button } from './ui/Button';
import { WizardStep1Basics } from './wizard/WizardStep1Basics';
import { WizardStep2Theme } from './wizard/WizardStep2Theme';
import { WizardStep3Review } from './wizard/WizardStep3Review';
import { WizardLivePreview } from './wizard/WizardLivePreview';

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
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#134e3a] dark:text-[#2dd4bf]">
          Step {step} of 3
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
          Plan Your Next Celebration
        </h1>
        <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b]">
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
                    : 'bg-[#f0ece3] text-[#4d5953] dark:bg-[#222d27] dark:text-[#94a19b]'
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
            {step === 1 && (
              <WizardStep1Basics
                formData={formData}
                updateField={updateField}
                errors={errors}
                minDate={minDate}
              />
            )}

            {step === 2 && (
              <WizardStep2Theme
                formData={formData}
                updateField={updateField}
                toggleSubEvent={toggleSubEvent}
              />
            )}

            {step === 3 && (
              <WizardStep3Review
                formData={formData}
                toggleDietary={toggleDietary}
              />
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  key={`wizard-next-step-${step}`}
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  className="gap-2"
                >
                  <span>{step === 1 ? 'Next: Format & Traditions' : 'Next: Preferences & Review'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  key="wizard-submit-btn"
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  className="gap-2 shadow-elevated"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Save & Generate Plan</span>
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="hidden lg:block lg:col-span-4">
          <WizardLivePreview formData={formData} />
        </div>
      </div>
    </div>
  );
}
