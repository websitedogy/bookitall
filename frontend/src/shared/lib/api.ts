import type { AuthUser } from "@/features/auth/store";

export const API_URL = (() => {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured?.startsWith("http")) {
    return configured.replace("://localhost", "://127.0.0.1");
  }
  if (typeof window === "undefined") return "http://127.0.0.1:4000/api/v1";
  return configured || "/api/v1";
})();
export { SITE_URL } from "@/shared/lib/site-url";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000/realtime";

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string | string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

let refreshInFlight: Promise<string | null> | null = null;

function errorMessage(json: ApiEnvelope<unknown> | { message?: string | string[] }) {
  return Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Request failed";
}

async function refreshAccessToken(failedToken?: string | null): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const { useAuth, useAdminAuth } = await import("@/features/auth/store");
    const market = useAuth.getState();
    const admin = useAdminAuth.getState();
    const session =
      failedToken && failedToken === admin.accessToken
        ? admin
        : failedToken && failedToken === market.accessToken
          ? market
          : market.refreshToken
            ? market
            : admin;
    if (!session.user?.id || !session.refreshToken) return null;
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id, refreshToken: session.refreshToken }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<AuthSession>;
    if (!res.ok || !json.data?.accessToken) return null;
    session.setSession(json.data);
    return json.data.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function authFetch(path: string, init: RequestInit & { token?: string | null } = {}): Promise<Response> {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  const stores = typeof window === "undefined" ? null : await import("@/features/auth/store");
  const firstToken = token ?? stores?.useAuth.getState().accessToken ?? null;
  if (firstToken) headers.set("Authorization", `Bearer ${firstToken}`);
  let res = await fetch(`${API_URL}${path}`, { ...rest, headers, cache: "no-store" });
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const next = await refreshAccessToken(firstToken);
    if (next) {
      headers.set("Authorization", `Bearer ${next}`);
      res = await fetch(`${API_URL}${path}`, { ...rest, headers, cache: "no-store" });
    } else if (stores) {
      if (firstToken && firstToken === stores.useAdminAuth.getState().accessToken) {
        stores.useAdminAuth.getState().logout();
      } else {
        stores.useAuth.getState().logout();
      }
    }
  }
  return res;
}

export async function publicApi<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(6000),
    next: { revalidate: 60 },
  });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new ApiError(errorMessage(json), res.status);
  }
  return json;
}

export async function api<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await authFetch(path, { ...init, headers });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? "Your session expired. Please sign in again." : errorMessage(json), res.status);
  }
  return json;
}
