import { getApiBase } from './config';
import { isErrorWithMessage } from '../lib/isErrorWithMessage';
import { lsGet, lsSet, lsRemove } from '../storage/persist';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: boolean; // attach Authorization header if token exists
  signal?: AbortSignal;
};

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return lsGet(TOKEN_KEY);
}

export function setToken(token: string): void {
  lsSet(TOKEN_KEY, token);
}

export function clearToken(): void {
  lsRemove(TOKEN_KEY);
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const API = getApiBase();
  const url = path.startsWith('http') ? path : `${API}${path}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...options.headers,
  };

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
      credentials: 'include',
    });
  } catch (e: unknown) {
    if (isErrorWithMessage(e)) {
      throw new Error(`Network error: ${e.message}`);
    }
    throw e;
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && typeof data.message === 'string') {
        msg = data.message;
      }
    } catch {
      // ignore json parse errors
    }
    throw new Error(msg);
  }

  // No content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  try {
    return (await res.json()) as T;
  } catch (e: unknown) {
    if (isErrorWithMessage(e)) {
      throw new Error(e.message);
    }
    throw e;
  }
}
