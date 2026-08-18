import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

interface SessionData {
  user: {
    playableTutorialCompleted: boolean;
  };
}

async function dataOf<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { ok: boolean; data?: T };
  if (!payload.ok || payload.data === undefined) throw new Error("非成功 API 响应");
  return payload.data;
}

describe("普通角色教学完成状态", () => {
  it("只允许登录账号保存，并在后续会话中返回完成状态", async () => {
    const guest = await SELF.fetch("https://fireflydle.games/api/session", { method: "POST" });
    const guestCookie = guest.headers.get("set-cookie") ?? "";
    expect(
      (
        await SELF.fetch("https://fireflydle.games/api/account/playable-tutorial", {
          method: "PATCH",
          headers: { cookie: guestCookie },
        })
      ).status,
    ).toBe(401);

    const registered = await SELF.fetch("https://fireflydle.games/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "test:tutorial",
      },
      body: JSON.stringify({
        loginName: "tutorial_account",
        displayName: "Tutorial Account",
        password: "tutorial-account-password",
      }),
    });
    expect(registered.status).toBe(201);
    expect((await dataOf<SessionData>(registered)).user.playableTutorialCompleted).toBe(false);

    const accountCookie = registered.headers.get("set-cookie") ?? "";
    const completed = await SELF.fetch("https://fireflydle.games/api/account/playable-tutorial", {
      method: "PATCH",
      headers: { cookie: accountCookie },
    });
    expect(completed.status).toBe(200);
    expect((await dataOf<SessionData["user"]>(completed)).playableTutorialCompleted).toBe(true);
    const formalRecords = await env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM games) AS game_count,
         (SELECT COUNT(*) FROM game_results) AS result_count`,
    ).first<{ game_count: number; result_count: number }>();
    expect(formalRecords).toEqual({ game_count: 0, result_count: 0 });

    const refreshed = await SELF.fetch("https://fireflydle.games/api/session", {
      method: "POST",
      headers: { cookie: accountCookie },
    });
    expect((await dataOf<SessionData>(refreshed)).user.playableTutorialCompleted).toBe(true);
  });
});
