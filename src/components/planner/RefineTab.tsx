'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  Leaf,
  DollarSign,
  Music,
  HeartHandshake,
  Soup,
} from 'lucide-react';
import type {
  StoredEvent,
  AIBlueprint,
  AIRefinement,
  BudgetCategory,
  TimelineTask,
} from '@/schemas';
import { mergeBlueprintRefinement } from '@/lib/ai/mergePlan';
import { buildBudgetCategories } from '@/lib/budget';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface RefineTabProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  tasks: TimelineTask[];
  onApplyRefinedPlan: (
    updatedBlueprint: AIBlueprint,
    updatedCategories: BudgetCategory[] | null,
    summary: string,
    refinedTotalBudget?: number
  ) => void;
}

interface RefinementHistoryItem {
  id: string;
  timestamp: string;
  userPrompt: string;
  summary: string;
  changedSections: string[];
}

const QUICK_PROMPTS = [
  {
    icon: Leaf,
    text: 'Make decor 100% eco-friendly, zero-plastic and potted-plant based',
  },
  {
    icon: DollarSign,
    text: 'Cut venue budget by 20% and reallocate to gourmet Indian catering',
  },
  {
    icon: Music,
    text: 'Add a high-energy Sangeet night with choreographed performances and live dhol',
  },
  {
    icon: HeartHandshake,
    text: 'Optimize seating, ramps, and quiet spaces for elderly grandparents',
  },
  {
    icon: Soup,
    text: 'Shift food menu to pure vegetarian with extensive Jain-friendly live chaat counters',
  },
];

export function RefineTab({
  event,
  blueprint,
  onApplyRefinedPlan,
}: RefineTabProps) {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<RefinementHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!blueprint) {
    return (
      <Card className="text-center py-16 border-dashed bg-sand-50/30 dark:bg-stone-900/30 animate-in fade-in">
        <Sparkles className="w-12 h-12 text-forest-600 dark:text-forest-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-forest-950 dark:text-forest-100">
          Blueprint Needed Before Refinement
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-6">
          Generate an initial celebration blueprint from the Overview tab first to start conversational refinements.
        </p>
      </Card>
    );
  }

  const handleRefine = async (requestText: string) => {
    const text = requestText.trim();
    if (!text || isSubmitting) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const userKey = typeof window !== 'undefined' ? localStorage.getItem('utsava_gemini_key') : null;
      const res = await fetch('/api/refine-plan', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(userKey ? { 'x-gemini-key': userKey } : {}),
        },
        body: JSON.stringify({
          eventDetails: {
            eventType: event.eventType,
            name: event.name,
            date: event.date,
            city: event.city,
            guestCount: event.guestCount,
            totalBudget: event.totalBudget,
            theme: event.theme,
            dietaryPreferences: event.dietaryPreferences,
            culturalPreferences: event.culturalPreferences,
            accessibilityNeeds: event.accessibilityNeeds,
            specialRequirements: event.specialRequirements,
            subEvents: event.subEvents,
          },
          currentPlan: blueprint,
          userRequest: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || 'Failed to refine plan. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const refinement: AIRefinement = data.refinement;

      // Identify which sections changed
      const changed: string[] = [];
      if (refinement.themeAndDecor) changed.push('Theme & Decor');
      if (refinement.budgetAllocation) changed.push('Budget Allocation');
      if (refinement.activities) changed.push('Activities');
      if (refinement.timeline) changed.push('Timeline');
      if (refinement.vendorCategories) changed.push('Vendor Categories');
      if (refinement.alternatives) changed.push('Alternatives');
      if (refinement.totalBudget) changed.push('Total Budget');

      // Merge into blueprint without touching unrelated sections
      const updatedBlueprint = mergeBlueprintRefinement(blueprint, refinement);

      // Recompute budget in code if budgetAllocation changed or totalBudget changed
      let newCategories: BudgetCategory[] | null = null;
      const effectiveBudget =
        refinement.totalBudget && refinement.totalBudget >= 1000
          ? refinement.totalBudget
          : event.totalBudget;

      if (refinement.budgetAllocation || refinement.totalBudget) {
        newCategories = buildBudgetCategories(
          updatedBlueprint.budgetAllocation,
          effectiveBudget
        );
      }

      // Add to conversation history
      const historyItem: RefinementHistoryItem = {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userPrompt: text,
        summary: refinement.refinementSummary,
        changedSections: changed,
      };

      setHistory((prev) => [historyItem, ...prev]);
      onApplyRefinedPlan(
        updatedBlueprint,
        newCategories,
        refinement.refinementSummary,
        refinement.totalBudget
      );
      setPrompt('');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error refining plan:', err);
      setErrorMessage('Network error during refinement. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="forest">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Plan Refinement
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-forest-100">
          Refine Your Plan Conversationally
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
          Ask Gemini to make budget cuts, add Indian ceremonies, or switch to sustainable options.
          Only requested sections update; your custom data stays intact.
        </p>
      </div>

      {/* Chat / Refinement Input Card */}
      <Card className="border-sand-200 dark:border-stone-800 shadow-soft">
        <CardContent className="p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRefine(prompt);
            }}
            className="flex items-start gap-2.5"
          >
            <div className="relative flex-1">
              <textarea
                id="refine-prompt-input"
                aria-label="Refinement request"
                rows={3}
                placeholder="e.g. Cut the overall budget by 15% and switch to eco-friendly floral decor..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 disabled:opacity-50 transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting || !prompt.trim()}
              className="h-12 px-5 gap-2 shrink-0 self-end"
            >
              <Send className="w-4 h-4" />
              <span>Refine</span>
            </Button>
          </form>

          {/* Quick Starter Chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPrompt(q.text);
                      handleRefine(q.text);
                    }}
                    disabled={isSubmitting}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-sand-50/70 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-forest-400 hover:bg-forest-50/50 dark:hover:bg-forest-950/30 transition-all cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <Icon className="w-3 h-3 text-forest-700 dark:text-forest-400 shrink-0" />
                    <span>{q.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Refinement History Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-forest-950 dark:text-forest-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-forest-700 dark:text-forest-400" />
            Refinement Activity Log ({history.length})
          </h3>
          {history.length > 0 && (
            <span className="text-xs text-stone-400">Deterministic merge preserving unmentioned fields</span>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-sand-200 dark:border-stone-800 rounded-2xl bg-sand-50/30 dark:bg-stone-900/30">
            <Bot className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              No refinements applied yet.
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Try asking for a budget trim, an eco-friendly decor shift, or a ceremony addition above!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card key={item.id} className="border-sand-200 dark:border-stone-800 shadow-soft">
                <CardContent className="p-4 space-y-3">
                  {/* User Request */}
                  <div className="flex items-start justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-forest-900 text-white dark:bg-forest-600 flex items-center justify-center text-[10px] font-bold">
                        <User className="w-3 h-3" />
                      </div>
                      <strong className="text-stone-900 dark:text-stone-100">You requested:</strong>
                    </div>
                    <span className="text-[11px] text-stone-400">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 pl-7 italic">
                    &ldquo;{item.userPrompt}&rdquo;
                  </p>

                  {/* AI Response */}
                  <div className="pt-2.5 border-t border-sand-100 dark:border-stone-800 pl-7 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-forest-800 dark:text-forest-300 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.summary}</span>
                    </div>

                    {item.changedSections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center pt-1">
                        <span className="text-[10px] text-stone-400">Sections updated:</span>
                        {item.changedSections.map((sec) => (
                          <span
                            key={sec}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 border border-forest-200 dark:border-forest-800"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
