'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Heart, PartyPopper, Home, Award, Sparkles, Briefcase, ArrowRight } from 'lucide-react';
import { saveEvent } from '@/lib/storage';
import { calculateDueDate, getTodayString } from '@/lib/dates';
import type { EventType, StoredEvent } from '@/schemas';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TemplateConfig {
  eventType: EventType;
  name: string;
  city: string;
  guestCount: number;
  totalBudget: number;
  theme: string;
  dietaryPreferences: Array<'vegetarian' | 'non-vegetarian' | 'jain' | 'vegan'>;
  culturalPreferences: string;
  accessibilityNeeds: string;
  specialRequirements: string;
  subEvents: Array<'haldi' | 'mehendi' | 'sangeet' | 'wedding' | 'reception'>;
  daysOffset: number;
}

const TEMPLATES: Array<{
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  desc: string;
  budgetRange: string;
  config: TemplateConfig;
}> = [
  {
    icon: Heart,
    iconClass:
      'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    title: 'Weddings & Sangeet Nights',
    desc: 'Multi-day celebrations with Haldi, Mehendi, Sangeet, Mandap, and Reception tailored to regional Indian customs.',
    budgetRange: 'Typical: ₹10L – ₹1Cr+',
    config: {
      eventType: 'wedding',
      name: 'Royal Heritage Wedding',
      city: 'Jaipur',
      guestCount: 350,
      totalBudget: 2000000,
      theme: 'Royal Rajasthani Palace Ambience',
      dietaryPreferences: ['vegetarian', 'jain'],
      culturalPreferences: 'Traditional Marwari rituals & gourmet sweets',
      accessibilityNeeds: 'Wheelchair ramp for elderly grandparents',
      specialRequirements: 'Eco-friendly banana leaf dining and clay lamps',
      subEvents: ['haldi', 'mehendi', 'sangeet', 'wedding', 'reception'],
      daysOffset: 90,
    },
  },
  {
    icon: PartyPopper,
    iconClass:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    title: 'Milestone Birthdays',
    desc: 'From 1st birthday theme wonderlands to 18th milestones and 50th/60th Golden Jubilee gatherings with live music.',
    budgetRange: 'Typical: ₹50K – ₹5L',
    config: {
      eventType: 'birthday',
      name: 'Aarav’s 1st Birthday Jungle Safari',
      city: 'Bengaluru',
      guestCount: 80,
      totalBudget: 150000,
      theme: 'Jungle Safari Wonderland & Balloon Arches',
      dietaryPreferences: ['vegetarian'],
      culturalPreferences: 'Cake cutting ceremony, fun magic show, and toddler soft play area',
      accessibilityNeeds: '',
      specialRequirements: 'Stroller parking area and kid-safe edible decor',
      subEvents: [],
      daysOffset: 30,
    },
  },
  {
    icon: Home,
    iconClass:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    title: 'Griha Pravesh & Housewarming',
    desc: 'Sacred Vastu pooja rituals, milk-boiling ceremony, floral threshold torans, and traditional sit-down feasts.',
    budgetRange: 'Typical: ₹75K – ₹4L',
    config: {
      eventType: 'community',
      name: 'Shanti Niwas Griha Pravesh',
      city: 'Pune',
      guestCount: 120,
      totalBudget: 250000,
      theme: 'Traditional Vedic Marigold & Brass Urli Decor',
      dietaryPreferences: ['vegetarian', 'jain'],
      culturalPreferences:
        'Morning Navagraha havan, Vastu pooja, and afternoon sattvic satyanarayan prasad',
      accessibilityNeeds: 'Elevator access to apartment floor',
      specialRequirements: 'Havan kund smoke ventilation and traditional rangoli at entrance',
      subEvents: [],
      daysOffset: 45,
    },
  },
  {
    icon: Award,
    iconClass:
      'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    title: 'Anniversaries & Jubilees',
    desc: 'Silver (25th) and Golden (50th) wedding anniversaries, vow renewals, emotional photo montages, and musical nights.',
    budgetRange: 'Typical: ₹1.5L – ₹15L',
    config: {
      eventType: 'wedding',
      name: 'Golden Jubilee: 50 Years of Love',
      city: 'Mumbai',
      guestCount: 150,
      totalBudget: 600000,
      theme: 'Vintage Gold & Ivory Elegance',
      dietaryPreferences: ['vegetarian', 'non-vegetarian'],
      culturalPreferences:
        'Vow renewal garland exchange, retro live ghazal musicians, and family memoir video',
      accessibilityNeeds: 'Step-free entrance and cushioned seating for senior guests',
      specialRequirements: 'High-definition projector for 50-year memory reel',
      subEvents: [],
      daysOffset: 60,
    },
  },
  {
    icon: Sparkles,
    iconClass:
      'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900',
    title: 'Festivals & Community Pandals',
    desc: 'Ganesh Utsav, Navratri Dandiya, Diwali Melas, and Durga Puja cultural nights with crowd management and prasad stalls.',
    budgetRange: 'Typical: ₹2L – ₹25L',
    config: {
      eventType: 'community',
      name: 'Sharad Utsav Dandiya Night',
      city: 'Ahmedabad',
      guestCount: 400,
      totalBudget: 450000,
      theme: 'Vibrant Kutch Mirror Work & Folk Illuminations',
      dietaryPreferences: ['vegetarian', 'jain'],
      culturalPreferences:
        'Traditional Garba circles, live dhol players, and midnight fafda-jalebi stalls',
      accessibilityNeeds: 'Wide clear aisles for safe darshan and dance floor entry',
      specialRequirements: 'Certified electrical safety inspection and first aid booth',
      subEvents: [],
      daysOffset: 35,
    },
  },
  {
    icon: Briefcase,
    iconClass:
      'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    title: 'Corporate Galas & Offsites',
    desc: 'Annual award nights, milestone celebrations, themed cocktail mixers, and high-energy employee recognition dinners.',
    budgetRange: 'Typical: ₹5L – ₹50L',
    config: {
      eventType: 'community',
      name: 'Annual Excellence Gala & Awards',
      city: 'Hyderabad',
      guestCount: 200,
      totalBudget: 850000,
      theme: 'Modern Techno-Futuristic Emerald & Slate',
      dietaryPreferences: ['vegetarian', 'non-vegetarian', 'vegan'],
      culturalPreferences:
        'Executive keynote addresses, employee spotlight awards, and interactive live DJ mixer',
      accessibilityNeeds: 'Accessible stage ramp and ADA compliant restrooms',
      specialRequirements:
        'Dual high-lumen projection screens, wireless collar mics, and badging counter',
      subEvents: [],
      daysOffset: 50,
    },
  },
];

