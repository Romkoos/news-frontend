import type { News } from '../model/types';
import { http } from '../../../shared/api/http';

export async function fetchToday(): Promise<News[]> {
  const data = await http<News[]>('/news/today', { auth: true });
  return data;
}
