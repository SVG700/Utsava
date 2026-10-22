import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Utsava — AI Celebration & Event Planner',
  description:
    'Every celebration deserves a little magic. Organize weddings, birthdays, anniversaries, and community festivals with deterministic budgets, dynamic timelines, and AI ideas.',
  keywords: [
    'event planner',
    'AI celebration planner',
    'Indian wedding planner',
    'birthday planning',
    'budget calculator',
    'vendor checklist',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('utsava_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-sand-50 dark:bg-moss-915 text-moss-875 dark:text-moss-45 selection:bg-forest-700/15 selection:text-forest-700 dark:selection:bg-mint-285/20 dark:selection:text-mint-285">
        {/* Accessible Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest-700 focus:text-white focus:rounded-lg focus:shadow-elevated focus:outline-none"
        >
          Skip to main content
        </a>
        <Suspense
          fallback={<div className="h-16 border-b border-linen-135 dark:border-moss-810" />}
        >
          <Navbar />
        </Suspense>
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
