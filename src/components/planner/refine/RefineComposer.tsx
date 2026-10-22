import React from 'react';
import { DollarSign, HeartHandshake, Leaf, Music, Send, Soup } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const QUICK_PROMPTS = [
  { icon: Leaf, text: 'Make decor 100% eco-friendly, zero-plastic and potted-plant based' },
  { icon: DollarSign, text: 'Cut venue budget by 20% and reallocate to gourmet Indian catering' },
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

interface RefineComposerProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: (prompt: string) => void;
  isSubmitting: boolean;
}

/** Free-text refinement request box plus one-click suggestion chips. */
export function RefineComposer({
  prompt,
  onPromptChange,
  onSubmit,
  isSubmitting,
}: RefineComposerProps) {
  return (
    <Card className="border-sand-200 dark:border-stone-800 shadow-soft">
      <CardContent className="p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(prompt);
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
              onChange={(e) => onPromptChange(e.target.value)}
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

        <div className="space-y-2 pt-1">
          <span
            id="quick-suggestions-label"
            className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block"
          >
            Quick Suggestions:
          </span>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-labelledby="quick-suggestions-label"
          >
            {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
              <button
                key={text}
                type="button"
                onClick={() => {
                  onPromptChange(text);
                  onSubmit(text);
                }}
                disabled={isSubmitting}
                className="text-[11px] font-medium px-3 py-1.5 rounded-xl border border-sand-200 dark:border-stone-800 bg-sand-50/70 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-forest-400 hover:bg-forest-50/50 dark:hover:bg-forest-950/30 transition-all cursor-pointer text-left flex items-center gap-1.5"
              >
                <Icon className="w-3 h-3 text-forest-700 dark:text-forest-400 shrink-0" />
                <span>{text}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
