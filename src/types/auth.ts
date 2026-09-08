import type { UserMenu } from "./access";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_code?: string;
  menus?: UserMenu[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface PasswordResetPayload {
  email: string;
}

export interface PasswordResetResponse {
  accepted: boolean;
}
