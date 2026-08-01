import type { ApiResponse, SessionPayload } from "@fireflydle/contracts";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
let pendingSessionRequest: Promise<SessionPayload> | null = null;

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
