import { flattenNavItems } from "@/lib/nav";

export type MenuAccess = {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
};

export type AdminMenu = {
  id: number;
  label: string;
  path: string;
  parent: string;
  is_active: boolean;
  sort_order: number;
  audit_enabled: boolean;
};

export type AdminRole = {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  audit_access: boolean;
  menu_ids: number[];
  permissions: Record<number, MenuAccess>;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role_id: number;
  status: "active" | "inactive";
  last_login: string | null;
};

export type AuditAction = "create" | "update" | "delete" | "access";
export type AuditEntity = "user" | "role" | "menu" | "setting";

export type AuditEntry = {
  id: number;
  at: string;
  actor: string;
  action: AuditAction;
  entity: AuditEntity;
  detail: string;
};

export type AdminSettings = {
  org_name: string;
  session_timeout_minutes: number;
  audit_logging: boolean;
  default_page_size: number;
  allow_self_role_edit: boolean;
};

const ACTOR = "System Admin";

function nowIso() {
  return new Date().toISOString();
}

function fullAccess(): MenuAccess {
  return { view: true, add: true, edit: true, delete: true };
}

function viewOnly(): MenuAccess {
  return { view: true, add: false, edit: false, delete: false };
}

function seedMenus(): AdminMenu[] {
  return flattenNavItems().map((row, i) => ({
    id: i + 1,
    label: row.item.label,
    path: row.item.to,
    parent: row.group.label,
    is_active: true,
    sort_order: i + 1,
    audit_enabled: row.group.id === "admin" || row.group.id === "overview",
  }));
}

let menus: AdminMenu[] = seedMenus();
let nextMenuId = menus.length + 1;

function permsFor(ids: number[], access: MenuAccess): Record<number, MenuAccess> {
  const out: Record<number, MenuAccess> = {};
  for (const id of ids) out[id] = { ...access };
  return out;
}

const allMenuIds = () => menus.map((m) => m.id);

let roles: AdminRole[] = [
  {
    id: 1,
    name: "Super Admin",
    code: "SUPER_ADMIN",
    description: "Full access to every menu, including audit logs.",
    is_active: true,
    audit_access: true,
    menu_ids: allMenuIds(),
    permissions: permsFor(allMenuIds(), fullAccess()),
  },
  {
    id: 2,
    name: "Data Officer",
    code: "DATA_OFFICER",
    description: "Maintain institutions and works. No administration or audit.",
    is_active: true,
    audit_access: false,
    menu_ids: menus.filter((m) => ["Institutions", "Works Management", "Overview"].includes(m.parent) || m.path === "/dashboard").map((m) => m.id),
    permissions: {},
  },
  {
    id: 3,
    name: "Auditor",
    code: "AUDITOR",
    description: "Read-only reports and audit trail access.",
    is_active: true,
    audit_access: true,
    menu_ids: menus.filter((m) => m.parent === "Reports" || m.parent === "Overview" || m.path === "/dashboard").map((m) => m.id),
    permissions: {},
  },
];

roles = roles.map((r) => {
  if (Object.keys(r.permissions).length > 0) return r;
  return {
    ...r,
    permissions: permsFor(r.menu_ids, r.audit_access ? viewOnly() : { view: true, add: true, edit: true, delete: false }),
  };
});

let nextRoleId = 4;

let users: AdminUser[] = [
  { id: 1, name: "System Admin", email: "admin@krics.karnataka.gov.in", mobile: "9876500001", role_id: 1, status: "active", last_login: nowIso() },
  { id: 2, name: "Ramesh Rao", email: "ramesh.rao@krics.karnataka.gov.in", mobile: "9876500002", role_id: 2, status: "active", last_login: "2026-09-05T10:22:00.000Z" },
  { id: 3, name: "Lakshmi Hegde", email: "lakshmi.hegde@krics.karnataka.gov.in", mobile: "9876500003", role_id: 3, status: "active", last_login: "2026-09-06T16:40:00.000Z" },
  { id: 4, name: "Inactive Clerk", email: "clerk@krics.karnataka.gov.in", mobile: "9876500004", role_id: 2, status: "inactive", last_login: null },
];
let nextUserId = 5;

let audit: AuditEntry[] = [
  { id: 1, at: "2026-09-01T09:00:00.000Z", actor: ACTOR, action: "create", entity: "role", detail: "Seeded Super Admin, Data Officer, Auditor" },
  { id: 2, at: "2026-09-01T09:05:00.000Z", actor: ACTOR, action: "create", entity: "user", detail: "Seeded initial users" },
  { id: 3, at: "2026-09-06T16:40:00.000Z", actor: "Lakshmi Hegde", action: "access", entity: "role", detail: "Opened Role menu (audit access)" },
];
let nextAuditId = 4;

let settings: AdminSettings = {
  org_name: "Karnataka Residential Educational Institutions Society",
  session_timeout_minutes: 30,
  audit_logging: true,
  default_page_size: 25,
  allow_self_role_edit: false,
};

