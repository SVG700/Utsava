'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Holds the most recently deleted item for a short window so the user can undo.
 * The timer is cleared on unmount and whenever a new item replaces the old one.
 */
export function useUndo<T>(windowMs: number) {
  const [item, setItem] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  /** Offers `deleted` for undo until the window expires. */
  const offer = useCallback(
    (deleted: T) => {
      clearTimer();
      setItem(deleted);
      timerRef.current = setTimeout(() => setItem(null), windowMs);
    },
    [clearTimer, windowMs],
  );

  /** Hides the undo offer (call after restoring the item). */
  const dismiss = useCallback(() => {
    clearTimer();
    setItem(null);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { item, offer, dismiss };
}
