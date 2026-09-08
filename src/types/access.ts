export interface MenuAccess {
  can_read: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface UserMenu extends MenuAccess {
  id: number;
  label: string;
  path: string;
  icon: string;
  sort_order: number;
  parent_id: number | null;
  is_active: boolean;
}

export interface AdminMenu {
  id: number;
  label: string;
  path: string;
  icon: string;
  sort_order: number;
  parent: number | null;
  parent_label: string | null;
  is_active: boolean;
  updated_at?: string;
}

export interface MenuPayload {
  label: string;
  path: string;
  icon: string;
  sort_order: number;
  parent: number | null;
  is_active: boolean;
}

export interface RoleAccessItem extends MenuAccess {
  menu_id: number;
}

export interface AdminRole {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  user_count: number;
  access: RoleAccessItem[];
  updated_at: string;
}

export interface RolePayload {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  mobile: string;
  role: number;
  role_name: string;
  is_active: boolean;
  last_login: string | null;
  updated_at?: string;
}

export interface UserPayload {
  name: string;
  username?: string;
  email: string;
  mobile: string;
  role: number;
  is_active: boolean;
  password?: string;
}

export function emptyAccess(): MenuAccess {
  return { can_read: false, can_create: false, can_edit: false, can_delete: false };
}

export function fullAccess(): MenuAccess {
  return { can_read: true, can_create: true, can_edit: true, can_delete: true };
}
