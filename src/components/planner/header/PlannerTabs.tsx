import React from 'react';
import {
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  Lightbulb,
  Printer,
  Sparkles,
  Wallet,
} from 'lucide-react';

export type PlannerTab =
  'dashboard' | 'budget' | 'timeline' | 'vendors' | 'ideas' | 'refine' | 'export';

const TABS: Array<{
  id: PlannerTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'budget', label: 'Budget Manager', icon: Wallet },
  { id: 'timeline', label: 'Smart Timeline', icon: CalendarClock },
  { id: 'vendors', label: 'Vendor Checklist', icon: ClipboardCheck },
  { id: 'ideas', label: 'Idea Studio', icon: Lightbulb },
  { id: 'refine', label: 'AI Refine', icon: Sparkles },
  { id: 'export', label: 'Export & Print', icon: Printer },
];

interface PlannerTabsProps {
  activeTab: PlannerTab;
  onTabChange: (tab: PlannerTab) => void;
}

/** WAI-ARIA tab list for the planner (Arrow keys, Home and End move between tabs). */
export function PlannerTabs({ activeTab, onTabChange }: PlannerTabsProps) {
  const activate = (index: number) => {
    const tab = TABS[(index + TABS.length) % TABS.length];
    onTabChange(tab.id);
    document.getElementById(`tab-${tab.id}`)?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const target = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: TABS.length - 1,
    }[e.key];
    if (target === undefined) return;
    e.preventDefault();
    activate(target);
  };

  return (
    <nav
      className="flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-sand-200 dark:border-moss-830 scrollbar-none"
      aria-label="Planner Tabs"
      role="tablist"
    >
      {TABS.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onKeyDown={(e) => handleKeyDown(e, index)}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 py-3.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isActive
                ? 'border-forest-700 text-forest-700 dark:border-mint-285 dark:text-mint-285'
                : 'border-transparent text-moss-620 hover:text-moss-875 dark:text-moss-415 dark:hover:text-moss-45 hover:border-linen-350'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${isActive ? 'text-forest-700 dark:text-mint-285' : 'text-moss-460'}`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
