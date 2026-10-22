import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const codeClass = 'px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-[11px] font-mono';

/** Setup guidance shown when the server has no Gemini API key configured. */
export function ApiKeyBanner() {
  return (
    <div
      role="alert"
      className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-900 dark:text-amber-200 block text-xs sm:text-sm">
            Gemini API Key Required for AI Features
          </strong>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
            To enable live blueprint generation and idea creation, configure{' '}
            <code className={codeClass}>GEMINI_API_KEY</code> in your{' '}
            <code className={codeClass}>.env.local</code> file or click the key icon in the
            navigation bar.
          </p>
        </div>
      </div>
      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
      >
        <Button size="sm" variant="secondary" className="text-xs" tabIndex={-1}>
          Get Free Gemini Key
        </Button>
      </a>
    </div>
  );
}
