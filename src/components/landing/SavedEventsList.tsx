'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Trash2,
  ChevronRight,
  Plus,
  Heart,
  PartyPopper,
  Flame,
} from 'lucide-react';
import { getAllEvents, deleteEvent } from '@/lib/storage';
import { formatINR } from '@/lib/budget';
import { formatDisplayDate } from '@/lib/dates';
import type { StoredEvent } from '@/schemas';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export function SavedEventsList() {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [eventToDelete, setEventToDelete] = useState<StoredEvent | null>(null);

  const loadEvents = () => {
    const list = getAllEvents();
    list.sort(
      (a: StoredEvent, b: StoredEvent) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    setEvents(list);
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

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 border-b border-sand-200 dark:border-moss-830">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-2xl font-bold tracking-tight text-moss-875 dark:text-moss-45">
                Your Saved Celebrations
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-moss-620 dark:text-moss-415 mt-0.5">
              Access your real celebration plans, budget ledgers, and vendor checklists.
            </p>
          </div>

          <Link href="/new">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Plan New Celebration</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <Card
              key={ev.id}
              className="hover:border-forest-700/50 dark:hover:border-mint-285/50 transition-all duration-200 group flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge
                    variant={
                      ev.eventType === 'wedding'
                        ? 'festive'
                        : ev.eventType === 'birthday'
                          ? 'warning'
                          : 'forest'
                    }
                  >
                    {ev.eventType === 'wedding' && <Heart className="w-3 h-3 text-rose-500" />}
                    {ev.eventType === 'birthday' && (
                      <PartyPopper className="w-3 h-3 text-amber-500" />
                    )}
                    {ev.eventType === 'community' && <Flame className="w-3 h-3 text-emerald-500" />}
                    <span className="capitalize">{ev.eventType}</span>
                  </Badge>

                  <button
                    type="button"
                    onClick={() => setEventToDelete(ev)}
                    aria-label={`Delete event: ${ev.name}`}
                    title={`Delete event: ${ev.name}`}
                    className="p-1.5 rounded-lg text-moss-460 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <Link href={`/events/${ev.id}`}>
                    <h3 className="font-bold text-base sm:text-lg text-moss-875 dark:text-moss-45 group-hover:text-forest-700 dark:group-hover:text-mint-285 transition-colors line-clamp-1">
                      {ev.name}
                    </h3>
                  </Link>
                  {ev.theme && (
                    <p className="text-xs text-moss-620 dark:text-moss-415 mt-0.5 line-clamp-1 italic">
                      &ldquo;{ev.theme}&rdquo;
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-linen-85 dark:border-moss-835 text-xs text-moss-620 dark:text-moss-415">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-forest-700 dark:text-mint-285" />
                    <span>{formatDisplayDate(ev.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-forest-700 dark:text-mint-285" />
                    <span className="truncate">{ev.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-forest-700 dark:text-mint-285" />
                    <span>{ev.guestCount} guests</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-moss-875 dark:text-moss-45">
                    <IndianRupee className="w-3.5 h-3.5 text-forest-700 dark:text-mint-285" />
                    <span>{formatINR(ev.totalBudget)}</span>
                  </div>
                </div>

                <Link href={`/events/${ev.id}`} className="block pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-between group-hover:bg-forest-700 group-hover:text-white dark:group-hover:bg-mint-285 dark:group-hover:text-mint-850 transition-all"
                  >
                    <span>Open Planning Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        title="Delete Celebration Plan?"
        description="This will permanently delete this celebration, all budget categories, logged expenses, and vendor records from your local browser storage."
      >
        <div className="space-y-4 pt-2">
          {eventToDelete && (
            <div className="p-3.5 rounded-xl bg-sand-50 dark:bg-stone-800 border border-sand-200 dark:border-stone-700 text-xs space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                {eventToDelete.name}
              </span>
              <span className="text-stone-500 dark:text-stone-400 block">
                {eventToDelete.city} • {formatDisplayDate(eventToDelete.date)} •{' '}
                {formatINR(eventToDelete.totalBudget)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEventToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
