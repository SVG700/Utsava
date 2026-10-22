import { Suspense } from 'react';
import { LandingHero } from '@/components/landing/LandingHero';
import { SavedEventsList } from '@/components/landing/SavedEventsList';
import { CategoryShowcase } from '@/components/landing/CategoryShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-sand-50 dark:bg-moss-915 text-moss-875 dark:text-moss-45">
      <main id="main-content">
        <LandingHero />
        <Suspense
          fallback={
            <div className="py-12 text-center text-xs text-stone-400">Loading celebrations...</div>
          }
        >
          <SavedEventsList />
        </Suspense>
        <CategoryShowcase />
        <FeatureGrid />
      </main>
      <LandingFooter />
    </div>
  );
}
