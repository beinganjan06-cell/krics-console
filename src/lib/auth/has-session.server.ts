import { getCookie } from "@tanstack/react-start/server";
import { AUTH_COOKIE } from "@/lib/constants";

export function hasServerSession(): boolean {
  try {
    return Boolean(getCookie(AUTH_COOKIE));
  } catch {
    return false;
  }
}
