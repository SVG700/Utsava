'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import type { AIBlueprint, StoredEvent } from '@/schemas';
import { resolveRefinement } from '@/lib/ai/mergePlan';
import type { RefinementChanges } from '@/lib/planUpdates';
import {
  getRefinementHistory,
  saveRefinementHistory,
  type RefinementHistoryRecord,
} from '@/lib/storage';
import { apiRefinePlan, ApiError } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RefineComposer } from './refine/RefineComposer';
import { RefinementHistory } from './refine/RefinementHistory';

interface RefineTabProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  onApplyRefinedPlan: (changes: RefinementChanges) => void;
}

const NO_CHANGES_MESSAGE = 'No changes could be applied to your plan. Try a more specific request.';
const NETWORK_ERROR_MESSAGE = 'Network error during refinement. Please retry.';

/** AI Refine tab: natural-language change requests applied as targeted plan updates. */
export function RefineTab({ event, blueprint, onApplyRefinedPlan }: RefineTabProps) {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<RefinementHistoryRecord[]>(() =>
    getRefinementHistory(event.id),
  );
  const [notice, setNotice] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  if (!blueprint) {
    return (
      <Card className="text-center py-16 border-dashed bg-sand-50/30 dark:bg-stone-900/30">
        <Sparkles className="w-12 h-12 text-forest-600 dark:text-forest-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-forest-950 dark:text-forest-100">
          Blueprint Needed Before Refinement
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-6">
          Generate an initial celebration blueprint from the Overview tab first to start
          conversational refinements.
        </p>
      </Card>
    );
  }

  const recordHistory = (userPrompt: string, summary: string, changedSections: string[]) => {
    const entry: RefinementHistoryRecord = {
      id: String(Date.now()),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userPrompt,
      summary,
      changedSections,
    };
    const updated = [entry, ...history];
    setHistory(updated);
    saveRefinementHistory(event.id, updated);
  };

  const handleRefine = async (requestText: string) => {
    const text = requestText.trim();
    if (!text || isSubmitting) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsSubmitting(true);
    setNotice(null);

    try {
      const { refinement } = await apiRefinePlan(event, blueprint, text, controller.signal);
      const resolved = resolveRefinement(blueprint, refinement, event.totalBudget);
      setPrompt('');

      // Never report success for a refinement that changed nothing.
      if (!resolved) {
        setNotice({ kind: 'info', text: NO_CHANGES_MESSAGE });
        return;
      }
      recordHistory(text, resolved.summary, resolved.changedSections);
      onApplyRefinedPlan(resolved);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      logger.error('Error refining plan:', err);
      if (err instanceof ApiError && err.status === 422) {
        setNotice({ kind: 'info', text: err.message || NO_CHANGES_MESSAGE });
      } else {
        setNotice({
          kind: 'error',
          text: err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      <RefineComposer
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleRefine}
        isSubmitting={isSubmitting}
      />

      {notice?.kind === 'error' && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice.text}</span>
        </div>
      )}
      {notice?.kind === 'info' && (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2"
        >
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>{notice.text}</span>
        </div>
      )}

      <RefinementHistory history={history} />
    </div>
  );
}
