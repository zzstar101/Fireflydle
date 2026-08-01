import { describe, expect, test } from "bun:test";
import type { Character } from "@fireflydle/contracts";
import {
  ATTEMPTS_BY_DIFFICULTY,
  calculateElo,
  compareCharacters,
  createGuessResult,
  createSpoilerFreeShareText,
  getBeijingDateKey,
  hasDuplicateGuess,
  pickFromShuffleBag,
} from "./index";

const asset = {
  avatarPath: "/characters/test/avatar.webp",
  portraitPath: "/characters/test/portrait.webp",
  sourceUrl: "https://example.com/source.png",
  sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
  sha256: "a".repeat(64),
  rightsNotice: "仅用于测试",
};

function character(overrides: Partial<Character> = {}): Character {
  return {
    id: "test-character",
    officialId: "1",
    baseCharacterId: "test-character",
    names: { "zh-CN": "测试角色", en: "Test Character", ja: "テストキャラ" },
    aliases: { "zh-CN": [], en: [], ja: [] },
    element: "fire",
    path: "harmony",
    rarity: 5,
    factionId: "astral-express",
    factionGroupId: "astral-express",
    releaseVersionId: "3.0",
    releaseOrder: 16,
    assets: asset,
    enabled: true,
    targetEligible: true,
    sourceRevision: "test",
    ...overrides,
  };
}

describe("角色反馈", () => {
  test("完全相同的角色得到五个绿色格", () => {
    const target = character();
    const cells = compareCharacters(target, target);
    expect(cells).toHaveLength(5);
    expect(cells.every((item) => item.state === "exact")).toBe(true);
  });

  test("同大势力与相邻版本得到黄色反馈和方向", () => {
    const target = character({ factionId: "cloud-knights", releaseOrder: 12 });
    const guess = character({
      id: "another-character",
      factionId: "divination-commission",
      factionGroupId: "xianzhou-alliance",
      releaseOrder: 10,
    });
    target.factionGroupId = "xianzhou-alliance";

    const cells = compareCharacters(target, guess);
    expect(cells[3]).toEqual({ field: "faction", state: "close", direction: "none" });
    expect(cells[4]).toEqual({ field: "version", state: "close", direction: "higher" });
  });

  test("猜中严格按角色 ID 而非属性组合", () => {
    const target = character({ id: "one" });
    const guess = character({ id: "two" });
    const result = createGuessResult(target, guess);
    expect(result.cells.every((item) => item.state === "exact")).toBe(true);
    expect(result.isCorrect).toBe(false);
  });
});

describe("游戏规则", () => {
  test("三档难度分别为 8、6、4 次", () => {
    expect(ATTEMPTS_BY_DIFFICULTY).toEqual({ casual: 8, standard: 6, hard: 4 });
  });

  test("重复角色会被识别", () => {
    const target = character();
    const result = createGuessResult(target, target);
    expect(hasDuplicateGuess([result], target.id)).toBe(true);
  });

  test("北京时间午夜划分每日日期", () => {
    expect(getBeijingDateKey(Date.parse("2026-07-31T15:59:59.999Z"))).toBe("2026-07-31");
    expect(getBeijingDateKey(Date.parse("2026-07-31T16:00:00.000Z"))).toBe("2026-08-01");
  });

  test("洗牌袋用尽前不重复", () => {
    const first = pickFromShuffleBag(["a", "b", "c"], new Set(), 0.5);
    const second = pickFromShuffleBag(["a", "b", "c"], new Set([first.index]), 0.5);
    expect(second.item).not.toBe(first.item);
    expect(second.exhausted).toBe(false);
  });

  test("Elo 对低分击败高分给予更大增量", () => {
    const upset = calculateElo(900, 1300, 20, 20);
    const expected = calculateElo(1300, 900, 20, 20);
    expect(upset.delta).toBeGreaterThan(expected.delta);
  });
});

describe("无剧透分享", () => {
  test("分享内容不包含角色名称", () => {
    const target = character();
    const guess = createGuessResult(target, target);
    const text = createSpoilerFreeShareText({
      locale: "zh-CN",
      dateKey: "2026-08-01",
      difficulty: "standard",
      guesses: [guess],
      won: true,
      elapsedMs: 65_000,
      url: "https://fireflydle.games",
    });

    expect(text).toContain("🟩🟩🟩🟩🟩");
    expect(text).not.toContain("测试角色");
    expect(text).toContain("01:05");
  });
});
