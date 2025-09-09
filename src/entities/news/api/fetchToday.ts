import { News } from '../model/types';
import { getApiBase } from '../../../shared/api/config';
import { isErrorWithMessage } from '../../../shared/lib/isErrorWithMessage';

export async function fetchToday(): Promise<News[]> {
  const API = getApiBase();
  const res = await fetch(`${API}/news/today`);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  try {
    const data: News[] = await res.json();
    return data;
  } catch (e: unknown) {
    if (isErrorWithMessage(e)) {
      throw new Error(e.message);
    }
    throw e;
  }
}
