import { EventWizard } from '@/components/EventWizard';

export const metadata = {
  title: 'Plan a New Celebration | Utsava',
  description:
    'Create your personalized celebration plan with AI budgets, timelines, and vendor checklists.',
};

export default function NewEventPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-sand-50 dark:bg-moss-915">
      <EventWizard />
    </main>
  );
}
