import React from 'react';
import {
  IndianRupee,
  Clock,
  Sliders,
  ShieldCheck,
  Sparkles,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function FeatureGrid() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge variant="forest">Built for Quality</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
            Engineered for Peace of Mind
          </h2>
          <p className="text-sm sm:text-base text-[#606d66] dark:text-[#94a19b]">
            Combining the creative brilliance of Google Gemini with deterministic algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
              Deterministic Budget Math
            </h3>
            <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
              Never trust AI with your money. Percentages from Gemini are strictly normalized to 100% and converted to penny-perfect rupee allocations in pure code.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
              Dynamic Milestone Dates
            </h3>
            <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
              Tasks automatically offset from the celebration date. Change the date from December to January? All deadlines recalculate instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
              Targeted AI Plan Refinement
            </h3>
            <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
              Ask for adjustments in chat. AI returns only the changed sections, deep-merging them into your plan without overwriting your custom vendor records.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
              Zero Fake Vendors
            </h3>
            <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
              Strict safety guardrails prevent AI hallucinating fake business names or numbers. AI supplies interview tips; you record real vendor quotes.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
              Idea Studio On-Demand
            </h3>
            <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
              Generate tailored ideas for food stalls, cultural games, return gifts, or eco-friendly decor with one click, and add them directly to your timeline.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#2f3f36] space-y-3 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-[#e8f3ee] dark:bg-[#152a22] text-[#134e3a] dark:text-[#34d399] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#1c2420] dark:text-[#f3f5f4]">
              Export & Print Coordinator Sheets
            </h3>
            <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] leading-relaxed">
              Export clean CSVs of budget ledgers and task lists. Trigger a print-ready coordinator checklist designed specifically for wedding day managers.
            </p>
          </div>
        </div>

        {/* Privacy Honesty Banner */}
        <div className="mt-12 p-5 rounded-2xl bg-forest-50/70 dark:bg-forest-950/30 border border-forest-200 dark:border-forest-800 flex items-start gap-3.5 shadow-soft max-w-4xl mx-auto">
          <Lock className="w-5 h-5 text-forest-700 dark:text-forest-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-forest-950 dark:text-forest-200 leading-relaxed">
            <strong className="font-semibold block text-forest-950 dark:text-forest-100 mb-0.5">
              Privacy & Data Protection Guarantee
            </strong>
            Processed securely via Google Gemini API; your data is never used to train public models or sold to third parties. All celebration budgets, guest lists, and vendor contact records remain securely stored inside your local browser storage.
          </div>
        </div>
      </div>
    </section>
  );
}
