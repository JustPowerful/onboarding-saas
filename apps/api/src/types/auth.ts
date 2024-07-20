import { Prisma, User } from '@saas-monorepo/database';

export type LoginResult = {
  accessToken: string;
  refreshToken?: any;
  user: Partial<User>;
};
export type AuthCheckResult = {
  user: Partial<User>;
};
export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthCheckPayload = {
  id: string;
};

export type ForgotResult = {
  token: string;
  user: Partial<User>;
};
export type ForgotPayload = {
  email: string;
};

export type ResetPayload = {
  token: string;
  password: string;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export type RegisterResult = {};

export type ResetBody = {
  password: string;
};
