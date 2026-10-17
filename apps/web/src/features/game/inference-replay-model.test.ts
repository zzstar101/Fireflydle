import { describe, expect, it } from "vitest";
import type { GuessCell, GuessResult } from "@fireflydle/contracts";
import { buildInferenceReplayFrames } from "./inference-replay-model";

interface Candidate {
  id: string;
  color: string;
}

const candidates: Candidate[] = [
  { id: "a", color: "red" },
  { id: "b", color: "blue" },
  { id: "c", color: "red" },
];

function compare(target: Candidate, guess: Candidate): GuessCell[] {
  return [
    { field: "color", state: target.color === guess.color ? "exact" : "miss", direction: "none" },
  ];
}

function guess(id: string, cells: GuessCell[], isCorrect = false): GuessResult {
  return {
    character: { id },
    cells,
    isCorrect,
  } as unknown as GuessResult;
}

const red: GuessCell[] = [{ field: "color", state: "exact", direction: "none" }];
const blue: GuessCell[] = [{ field: "color", state: "miss", direction: "none" }];

describe("buildInferenceReplayFrames", () => {
  it("每一帧记录的是这一猜之后的存活集合", () => {
    const frames = buildInferenceReplayFrames(candidates, [guess("a", red)], compare);
    expect(frames).toHaveLength(1);
    expect(frames[0]?.guessId).toBe("a");
    // 红色的 a 与 c 都符合反馈，但 a 这一猜没中，所以 a 被确定排除，只剩 c。
    expect(frames[0]?.remainingIds).toEqual(["c"]);
  });

  it("猜中时只剩被猜中的那个候选", () => {
    const frames = buildInferenceReplayFrames(candidates, [guess("a", red, true)], compare);
    expect(frames[0]?.remainingIds).toEqual(["a"]);
  });

  it("连续猜测时逐帧收窄", () => {
    const frames = buildInferenceReplayFrames(
      candidates,
      [guess("a", red), guess("c", red, true)],
      compare,
    );
    expect(frames.map((frame) => frame.remainingIds)).toEqual([["c"], ["c"]]);
  });

  it("猜错时被猜中的候选即使反馈一致也要排除", () => {
    const frames = buildInferenceReplayFrames(
      candidates,
      [guess("a", red, false), guess("b", blue)],
      compare,
    );
    expect(frames[1]?.remainingIds).toEqual(["c"]);
  });

  it("没有猜测时返回空数组", () => {
    expect(buildInferenceReplayFrames(candidates, [], compare)).toEqual([]);
  });

  it("候选池里没有这个猜测时跳过收窄，不抛错", () => {
    const frames = buildInferenceReplayFrames(
      candidates,
      [guess("zzz", red), guess("b", blue)],
      compare,
    );
    // 第一猜的 zzz 不在候选池里：保留全体。第二猜 b 得蓝反馈，排除 b 自己，剩下两个红色候选。
    expect(frames[0]?.remainingIds).toEqual(["a", "b", "c"]);
    expect(frames[1]?.remainingIds).toEqual(["a", "c"]);
  });
});
