import { http } from '../../../shared/api/http';

export type DailyStat = {
  date: string; // e.g., '2025-09-24'
  published: number;
  rejected: number;
  moderated: number;
  filtered: number;
};

export type FiltersDailyItem = { note: string; count: number };
export type FiltersDaily = { date: string; items: FiltersDailyItem[] }[];

// Returns an array of numbers representing hourly stats for the last 24 hours
export async function getStats24h(): Promise<number[]> {
  // Note: http() already prefixes with API base (default '/api'),
  // so we pass '/stats/24h' here to reach '/api/stats/24h'.
  return http<number[]>('/stats/24h', { auth: true });
}

export async function getHiddenStats24h(): Promise<number[]> {
    // Note: http() already prefixes with API base (default '/api'),
    // so we pass '/stats/24h' here to reach '/api/stats/24h'.
    return http<number[]>('/stats/24h-hidden', { auth: true });
}

export async function getDaily(days: number): Promise<DailyStat[]> {
  const params = new URLSearchParams();
  if (days != null) params.set('days', String(days));
  const qs = params.toString();
  // Keeping the existing '/stats/daily' base to avoid breaking changes
  const path = qs ? `/stats/daily?${qs}` : '/stats/daily';
  return http<DailyStat[]>(path, { auth: true });
}

export async function getFiltersDaily(days: number): Promise<FiltersDaily> {
  const params = new URLSearchParams();
  if (days != null) params.set('days', String(days));
  const qs = params.toString();
  const path = qs ? `/stats/filters/daily?${qs}` : '/filters/daily';
  return http<FiltersDaily>(path, { auth: true });
}
