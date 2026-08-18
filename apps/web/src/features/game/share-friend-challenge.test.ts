import { describe, expect, it, vi } from "vitest";
import {
  buildFriendChallengeSharePayload,
  tryNativeFriendChallengeShare,
} from "./share-friend-challenge";

const challengeUrl = "https://fireflydle.games/challenge/00000000-0000-4000-8000-000000000029";

describe("好友挑战分享", () => {
  it.each([
    ["zh-CN" as const, "好友同题挑战", "3/6 · 01:23"],
    ["en" as const, "Friend challenge", "3/6 · 01:23"],
    ["ja" as const, "フレンド挑戦", "3/6 · 01:23"],
  ])("为 %s 生成只包含成绩与挑战链接的文案", (locale, title, score) => {
    const payload = buildFriendChallengeSharePayload({
      locale,
      won: true,
      guessCount: 3,
      maxAttempts: 6,
      elapsedMs: 83_000,
      challengeUrl,
    });

    expect(payload.title).toContain(title);
    expect(payload.text).toContain(score);
    expect(payload.url).toBe(challengeUrl);
    expect(JSON.stringify(payload)).not.toContain("流萤");
    expect(JSON.stringify(payload)).not.toContain("answer");
  });

  it("支持文件时把无剧透结果图和挑战 URL 交给系统分享", async () => {
    const share = vi.fn(async (_data: ShareData) => undefined);
    const result = await tryNativeFriendChallengeShare(
      { title: "Title", text: "Score", url: challengeUrl },
      new Blob(["png"], { type: "image/png" }),
      "result.png",
      { share, canShare: () => true },
    );

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0]?.[0]).toMatchObject({
      text: "Score",
      url: challengeUrl,
      files: [expect.objectContaining({ name: "result.png", type: "image/png" })],
    });
  });

  it("系统分享不可用或被取消时分别进入回退与静默取消", async () => {
    expect(
      await tryNativeFriendChallengeShare(
        { title: "Title", text: "Score", url: challengeUrl },
        new Blob(),
        "result.png",
        {},
      ),
    ).toBe("fallback");

    const cancelled = new DOMException("cancelled", "AbortError");
    expect(
      await tryNativeFriendChallengeShare(
        { title: "Title", text: "Score", url: challengeUrl },
        new Blob(),
        "result.png",
        { share: async () => Promise.reject(cancelled) },
      ),
    ).toBe("cancelled");
  });
});
