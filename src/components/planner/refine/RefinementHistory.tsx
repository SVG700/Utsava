import React from 'react';
import { Bot, CheckCircle2, MessageSquare, User } from 'lucide-react';
import type { RefinementHistoryRecord } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/Card';

interface RefinementHistoryProps {
  history: RefinementHistoryRecord[];
}

/** Log of past refinement requests, Gemini's summaries and the sections they changed. */
export function RefinementHistory({ history }: RefinementHistoryProps) {
  return (
    <section className="space-y-4" aria-labelledby="refinement-log-heading">
      <div className="flex items-center justify-between">
        <h3
          id="refinement-log-heading"
          className="text-sm font-bold text-forest-950 dark:text-forest-100 flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-forest-700 dark:text-forest-400" />
          Refinement Activity Log ({history.length})
        </h3>
        {history.length > 0 && (
          <span className="text-xs text-stone-400">
            Deterministic merge preserving unmentioned fields
          </span>
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
        <ol className="space-y-3">
          {history.map((item) => (
            <li key={item.id}>
              <Card className="border-sand-200 dark:border-stone-800 shadow-soft">
                <CardContent className="p-4 space-y-3">
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

                  <div className="pt-2.5 border-t border-sand-100 dark:border-stone-800 pl-7 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-forest-800 dark:text-forest-300 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.summary}</span>
                    </div>
                    {item.changedSections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center pt-1">
                        <span className="text-[10px] text-stone-400">Sections updated:</span>
                        {item.changedSections.map((section) => (
                          <span
                            key={section}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 border border-forest-200 dark:border-forest-800"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
