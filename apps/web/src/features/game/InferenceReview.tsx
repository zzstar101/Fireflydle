import { BrainCircuit, Sparkles } from "lucide-react";
import type {
  InferenceGrade,
  InferenceReview as InferenceReviewData,
  Locale,
} from "@fireflydle/contracts";
import "./game.css";

const COPY = {
  "zh-CN": {
    title: "推理复盘",
    initial: "初始候选",
    guess: "第",
    suffix: " 猜",
    remaining: "剩余",
    best: "最大缩减",
    score: "推理评分",
    chain: "每一猜后剩余候选",
    skill: "信息效率",
    bestGuess: "这一步最优",
    bits: "比特",
    grades: {
      S: "近乎最优",
      A: "思路清晰",
      B: "稳扎稳打",
      C: "还有空间",
      D: "全凭运气",
    },
  },
  ja: {
    title: "推理レビュー",
    initial: "初期候補",
    guess: "第",
    suffix: "回目",
    remaining: "残り",
    best: "最大削減",
    score: "推理スコア",
    chain: "各回答後の残り候補",
    skill: "情報効率",
    bestGuess: "最善手",
    bits: "bit",
    grades: {
      S: "ほぼ最適",
      A: "明快な推理",
      B: "堅実",
      C: "改善の余地あり",
      D: "運まかせ",
    },
  },
  en: {
    title: "Inference review",
    initial: "Initial pool",
    guess: "Guess ",
    suffix: "",
    remaining: "left",
    best: "Best cut",
    score: "Inference score",
    chain: "Candidates left after each guess",
    skill: "Info efficiency",
    bestGuess: "Best here",
    bits: "bits",
    grades: {
      S: "Near optimal",
      A: "Sharp",
      B: "Steady",
      C: "Room to grow",
      D: "Mostly luck",
    },
  },
} satisfies Record<Locale, unknown>;

/** 评分环：r=26 的圆周长，用 stroke-dasharray 画进度。 */
const RING = 2 * Math.PI * 26;

function GradeRing({ score, grade }: { score: number; grade: InferenceGrade }) {
  const filled = (Math.max(0, Math.min(100, score)) / 100) * RING;
  return (
    <svg className="inference-ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="26" className="track" />
      <circle
        cx="32"
        cy="32"
        r="26"
        className="value"
        style={{ strokeDasharray: `${filled} ${RING}` }}
      />
      <text x="32" y="38" textAnchor="middle">
        {grade}
      </text>
    </svg>
  );
}

export function InferenceReview({
  review,
  locale,
  compact = false,
}: {
  review: InferenceReviewData;
  locale: Locale;
  compact?: boolean;
}) {
  const text = COPY[locale] ?? COPY.en;
  const scored = typeof review.score === "number" && review.grade;
  const chain = [review.initialCandidates, ...review.steps.map((step) => step.remainingCandidates)];

  return (
    <section
      className={`inference-review${compact ? " inference-review-compact" : ""}${
        scored ? " is-scored" : ""
      }`}
    >
      <header>
        <span>
          <BrainCircuit size={17} /> {text.title}
        </span>
        <small>
          {text.initial} <strong>{review.initialCandidates}</strong>
        </small>
      </header>

      {scored ? (
        <div className={`inference-score grade-${review.grade}`}>
          <GradeRing score={review.score ?? 0} grade={review.grade as InferenceGrade} />
          <div>
            <small>{text.score}</small>
            <strong>
              {review.score}
              <span>/100</span>
            </strong>
            <em>{text.grades[review.grade as InferenceGrade]}</em>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="inference-chain">
          <small>{text.chain}</small>
          <p>
            {chain.map((count, index) => (
              <span key={index} className={index === chain.length - 1 ? "last" : undefined}>
                {index > 0 ? <i aria-hidden="true">→</i> : null}
                <b>{count}</b>
              </span>
            ))}
          </p>
        </div>
      ) : null}

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
            {typeof step.skill === "number" ? (
              <meter
                className="inference-skill"
                min={0}
                max={100}
                value={step.skill}
                title={`${text.skill} ${step.skill}%${
                  typeof step.informationBits === "number"
                    ? ` · ${step.informationBits.toFixed(2)} ${text.bits}`
                    : ""
                }`}
              />
            ) : null}
            {step.isBest ? (
              <i title={text.best}>
                <Sparkles size={13} /> {text.best}
              </i>
            ) : null}
            {!compact && step.bestGuess && typeof step.skill === "number" && step.skill < 100 ? (
              <em className="inference-best-guess">
                {text.bestGuess}：{step.bestGuess.names[locale]}
              </em>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
