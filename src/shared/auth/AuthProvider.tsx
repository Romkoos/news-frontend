import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User, LoginPayload } from '../../entities/user/model/types';
import { login as apiLogin, logout as apiLogout, me as apiMe } from '../../entities/user/api/index';
import { clearToken, getToken, setToken } from '../api/http';
import { AuthContext, type AuthContextValue } from './context';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const meRes = await apiMe();
        setUser(meRes.user);
      } catch {
        // token might be invalid
        clearToken();
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, []);

  const doLogin = useCallback(async (payload: LoginPayload) => {
    setError(null);
    try {
      const res = await apiLogin(payload);
      setToken(res.token);
      setUser(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  }, []);

  const doLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, error, login: doLogin, logout: doLogout }), [doLogout, doLogin, error, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
