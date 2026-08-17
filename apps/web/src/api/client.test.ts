import { describe, expect, it, vi } from "vitest";

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};
globalThis.localStorage = storage as never;

const guestIds: string[] = [];
globalThis.fetch = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
  const guestId = new Headers(init?.headers).get("x-guest-id");
  if (!guestId) throw new Error("缺少稳定访客身份请求头");
  guestIds.push(guestId);
  return new Response(
    JSON.stringify({
      ok: true,
      data: {
        expiresAt: "2026-09-01T00:00:00.000Z",
        user: {
          id: guestId,
          displayName: "开拓者-TEST",
          role: "player",
          isGuest: true,
          hasEmail: false,
          emailVerified: false,
          elo: 1000,
          rankedMatches: 0,
          leaderboardEligible: false,
          createdAt: "2026-08-17T00:00:00.000Z",
        },
      },
    }),
    { status: 201, headers: { "content-type": "application/json" } },
  );
}) as never;

const { apiRequest, ensureSession } = await import("./client");

describe("本地访客身份", () => {
  it("新建会话时持续发送同一个本地 UUID", async () => {
    const first = await ensureSession();
    const second = await ensureSession();

    expect(guestIds).toHaveLength(2);
    expect(guestIds[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
    );
    expect(guestIds[1]).toBe(guestIds[0]);
    expect(first.user.id).toBe(second.user.id);
    expect(values.get("fireflydle-local-guest-id")).toBe(first.user.id);
  });

  it("保留服务端过期详情供页面返回原内容模式", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: "CHALLENGE_EXPIRED",
            requestId: crypto.randomUUID(),
            details: { modeId: "playable" },
          },
        }),
        { status: 410, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(apiRequest("/challenges/expired")).rejects.toMatchObject({
      code: "CHALLENGE_EXPIRED",
      details: { modeId: "playable" },
    });
  });
});
