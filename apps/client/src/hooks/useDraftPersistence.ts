import { useEffect, useRef, useCallback } from "react";

const DEBOUNCE_MS = 1000;

interface DraftData<T> {
  data: T;
  savedAt: number;
}

/**
 * Persists form data to localStorage with debounced writes.
 * Returns helpers to load, save, and clear the draft.
 *
 * @param key - Unique localStorage key for this draft
 * @param data - Current form state to persist
 * @param enabled - Whether auto-save is active (disable after successful submit)
 */
export function useDraftPersistence<T>(
  key: string,
  data: T,
  enabled = true,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save on data changes
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const draft: DraftData<T> = { data, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(draft));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, data, enabled]);

  const loadDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const draft: DraftData<T> = JSON.parse(raw);
      return draft.data;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  const hasDraft = useCallback((): boolean => {
    return localStorage.getItem(key) !== null;
  }, [key]);

  return { loadDraft, clearDraft, hasDraft };
}
