import { useState, useEffect, type ComponentType } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Database, Building2, HardHat,
  BarChart3, Settings, ChevronDown, ChevronRight, Menu, X,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_GROUP_STORAGE_KEY } from "@/lib/constants";
import { KricsLogo } from "@/components/brand/KricsLogo";
import { findActiveGroup, isLeafActive, isNavItemActive, pathMatches, type NavGroup } from "@/lib/nav";
import { useAccessNav } from "@/lib/auth/use-access";
import { menuIcon } from "@/lib/access";

const GROUP_ICONS: Record<string, ComponentType<LucideProps>> = {
  masters: Database,
  institutions: Building2,
  works: HardHat,
  reports: BarChart3,
  admin: Settings,
};

function loadOpenGroup(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY);
    if (!raw) return null;
    if (raw.startsWith("[")) {
      const ids = JSON.parse(raw) as string[];
      return ids.find((id) => id !== "dashboard") ?? null;
    }
    return raw;
  } catch {
    return null;
  }
}

interface SidebarProps { mobileOpen: boolean; onMobileClose: () => void }

const navItem =
  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors mb-0.5";
const navIdle = "text-white/85 hover:bg-white/10 hover:text-white";
const navActive = "bg-white text-[#0d5c56]";

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useAccessNav();
  const [openGroupId, setOpenGroupId] = useState<string | null>(
    () => findActiveGroup(pathname, nav)?.id ?? null,
  );

  useEffect(() => {
    try {
      if (openGroupId) localStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, openGroupId);
      else localStorage.removeItem(SIDEBAR_GROUP_STORAGE_KEY);
    } catch { /* ignore */ }
  }, [openGroupId]);

  useEffect(() => {
    const active = findActiveGroup(pathname, nav);
    setOpenGroupId(active?.id ?? loadOpenGroup());
  }, [pathname, nav]);

  function toggle(id: string) {
    setOpenGroupId((prev) => (prev === id ? null : id));
  }

  function openGroupAndGo(group: NavGroup) {
    setOpenGroupId(group.id);
    const first = group.items[0];
    if (first) {
      void navigate({ to: first.to as never });
      onMobileClose();
    }
  }

  const inner = (
    <nav className="flex flex-col h-full">
      <div className="flex h-14 items-center gap-2 px-3 border-b border-white/15 shrink-0">
        <Link
          to="/dashboard"
          onClick={onMobileClose}
          className="flex min-w-0 flex-1 items-center"
          aria-label="KRICS home"
        >
          <KricsLogo wordmark light size="sm" />
        </Link>
        <button
          type="button"
          className="ml-auto lg:hidden text-white/80 hover:text-white"
          onClick={onMobileClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map((entry) => {
          if (entry.kind === "leaf") {
            const isActive = isLeafActive(pathname, entry, nav) || pathMatches(pathname, entry.to);
            const Icon = entry.icon ? menuIcon(entry.icon) : (GROUP_ICONS[entry.id] ?? LayoutDashboard);
            return (
              <Link
                key={entry.id}
                to={entry.to as never}
                onClick={() => { setOpenGroupId(null); onMobileClose(); }}
                className={cn(navItem, isActive ? navActive : navIdle)}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1 text-left truncate">{entry.label}</span>
              </Link>
            );
          }

          const group = entry;
          const isOpen = openGroupId === group.id;
          const isGroupActive = findActiveGroup(pathname, nav)?.id === group.id;
          const Icon = group.icon ? menuIcon(group.icon) : (GROUP_ICONS[group.id] ?? Settings);
          return (
            <div key={group.id} className="mb-0.5">
              <div
                className={cn(
                  "w-full flex items-center rounded-md text-[13px] font-medium transition-colors",
                  isGroupActive ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => openGroupAndGo(group)}
                  className="flex-1 flex items-center gap-2 px-2.5 py-1.5 min-w-0 text-left"
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{group.label}</span>
                </button>
                <button
                  type="button"
                  aria-label={isOpen ? `Collapse ${group.label}` : `Expand ${group.label}`}
                  onClick={() => toggle(group.id)}
                  className="px-2 py-1.5 text-inherit hover:opacity-80"
                >
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
              </div>
              {isOpen && (
                <div className="ml-4 mt-0.5 border-l border-white/20 pl-2 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isNavItemActive(pathname, item, nav);
                    return (
                      <Link
                        key={item.to}
                        to={item.to as never}
                        onClick={() => { setOpenGroupId(group.id); onMobileClose(); }}
                        className={cn(
                          "block px-2 py-1 rounded-md text-[12px] transition-colors",
                          isActive
                            ? "bg-white text-[#0d5c56] font-medium"
                            : "text-white/70 hover:text-white hover:bg-white/10",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#0d5c56] h-screen sticky top-0">
        {inner}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} aria-hidden="true" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0d5c56]">{inner}</aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  );
}
