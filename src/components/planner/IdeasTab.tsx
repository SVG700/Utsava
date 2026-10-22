'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import {
  Sparkles,
  Leaf,
  Plus,
  Check,
  Palette,
  UtensilsCrossed,
  PartyPopper,
  Gift,
  Lightbulb,
  Coins,
} from 'lucide-react';
import type { StoredEvent, AIIdeaSection, AIIdeas, TimelineTask } from '@/schemas';
import { calculateDueDate } from '@/lib/dates';
import { getEventIdeas, saveEventIdeas } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiGenerateIdeas, ApiError } from '@/lib/api';

interface IdeasTabProps {
  event: StoredEvent;
  onAddTask: (task: Omit<TimelineTask, 'id'>) => void;
}

const SECTIONS: Array<{
  id: AIIdeaSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}> = [
  {
    id: 'theme',
    label: 'Theme & Style',
    icon: Palette,
    desc: 'Aesthetic concepts & dress code styles',
  },
  {
    id: 'food',
    label: 'Food & Live Stalls',
    icon: UtensilsCrossed,
    desc: 'Indian culinary ideas & live chaat',
  },
  {
    id: 'activities',
    label: 'Celebration Activities',
    icon: PartyPopper,
    desc: 'Rituals, interactive games & performances',
  },
  {
    id: 'decor',
    label: 'Decor & Ambience',
    icon: Sparkles,
    desc: 'Mandap, lighting & entrance setups',
  },
  {
    id: 'return-gifts',
    label: 'Return Gifts & Favors',
    icon: Gift,
    desc: 'Traditional potli bags & souvenirs',
  },
];

export function IdeasTab({ event, onAddTask }: IdeasTabProps) {
  const [selectedSection, setSelectedSection] = useState<AIIdeaSection>('food');
  const [ideasBySection, setIdeasBySection] = useState<Record<string, AIIdeas['ideas']>>(() => {
    return getEventIdeas(event.id);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [addedTitles, setAddedTitles] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchIdeas = async (section: AIIdeaSection) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiGenerateIdeas(
        event,
        section,
        (ideasBySection[section] || []).map((i) => i.title),
        controller.signal,
      );

      const existing = ideasBySection[section] || [];
      const incoming: AIIdeas['ideas'] = data.ideas.ideas || [];
      const newItems = incoming.filter(
        (ni) =>
          !existing.some((ei) => ei.title.trim().toLowerCase() === ni.title.trim().toLowerCase()),
      );
      const combined = [...existing, ...newItems];

      setIdeasBySection((prev) => {
        const next = {
          ...prev,
          [section]: combined,
        };
        saveEventIdeas(event.id, next);
        return next;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      logger.error('Error fetching ideas:', err);
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Network error while requesting ideas. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const currentIdeas = ideasBySection[selectedSection] || [];

  const handleAddAsTask = (title: string, desc: string) => {
    onAddTask({
      title: `Plan idea: ${title}`,
      description: desc,
      dueDate: calculateDueDate(event.date, 14),
      daysBeforeEvent: 14,
      priority: 'medium',
      completed: false,
      category: selectedSection,
    });
    setAddedTitles((prev) => ({ ...prev, [title]: true }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <Badge variant="forest" className="mx-auto">
          <Lightbulb className="w-3.5 h-3.5 mr-1" /> Idea Studio
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-forest-100">
          Personalized Indian Celebration Ideas
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Brainstorm creative concepts tailored to {event.city}, your guest count (
          {event.guestCount}), and cultural traditions on demand.
        </p>
      </div>

      {/* Section Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SECTIONS.map((sec) => {
          const isSelected = selectedSection === sec.id;
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedSection(sec.id);
                if (!ideasBySection[sec.id]) {
                  fetchIdeas(sec.id);
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-forest-600 bg-forest-50/80 dark:bg-forest-950/40 shadow-soft ring-2 ring-forest-600/20'
                  : 'border-sand-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-forest-300 dark:hover:border-forest-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isSelected
                    ? 'bg-forest-900 text-white dark:bg-forest-600'
                    : 'bg-sand-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">{sec.label}</h4>
              <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{sec.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          Showing suggestions for{' '}
          <strong className="capitalize text-forest-900 dark:text-forest-300">
            {selectedSection}
          </strong>
        </span>
        <Button
          size="sm"
          variant="primary"
          onClick={() => fetchIdeas(selectedSection)}
          isLoading={isLoading}
          disabled={isLoading}
          className="text-xs gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {currentIdeas.length > 0 ? 'Generate More Ideas' : 'Generate Ideas'}
        </Button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-xs text-rose-700 dark:text-rose-300"
        >
          {errorMessage}
        </div>
      )}

      {/* Ideas Grid */}
      {isLoading && currentIdeas.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-sand-200/60 dark:bg-stone-800 rounded-2xl" />
          ))}
        </div>
      ) : currentIdeas.length === 0 ? (
        <Card className="text-center py-14 border-dashed bg-sand-50/30 dark:bg-stone-900/30">
          <Sparkles className="w-10 h-10 text-forest-600 dark:text-forest-400 mx-auto mb-2" />
          <h3 className="font-semibold text-sm text-stone-800 dark:text-stone-200">
            No ideas generated for {selectedSection} yet.
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Click Generate Ideas to fetch creative, culturally tailored concepts from Gemini.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => fetchIdeas(selectedSection)}
            isLoading={isLoading}
          >
            Generate {selectedSection} Ideas
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentIdeas.map((idea, idx) => {
            const isAdded = addedTitles[idea.title];

            return (
              <Card
                key={idx}
                className="hover:border-forest-300 dark:hover:border-forest-700 transition-all flex flex-col justify-between shadow-soft"
              >
                <CardContent className="p-5 space-y-3.5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {idea.title}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-sand-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold shrink-0 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-stone-400" />
                        {idea.estimatedCost}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mt-2">
                      {idea.description}
                    </p>
                  </div>

                  {idea.sustainability && (
                    <div className="p-2.5 rounded-xl bg-forest-50/70 dark:bg-forest-950/30 border border-forest-200/60 dark:border-forest-900/60 text-[11px] text-forest-800 dark:text-forest-300 flex items-start gap-2">
                      <Leaf className="w-3.5 h-3.5 shrink-0 mt-0.5 text-forest-600" />
                      <span>{idea.sustainability}</span>
                    </div>
                  )}
                </CardContent>

                <div className="p-3 bg-sand-50/50 dark:bg-stone-900/50 border-t border-sand-100 dark:border-stone-800 flex justify-end">
                  <Button
                    size="sm"
                    variant={isAdded ? 'secondary' : 'outline'}
                    disabled={isAdded}
                    onClick={() => handleAddAsTask(idea.title, idea.description)}
                    className="text-xs gap-1"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-forest-600" /> Added to Tasks
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Add to Timeline
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