function log(action: AuditAction, entity: AuditEntity, detail: string) {
  if (!settings.audit_logging && action === "access") return;
  audit = [{ id: nextAuditId++, at: nowIso(), actor: ACTOR, action, entity, detail }, ...audit];
}

export function listUsers() {
  return users.map((u) => ({ ...u, role_name: roles.find((r) => r.id === u.role_id)?.name ?? "—" }));
}

export function getUser(id: number) {
  return users.find((u) => u.id === id) ?? null;
}

export type UserPayload = Omit<AdminUser, "id" | "last_login"> & { last_login?: string | null };

export function createUser(payload: UserPayload) {
  const row: AdminUser = { ...payload, id: nextUserId++, last_login: payload.last_login ?? null };
  users = [row, ...users];
  log("create", "user", `Created user “${row.name}” (${row.email})`);
  return row;
}

export function updateUser(id: number, payload: UserPayload) {
  const prev = users.find((u) => u.id === id);
  users = users.map((u) => (u.id === id ? { ...u, ...payload, id, last_login: u.last_login } : u));
  log("update", "user", `Updated user “${payload.name}”${prev && prev.role_id !== payload.role_id ? " (role changed)" : ""}`);
  return users.find((u) => u.id === id)!;
}

export function deleteUser(id: number) {
  const prev = users.find((u) => u.id === id);
  users = users.filter((u) => u.id !== id);
  if (prev) log("delete", "user", `Deleted user “${prev.name}”`);
}

export function listRoles() {
  return roles.map((r) => ({
    ...r,
    user_count: users.filter((u) => u.role_id === r.id).length,
    menu_count: r.menu_ids.length,
  }));
}

export function getRole(id: number) {
  return roles.find((r) => r.id === id) ?? null;
}

export type RolePayload = Omit<AdminRole, "id">;

export function createRole(payload: RolePayload) {
  const row: AdminRole = { ...payload, id: nextRoleId++ };
  roles = [row, ...roles];
  log("create", "role", `Created role “${row.name}” with ${row.menu_ids.length} menus, audit ${row.audit_access ? "on" : "off"}`);
  return row;
}

export function updateRole(id: number, payload: RolePayload) {
  roles = roles.map((r) => (r.id === id ? { ...payload, id } : r));
  log("update", "role", `Updated role “${payload.name}” (${payload.menu_ids.length} menus, audit ${payload.audit_access ? "on" : "off"})`);
  return roles.find((r) => r.id === id)!;
}

export function deleteRole(id: number) {
  const prev = roles.find((r) => r.id === id);
  const assigned = users.some((u) => u.role_id === id);
  if (assigned) throw new Error("Cannot delete a role that is assigned to users.");
  roles = roles.filter((r) => r.id !== id);
  if (prev) log("delete", "role", `Deleted role “${prev.name}”`);
}

export function listMenus() {
  return [...menus].sort((a, b) => a.sort_order - b.sort_order);
}

export type MenuPayload = Omit<AdminMenu, "id">;

export function createMenu(payload: MenuPayload) {
  const row: AdminMenu = { ...payload, id: nextMenuId++ };
  menus = [...menus, row];
  roles = roles.map((r) =>
    r.audit_access && r.code === "SUPER_ADMIN"
      ? {
          ...r,
          menu_ids: [...r.menu_ids, row.id],
          permissions: { ...r.permissions, [row.id]: fullAccess() },
        }
      : r,
  );
  log("create", "menu", `Created menu “${row.label}” (${row.path})`);
  return row;
}

export function updateMenu(id: number, payload: MenuPayload) {
  menus = menus.map((m) => (m.id === id ? { ...payload, id } : m));
  log("update", "menu", `Updated menu “${payload.label}”`);
  return menus.find((m) => m.id === id)!;
}

export function deleteMenu(id: number) {
  const prev = menus.find((m) => m.id === id);
  menus = menus.filter((m) => m.id !== id);
  roles = roles.map((r) => {
    const permissions = { ...r.permissions };
    delete permissions[id];
    return { ...r, menu_ids: r.menu_ids.filter((mid) => mid !== id), permissions };
  });
  if (prev) log("delete", "menu", `Deleted menu “${prev.label}”`);
}

export function listAudit(entity?: AuditEntity) {
  return entity ? audit.filter((a) => a.entity === entity) : audit;
}

export function getSettings() {
  return { ...settings };
}

export function updateSettings(payload: AdminSettings) {
  settings = { ...payload };
  log("update", "setting", "Updated administration settings");
  return getSettings();
}

export function logAccess(entity: AuditEntity, detail: string) {
  log("access", entity, detail);
}

export function emptyAccess(): MenuAccess {
  return { view: false, add: false, edit: false, delete: false };
}

export { fullAccess, viewOnly };
