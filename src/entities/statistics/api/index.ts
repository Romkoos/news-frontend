import { http } from '../../../shared/api/http';

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