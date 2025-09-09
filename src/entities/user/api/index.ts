import { http } from '../../../shared/api/http';
import type { LoginPayload, LoginResponse, MeResponse } from '../model/types';

function isMock(): boolean {
  try {
    const meta = import.meta as unknown as { env?: { VITE_AUTH_MOCK?: string | boolean } };
    return Boolean(meta.env?.VITE_AUTH_MOCK);
  } catch {
    return false;
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (isMock()) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            token: 'mock-token-123',
            user: { id: 1, email: payload.email, name: 'Mock User' },
          }),
        300
      )
    );
  }
  return http<LoginResponse>('/users/login', {
    method: 'POST',
    body: payload,
  });
}

export async function me(): Promise<MeResponse> {
  if (isMock()) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ user: { id: 1, email: 'mock@local', name: 'Mock User' } }), 200)
    );
  }
  return http<MeResponse>('/users/me', { auth: true });
}

export async function logout(): Promise<void> {
  if (isMock()) {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
  await http<void>('/users/logout', { method: 'POST', auth: true });
}
