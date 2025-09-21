import { http } from '../../../shared/api/http';
import type { ModerationItem } from '../model/types';

export async function getModeration(limit = 20, offset = 0): Promise<ModerationItem[]> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (offset != null) params.set('offset', String(offset));
  const qs = params.toString();
  const path = qs ? `/moderation?${qs}` : '/moderation';
  return http<ModerationItem[]>(path, { auth: true });
}

export async function approveModeration(id: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`/moderation/${id}/approve`, { method: 'POST', auth: true });
}

export async function rejectModeration(id: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`/moderation/${id}/reject`, { method: 'POST', auth: true });
}
