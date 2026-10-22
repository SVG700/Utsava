import React from 'react';

interface UndoToastProps {
  /** Text describing what was deleted. */
  children: React.ReactNode;
  onUndo: () => void;
}

/** Floating, screen-reader-announced notice with an Undo action. */
export function UndoToast({ children, onUndo }: UndoToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-4 py-3 rounded-2xl shadow-xl border border-stone-800 dark:border-stone-200"
    >
      <span className="text-xs font-medium">{children}</span>
      <button
        type="button"
        onClick={onUndo}
        className="text-xs font-bold text-emerald-400 dark:text-emerald-700 hover:underline cursor-pointer"
      >
        Undo
      </button>
    </div>
  );
}
