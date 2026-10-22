import React from 'react';
import { Palette, Sparkles, Leaf } from 'lucide-react';
import type { AIBlueprint, StoredEvent } from '@/schemas';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface DashboardBlueprintViewProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  onGenerateBlueprint: () => void;
  isGeneratingBlueprint: boolean;
}

export function DashboardBlueprintView({
  event,
  blueprint,
  onGenerateBlueprint,
  isGeneratingBlueprint,
}: DashboardBlueprintViewProps) {
  if (!blueprint) {
    return (
      <Card className="text-center p-8 sm:p-12 border-dashed border-linen-180 dark:border-moss-790">
        <div className="w-12 h-12 rounded-2xl bg-forest-50 dark:bg-moss-860 text-forest-700 dark:text-mint-295 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-lg text-moss-875 dark:text-moss-45">
          Generate Your AI Celebration Blueprint
        </h3>
        <p className="text-xs sm:text-sm text-moss-620 dark:text-moss-415 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
          Let Gemini design personalized themes, Indian ritual timeline tasks, budget percentages,
          and vendor requirements tailored for {event.city}.
        </p>
        <Button
          variant="primary"
          onClick={onGenerateBlueprint}
          isLoading={isGeneratingBlueprint}
          className="gap-2 shadow-soft"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Blueprint Now</span>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Concept & Decor Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-moss-860 text-forest-700 dark:text-mint-295 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Theme & Styling Blueprint</CardTitle>
              <CardDescription>Visual concept & aesthetic guidelines</CardDescription>
            </div>
          </div>
          <Badge variant="forest">AI Recommended</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h4 className="font-bold text-lg text-moss-875 dark:text-moss-45">
              {blueprint.themeAndDecor.mainTheme}
            </h4>
            <p className="text-xs sm:text-sm text-moss-620 dark:text-moss-415 mt-1 leading-relaxed">
              {blueprint.themeAndDecor.description}
            </p>
          </div>

          {/* Color Palette */}
          <div>
            <span className="text-[11px] font-bold text-moss-620 dark:text-moss-415 uppercase tracking-wider block mb-2">
              Color Palette
            </span>
            <div className="flex flex-wrap gap-2">
              {blueprint.themeAndDecor.colorPalette.map((color, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-medium border bg-sand-50 dark:bg-moss-865 border-linen-135 dark:border-moss-810 text-moss-810 dark:text-moss-155 capitalize shadow-2xs"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>

          {/* Decor Ideas */}
          <div>
            <span className="text-[11px] font-bold text-moss-620 dark:text-moss-415 uppercase tracking-wider block mb-2">
              Decor & Atmospheric Elements
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {blueprint.themeAndDecor.decorIdeas.map((idea, i) => (
                <li
                  key={i}
                  className="p-3 rounded-xl bg-sand-50 dark:bg-moss-865 border border-sand-200 dark:border-moss-810 flex items-start gap-2 text-moss-810 dark:text-moss-155"
                >
                  <span className="text-forest-700 dark:text-mint-285 font-bold">•</span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scaled Celebration Activities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-moss-860 text-forest-700 dark:text-mint-295 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Scaled Celebration Activities</CardTitle>
              <CardDescription>Tailored for {event.guestCount} guests</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blueprint.activities.map((act, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-sand-200 dark:border-moss-815 bg-sand-50/60 dark:bg-moss-885/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-moss-875 dark:text-moss-45">{act.name}</h4>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-linen-85 dark:bg-moss-845 text-moss-620 dark:text-moss-415 font-medium">
                    {act.estimatedDuration}
                  </span>
                </div>
                <p className="text-xs text-moss-620 dark:text-moss-415 leading-relaxed">
                  {act.description}
                </p>
                <span className="text-[11px] text-forest-700 dark:text-mint-295 font-medium block">
                  Suitable for: {act.suitableFor}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sustainable & Budget Alternatives */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Eco-Friendly & Accessible Alternatives</CardTitle>
              <CardDescription>
                Smart alternatives to high-cost traditional elements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {blueprint.alternatives.map((alt, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-1.5 font-bold text-moss-875 dark:text-moss-45">
                  <span className="text-rose-600 dark:text-rose-400 line-through font-normal">
                    {alt.original}
                  </span>
                  <span className="text-moss-660 dark:text-moss-415">→</span>
                  <span className="text-emerald-800 dark:text-emerald-400 font-semibold">
                    Smart Alternatives:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-moss-885 border border-linen-135 dark:border-moss-790">
                    <span className="text-[10px] font-bold text-saffron-535 dark:text-saffron-290 block uppercase">
                      Budget-Friendly
                    </span>
                    <span className="text-moss-810 dark:text-moss-155 mt-0.5 block leading-relaxed">
                      {alt.budgetFriendly}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-moss-885 border border-linen-135 dark:border-moss-790">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                      Sustainable
                    </span>
                    <span className="text-moss-810 dark:text-moss-155 mt-0.5 block leading-relaxed">
                      {alt.sustainable}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-moss-885 border border-linen-135 dark:border-moss-790">
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 block uppercase">
                      Accessible
                    </span>
                    <span className="text-moss-810 dark:text-moss-155 mt-0.5 block leading-relaxed">
                      {alt.accessible}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
