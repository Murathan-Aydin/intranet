"use client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? "http://localhost:8000" : "http://backend:8000");

const ACCESS_KEY = "mds_access";
const REFRESH_KEY = "mds_refresh";

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccess(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefresh();
  if (!refresh) return false;
  try {
    const r = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!r.ok) return false;
    const data = await r.json();
    setTokens(data.access);
    return true;
  } catch {
    return false;
  }
}

export async function api<T = any>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const access = getAccess();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return api<T>(path, init, false);
    clearTokens();
  }

  if (!response.ok) {
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    const message =
      typeof data === "object"
        ? data?.detail || JSON.stringify(data)
        : String(data);
    throw new ApiError(message, response.status, data);
  }

  if (response.status === 204) return undefined as unknown as T;
  return (await response.json()) as T;
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data?.detail || "Identifiants invalides", res.status, data);
  }
  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data as { access: string; refresh: string };
}
