import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-sand-200 dark:border-moss-830 bg-linen-60 dark:bg-moss-925 py-12 text-xs text-moss-620 dark:text-moss-415">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-forest-700 text-white flex items-center justify-center text-xs font-bold">
              U
            </div>
            <span className="font-bold text-sm text-moss-875 dark:text-moss-45">
              Utsava — AI Celebration Planner
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/new"
              className="hover:text-moss-875 dark:hover:text-moss-45 transition-colors"
            >
              Create Event
            </Link>
            <a
              href="#categories"
              className="hover:text-moss-875 dark:hover:text-moss-45 transition-colors"
            >
              Celebration Formats
            </a>
            <a
              href="#how-it-works"
              className="hover:text-moss-875 dark:hover:text-moss-45 transition-colors"
            >
              How It Works
            </a>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="hover:text-moss-875 dark:hover:text-moss-45 transition-colors"
            >
              Get Gemini API Key
            </a>
          </div>

          <div className="text-[11px] text-moss-660 dark:text-moss-415">
            PromptWars 2026 • Challenge 5
          </div>
        </div>
      </div>
    </footer>
  );
}
