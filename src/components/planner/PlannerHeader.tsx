'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Sparkles,
  ArrowLeft,
  Clock,
  Heart,
  PartyPopper,
  Flame,
  AlertTriangle,
  Edit2,
  LayoutDashboard,
  Wallet,
  CalendarClock,
  ClipboardCheck,
  Lightbulb,
  Printer,
  RotateCcw,
} from 'lucide-react';
import type { StoredEvent } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { formatDisplayDate, daysUntilEvent, getTodayString } from '@/lib/dates';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export type PlannerTab =
  | 'dashboard'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'ideas'
  | 'refine'
  | 'export';

interface PlannerHeaderProps {
  event: StoredEvent;
  activeTab: PlannerTab;
  onTabChange: (tab: PlannerTab) => void;
  hasBlueprint: boolean;
  isGeneratingBlueprint: boolean;
  onGenerateBlueprint: () => void;
  onUpdateEventDate: (newDate: string) => void;
  onUpdateTotalBudget: (newBudget: number) => void;
  apiKeyMissing: boolean;
}

export function PlannerHeader({
  event,
  activeTab,
  onTabChange,
  hasBlueprint,
  isGeneratingBlueprint,
  onGenerateBlueprint,
  onUpdateEventDate,
  onUpdateTotalBudget,
  apiKeyMissing,
}: PlannerHeaderProps) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(event.date);
  const [dateError, setDateError] = useState<string | null>(null);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetStr, setNewBudgetStr] = useState(String(event.totalBudget));
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const [isConfirmRegenerateOpen, setIsConfirmRegenerateOpen] = useState(false);

  const today = getTodayString();
  const daysLeft = daysUntilEvent(event.date, today);
  const isPast = daysLeft < 0;
  const isToday = daysLeft === 0;

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);

    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      setDateError('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    if (newDate < today) {
      setDateError('Celebration date cannot be in the past.');
      return;
    }

    onUpdateEventDate(newDate);
    setIsEditingDate(false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetError(null);

    const val = Number(newBudgetStr);
    if (isNaN(val) || val < 1000) {
      setBudgetError('Total budget must be at least ₹1,000.');
      return;
    }

    onUpdateTotalBudget(val);
    setIsEditingBudget(false);
  };

  const handleRegenerateClick = () => {
    if (hasBlueprint) {
      setIsConfirmRegenerateOpen(true);
    } else {
      onGenerateBlueprint();
    }
  };

  const tabs: Array<{ id: PlannerTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget Manager', icon: Wallet },
    { id: 'timeline', label: 'Smart Timeline', icon: CalendarClock },
    { id: 'vendors', label: 'Vendor Checklist', icon: ClipboardCheck },
    { id: 'ideas', label: 'Idea Studio', icon: Lightbulb },
    { id: 'refine', label: 'AI Refine', icon: Sparkles },
    { id: 'export', label: 'Export & Print', icon: Printer },
  ];

  return (
    <div className="border-b border-[#e8e2d7] dark:border-[#26332b] bg-[#faf8f5]/80 dark:bg-[#111614]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        {/* Top Back Navigation Row */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#606d66] hover:text-[#1c2420] dark:text-[#94a19b] dark:hover:text-[#f3f5f4] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Celebrations</span>
          </Link>

          {/* Regenerate Blueprint Action */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegenerateClick}
            isLoading={isGeneratingBlueprint}
            disabled={isGeneratingBlueprint}
            className="gap-1.5 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#134e3a] dark:text-[#2dd4bf]" />
            <span>{hasBlueprint ? 'Regenerate Blueprint' : 'Generate Blueprint'}</span>
          </Button>
        </div>

        {/* API Key Missing Setup Banner */}
        {apiKeyMissing && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-900 dark:text-amber-200 block text-xs sm:text-sm">
                  Gemini API Key Required for AI Features
                </strong>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  To enable live blueprint generation and idea creation, configure{' '}
                  <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-[11px] font-mono">
                    GEMINI_API_KEY
                  </code>{' '}
                  in your <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-[11px] font-mono">.env.local</code> file or click the key icon in the navigation bar.
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
            >
              <Button size="sm" variant="secondary" className="text-xs">
                Get Free Gemini Key
              </Button>
            </a>
          </div>
        )}

        {/* Event Header Main Card */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  event.eventType === 'wedding'
                    ? 'festive'
                    : event.eventType === 'birthday'
                    ? 'warning'
                    : 'forest'
                }
              >
                {event.eventType === 'wedding' && <Heart className="w-3 h-3 text-rose-500" />}
                {event.eventType === 'birthday' && <PartyPopper className="w-3 h-3 text-amber-500" />}
                {event.eventType === 'community' && <Flame className="w-3 h-3 text-emerald-500" />}
                <span className="capitalize">{event.eventType}</span>
              </Badge>

              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  isToday
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : isPast
                    ? 'bg-[#f0ece3] text-[#75837c] dark:bg-[#222d27] dark:text-[#94a19b]'
                    : daysLeft <= 14
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-[#e8f3ee] text-[#134e3a] dark:bg-[#152a22] dark:text-[#34d399]'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{isToday ? '🎉 Today!' : isPast ? 'Concluded' : `in ${daysLeft} days`}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
              {event.name}
            </h1>

            {/* Quick Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#606d66] dark:text-[#94a19b] pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setNewDate(event.date);
                  setDateError(null);
                  setIsEditingDate(true);
                }}
                className="flex items-center gap-1.5 hover:text-[#134e3a] dark:hover:text-[#2dd4bf] transition-colors cursor-pointer group"
                title="Change celebration date (auto-recalculates timeline)"
              >
                <Calendar className="w-3.5 h-3.5 text-[#88968e] group-hover:text-[#134e3a] dark:group-hover:text-[#2dd4bf]" />
                <span className="underline decoration-dotted underline-offset-2 font-medium">
                  {formatDisplayDate(event.date)}
                </span>
                <Edit2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </button>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#88968e]" />
                <span>{event.city}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#88968e]" />
                <span>{event.guestCount} Guests</span>
              </div>

              {/* Total Budget Edit Control */}
              <button
                type="button"
                onClick={() => {
                  setNewBudgetStr(String(event.totalBudget));
                  setBudgetError(null);
                  setIsEditingBudget(true);
                }}
                className="flex items-center gap-1.5 font-bold text-[#134e3a] dark:text-[#34d399] hover:underline cursor-pointer group"
                title="Edit total celebration budget"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Budget: {formatINR(event.totalBudget)}</span>
                <Edit2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation with Lucide Icons */}
        <nav
          className="flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-[#e8e2d7] dark:border-[#26332b] scrollbar-none"
          aria-label="Planner Tabs"
          role="tablist"
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                type="button"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const next = tabs[(idx + 1) % tabs.length];
                    onTabChange(next.id);
                    document.getElementById(`tab-${next.id}`)?.focus();
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
                    onTabChange(prev.id);
                    document.getElementById(`tab-${prev.id}`)?.focus();
                  }
                }}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[#134e3a] text-[#134e3a] dark:border-[#2dd4bf] dark:text-[#2dd4bf]'
                    : 'border-transparent text-[#606d66] hover:text-[#1c2420] dark:text-[#94a19b] dark:hover:text-[#f3f5f4] hover:border-[#b8ad96]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#134e3a] dark:text-[#2dd4bf]' : 'text-[#88968e]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Date Edit Modal with Inline Past-Date Rejection */}
      <Modal
        isOpen={isEditingDate}
        onClose={() => setIsEditingDate(false)}
        title="Change Celebration Date"
        description="Updating the date automatically offsets and recalculates all preparation milestone due dates."
      >
        <form onSubmit={handleSaveDate} className="space-y-4">
          <Input
            id="new-event-date"
            label="New Celebration Date"
            type="date"
            required
            value={newDate}
            min={today}
            onChange={(e) => {
              setNewDate(e.target.value);
              setDateError(null);
            }}
            helperText={`Earliest selectable date is today (${today})`}
          />

          {dateError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{dateError}</p>
          )}

          <div className="p-3 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] border border-[#cbe4d7] dark:border-[#1d4235] text-xs text-[#134e3a] dark:text-[#34d399]">
            All preparation timeline deadlines will be shifted based on their relative days before the event.
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingDate(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Recalculate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Total Budget Edit Modal */}
      <Modal
        isOpen={isEditingBudget}
        onClose={() => setIsEditingBudget(false)}
        title="Edit Total Event Budget"
        description="Recalculates all category allocations in code using current percentage distributions."
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <Input
            id="new-total-budget"
            label="Total Budget (INR ₹)"
            type="number"
            required
            min={1000}
            step="any"
            value={newBudgetStr}
            onChange={(e) => {
              setNewBudgetStr(e.target.value);
              setBudgetError(null);
            }}
            helperText="Minimum allowed celebration budget is ₹1,000"
          />

          {budgetError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{budgetError}</p>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingBudget(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Budget & Recalculate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Regenerate Modal */}
      <Modal
        isOpen={isConfirmRegenerateOpen}
        onClose={() => setIsConfirmRegenerateOpen(false)}
        title="Regenerate Celebration Plan?"
        description="Refresh AI recommendations while preserving your completed tasks, vendor details, and expense records."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              What will be preserved:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All completed tasks and user-added custom tasks</li>
              <li>Vendor names, contact numbers, quotes, and booking statuses</li>
              <li>All recorded expenses (re-mapped to matching categories)</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmRegenerateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setIsConfirmRegenerateOpen(false);
                onGenerateBlueprint();
              }}
            >
              Yes, Regenerate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
