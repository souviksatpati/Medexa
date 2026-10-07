/**
 * Deliberately thin. The real safety net here isn't this file — it's that
 * `npm run gen:types` regenerates src/generated/api-types.ts directly from
 * FastAPI's live OpenAPI schema. If the backend renames a field or changes
 * a type, this becomes a TypeScript compile error, not a runtime bug.
 *
 * API base URL is configurable through VITE_API_BASE_URL so the same
 * frontend can run behind Docker, a development proxy, or production
 * infrastructure without changing source code.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const message = networkErr instanceof Error ? networkErr.message : "Network request failed";
    throw new ApiError(0, `Network error: ${message}`);
  }

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      // Body not JSON
    }
    throw new ApiError(res.status, `API ${method} ${path} failed (${res.status}): ${errorDetail}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export { ApiError };
