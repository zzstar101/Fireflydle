/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import {
  InferenceReviewSchema,
  type GameEntitySummary,
  type GuessCell,
  type GuessResult,
} from "@fireflydle/contracts";
import { createInferenceReviewForEntities } from "./index";

type Entity = { id: string };
const entities = (...ids: string[]): Entity[] => ids.map((id) => ({ id }));
const summary = (entity: Entity): GameEntitySummary => ({
  id: entity.id,
  names: { "zh-CN": entity.id, en: entity.id, ja: entity.id },
  aliases: { "zh-CN": [], en: [], ja: [] },
  regionId: "region",
  factionId: "faction",
  factionGroupId: "group",
  debutVersionId: "1.0",
  debutVersionOrder: 0,
  assets: {
    avatarPath: "/test.webp",
    portraitPath: "/test.webp",
    sha256: "a".repeat(64),
    rightsNotice: "测试",
  },
});
const feedback = (field = "region", direction: GuessCell["direction"] = "none"): GuessCell[] => [
  { field, state: "miss", direction },
];
const uniform = (): GuessCell[] => feedback();
const result = (
  answer: Entity,
  guess: Entity,
  compare: (answer: Entity, guess: Entity) => GuessCell[] = uniform,
): GuessResult => ({
  character: summary(guess),
  cells: compare(answer, guess),
  isCorrect: answer.id === guess.id,
  guessedAt: "2026-08-01T00:00:00.000Z",
});

describe("推理评分", () => {
  test("反馈相同仍将猜中单独分组，计算熵与期望剩余数", () => {
    const pool = entities("a", "b", "c", "d");
    const review = createInferenceReviewForEntities(pool, [result(pool[1]!, pool[0]!)], uniform);
    expect(review.steps[0]).toMatchObject({
      candidatesBefore: 4,
      expectedRemaining: 2.5,
      skill: 100,
    });
    expect(review.steps[0]?.informationBits).toBeCloseTo(0.8112781244591328, 12);
    expect(review).toMatchObject({ score: 100, grade: "S" });
    expect(review.steps[0]).not.toHaveProperty("bestGuess");
    expect(InferenceReviewSchema.safeParse(review).success).toBe(true);
  });

  test("反馈签名区分字段与方向，并用最佳熵归一化 skill", () => {
    const pool = entities("a", "b", "c", "d");
    const compare = (answer: Entity, guess: Entity) =>
      guess.id === "b"
        ? feedback(answer.id === "c" ? "faction" : "region", answer.id === "d" ? "higher" : "none")
        : feedback();
    const review = createInferenceReviewForEntities(
      pool,
      [result(pool[3]!, pool[0]!, compare)],
      compare,
      { toSummary: summary },
    );
    expect(review.steps[0]).toMatchObject({
      bestInformationBits: 2,
      bestExpectedRemaining: 1,
      skill: 41,
      bestGuess: { id: "b" },
    });
  });

  test("并列优先剩余候选，再按 id 排序且不依赖输入顺序", () => {
    const pool = entities("c", "a", "b");
    const compare = (answer: Entity) => feedback(answer.id);
    const guesses = [result(pool[0]!, pool[1]!, compare), result(pool[0]!, pool[0]!, compare)];
    for (const candidates of [pool, [...pool].reverse()]) {
      const review = createInferenceReviewForEntities(candidates, guesses, compare, {
        toSummary: summary,
      });
      expect(review.steps.map((step) => step.bestGuess?.id)).toEqual(["a", "c"]);
      expect(review.steps.map((step) => step.candidatesBefore)).toEqual([3, 1]);
    }
  });

  test("相同熵时先选期望剩余更小的猜测，允许选择已排除实体", () => {
    const pool = entities(
      "probe",
      "a-wide",
      "z-balanced",
      ...Array.from({ length: 8 }, (_, i) => `s${i}`),
    );
    const compare = (answer: Entity, guess: Entity) => {
      if (guess.id === "probe") return feedback(answer.id.startsWith("s") ? "region" : "faction");
      const index = Number(answer.id.slice(1));
      if (guess.id === "a-wide") return feedback(`group-${index < 4 ? index : 4}`);
      if (guess.id === "z-balanced") return feedback(`group-${Math.floor(index / 2)}`);
      return feedback();
    };
    const answer = pool[3]!;
    const review = createInferenceReviewForEntities(
      pool,
      [result(answer, pool[0]!, compare), result(answer, pool[1]!, compare)],
      compare,
      { toSummary: summary },
    );
    expect(review.steps[1]).toMatchObject({
      candidatesBefore: 8,
      informationBits: 2,
      expectedRemaining: 2.5,
      bestInformationBits: 2,
      bestExpectedRemaining: 2,
      bestGuess: { id: "z-balanced" },
    });
  });

  test("只剩一个候选时猜中 100，猜错 0，均值四舍五入", () => {
    const pool = entities("a", "b");
    const guesses = [
      result(pool[0]!, pool[1]!),
      result(pool[0]!, pool[1]!),
      result(pool[0]!, pool[0]!),
    ];
    const review = createInferenceReviewForEntities(pool, guesses, uniform, { toSummary: summary });
    expect(review.steps.map((step) => step.skill)).toEqual([100, 0, 100]);
    expect(review.steps[1]).toMatchObject({
      candidatesBefore: 1,
      informationBits: 0,
      bestInformationBits: 0,
    });
    expect(review).toMatchObject({ score: 67, grade: "B", bestGuessNumber: 1 });
    expect(review.steps.map((step) => step.isBest)).toEqual([true, false, false]);
  });

  test.each([
    [0, "D"],
    [39, "D"],
    [40, "C"],
    [59, "C"],
    [60, "B"],
    [74, "B"],
    [75, "A"],
    [89, "A"],
    [90, "S"],
    [100, "S"],
  ] as const)("score %i 对应 grade %s", (score, grade) => {
    const [answer, missing] = entities("answer", "missing");
    const guesses = Array.from({ length: 100 }, (_, index) =>
      result(answer!, index < score ? answer! : missing!),
    );
    expect(createInferenceReviewForEntities([answer!], guesses, uniform)).toMatchObject({
      score,
      grade,
    });
  });

  test("没有猜测时 score/grade 为 null，旧复盘仍通过契约", () => {
    const review = createInferenceReviewForEntities(entities("a"), [], uniform);
    expect(review).toMatchObject({ score: null, grade: null, steps: [] });
    expect(
      InferenceReviewSchema.safeParse({ initialCandidates: 1, bestGuessNumber: null, steps: [] })
        .success,
    ).toBe(true);
  });

  test("超过 60000 比较预算时只从剩余候选找 best", () => {
    const pool = entities("probe", ...Array.from({ length: 300 }, (_, i) => `s${i}`));
    const compare = (answer: Entity, guess: Entity) =>
      feedback(guess.id === "probe" ? (answer.id === "s299" ? "faction" : "region") : "region");
    const guesses = [result(pool[1]!, pool[0]!, compare), result(pool[1]!, pool[1]!, compare)];
    // 通过摘要回调标记第二步，确认不会再评估已排除的 probe。
    let secondStep = false;
    const tracked = (answer: Entity, guess: Entity) => {
      if (secondStep && guess.id === "probe") throw new Error("预算降级后不应评估池外猜测");
      return compare(answer, guess);
    };
    const review = createInferenceReviewForEntities(pool, guesses, tracked, {
      toSummary: (entity) => {
        secondStep = true;
        return summary(entity);
      },
    });
    expect(review.steps[1]?.candidatesBefore).toBe(299);
    expect(review.steps[1]?.bestGuess?.id).not.toBe("probe");
  });
});
