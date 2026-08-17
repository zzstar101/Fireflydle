import { BrainCircuit, Sparkles } from "lucide-react";
import type { InferenceReview as InferenceReviewData, Locale } from "@fireflydle/contracts";
import "./game.css";

export function InferenceReview({
  review,
  locale,
  compact = false,
}: {
  review: InferenceReviewData;
  locale: Locale;
  compact?: boolean;
}) {
  const text =
    locale === "zh-CN"
      ? {
          title: "推理复盘",
          initial: "初始候选",
          guess: "第",
          suffix: " 猜",
          remaining: "剩余",
          best: "最大缩减",
        }
      : locale === "ja"
        ? {
            title: "推理レビュー",
            initial: "初期候補",
            guess: "第",
            suffix: "回目",
            remaining: "残り",
            best: "最大削減",
          }
        : {
            title: "Inference review",
            initial: "Initial pool",
            guess: "Guess ",
            suffix: "",
            remaining: "left",
            best: "Best cut",
          };
  return (
    <section className={`inference-review${compact ? " inference-review-compact" : ""}`}>
      <header>
        <span>
          <BrainCircuit size={17} /> {text.title}
        </span>
        <small>
          {text.initial} <strong>{review.initialCandidates}</strong>
        </small>
      </header>
      <ol aria-label={text.title}>
        {review.steps.map((step) => (
          <li className={step.isBest ? "best" : undefined} key={step.guessNumber}>
            <span>
              {text.guess}
              {step.guessNumber}
              {text.suffix}
            </span>
            <strong>
              {text.remaining} {step.remainingCandidates}
            </strong>
            <small>-{step.eliminatedCandidates}</small>
            {step.isBest ? (
              <i title={text.best}>
                <Sparkles size={13} /> {text.best}
              </i>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
