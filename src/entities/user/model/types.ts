export type User = {
  id: number;
  email: string;
  name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthToken = string;

export type LoginResponse = {
  token: AuthToken;
  user: User;
};

export type MeResponse = {
  user: User;
};
