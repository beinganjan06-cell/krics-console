import { useAuthUser } from "@/lib/auth/use-auth";
import { accessForPath, accessNav, canReadPath, firstReadablePath } from "@/lib/access";
import { useRouterState } from "@tanstack/react-router";

export function useAccessNav() {
  const user = useAuthUser();
  return accessNav(user?.menus);
}

export function useMenuAccess() {
  const user = useAuthUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return accessForPath(user?.menus, pathname);
}

export function useCanReadPath(pathname: string) {
  const user = useAuthUser();
  return canReadPath(user?.menus, pathname);
}

export function useHomePath() {
  const user = useAuthUser();
  return firstReadablePath(user?.menus);
}