export function CategoryShowcase() {
  const router = useRouter();

  const handleLaunchTemplate = (cfg: TemplateConfig) => {
    const eventDate = calculateDueDate(getTodayString(), -cfg.daysOffset);

    const newEvent: StoredEvent = {
      id: uuidv4(),
      eventType: cfg.eventType,
      name: cfg.name,
      date: eventDate,
      city: cfg.city,
      guestCount: cfg.guestCount,
      totalBudget: cfg.totalBudget,
      theme: cfg.theme,
      dietaryPreferences: cfg.dietaryPreferences,
      culturalPreferences: cfg.culturalPreferences,
      accessibilityNeeds: cfg.accessibilityNeeds,
      specialRequirements: cfg.specialRequirements,
      subEvents: cfg.subEvents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveEvent(newEvent);
    router.push(`/events/${newEvent.id}?new=true`);
  };

  return (
    <section
      id="categories"
      className="py-16 sm:py-20 border-b border-sand-200 dark:border-moss-830"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <Badge variant="forest">Celebration Formats</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-moss-875 dark:text-moss-45 tracking-tight">
            Tailored for Every Indian Tradition
          </h2>
          <p className="text-sm sm:text-base text-moss-620 dark:text-moss-415 font-normal leading-relaxed">
            From grand 3-day royal weddings to community festival pandals, Utsava’s AI understands
            cultural rituals, regional dining customs, and guest logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="p-6 border border-linen-135 dark:border-moss-790 hover:shadow-card transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.iconClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-moss-875 dark:text-moss-45">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-moss-620 dark:text-moss-415 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-linen-85 dark:border-moss-835 flex items-center justify-between text-xs text-moss-620 dark:text-moss-415">
                  <span>{item.budgetRange}</span>
                  <button
                    type="button"
                    onClick={() => handleLaunchTemplate(item.config)}
                    aria-label={`Use ${item.title} Quick Template`}
                    className="font-semibold text-forest-700 dark:text-mint-285 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Quick Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
