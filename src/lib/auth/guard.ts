import { redirect } from "@tanstack/react-router";
import { hasClientSession } from "./session";

const PUBLIC_PATHS = new Set(["/login", "/forgot-password"]);

async function resolveAuthenticated(): Promise<boolean> {
  if (typeof document !== "undefined") return hasClientSession();
  try {
    const { hasServerSession } = await import("./has-session.server");
    return hasServerSession();
  } catch {
    return false;
  }
}

export async function enforceAuth(pathname: string) {
  const authed = await resolveAuthenticated();
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (isPublic) {
    if (authed && pathname === "/login") {
      throw redirect({ to: "/dashboard" });
    }
    return;
  }

  if (!authed) {
    throw redirect({
      to: "/login",
      search: { redirect: pathname && pathname !== "/" ? pathname : undefined } as never,
    });
  }
}
