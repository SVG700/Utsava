'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Trash2,
  ArrowRight,
  Heart,
  PartyPopper,
  Flame,
  PlusCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { getAllEvents, deleteEvent, saveEvent } from '@/lib/storage';
import { formatINR } from '@/lib/budget';
import { formatDisplayDate, daysUntilEvent, getTodayString, calculateDueDate } from '@/lib/dates';
import type { StoredEvent, EventType } from '@/schemas';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToDelete, setEventToDelete] = useState<StoredEvent | null>(null);
  const [today, setToday] = useState('');

  const loadEvents = () => {
    const list = getAllEvents();
    list.sort((a, b) => a.date.localeCompare(b.date));
    setEvents(list);
    setToday(getTodayString());
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = () => {
    if (!eventToDelete) return;
    deleteEvent(eventToDelete.id);
    setEventToDelete(null);
    loadEvents();
  };

  const handleCreateTemplate = (template: {
    eventType: EventType;
    name: string;
    city: string;
    guestCount: number;
    totalBudget: number;
    theme: string;
    dietaryPreferences: Array<'vegetarian' | 'non-vegetarian' | 'jain' | 'vegan'>;
    culturalPreferences: string;
    subEvents: Array<'haldi' | 'mehendi' | 'sangeet' | 'wedding' | 'reception'>;
  }) => {
    const dateStr = calculateDueDate(getTodayString(), -90);

    const newEvent: StoredEvent = {
      ...template,
      id: uuidv4(),
      date: dateStr,
      accessibilityNeeds: 'Wheelchair ramp for elderly grandparents',
      specialRequirements: 'Eco-friendly banana leaf dining and clay lamps',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveEvent(newEvent);
    router.push(`/events/${newEvent.id}?new=true`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#111614] text-[#1c2420] dark:text-[#f3f5f4]">
      {/* ─── 1. HERO SECTION ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-[#e8e2d7] dark:border-[#26332b]">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#134e3a]/8 via-[#c48a3f]/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Challenge / Pill badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f3ee] dark:bg-[#152a22] border border-[#cbe4d7] dark:border-[#1d4235] text-xs font-semibold text-[#134e3a] dark:text-[#34d399]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PromptWars 2026 • Challenge 5</span>
              </div>

              {/* Exact required headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1c2420] dark:text-[#f3f5f4] leading-[1.12]">
                <span className="block text-xs uppercase tracking-widest text-[#134e3a] dark:text-[#2dd4bf] font-sans font-bold mb-3">
                  Utsava AI Celebration Planner
                </span>
                Every celebration deserves a{' '}
                <span className="italic font-serif font-normal text-[#134e3a] dark:text-[#2dd4bf]">
                  little magic.
                </span>
              </h1>

              {/* Supporting copy */}
              <p className="text-base sm:text-lg text-[#5a6861] dark:text-[#9fb0a8] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Utsava brings intelligent generative planning to Indian multi-day weddings, milestone birthdays, and community festivals. Get deterministic budgets in INR, smart milestone timelines, and vendor checklists in seconds.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link href="/new" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto gap-2 shadow-card"
                  >
                    <span>Plan a New Celebration</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto gap-2"
                  >
                    <span>Explore How It Works</span>
                  </Button>
                </a>
              </div>

              {/* Social proof / stats micro-bar */}
              <div className="pt-6 border-t border-[#e8e2d7] dark:border-[#26332b] grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4]">
                    ₹100%
                  </div>
                  <div className="text-[11px] text-[#606d66] dark:text-[#94a19b] font-medium">
                    Penny-Perfect Math
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4]">
                    7+
                  </div>
                  <div className="text-[11px] text-[#606d66] dark:text-[#94a19b] font-medium">
                    Indian Sub-Events
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4]">
                    Offline
                  </div>
                  <div className="text-[11px] text-[#606d66] dark:text-[#94a19b] font-medium">
                    Private Local Storage
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Composition — Interactive Sample Event Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background decorative card offset */}
                <div className="absolute inset-0 bg-[#e8f3ee] dark:bg-[#1a2e26] rounded-3xl transform rotate-2 scale-95 opacity-80" />

                {/* Main Floating Card */}
                <Card className="relative z-10 p-6 sm:p-7 border border-[#e6e0d4] dark:border-[#2f3f36] shadow-elevated bg-white dark:bg-[#18201c] rounded-3xl">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-5 border-b border-[#f0ece2] dark:border-[#243029]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-semibold text-[#134e3a] dark:text-[#34d399] uppercase tracking-wider">
                          Live AI Blueprint
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1c2420] dark:text-[#f3f5f4]">
                        Ananya & Rohan’s Royal Wedding
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#606d66] dark:text-[#94a19b]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Jaipur, Rajasthan
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> 350 Guests
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fbf4ea] text-[#ab7532] border border-[#f0dfc4] shrink-0">
                      in 68 days
                    </span>
                  </div>

                  {/* Budget Breakdown Preview */}
                  <div className="py-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-[#606d66] dark:text-[#94a19b]">
                        Budget Allocation (INR)
                      </span>
                      <span className="text-sm font-bold text-[#134e3a] dark:text-[#34d399]">
                        ₹20,00,000 Total
                      </span>
                    </div>

                    {/* Stacked Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-[#f0ece3] dark:bg-[#25322b] overflow-hidden flex">
                      <div style={{ width: '35%' }} className="bg-[#134e3a] h-full" title="Venue (35%)" />
                      <div style={{ width: '30%' }} className="bg-[#c48a3f] h-full" title="Catering (30%)" />
                      <div style={{ width: '15%' }} className="bg-emerald-500 h-full" title="Decor (15%)" />
                      <div style={{ width: '12%' }} className="bg-sky-500 h-full" title="Photography (12%)" />
                      <div style={{ width: '8%' }} className="bg-stone-400 h-full" title="Logistics (8%)" />
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#606d66] dark:text-[#94a19b]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#134e3a]" />
                        <span>Venue & Mandap: <strong>₹7,00,000</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#c48a3f]" />
                        <span>Catering & Feast: <strong>₹6,00,000</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Floral & Lighting: <strong>₹3,00,000</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <span>Cinematography: <strong>₹2,40,000</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Sample AI Milestone Task */}
                  <div className="pt-3 border-t border-[#f0ece2] dark:border-[#243029] space-y-2">
                    <span className="text-[11px] font-semibold text-[#606d66] dark:text-[#94a19b] uppercase tracking-wider block">
                      Next Milestone
                    </span>
                    <div className="p-3 rounded-xl bg-[#faf8f5] dark:bg-[#1f2924] border border-[#e8e2d7] dark:border-[#2b3a32] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#134e3a] dark:text-[#34d399]" />
                        <div>
                          <div className="text-xs font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
                            Finalize Palace Banquet Deposit
                          </div>
                          <div className="text-[11px] text-[#606d66] dark:text-[#94a19b]">
                            Due 60 days before event
                          </div>
                        </div>
                      </div>
                      <Badge variant="festive">High</Badge>
                    </div>
                  </div>

                  {/* AI Refinement Quote */}
                  <div className="mt-4 p-3 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] border border-[#cbe4d7] dark:border-[#1d4235] text-[11px] text-[#134e3a] dark:text-[#34d399] flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>AI Suggestion:</strong> Replaced exotic cut flowers with fragrant Marigold & Mogra garlands, saving ₹45,000 while remaining 100% biodegradable.
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. STORED USER CELEBRATIONS SECTION ─────────────────────── */}
      <section className="py-12 sm:py-16 bg-[#ffffff] dark:bg-[#151c18] border-b border-[#e8e2d7] dark:border-[#26332b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#134e3a] dark:text-[#34d399] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Your Events Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
                Active Celebrations
              </h2>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] mt-0.5">
                {events.length} {events.length === 1 ? 'event' : 'events'} stored securely in your browser
              </p>
            </div>

            <Link href="/new">
              <Button variant="primary" size="md" className="gap-2 shrink-0">
                <PlusCircle className="w-4 h-4" />
                <span>Plan a New Celebration</span>
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-[#f0ece3] dark:bg-[#202b25]" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-3xl bg-[#faf8f5] dark:bg-[#18201c] border border-dashed border-[#dcd6c8] dark:border-[#2f3f36] max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                No celebrations planned yet
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] mt-1 mb-5">
                Start planning your wedding, milestone birthday, or community festival in minutes.
              </p>
              <Link href="/new">
                <Button variant="primary" size="md" className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Your First Event</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => {
                const daysLeft = daysUntilEvent(ev.date, today);
                const isPast = daysLeft < 0;
                const isToday = daysLeft === 0;

                const eventTypeBadges = {
                  wedding: { label: 'Wedding', variant: 'festive' as const, icon: Heart },
                  birthday: { label: 'Birthday', variant: 'warning' as const, icon: PartyPopper },
                  community: { label: 'Community', variant: 'forest' as const, icon: Users },
                };

                const badgeConfig = eventTypeBadges[ev.eventType] || eventTypeBadges.community;
                const IconComponent = badgeConfig.icon;

                return (
                  <Card
                    key={ev.id}
                    className="group hover:border-[#134e3a]/40 dark:hover:border-[#2dd4bf]/40 hover:shadow-card transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-5 sm:p-6 space-y-4">
                      {/* Card Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant={badgeConfig.variant} className="gap-1">
                          <IconComponent className="w-3 h-3" />
                          <span>{badgeConfig.label}</span>
                        </Badge>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              isPast
                                ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                                : isToday
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                                : 'bg-[#e8f3ee] text-[#134e3a] dark:bg-[#152a22] dark:text-[#34d399]'
                            }`}
                          >
                            {isPast
                              ? 'Concluded'
                              : isToday
                              ? '🎉 Today!'
                              : `in ${daysLeft} days`}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEventToDelete(ev);
                            }}
                            className="text-[#88968e] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                            aria-label={`Delete ${ev.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Event Title */}
                      <div>
                        <Link href={`/events/${ev.id}`}>
                          <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4] group-hover:text-[#134e3a] dark:group-hover:text-[#2dd4bf] transition-colors line-clamp-1">
                            {ev.name}
                          </h3>
                        </Link>
                        {ev.theme && (
                          <p className="text-xs text-[#606d66] dark:text-[#94a19b] mt-0.5 line-clamp-1 italic">
                            &ldquo;{ev.theme}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f0ece2] dark:border-[#243029] text-xs text-[#606d66] dark:text-[#94a19b]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#134e3a] dark:text-[#2dd4bf]" />
                          <span>{formatDisplayDate(ev.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#134e3a] dark:text-[#2dd4bf]" />
                          <span className="truncate">{ev.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#134e3a] dark:text-[#2dd4bf]" />
                          <span>{ev.guestCount} guests</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
                          <IndianRupee className="w-3.5 h-3.5 text-[#134e3a] dark:text-[#2dd4bf]" />
                          <span>{formatINR(ev.totalBudget)}</span>
                        </div>
                      </div>

                      {/* Open Dashboard Link Button */}
                      <Link href={`/events/${ev.id}`} className="block pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full justify-between group-hover:bg-[#134e3a] group-hover:text-white dark:group-hover:bg-[#2dd4bf] dark:group-hover:text-[#042f2e] transition-all"
                        >
                          <span>Open Planning Dashboard</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. EVENT CATEGORIES SHOWCASE ───────────────────────────── */}
      <section id="categories" className="py-16 sm:py-20 border-b border-[#e8e2d7] dark:border-[#26332b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <Badge variant="forest">Celebration Formats</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
              Tailored for Every Indian Tradition
            </h2>
            <p className="text-sm sm:text-base text-[#606d66] dark:text-[#94a19b] font-normal leading-relaxed">
              From grand 3-day royal weddings to community festival pandals, Utsava’s AI understands cultural rituals, regional dining customs, and guest logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category 1: Weddings */}
            <Card className="p-6 border border-[#e6e0d4] dark:border-[#2f3f36] hover:shadow-card transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                  Weddings & Sangeet Nights
                </h3>
                <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] mt-1 leading-relaxed">
                  Multi-day ceremonies (Haldi, Mehendi, Sangeet, Mandap, Reception) with regional traditions (Marwari, South Indian, Bengali, Punjabi).
                </p>
              </div>
              <div className="pt-2 border-t border-[#f0ece2] dark:border-[#243029] flex items-center justify-between text-xs text-[#606d66] dark:text-[#94a19b]">
                <span>Typical: ₹10L – ₹1Cr+</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCreateTemplate({
                      eventType: 'wedding',
                      name: 'Royal Heritage Wedding',
                      city: 'Jaipur',
                      guestCount: 350,
                      totalBudget: 2000000,
                      theme: 'Royal Rajasthani Palace Ambience',
                      dietaryPreferences: ['vegetarian', 'jain'],
                      culturalPreferences: 'Traditional Marwari rituals & gourmet sweets',
                      subEvents: ['haldi', 'mehendi', 'sangeet', 'wedding', 'reception'],
                    })
                  }
                  className="font-semibold text-[#134e3a] dark:text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Quick Template <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>

            {/* Category 2: Birthdays */}
            <Card className="p-6 border border-[#e6e0d4] dark:border-[#2f3f36] hover:shadow-card transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center justify-center">
                <PartyPopper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                  Milestone Birthdays
                </h3>
                <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] mt-1 leading-relaxed">
                  From 1st birthday theme wonderlands to 18th milestones and 50th/60th Golden Jubilee gatherings with live music and banquet dining.
                </p>
              </div>
              <div className="pt-2 border-t border-[#f0ece2] dark:border-[#243029] flex items-center justify-between text-xs text-[#606d66] dark:text-[#94a19b]">
                <span>Typical: ₹50K – ₹5L</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCreateTemplate({
                      eventType: 'birthday',
                      name: 'Aarav’s 1st Birthday Carnival',
                      city: 'Bengaluru',
                      guestCount: 60,
                      totalBudget: 150000,
                      theme: 'Jungle Safari with Live Puppet Show',
                      dietaryPreferences: ['vegetarian'],
                      culturalPreferences: 'Traditional Ayushya homam followed by evening party',
                      subEvents: [],
                    })
                  }
                  className="font-semibold text-[#134e3a] dark:text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Quick Template <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>

            {/* Category 3: Anniversaries & Festivals */}
            <Card className="p-6 border border-[#e6e0d4] dark:border-[#2f3f36] hover:shadow-card transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                  Festivals & Anniversaries
                </h3>
                <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] mt-1 leading-relaxed">
                  Ganesh Chaturthi Utsav, Diwali Melas, Navratri Dandiya nights, and 25th Silver Jubilee couple banquets with customized return gifts.
                </p>
              </div>
              <div className="pt-2 border-t border-[#f0ece2] dark:border-[#243029] flex items-center justify-between text-xs text-[#606d66] dark:text-[#94a19b]">
                <span>Typical: ₹1L – ₹10L</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCreateTemplate({
                      eventType: 'community',
                      name: 'Society Diwali Mela & Cultural Evening',
                      city: 'Mumbai',
                      guestCount: 300,
                      totalBudget: 400000,
                      theme: 'Traditional Diyas & Eco-Friendly Rangoli',
                      dietaryPreferences: ['vegetarian'],
                      culturalPreferences: 'Live acoustic music, food stalls & children dance performances',
                      subEvents: [],
                    })
                  }
                  className="font-semibold text-[#134e3a] dark:text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Quick Template <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW UTSAVA WORKS (3 STEPS) ──────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#ffffff] dark:bg-[#151c18] border-b border-[#e8e2d7] dark:border-[#26332b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="forest">Simple 3-Step Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
              From First Thought to Flawless Event
            </h2>
            <p className="text-sm sm:text-base text-[#606d66] dark:text-[#94a19b]">
              Say goodbye to messy spreadsheets. Let GenAI draft your plan and let pure code handle the financial math.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#134e3a] text-white flex items-center justify-center font-bold text-lg shadow-soft">
                1
              </div>
              <h3 className="font-bold text-xl text-[#1c2420] dark:text-[#f3f5f4]">
                Share Your Vision
              </h3>
              <p className="text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Specify guest count, total budget in INR, city, dietary needs (Jain, Sattvic, Halal), and chosen sub-events like Sangeet or Mehendi.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#c48a3f] text-white flex items-center justify-center font-bold text-lg shadow-soft">
                2
              </div>
              <h3 className="font-bold text-xl text-[#1c2420] dark:text-[#f3f5f4]">
                GenAI Creates Blueprint
              </h3>
              <p className="text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Google Gemini designs theme aesthetics, activities, vendor checklists, and milestone timeline tasks, with pure code calculating exact budgets.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-soft">
                3
              </div>
              <h3 className="font-bold text-xl text-[#1c2420] dark:text-[#f3f5f4]">
                Refine, Track & Export
              </h3>
              <p className="text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Refine plans in natural language (&ldquo;cut venue by 10%&rdquo;), record real expenses, compare vendor quotes, and print coordinator checklists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. CORE FEATURES SHOWCASE ──────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-[#e8e2d7] dark:border-[#26332b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="forest">Built for Quality</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
              Engineered for Peace of Mind
            </h2>
            <p className="text-sm sm:text-base text-[#606d66] dark:text-[#94a19b]">
              Combining the creative power of GenAI with the precision of deterministic software engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                Deterministic Budget Math
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Never trust AI with your money. Percentages from Gemini are strictly normalized to 100% and converted to penny-perfect rupee allocations in pure code.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                Dynamic Milestone Dates
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Tasks automatically offset from the wedding date. Change the date from December to January? All milestones recalculate instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                Targeted AI Plan Refinement
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Ask for adjustments in chat. AI returns only the changed sections, deep-merging them into your plan without overwriting your custom vendor notes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                Zero Fake Vendors
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Strict safety guardrails prevent AI hallucinating fake business names or phone numbers. AI supplies interview tips; you record real vendor quotes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                Idea Studio On-Demand
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Generate tailored ideas for food stalls, cultural games, return gifts, or eco-friendly decor with one click, and add them directly to your timeline.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
                Export & Print Coordinator Sheets
              </h3>
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
                Export clean CSVs of budget ledgers and task lists. Trigger a print-ready coordinator checklist designed specifically for wedding day managers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FOOTER ──────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#e8e2d7] dark:border-[#26332b] bg-[#f5f1e8] dark:bg-[#0e1311] py-12 text-xs text-[#606d66] dark:text-[#94a19b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#134e3a] text-white flex items-center justify-center text-xs font-bold">
                U
              </div>
              <span className="font-bold text-sm text-[#1c2420] dark:text-[#f3f5f4]">
                Utsava — AI Celebration Planner
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/new" className="hover:text-[#1c2420] dark:hover:text-[#f3f5f4] transition-colors">
                Create Event
              </Link>
              <a href="#categories" className="hover:text-[#1c2420] dark:hover:text-[#f3f5f4] transition-colors">
                Categories
              </a>
              <a href="#how-it-works" className="hover:text-[#1c2420] dark:hover:text-[#f3f5f4] transition-colors">
                How It Works
              </a>
              <span className="text-[#a8b3ac]">|</span>
              <span>PromptWars Virtual 2026 • Challenge 5</span>
            </div>

            <div className="text-center sm:text-right">
              <p>© 2026 Utsava. Local & Private.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        title="Delete Celebration Plan"
        description="Are you sure you want to delete this event? All associated budget categories, expenses, tasks, and vendor records will be permanently removed from this device."
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#1c2420] dark:text-[#f3f5f4]">
            {eventToDelete?.name} ({eventToDelete?.city})
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEventToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              Delete Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
