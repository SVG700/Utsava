'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface GenerationProgressModalProps {
  isOpen: boolean;
  eventName: string;
}

const STAGES = [
  { label: 'Analyzing celebration requirements & guest profile', duration: 2500 },
  { label: 'Allocating optimal budget across categories', duration: 3000 },
  { label: 'Generating timeline & ritual milestones', duration: 3000 },
  { label: 'Selecting verified vendor categories & scopes', duration: 3000 },
  { label: 'Finalizing personalized celebration blueprint', duration: 3500 },
];

export function GenerationProgressModal({
  isOpen,
  eventName: _eventName,
}: GenerationProgressModalProps) {
  void _eventName;
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const advanceStage = (index: number) => {
      if (index >= STAGES.length - 1) return;
      timer = setTimeout(() => {
        if (!isMounted) return;
        setCurrentStageIndex((prev) => {
          const next = Math.min(prev + 1, STAGES.length - 1);
          advanceStage(next);
          return next;
        });
      }, STAGES[index].duration);
    };

    advanceStage(0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen]);

  const progressPercent = Math.min(Math.round(((currentStageIndex + 1) / STAGES.length) * 100), 95);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Non-dismissible while generating
      title="Crafting Your AI Celebration Blueprint"
      description="Personalizing celebration blueprint and budgeting parameters..."
      maxWidth="md"
    >
      <div className="space-y-6 py-2">
        {/* Animated Header Visual */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-forest-50 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-800">
          <div className="w-12 h-12 rounded-xl bg-forest-700 text-white flex items-center justify-center shrink-0 shadow-soft">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-forest-950 dark:text-forest-100">
              {STAGES[currentStageIndex].label}...
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Powered by Google Gemini 3.5 & deterministic financial algorithms
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <ProgressBar value={progressPercent} variant="primary" showPercent className="h-2.5" />
        </div>

        {/* Staged Checklist */}
        <div className="space-y-3 pt-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                  isCompleted
                    ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                    : isCurrent
                      ? 'text-forest-900 dark:text-forest-100 font-semibold'
                      : 'text-stone-400 dark:text-stone-600 opacity-60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-forest-700 dark:text-forest-300 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700 shrink-0" />
                )}
                <span>{stage.label}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-center text-stone-500 dark:text-stone-400 pt-2 border-t border-sand-100 dark:border-stone-800">
          This usually takes 5 to 15 seconds. Please do not close your browser tab.
        </p>
      </div>
    </Modal>
  );
}
