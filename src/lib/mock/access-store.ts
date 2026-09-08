import { flattenNavItems } from "@/lib/nav";
import { ApiError } from "@/types/api";
import type { Paginated } from "@/types/api";
import type { ListParams } from "@/types/api";
import {
  emptyAccess,
  fullAccess,
  type AdminMenu,
  type AdminRole,
  type AdminUser,
  type MenuPayload,
  type RoleAccessItem,
  type RolePayload,
  type UserMenu,
  type UserPayload,
} from "@/types/access";

function nowIso() {
  return new Date().toISOString();
}

function paginate<T>(rows: T[], params: ListParams = {}): Paginated<T> {
  const page = Number(params.page ?? 1);
  const size = Number(params.page_size ?? 25);
  const start = (page - 1) * size;
  return {
    count: rows.length,
    next: start + size < rows.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: rows.slice(start, start + size),
  };
}

const seed = flattenNavItems().map((row, i) => ({
  id: i + 1,
  label: row.item.label,
  path: row.item.to,
  icon: row.group.id === "overview" ? "LayoutDashboard" : "",
  sort_order: i + 1,
  parent: null as number | null,
  parent_label: row.group.label === row.item.label ? null : row.group.label,
  is_active: row.item.to !== "/administration/settings",
  updated_at: nowIso(),
}));

let menus: AdminMenu[] = seed.filter((m) => m.path !== "/administration/settings");
let nextMenuId = menus.reduce((max, m) => Math.max(max, m.id), 0) + 1;

const allAccess = (): RoleAccessItem[] => menus.map((m) => ({ menu_id: m.id, ...fullAccess() }));

let roles: AdminRole[] = [
  {
    id: 1,
    name: "Super Admin",
    code: "SUPER_ADMIN",
    description: "Full access to every menu.",
    is_active: true,
    user_count: 1,
    access: allAccess(),
    updated_at: nowIso(),
  },
];
let nextRoleId = 2;

let users: AdminUser[] = [
  {
    id: 1,
    name: "System Admin",
    username: "admin",
    email: "admin@krics.karnataka.gov.in",
    mobile: "",
    role: 1,
    role_name: "Super Admin",
    is_active: true,
    last_login: nowIso(),
    updated_at: nowIso(),
  },
];
let nextUserId = 2;

function refreshRoleCounts() {
  roles = roles.map((r) => ({ ...r, user_count: users.filter((u) => u.role === r.id && u.is_active).length }));
}

export function mockMenusForUser(): UserMenu[] {
  return menus.filter((m) => m.is_active).map((m) => ({
    id: m.id,
    label: m.label,
    path: m.path,
    icon: m.icon,
    sort_order: m.sort_order,
    parent_id: m.parent,
    is_active: m.is_active,
    ...fullAccess(),
  }));
}

export function listMenus(params: ListParams = {}) {
  let rows = [...menus];
  if (params.search) {
    const q = String(params.search).toLowerCase();
    rows = rows.filter((m) => `${m.label} ${m.path} ${m.icon} ${m.parent_label ?? ""}`.toLowerCase().includes(q));
  }
  rows.sort((a, b) => a.sort_order - b.sort_order);
  return paginate(rows, params);
}

export function createMenu(payload: MenuPayload): AdminMenu {
  const parent = menus.find((m) => m.id === payload.parent) ?? null;
  const row: AdminMenu = {
    id: nextMenuId++,
    ...payload,
    parent_label: parent?.label ?? null,
    updated_at: nowIso(),
  };
  menus = [...menus, row];
  return row;
}

export function updateMenu(id: number, payload: Partial<MenuPayload>): AdminMenu {
  menus = menus.map((m) => {
    if (m.id !== id) return m;
    const next = { ...m, ...payload, updated_at: nowIso() };
    next.parent_label = menus.find((p) => p.id === next.parent)?.label ?? null;
    return next;
  });
  const found = menus.find((m) => m.id === id);
  if (!found) throw new ApiError("Menu not found.", 404);
  return found;
}

export function deleteMenu(id: number) {
  updateMenu(id, { is_active: false });
}

export function listRoles(params: ListParams = {}) {
  refreshRoleCounts();
  let rows = [...roles];
  if (params.search) {
    const q = String(params.search).toLowerCase();
    rows = rows.filter((r) => `${r.name} ${r.code} ${r.description}`.toLowerCase().includes(q));
  }
  return paginate(rows, params);
}

export function createRole(payload: RolePayload): AdminRole {
  const row: AdminRole = {
    id: nextRoleId++,
    ...payload,
    code: payload.code.toUpperCase(),
    user_count: 0,
    access: [],
    updated_at: nowIso(),
  };
  roles = [row, ...roles];
  return row;
}

export function updateRole(id: number, payload: Partial<RolePayload>): AdminRole {
  roles = roles.map((r) => (r.id === id ? { ...r, ...payload, id, updated_at: nowIso() } : r));
  const found = roles.find((r) => r.id === id);
  if (!found) throw new ApiError("Role not found.", 404);
  return found;
}

export function deleteRole(id: number) {
  if (users.some((u) => u.role === id && u.is_active)) {
    throw new ApiError("Cannot delete a role that is assigned to users.", 400);
  }
  roles = roles.filter((r) => r.id !== id);
}

export function updateRoleAccess(id: number, access: RoleAccessItem[]): AdminRole {
  const cleaned = access.filter((a) => a.can_read || a.can_create || a.can_edit || a.can_delete).map((a) => ({
    ...a,
    can_read: a.can_read || a.can_create || a.can_edit || a.can_delete,
  }));
  roles = roles.map((r) => (r.id === id ? { ...r, access: cleaned, updated_at: nowIso() } : r));
  const found = roles.find((r) => r.id === id);
  if (!found) throw new ApiError("Role not found.", 404);
  return found;
}

export function listUsers(params: ListParams = {}) {
  let rows = users.map((u) => ({ ...u, role_name: roles.find((r) => r.id === u.role)?.name ?? "—" }));
  if (params.search) {
    const q = String(params.search).toLowerCase();
    rows = rows.filter((u) => `${u.name} ${u.email} ${u.mobile} ${u.role_name}`.toLowerCase().includes(q));
  }
  return paginate(rows, params);
}

export function createUser(payload: UserPayload): AdminUser {
  const row: AdminUser = {
    id: nextUserId++,
    name: payload.name,
    username: payload.username || payload.email.split("@")[0] || `user${nextUserId}`,
    email: payload.email,
    mobile: payload.mobile,
    role: payload.role,
    role_name: roles.find((r) => r.id === payload.role)?.name ?? "—",
    is_active: payload.is_active,
    last_login: null,
    updated_at: nowIso(),
  };
  users = [row, ...users];
  return row;
}

export function updateUser(id: number, payload: Partial<UserPayload>): AdminUser {
  users = users.map((u) => {
    if (u.id !== id) return u;
    const next = { ...u, ...payload, id, updated_at: nowIso() };
    next.role_name = roles.find((r) => r.id === next.role)?.name ?? "—";
    return next;
  });
  const found = users.find((u) => u.id === id);
  if (!found) throw new ApiError("User not found.", 404);
  return found;
}

export function deleteUser(id: number) {
  updateUser(id, { is_active: false });
}

export { emptyAccess, fullAccess };
