'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Flame,
  Heart,
  IndianRupee,
  MapPin,
  PartyPopper,
  Sparkles,
  Users,
} from 'lucide-react';
import type { EventType, StoredEvent } from '@/schemas';
import { formatINR } from '@/lib/budget';
import { daysUntilEvent, formatDisplayDate, getTodayString } from '@/lib/dates';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PlannerTabs, type PlannerTab } from './header/PlannerTabs';
import { ApiKeyBanner } from './header/ApiKeyBanner';
import { EditBudgetDialog, EditDateDialog, RegenerateDialog } from './header/HeaderDialogs';

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

type OpenDialog = 'date' | 'budget' | 'regenerate' | null;

const EVENT_TYPE_BADGE: Record<
  EventType,
  { variant: BadgeProps['variant']; icon: React.ReactNode }
> = {
  wedding: { variant: 'festive', icon: <Heart className="w-3 h-3 text-rose-500" /> },
  birthday: { variant: 'warning', icon: <PartyPopper className="w-3 h-3 text-amber-500" /> },
  community: { variant: 'forest', icon: <Flame className="w-3 h-3 text-emerald-500" /> },
};

/** Countdown label and colour for the days remaining until the event. */
function countdown(daysLeft: number): { label: string; className: string } {
  if (daysLeft === 0) {
    return {
      label: '🎉 Today!',
      className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    };
  }
  if (daysLeft < 0) {
    return {
      label: 'Concluded',
      className: 'bg-linen-85 text-moss-535 dark:bg-moss-845 dark:text-moss-415',
    };
  }
  return {
    label: `in ${daysLeft} days`,
    className:
      daysLeft <= 14
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-forest-50 text-forest-700 dark:bg-moss-860 dark:text-mint-295',
  };
}

/** Event summary, edit controls, regenerate action and the planner tab bar. */
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
  // `session` re-mounts dialogs on each open so their forms start from current values.
  const [dialog, setDialog] = useState<{ open: OpenDialog; session: number }>({
    open: null,
    session: 0,
  });
  const openDialog = (open: OpenDialog) => setDialog((d) => ({ open, session: d.session + 1 }));
  const closeDialog = () => setDialog((d) => ({ ...d, open: null }));

  const today = getTodayString();
  const status = countdown(daysUntilEvent(event.date, today));
  const typeBadge = EVENT_TYPE_BADGE[event.eventType];

  return (
    <div className="border-b border-sand-200 dark:border-moss-830 bg-sand-50/80 dark:bg-moss-915/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss-620 hover:text-moss-875 dark:text-moss-415 dark:hover:text-moss-45 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Celebrations</span>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => (hasBlueprint ? openDialog('regenerate') : onGenerateBlueprint())}
            isLoading={isGeneratingBlueprint}
            disabled={isGeneratingBlueprint}
            className="gap-1.5 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-forest-700 dark:text-mint-285" />
            <span>{hasBlueprint ? 'Regenerate Blueprint' : 'Generate Blueprint'}</span>
          </Button>
        </div>

        {apiKeyMissing && <ApiKeyBanner />}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={typeBadge.variant}>
                {typeBadge.icon}
                <span className="capitalize">{event.eventType}</span>
              </Badge>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${status.className}`}
              >
                <Clock className="w-3 h-3" />
                <span>{status.label}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-moss-875 dark:text-moss-45 tracking-tight">
              {event.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-moss-620 dark:text-moss-415 pt-0.5">
              <button
                type="button"
                onClick={() => openDialog('date')}
                className="flex items-center gap-1.5 hover:text-forest-700 dark:hover:text-mint-285 transition-colors cursor-pointer group"
                title="Change celebration date (auto-recalculates timeline)"
              >
                <Calendar className="w-3.5 h-3.5 text-moss-460 group-hover:text-forest-700 dark:group-hover:text-mint-285" />
                <span className="underline decoration-dotted underline-offset-2 font-medium">
                  {formatDisplayDate(event.date)}
                </span>
                <Edit2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </button>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-moss-460" />
                <span>{event.city}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-moss-460" />
                <span>{event.guestCount} Guests</span>
              </div>

              <button
                type="button"
                onClick={() => openDialog('budget')}
                className="flex items-center gap-1.5 font-bold text-forest-700 dark:text-mint-295 hover:underline cursor-pointer group"
                title="Edit total celebration budget"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Budget: {formatINR(event.totalBudget)}</span>
                <Edit2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>

        <PlannerTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <EditDateDialog
        key={`date-${dialog.session}`}
        isOpen={dialog.open === 'date'}
        currentDate={event.date}
        today={today}
        onClose={closeDialog}
        onSave={(date) => {
          onUpdateEventDate(date);
          closeDialog();
        }}
      />
      <EditBudgetDialog
        key={`budget-${dialog.session}`}
        isOpen={dialog.open === 'budget'}
        currentBudget={event.totalBudget}
        onClose={closeDialog}
        onSave={(total) => {
          onUpdateTotalBudget(total);
          closeDialog();
        }}
      />
      <RegenerateDialog
        isOpen={dialog.open === 'regenerate'}
        onClose={closeDialog}
        onConfirm={() => {
          closeDialog();
          onGenerateBlueprint();
        }}
      />
    </div>
  );
}
