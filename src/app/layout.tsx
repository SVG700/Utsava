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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('utsava_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf8f5] dark:bg-[#111614] text-[#1c2420] dark:text-[#f3f5f4] selection:bg-[#134e3a]/15 selection:text-[#134e3a] dark:selection:bg-[#2dd4bf]/20 dark:selection:text-[#2dd4bf]">
        {/* Accessible Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#134e3a] focus:text-white focus:rounded-lg focus:shadow-elevated focus:outline-none"
        >
          Skip to main content
        </a>
        <Suspense fallback={<div className="h-16 border-b border-[#e6e0d4] dark:border-[#2c3a33]" />}>
          <Navbar />
        </Suspense>
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
