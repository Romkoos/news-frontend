import { http } from '../../../shared/api/http';

export async function postLastUsed(): Promise<void> {
  await http<void>('/news/last-used', { method: 'POST', auth: true });
}
