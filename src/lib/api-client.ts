import { ApiError, type ApiErrorShape, type QueryParams } from "@/types/api";

export const API_BASE_URL: string | undefined = import.meta.env["VITE_API_BASE_URL"] as
  | string
  | undefined;

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
    if (body?.detail) detail = body.detail;
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

export async function request<T>(
  path: string,
  options: RequestInit & { params?: QueryParams } = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_BASE_URL is not configured.", 0);
  }
  const { params, headers, ...rest } = options;
  const url = `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}${buildQuery(params)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your network connection.", 0);
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
