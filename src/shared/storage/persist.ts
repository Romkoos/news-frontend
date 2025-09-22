// Simple, safe localStorage helpers and a tiny React hook for persistence
import { useEffect, useState } from 'react';

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function lsGet(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota or privacy errors
  }
}

export function lsRemove(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function lsGetJSON<T>(key: string, fallback: T): T {
  const raw = lsGet(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSetJSON<T>(key: string, value: T): void {
  try {
    lsSet(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Generic React hook to persist a piece of state in localStorage
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => lsGetJSON<T>(key, initial));
  useEffect(() => {
    lsSetJSON<T>(key, state);
  }, [key, state]);
  return [state, setState] as const;
}

// Common keys used across the app
export const LS_KEYS = {
  moderationAuto: 'ui.moderation.autoRefresh',
  filtersOnlyActive: 'ui.filters.onlyActive',
  filtersAction: 'ui.filters.actionFilter',
} as const;
