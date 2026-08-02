import type { ApiResponse, SessionPayload } from "@fireflydle/contracts";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
let pendingSessionRequest: Promise<SessionPayload> | null = null;
const VISIT_SESSION_KEY = "fireflydle-visit-session";
const VISIT_INACTIVITY_MS = 30 * 60_000;

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
    throw new ApiClientError(error?.code ?? "INTERNAL_ERROR", error?.requestId);
  }

  return payload.data;
}

export function ensureSession(): Promise<SessionPayload> {
  if (!pendingSessionRequest) {
    pendingSessionRequest = apiRequest<SessionPayload>("/session", { method: "POST" }).finally(
      () => {
        pendingSessionRequest = null;
      },
    );
  }
  return pendingSessionRequest;
}

export function getWebSocketUrl(path: string): string {
  const apiBase = API_URL || window.location.origin;
  const url = new URL(`/api${path}`, apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
