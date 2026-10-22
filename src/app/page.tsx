import { Suspense } from 'react';
import { LandingHero } from '@/components/landing/LandingHero';
import { SavedEventsList } from '@/components/landing/SavedEventsList';
import { CategoryShowcase } from '@/components/landing/CategoryShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#111614] text-[#1c2420] dark:text-[#f3f5f4]">
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
