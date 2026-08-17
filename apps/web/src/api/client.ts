import type { ApiResponse, SessionPayload } from "@fireflydle/contracts";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
let pendingSessionRequest: Promise<SessionPayload> | null = null;
const VISIT_SESSION_KEY = "fireflydle-visit-session";
const GUEST_ID_KEY = "fireflydle-local-guest-id";
const VISIT_INACTIVITY_MS = 30 * 60_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
let memoryGuestId: string | null = null;

export function getStableGuestId(): string {
  if (memoryGuestId) return memoryGuestId;
  try {
    const stored = localStorage.getItem(GUEST_ID_KEY);
    if (stored && UUID_PATTERN.test(stored)) return (memoryGuestId = stored);
    const id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
    return (memoryGuestId = id);
  } catch {
    return (memoryGuestId = crypto.randomUUID());
  }
}

function rememberGuestId(id: string): void {
  memoryGuestId = id;
  try {
    localStorage.setItem(GUEST_ID_KEY, id);
  } catch {
    // 禁用本地存储时仍在当前页面生命周期内保持身份稳定。
  }
}

function currentVisitSessionId(): string {
  const now = Date.now();
  try {
    const stored = localStorage.getItem(VISIT_SESSION_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    const record =
      typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
    const id = typeof record?.id === "string" ? record.id : null;
    const lastActivity = typeof record?.lastActivity === "number" ? record.lastActivity : 0;
    const nextId = id && now - lastActivity <= VISIT_INACTIVITY_MS ? id : crypto.randomUUID();
    localStorage.setItem(VISIT_SESSION_KEY, JSON.stringify({ id: nextId, lastActivity: now }));
    return nextId;
  } catch {
    return crypto.randomUUID();
  }
}

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly requestId?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (!headers.has("x-visit-session-id")) {
    headers.set("x-visit-session-id", currentVisitSessionId());
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  let payload: ApiResponse<T> | undefined;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("INTERNAL_ERROR");
  }

  if (!response.ok || !payload.ok) {
    const error = payload.ok ? undefined : payload.error;
    throw new ApiClientError(error?.code ?? "INTERNAL_ERROR", error?.requestId, error?.details);
  }

  return payload.data;
}

export function ensureSession(): Promise<SessionPayload> {
  if (!pendingSessionRequest) {
    pendingSessionRequest = apiRequest<SessionPayload>("/session", {
      method: "POST",
      headers: { "x-guest-id": getStableGuestId() },
    })
      .then((session) => {
        if (session.user.isGuest) rememberGuestId(session.user.id);
        return session;
      })
      .finally(() => {
        pendingSessionRequest = null;
      });
  }
  return pendingSessionRequest;
}

export function getWebSocketUrl(path: string): string {
  const apiBase = API_URL || window.location.origin;
  const url = new URL(`/api${path}`, apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
