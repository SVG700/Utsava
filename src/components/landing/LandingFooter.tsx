import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-[#e8e2d7] dark:border-[#26332b] bg-[#f5f1e8] dark:bg-[#0e1311] py-12 text-xs text-[#606d66] dark:text-[#94a19b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#134e3a] text-white flex items-center justify-center text-xs font-bold">
              U
            </div>
            <span className="font-bold text-sm text-[#1c2420] dark:text-[#f3f5f4]">
              Utsava — AI Celebration Planner
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/new" className="hover:text-[#1c2420] dark:hover:text-[#f3f5f4] transition-colors">
              Create Event
            </Link>
            <a href="#categories" className="hover:text-[#1c2420] dark:hover:text-[#f3f5f4] transition-colors">
              Celebration Formats
            </a>
            <a href="#how-it-works" className="hover:text-[#1c2420] dark:hover:text-[#f3f5f4] transition-colors">
              How It Works
            </a>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1c2420] dark:hover:text-[#f3f5f4] transition-colors"
            >
              Get Gemini API Key
            </a>
          </div>

          <div className="text-[11px] text-[#55635c] dark:text-[#94a19b]">
            PromptWars 2026 • Challenge 5
          </div>
        </div>
      </div>
    </footer>
  );
}
