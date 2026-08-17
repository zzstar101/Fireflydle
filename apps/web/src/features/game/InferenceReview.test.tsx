import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { InferenceReview } from "./InferenceReview";

describe("推理复盘", () => {
  test("展示每一步剩余数并只标记服务端选出的最佳猜测", () => {
    const markup = renderToStaticMarkup(
      <InferenceReview
        locale="zh-CN"
        review={{
          initialCandidates: 7,
          bestGuessNumber: 1,
          steps: [
            { guessNumber: 1, remainingCandidates: 3, eliminatedCandidates: 4, isBest: true },
            { guessNumber: 2, remainingCandidates: 1, eliminatedCandidates: 2, isBest: false },
          ],
        }}
      />,
    );
    expect(markup).toContain("初始候选");
    expect(markup).toContain("剩余 3");
    expect(markup.match(/最大缩减/g)).toHaveLength(2);
    expect(markup.match(/class=\"best\"/g)).toHaveLength(1);
  });
});
