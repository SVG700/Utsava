import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-sand-200 dark:border-moss-830">
      {/* Decorative subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-forest-700/8 via-saffron-450/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Challenge Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 dark:bg-moss-860 border border-moss-145 dark:border-moss-795 text-xs font-semibold text-forest-700 dark:text-mint-295">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PromptWars 2026 • Challenge 5</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-moss-875 dark:text-moss-45 leading-[1.12]">
              <span className="block text-xs uppercase tracking-widest text-forest-700 dark:text-mint-285 font-sans font-bold mb-3">
                Utsava • AI-Powered Indian Celebration Planner
              </span>
              Every celebration deserves a little magic.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-moss-620 dark:text-moss-415 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Utsava pairs Google Gemini with penny-perfect mathematical financial algorithms. Plan
              weddings, milestone birthdays, and festivals with zero hallucinated budgets and zero
              fake vendors.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link href="/new" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto gap-2.5 shadow-elevated group"
                >
                  <Calendar className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                  <span>Plan a New Celebration</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <span>Explore How It Works</span>
                </Button>
              </a>
            </div>

            {/* Trust & Math Micro-bar */}
            <div className="pt-6 border-t border-sand-200 dark:border-moss-830 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-moss-875 dark:text-moss-45">
                  100%
                </div>
                <div className="text-[11px] text-moss-620 dark:text-moss-415 font-medium">
                  Penny-Perfect Math
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-moss-875 dark:text-moss-45">
                  7+
                </div>
                <div className="text-[11px] text-moss-620 dark:text-moss-415 font-medium">
                  Indian Sub-Events
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-moss-875 dark:text-moss-45">
                  100% Private
                </div>
                <div className="text-[11px] text-moss-620 dark:text-moss-415 font-medium">
                  Local-First Storage
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Composition — Explicitly Labeled Example Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute inset-0 bg-forest-50 dark:bg-moss-850 rounded-3xl transform rotate-2 scale-95 opacity-80" />

              <Card className="relative z-10 p-6 sm:p-7 border border-linen-135 dark:border-moss-790 shadow-elevated bg-white dark:bg-moss-885 rounded-3xl">
                {/* Header with Explicit Live Demo Label */}
                <div className="flex items-start justify-between gap-3 pb-5 border-b border-linen-85 dark:border-moss-835">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-semibold text-forest-700 dark:text-mint-295 uppercase tracking-wider">
                        Example Preview • Live Demo
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-moss-875 dark:text-moss-45">
                      Ananya & Rohan’s Royal Wedding
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-moss-620 dark:text-moss-415">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Jaipur, Rajasthan
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> 350 Guests
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-saffron-45 dark:bg-saffron-880 text-saffron-655 dark:text-saffron-230 border border-linen-130 dark:border-saffron-810 shrink-0">
                    in 68 days
                  </span>
                </div>

                {/* Budget Breakdown Preview */}
                <div className="py-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-moss-620 dark:text-moss-415">
                      Budget Allocation (INR)
                    </span>
                    <span className="text-sm font-bold text-forest-700 dark:text-mint-295">
                      ₹20,00,000 Total
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-linen-85 dark:bg-moss-835 overflow-hidden flex">
                    <div
                      style={{ width: '35%' }}
                      className="bg-forest-700 h-full"
                      title="Venue (35%)"
                    />
                    <div
                      style={{ width: '30%' }}
                      className="bg-saffron-450 h-full"
                      title="Catering (30%)"
                    />
                    <div
                      style={{ width: '15%' }}
                      className="bg-emerald-500 h-full"
                      title="Decor (15%)"
                    />
                    <div
                      style={{ width: '12%' }}
                      className="bg-sky-500 h-full"
                      title="Photography (12%)"
                    />
                    <div
                      style={{ width: '8%' }}
                      className="bg-stone-400 h-full"
                      title="Logistics (8%)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-moss-620 dark:text-moss-415">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-forest-700" />
                      <span>
                        Venue: <strong>₹7,00,000</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-saffron-450" />
                      <span>
                        Catering: <strong>₹6,00,000</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>
                        Decor: <strong>₹3,00,000</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>
                        Photo: <strong>₹2,40,000</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sample AI Milestone Task */}
                <div className="pt-3 border-t border-linen-85 dark:border-moss-835 space-y-2">
                  <span className="text-[11px] font-semibold text-moss-620 dark:text-moss-415 uppercase tracking-wider block">
                    Next Milestone
                  </span>
                  <div className="p-3 rounded-xl bg-sand-50 dark:bg-moss-865 border border-sand-200 dark:border-moss-810 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-forest-700 dark:text-mint-295" />
                      <div className="text-xs">
                        <span className="font-semibold text-moss-875 dark:text-moss-45 block">
                          Finalize Mandap Floral Blueprint
                        </span>
                        <span className="text-[10px] text-moss-660 dark:text-moss-415">
                          Due 30 days before wedding
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold uppercase">
                      High
                    </span>
                  </div>
                </div>

                {/* AI Refinement Quote */}
                <div className="mt-3 p-3 rounded-xl bg-forest-50/60 dark:bg-moss-860/50 border border-moss-145 dark:border-moss-795 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-forest-700 dark:text-mint-295 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini Refinement Insight:</span>
                  </div>
                  <p className="text-moss-810 dark:text-moss-155 text-[11px] leading-relaxed">
                    &ldquo;Switched Rajasthani royal dining to 100% locally sourced organic
                    marigolds and banana leaf thali service, saving ₹1,20,000.&rdquo;
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
