import { createContext } from 'react';
import type { User } from '../../entities/user/model/types';

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
