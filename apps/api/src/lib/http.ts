import type { ErrorCode } from "@fireflydle/contracts";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppContext } from "../types";

export class ApiProblem extends Error {
  public constructor(
    public readonly code: ErrorCode,
    public readonly status: ContentfulStatusCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "ApiProblem";
  }
}

export function ok<T>(context: Context<AppContext>, data: T, status: ContentfulStatusCode = 200) {
  return context.json({ ok: true as const, data }, status);
}

export function problemResponse(context: Context<AppContext>, problem: ApiProblem) {
  const retryAfter = problem.details?.retryAfter;
  if (problem.code === "RATE_LIMITED" && typeof retryAfter === "number") {
    context.header("Retry-After", String(retryAfter));
  }
  const error = problem.details
    ? { code: problem.code, requestId: context.get("requestId"), details: problem.details }
    : { code: problem.code, requestId: context.get("requestId") };
  return context.json({ ok: false as const, error }, problem.status);
}

export async function readJson(context: Context<AppContext>): Promise<unknown> {
  const contentType = context.req.header("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "content-type" });
  }
  try {
    return await context.req.json();
  } catch {
    throw new ApiProblem("VALIDATION_FAILED", 400, { reason: "invalid-json" });
  }
}

export async function readOptionalJson(context: Context<AppContext>): Promise<unknown> {
  const contentLength = context.req.header("content-length");
  if (contentLength === "0" || !context.req.header("content-type")) return {};
  return readJson(context);
}
