import type { GuessCell, GuessResult } from "@fireflydle/contracts";

/**
 * 结算推理回放：算出每一步猜测之后牌桌上还剩哪些候选。
 *
 * Worker 返回的 `InferenceReview` 只公开计数（`remainingCandidates` 等），
 * 不公开候选 id 列表——这是有意的，避免复盘接口变成答案探测器。
 * 回放只在对局结束后出现，所以在客户端用同一套判题器重放即可，公平性不受影响。
 */

export interface InferenceReplayFrame {
  /** 这一步猜的角色 id。 */
  guessId: string;
  /** 这一步猜完之后仍在牌桌上的候选 id，顺序与传入的 candidates 一致。 */
  remainingIds: readonly string[];
}

/** 与 game-engine 内部 `sameFeedback` 等价：逐字段比对状态与方向。 */
function sameFeedback(left: readonly GuessCell[], right: readonly GuessCell[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((cell, index) => {
    const other = right[index];
    return (
      other !== undefined &&
      cell.field === other.field &&
      cell.state === other.state &&
      cell.direction === other.direction
    );
  });
}

/**
 * 逐猜收窄候选池。过滤条件与 `createInferenceReviewForEntities` 完全一致：
 * 「是不是这一猜的答案」与「判题反馈是否和真实反馈相同」两件事必须同时成立。
 *
 * 每一帧记录的是**这一猜之后**的存活集合，与 `InferenceReviewStep.remainingCandidates`
 * 同一语义；回放组件自己负责在序列最前面补上「全体候选」的初始状态。
 */
export function buildInferenceReplayFrames<T extends { id: string }>(
  candidates: readonly T[],
  guesses: readonly GuessResult[],
  compare: (target: T, guess: T) => readonly GuessCell[],
): InferenceReplayFrame[] {
  let remaining = [...candidates];
  const frames: InferenceReplayFrame[] = [];
  for (const result of guesses) {
    const guess = candidates.find((candidate) => candidate.id === result.character.id);
    if (guess) {
      remaining = remaining.filter(
        (candidate) =>
          (candidate.id === guess.id) === result.isCorrect &&
          sameFeedback(compare(candidate, guess), result.cells),
      );
    }
    frames.push({
      guessId: result.character.id,
      remainingIds: remaining.map((candidate) => candidate.id),
    });
  }
  return frames;
}
