import { EventWizard } from '@/components/EventWizard';

export const metadata = {
  title: 'Plan a New Celebration | Utsava',
  description: 'Create your personalized celebration plan with AI budgets, timelines, and vendor checklists.',
};

export default function NewEventPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#faf8f5] dark:bg-[#111614]">
      <EventWizard />
    </main>
  );
}
