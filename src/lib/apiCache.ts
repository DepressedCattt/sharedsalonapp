/**
 * Lightweight localStorage-based stale-while-revalidate (SWR) cache.
 *
 * Pattern:
 *   1. getCached(key) → return stored data immediately (no spinner)
 *   2. fetchWithRetry(url) → update state + setCached(key, data) in background
 *
 * This makes page navigations feel instant: the user sees last-known data
 * right away while fresh data loads silently behind the scenes.
 */

const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry<T> {
  data: T;
  ts: number;
}

export function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`swr_${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(`swr_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(`swr_${key}`, JSON.stringify(entry));
  } catch {
    // Ignore storage errors (e.g., private browsing or quota exceeded)
  }
}
