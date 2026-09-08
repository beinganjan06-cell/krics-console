import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Toaster } from "@/components/ui/sonner";
import { matchNav } from "@/lib/nav";
import { api } from "@/lib/adapter";
import { getAuthUser, hasClientSession, replaceAuthUser } from "@/lib/auth/session";
import { useAccessNav, useHomePath } from "@/lib/auth/use-access";
import { canReadPath } from "@/lib/access";
import { useAuthUser } from "@/lib/auth/use-auth";

interface AppShellProps {
  title?: string;
  breadcrumbs?: { label: string }[];
  children: React.ReactNode;
}

export function AppShell({ title, breadcrumbs, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const user = useAuthUser();
  const nav = useAccessNav();
  const home = useHomePath();
  const resolved = matchNav(pathname, nav);
  const displayTitle = resolved.title || title || "KRICS";
  const displayCrumbs = resolved.breadcrumbs.length > 0 ? resolved.breadcrumbs : (breadcrumbs ?? []);

  useEffect(() => {
    if (!hasClientSession()) return;
    void api.getMe().then((next) => replaceAuthUser(next)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const menus = user?.menus ?? getAuthUser()?.menus;
    if (!menus?.length) return;
    if (canReadPath(menus, pathname)) return;
    if (pathname === home) return;
    void navigate({ to: home as never });
  }, [pathname, user, home, navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={displayTitle} breadcrumbs={displayCrumbs} onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
