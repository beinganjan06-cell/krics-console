import { ApiError, type ApiErrorShape, type QueryParams } from "@/types/api";
import { clearSession, getAccessToken } from "@/lib/auth/session";

function resolveApiBaseUrl(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  let url = raw.trim().replace(/\/+$/, "");
  if (!/\/api$/i.test(url)) url = `${url}/api`;
  return url;
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env["VITE_API_BASE_URL"] as string | undefined,
);

/** "real" when VITE_API_BASE_URL is configured, otherwise the isolated dev mock adapter. */
export const API_MODE: "real" | "mock" = API_BASE_URL ? "real" : "mock";

export function buildQuery(params: QueryParams = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : "";
}

async function parseError(response: Response): Promise<ApiError> {
  let detail = `Request failed with status ${response.status}.`;
  let fieldErrors: Record<string, string[]> = {};
  try {
    const body = (await response.json()) as ApiErrorShape & Record<string, unknown>;
    if (body?.detail) detail = String(body.detail);
    else if (Array.isArray(body?.["non_field_errors"])) {
      detail = String((body.non_field_errors as string[])[0] ?? detail);
    }
    if (body?.field_errors) fieldErrors = body.field_errors;
    else {
      const entries = Object.entries(body).filter(([k, v]) => k !== "detail" && Array.isArray(v));
      if (entries.length) fieldErrors = Object.fromEntries(entries) as Record<string, string[]>;
    }
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(detail, response.status, fieldErrors);
}

function handleUnauthorized(path: string, status: number) {
  const isAuthCall = path.includes("/auth/login") || path.includes("/auth/password");
  if (status !== 401 || isAuthCall) return;
  clearSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login?reason=expired");
  }
}

export async function request<T>(
  path: string,
  options: RequestInit & { params?: QueryParams } = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_BASE_URL is not configured.", 0);
  }
  const { params, headers, ...rest } = options;
  const url = `${API_BASE_URL}/${path.replace(/^\//, "")}${buildQuery(params)}`;
  const token = getAccessToken();

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your network connection.", 0);
  }

  if (!response.ok) {
    handleUnauthorized(path, response.status);
    throw await parseError(response);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function requestBlob(
  path: string,
  options: RequestInit & { params?: QueryParams } = {},
): Promise<{ blob: Blob; filename: string }> {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_BASE_URL is not configured.", 0);
  }
  const { params, headers, ...rest } = options;
  const url = `${API_BASE_URL}/${path.replace(/^\//, "")}${buildQuery(params)}`;
  const token = getAccessToken();
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        Accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your network connection.", 0);
  }
  if (!response.ok) {
    handleUnauthorized(path, response.status);
    throw await parseError(response);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  return { blob, filename: match?.[1] ?? "krics-report" };
}
