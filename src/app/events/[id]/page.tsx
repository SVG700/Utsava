import { Suspense } from 'react';
import { MainPlanner } from '@/components/planner/MainPlanner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-2 border-forest-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-stone-500">Loading celebration planner...</p>
        </div>
      }
    >
      <MainPlanner eventId={id} />
    </Suspense>
  );
}
