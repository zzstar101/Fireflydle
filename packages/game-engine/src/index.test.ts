import { describe, expect, test } from "bun:test";
import type { Character, CurrencyWarsUnit } from "@fireflydle/contracts";
import {
  calculateElo,
  compareCharacters,
  createGuessResult,
  createSpoilerFreeShareText,
  getBeijingDateKey,
  getBeijingWeekEnd,
  getBeijingWeekKey,
  getWeeklyModeId,
  hasDuplicateGuess,
  pickFromShuffleBag,
  compareFieldValues,
  compareCharactersWithRules,
  snapshotRulesFromFieldDefinitions,
  compareNpcEntities,
  compareCurrencyWarsUnits,
  createCurrencyWarsGuessResult,
  applyEndlessRoundOutcome,
  compareEndlessLeaderboardEntries,
  ENDLESS_INITIAL_LIVES,
  aeonRevealOrder,
  aeonRevealedCells,
  createGuessResultWithRules,
  createInferenceReview,
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

describe("NPC 三列黄金判题", () => {
  const target = {
    id: "npc-skott",
    names: { "zh-CN": "斯科特", en: "Skott", ja: "スコート" },
    regionId: "xianzhou-luofu",
    factionId: "xianzhou-luofu",
    factionGroupId: "xianzhou-alliance",
    debutVersionId: "1.3",
    debutVersionOrder: 3,
  };

  test("地区 exact、派系同大组 close、版本方向 close", () => {
    const cells = compareNpcEntities(target, {
      ...target,
      id: "npc-fixture-yaoqing",
      regionId: "penacony",
      factionId: "xianzhou-yaoqing",
      factionGroupId: "xianzhou-alliance",
      debutVersionId: "1.1",
      debutVersionOrder: 1,
    });
    expect(cells.map((cell) => [cell.field, cell.state, cell.direction])).toEqual([
      ["region", "miss", "none"],
      ["faction", "close", "none"],
      ["debut-version", "close", "higher"],
    ]);
  });

  test("跨大版本按统一发布序位比较 1.6 与 2.0", () => {
    const cells = compareNpcEntities(
      { ...target, debutVersionId: "2.0", debutVersionOrder: 7 },
      { ...target, id: "npc-fixture-1-6", debutVersionId: "1.6", debutVersionOrder: 6 },
    );
    expect(cells[2]).toEqual({
      field: "debut-version",
      state: "close",
      direction: "higher",
    });
  });
});

describe("货币战争三列黄金判题", () => {
  const unit = (overrides: Partial<CurrencyWarsUnit> = {}): CurrencyWarsUnit => ({
    id: "cw-alpha",
    names: { "zh-CN": "单位甲", en: "Unit Alpha", ja: "ユニット甲" },
    aliases: { "zh-CN": [], en: [], ja: [] },
    source: { url: "https://example.com/currency-wars", revision: "test" },
    reviewStatus: "approved",
    cost: 3,
    position: "front",
    synergies: ["ipc", "merchant"],
    assets: {
      avatarPath: "/unit.png",
      portraitPath: "/unit.png",
      sha256: "a".repeat(64),
      rightsNotice: "测试数据",
    },
    ...overrides,
  });

  test("费用相同 exact、不同只给高低方向，站位二值，羁绊集合三态", () => {
    const cells = compareCurrencyWarsUnits(
      unit(),
      unit({ id: "cw-beta", cost: 4, position: "back", synergies: ["merchant", "herta"] }),
    );
    expect(cells).toEqual([
      { field: "cost", state: "miss", direction: "lower" },
      { field: "position", state: "miss", direction: "none" },
      { field: "synergies", state: "close", direction: "none" },
    ]);
  });

  test("公开结果只携带已猜单位的羁绊，不标记具体共享项", () => {
    const result = createCurrencyWarsGuessResult(
      unit(),
      unit({ id: "cw-beta", synergies: ["merchant", "herta"] }),
    );
    expect(result.character).toHaveProperty("synergies", ["merchant", "herta"]);
    expect(result.cells.find((cell) => cell.field === "synergies")).toEqual({
      field: "synergies",
      state: "close",
      direction: "none",
    });
    expect(result.cells.find((cell) => cell.field === "synergies")).not.toHaveProperty(
      "matchedSynergy",
    );
    expect(JSON.stringify(result)).not.toContain("ipc");
  });

  test("多值费用按可用费用命中，完全落在区间外才给方向", () => {
    const target = unit({ cost: [3, 4, 5] });
    expect(compareCurrencyWarsUnits(target, unit({ id: "cw-low", cost: 2 }))[0]).toEqual({
      field: "cost",
      state: "miss",
      direction: "higher",
    });
    expect(compareCurrencyWarsUnits(target, unit({ id: "cw-hit", cost: 4 }))[0]).toEqual({
      field: "cost",
      state: "exact",
      direction: "none",
    });
  });
});

describe("角色反馈", () => {
  test("完全相同的角色得到六个绿色格", () => {
    const target = character();
    const cells = compareCharacters(target, target);
    expect(cells).toHaveLength(6);
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
    expect(cells[4]).toEqual({ field: "region", state: "exact", direction: "none" });
    expect(cells[5]).toEqual({ field: "version", state: "close", direction: "higher" });
  });

  test("同一 baseCharacterId 的不同形态仍严格按永久 ID 判定", () => {
    const target = character({ id: "one" });
    const guess = character({ id: "two" });
    const result = createGuessResult(target, guess);
    expect(result.cells.every((item) => item.state === "exact")).toBe(true);
    expect(result.isCorrect).toBe(false);
  });

  test("派系仅同主派系 exact、同大组 close、其余 miss", () => {
    const target = character({ factionId: "cloud-knights", factionGroupId: "xianzhou" });
    const exact = character({ factionId: "cloud-knights", factionGroupId: "xianzhou" });
    const close = character({ factionId: "divination-commission", factionGroupId: "xianzhou" });
    const miss = character({ factionId: "ipc", factionGroupId: "cosmic" });

    expect(compareCharacters(target, exact)[3]?.state).toBe("exact");
    expect(compareCharacters(target, close)[3]?.state).toBe("close");
    expect(compareCharacters(target, miss)[3]?.state).toBe("miss");
  });

  test("地区只产生 exact 或 miss", () => {
    const target = character({ regionId: "xianzhou" });
    const exact = character({ regionId: "xianzhou" });
    const miss = character({ regionId: "cosmic" });

    expect(compareCharacters(target, exact)[4]).toEqual({
      field: "region",
      state: "exact",
      direction: "none",
    });
    expect(compareCharacters(target, miss)[4]).toEqual({
      field: "region",
      state: "miss",
      direction: "none",
    });
  });

  test("版本按发布序位给出 exact、两格内 close、更远 miss 及方向", () => {
    const target = character({ releaseOrder: 10 });
    const exact = character({ releaseOrder: 10 });
    const earlierClose = character({ releaseOrder: 8 });
    const laterClose = character({ releaseOrder: 12 });
    const earlierMiss = character({ releaseOrder: 7 });

    expect(compareCharacters(target, exact)[5]).toEqual({
      field: "version",
      state: "exact",
      direction: "none",
    });
    expect(compareCharacters(target, earlierClose)[5]).toEqual({
      field: "version",
      state: "close",
      direction: "higher",
    });
    expect(compareCharacters(target, laterClose)[5]).toEqual({
      field: "version",
      state: "close",
      direction: "lower",
    });
    expect(compareCharacters(target, earlierMiss)[5]).toEqual({
      field: "version",
      state: "miss",
      direction: "higher",
    });
  });

  test("字段规则快照实际决定输出字段", () => {
    const target = character({ element: "fire", path: "harmony" });
    const guess = character({ id: "another-character", element: "ice", path: "harmony" });
    const cells = compareCharactersWithRules(target, guess, [
      { field: "path", comparison: "exact" },
      { field: "path", comparison: "exact" },
      { field: "path", comparison: "exact" },
      { field: "path", comparison: "exact" },
      { field: "path", comparison: "exact" },
    ]);
    expect(cells).toHaveLength(5);
    expect(cells.every((item) => item.field === "path" && item.state === "exact")).toBe(true);
  });

  test("字段规则可以使用题池自定义顺序并对缺失值返回 unavailable", () => {
    const target = character({ element: "fire" });
    const guess = character({ id: "another-character", element: "ice" });
    const cells = compareCharactersWithRules(target, guess, [
      { field: "rarity", comparison: "exact" },
      { field: "custom-field", comparison: "exact" },
      { field: "element", comparison: "exact" },
    ]);

    expect(cells.map((cell) => cell.field)).toEqual(["rarity", "custom-field", "element"]);
    expect(cells[1]).toEqual({ field: "custom-field", state: "unavailable", direction: "none" });
    expect(cells[2]).toEqual({ field: "element", state: "miss", direction: "none" });
  });

  test("在线和离线可从题池字段定义得到同一迁移期规则顺序", () => {
    expect(
      snapshotRulesFromFieldDefinitions([
        { id: "path", comparison: "exact" },
        { id: "region", comparison: "exact" },
        { id: "version", comparison: "direction" },
        { id: "faction", comparison: "exact" },
      ]),
    ).toEqual([
      { field: "path", comparison: "exact" },
      { field: "region", comparison: "exact" },
      { field: "version", comparison: "version" },
      { field: "faction", comparison: "faction" },
    ]);
  });
});

describe("通用字段反馈", () => {
  test("支持 exact、close、miss 与 unavailable，并只在可比较时给方向", () => {
    expect(
      compareFieldValues("3.0", "3.0", { kind: "version", targetOrder: 3, guessOrder: 3 }),
    ).toEqual({
      state: "exact",
      direction: "none",
    });
    expect(
      compareFieldValues("3.0", "2.0", { kind: "version", targetOrder: 3, guessOrder: 2 }),
    ).toEqual({
      state: "close",
      direction: "higher",
    });
    expect(compareFieldValues(undefined, "2.0", { kind: "version" })).toEqual({
      state: "unavailable",
      direction: "none",
    });
    expect(compareFieldValues("fire", "ice", { kind: "exact" })).toEqual({
      state: "miss",
      direction: "none",
    });
    expect(compareFieldValues(["ipc", "merchant"], ["merchant", "herta"], { kind: "set" })).toEqual(
      {
        state: "close",
        direction: "none",
      },
    );
  });
});

describe("游戏规则", () => {
  test("复盘按累计反馈给出精确剩余数并在最大缩减并列时选择较早猜测", () => {
    const alpha = character({ id: "alpha", element: "fire", path: "harmony" });
    const beta = character({ id: "beta", element: "fire", path: "harmony" });
    const gamma = character({ id: "gamma", element: "fire", path: "harmony" });
    const delta = character({ id: "delta", element: "ice", path: "hunt" });
    const rules = [
      { field: "element", comparison: "exact" as const },
      { field: "path", comparison: "exact" as const },
    ];
    const guesses = [
      createGuessResultWithRules(alpha, delta, rules),
      createGuessResultWithRules(alpha, beta, rules),
    ];
    expect(createInferenceReview([alpha, beta, gamma, delta], guesses, rules)).toEqual({
      initialCandidates: 4,
      bestGuessNumber: 1,
      steps: [
        { guessNumber: 1, remainingCandidates: 3, eliminatedCandidates: 1, isBest: true },
        { guessNumber: 2, remainingCandidates: 2, eliminatedCandidates: 1, isBest: false },
      ],
    });
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

  test("北京时间周一零点划分周赛", () => {
    expect(getBeijingWeekKey(Date.parse("2026-08-16T15:59:59.999Z"))).toBe("2026-08-10");
    expect(getBeijingWeekKey(Date.parse("2026-08-16T16:00:00.000Z"))).toBe("2026-08-17");
    expect(getBeijingWeekEnd(Date.parse("2026-08-16T16:00:00.000Z"))).toBe(
      Date.parse("2026-08-23T16:00:00.000Z"),
    );
  });

  test("周赛按 playable、货币战争、星神固定循环", () => {
    expect([
      getWeeklyModeId(Date.parse("2026-08-17T00:00:00+08:00")),
      getWeeklyModeId(Date.parse("2026-08-24T00:00:00+08:00")),
      getWeeklyModeId(Date.parse("2026-08-31T00:00:00+08:00")),
      getWeeklyModeId(Date.parse("2026-09-07T00:00:00+08:00")),
      getWeeklyModeId(Date.parse("2026-09-14T00:00:00+08:00")),
    ]).toEqual(["playable", "currency-wars", "aeon", "playable", "currency-wars"]);
  });

  test("洗牌袋用尽前不重复", () => {
    const first = pickFromShuffleBag(["a", "b", "c"], new Set(), 0.5);
    const second = pickFromShuffleBag(["a", "b", "c"], new Set([first.index]), 0.5);
    expect(second.item).not.toBe(first.item);
    expect(second.exhausted).toBe(false);
  });

  test("洗牌袋重洗后不会立即重复上一题", () => {
    const next = pickFromShuffleBag(["a", "b", "c"], new Set([0, 1, 2]), 0, 0);
    expect(next.item).not.toBe("a");
    expect(next.exhausted).toBe(true);
  });

  test("无尽局以五条命开始，胜负与跳过分别更新计分", () => {
    expect(ENDLESS_INITIAL_LIVES).toBe(5);
    const cleared = applyEndlessRoundOutcome(
      { lives: 5, clears: 0, totalGuesses: 0 },
      { outcome: "won", guessesUsed: 3 },
    );
    const failed = applyEndlessRoundOutcome(cleared, { outcome: "lost", guessesUsed: 6 });
    const skipped = applyEndlessRoundOutcome(failed, { outcome: "skipped", guessesUsed: 0 });
    expect(cleared).toEqual({ lives: 5, clears: 1, totalGuesses: 3 });
    expect(failed).toEqual({ lives: 4, clears: 1, totalGuesses: 9 });
    expect(skipped).toEqual({ lives: 3, clears: 1, totalGuesses: 9 });
  });

  test("无尽排行依次比较通关数、总猜测次数和总耗时", () => {
    const entries = [
      { clears: 4, totalGuesses: 12, elapsedMs: 90_000 },
      { clears: 5, totalGuesses: 20, elapsedMs: 80_000 },
      { clears: 5, totalGuesses: 18, elapsedMs: 100_000 },
      { clears: 5, totalGuesses: 18, elapsedMs: 70_000 },
    ];
    expect(entries.toSorted(compareEndlessLeaderboardEntries)).toEqual([
      entries[3]!,
      entries[2]!,
      entries[1]!,
      entries[0]!,
    ]);
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

describe("星神遮罩", () => {
  test("同一 gameId 的顺序在恢复和回放时稳定", () => {
    const order = aeonRevealOrder("game-aeon-stable");
    expect(aeonRevealOrder("game-aeon-stable")).toEqual(order);
    expect(new Set(order).size).toBe(16);
    expect(aeonRevealOrder("game-aeon-other")).not.toEqual(order);
  });

  test("初始揭示四格，每次错误再揭示两格，结算后完整揭示", () => {
    expect(aeonRevealedCells("game-aeon-stable", 0).size).toBe(4);
    expect(aeonRevealedCells("game-aeon-stable", 1).size).toBe(6);
    expect(aeonRevealedCells("game-aeon-stable", 5).size).toBe(14);
    expect(aeonRevealedCells("game-aeon-stable", 6).size).toBe(16);
    expect([...aeonRevealedCells("game-aeon-stable", 1)]).toEqual(
      aeonRevealOrder("game-aeon-stable").slice(0, 6),
    );
  });
});
