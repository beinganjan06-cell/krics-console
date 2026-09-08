import type { AuthUser, LoginResponse } from "@/types/auth";
import { AUTH_COOKIE } from "@/lib/constants";
const ACCESS_KEY = "krics.access";
const REFRESH_KEY = "krics.refresh";
const USER_KEY = "krics.user";
const REMEMBER_KEY = "krics.remember";

const listeners = new Set<() => void>();

let cachedUserRaw: string | null | undefined;
let cachedUser: AuthUser | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function cookieHasSession(): boolean {
  if (!canUseDom()) return false;
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${AUTH_COOKIE}=`));
}

function writeCookie(remember: boolean) {
  if (!canUseDom()) return;
  const base = `${AUTH_COOKIE}=1; Path=/; SameSite=Lax`;
  document.cookie = remember ? `${base}; Max-Age=${60 * 60 * 24 * 30}` : base;
}

function clearCookie() {
  if (!canUseDom()) return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

function readStore(key: string): string | null {
  if (!canUseDom()) return null;
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

function writeStore(key: string, value: string, remember: boolean) {
  const primary = remember ? localStorage : sessionStorage;
  const secondary = remember ? sessionStorage : localStorage;
  primary.setItem(key, value);
  secondary.removeItem(key);
}

export function persistSession(data: LoginResponse, remember: boolean) {
  if (!canUseDom()) return;
  writeStore(ACCESS_KEY, data.access, remember);
  writeStore(REFRESH_KEY, data.refresh, remember);
  const userJson = JSON.stringify(data.user);
  writeStore(USER_KEY, userJson, remember);
  writeStore(REMEMBER_KEY, remember ? "1" : "0", remember);
  cachedUserRaw = userJson;
  cachedUser = data.user;
  writeCookie(remember);
  notify();
}

export function replaceAuthUser(user: AuthUser) {
  if (!canUseDom()) return;
  const remember = readStore(REMEMBER_KEY) === "1";
  const userJson = JSON.stringify(user);
  writeStore(USER_KEY, userJson, remember);
  cachedUserRaw = userJson;
  cachedUser = user;
  notify();
}

export function clearSession() {
  if (canUseDom()) {
    [localStorage, sessionStorage].forEach((store) => {
      store.removeItem(ACCESS_KEY);
      store.removeItem(REFRESH_KEY);
      store.removeItem(USER_KEY);
      store.removeItem(REMEMBER_KEY);
    });
  }
  cachedUserRaw = null;
  cachedUser = null;
  clearCookie();
  notify();
}

export function getAccessToken(): string | null {
  return readStore(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return readStore(REFRESH_KEY);
}

export function getAuthUser(): AuthUser | null {
  const raw = readStore(USER_KEY);
  if (raw === cachedUserRaw) return cachedUser;
  cachedUserRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }
  try {
    cachedUser = JSON.parse(raw) as AuthUser;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function hasClientSession(): boolean {
  return Boolean(getAccessToken()) || cookieHasSession();
}
