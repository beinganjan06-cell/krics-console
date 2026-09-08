import { api } from "@/lib/adapter";
import { clearSession, persistSession } from "@/lib/auth/session";
import type { LoginPayload, PasswordResetPayload } from "@/types/auth";

export async function signIn(payload: LoginPayload, remember: boolean) {
  const result = await api.login(payload);
  persistSession(result, remember);
  return result;
}

export async function signOut() {
  try {
    await api.logout();
  } catch {
    /* still clear local session */
  }
  clearSession();
}

export async function requestPasswordReset(payload: PasswordResetPayload) {
  return api.requestPasswordReset(payload);
}
