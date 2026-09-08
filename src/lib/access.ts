import type { ComponentType } from "react";
import {
  BarChart3,
  Building2,
  Database,
  FileText,
  HardHat,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Users,
  type LucideProps,
} from "lucide-react";
import type { MenuAccess, UserMenu } from "@/types/access";
import { emptyAccess } from "@/types/access";
import { NAV, OVERVIEW, pathMatches, type NavEntry } from "@/lib/nav";

const ICONS: Record<string, ComponentType<LucideProps>> = {
  LayoutDashboard,
  Database,
  Building2,
  HardHat,
  BarChart3,
  Settings,
  Users,
  Shield,
  Menu,
  FileText,
};

export function menuIcon(name?: string | null): ComponentType<LucideProps> {
  if (name && ICONS[name]) return ICONS[name]!;
  return FileText;
}

export function buildNavFromMenus(menus: UserMenu[]): NavEntry[] {
  const visible = menus.filter((m) => m.can_read || m.can_create || m.can_edit || m.can_delete);
  const childrenOf = (parentId: number | null) =>
    visible
      .filter((m) => m.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  return childrenOf(null).map((top) => {
    const kids = childrenOf(top.id);
    if (kids.length) {
      return {
        kind: "group" as const,
        id: `menu-${top.id}`,
        label: top.label,
        icon: top.icon,
        items: kids.map((k) => ({ label: k.label, to: k.path })),
      };
    }
    return {
      kind: "leaf" as const,
      id: `menu-${top.id}`,
      label: top.label,
      to: top.path,
      icon: top.icon,
    };
  });
}

export function accessNav(menus?: UserMenu[] | null): NavEntry[] {
  if (menus && menus.length) return buildNavFromMenus(menus);
  return NAV;
}

export function accessForPath(menus: UserMenu[] | undefined, pathname: string): MenuAccess {
  if (!menus?.length) return emptyAccess();
  const hits = menus.filter((m) => m.path && pathMatches(pathname, m.path));
  if (!hits.length) return emptyAccess();
  hits.sort((a, b) => {
    const pathDelta = b.path.length - a.path.length;
    if (pathDelta) return pathDelta;
    const childDelta = Number(b.parent_id != null) - Number(a.parent_id != null);
    if (childDelta) return childDelta;
    const score = (m: UserMenu) => Number(m.can_read) + Number(m.can_create) + Number(m.can_edit) + Number(m.can_delete);
    return score(b) - score(a);
  });
  const best = hits[0]!;
  return {
    can_read: best.can_read,
    can_create: best.can_create,
    can_edit: best.can_edit,
    can_delete: best.can_delete,
  };
}

export function canReadPath(menus: UserMenu[] | undefined, pathname: string): boolean {
  if (!menus?.length) return true;
  if (pathname === "/" || pathname === OVERVIEW.to) {
    return menus.some((m) => m.can_read && pathMatches(pathname, m.path));
  }
  return accessForPath(menus, pathname).can_read;
}

export function firstReadablePath(menus: UserMenu[] | undefined): string {
  if (!menus?.length) return OVERVIEW.to;
  const readable = [...menus]
    .filter((m) => m.can_read && m.path)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const leaf = readable.find((m) => !readable.some((other) => other.parent_id === m.id)) ?? readable[0];
  return leaf?.path || OVERVIEW.to;
}
