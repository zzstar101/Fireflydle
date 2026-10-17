import { useId, type JSX } from "react";
import "./mode-art.css";

/**
 * 玩法卡自绘插画，直接移植自 docs/design/redesign-v2/prototype.html（illD20 / illInf /
 * illWeek / illDuel 与更多玩法的 GLYPH）。星图仪线稿：统一 200×200 视窗，细线 + 圆点 +
 * 一个发光主色；线条用 currentColor，主色用 --lit / --near。
 *
 * 动画只在父元素带 [data-visible="true"]（进入视口）时运行，见 mode-art.css。
 */

export type ModeArtKind =
  | "practice" // 练习 —— 星图骰
  | "endless" // 无尽 —— 无限轨道
  | "weekly" // 周赛 —— 5 段进度环 + 星座
  | "duel" // 实时对战 —— 双星彗尾
  | "portrait" // 立绘挑战 —— 取景框 + 放大镜
  | "currency-wars" // 货币战争 —— 硬币堆
  | "aeon"; // 星神 —— 星环

export interface ModeArtProps {
  kind: ModeArtKind;
  /** 可选类名，调用方用来控制尺寸；默认 100% 宽高由父元素决定。 */
  className?: string | undefined;
  /** 周赛已完成题数（0–5），决定进度环亮几段。 */
  weeklyDone?: number | undefined;
}

type Point = [number, number];

const polar = (cx: number, cy: number, r: number, deg: number): Point => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];
const fmt = (pts: Point[]) => pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
/** 四角星（原型 star4）。 */
const star4 = (x: number, y: number, s: number) =>
  `M${x},${y - s}Q${x},${y} ${x + s},${y}Q${x},${y} ${x},${y + s}Q${x},${y} ${x - s},${y}Q${x},${y} ${x},${y - s}Z`;

function D20({ uid }: { uid: string }) {
  const outer = [-90, -30, 30, 90, 150, 210].map((a) => polar(100, 104, 74, a));
  const inner = [-90, 30, 150].map((a) => polar(100, 104, 40, a));
  const links: Array<[number, number[]]> = [
    [0, [0, 1, 5]],
    [1, [1, 2, 3]],
    [2, [3, 4, 5]],
  ];
  const edges = links
    .flatMap(([i, os]) =>
      os.map((o) => `M${fmt([inner[i] ?? [0, 0]])}L${fmt([outer[o] ?? [0, 0]])}`),
    )
    .join("");
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-g`}>
          <stop offset="0" style={{ stopColor: "var(--lit)" }} stopOpacity=".28" />
          <stop offset="1" style={{ stopColor: "var(--lit)" }} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="104" r="96" fill={`url(#${uid}-g)`} />
      <circle className="orbit spin" cx="100" cy="104" r="90" strokeDasharray="1 6" />
      <g className="die">
        <polygon className="ln" points={fmt(outer)} />
        <path className="ln" d={edges} />
        <polygon className="face" points={fmt(inner)} />
        <text x="100" y="114" className="q">
          ?
        </text>
      </g>
      <path className="spark tw" d={star4(168, 40, 7)} />
      <path className="spark tw d2" d={star4(36, 160, 5)} />
    </>
  );
}

const INF_PATH =
  "M100,100C128,58 182,58 182,100C182,142 128,142 100,100C72,58 18,58 18,100C18,142 72,142 100,100Z";

function InfinityLoop({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-g`}>
          <stop offset="0" style={{ stopColor: "var(--near)" }} stopOpacity=".3" />
          <stop offset="1" style={{ stopColor: "var(--near)" }} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="98" ry="70" fill={`url(#${uid}-g)`} />
      <path className="ln" d={INF_PATH} />
      <path className="rail" d={INF_PATH} transform="translate(0 7)" />
      <path className="runner trail" d={INF_PATH} pathLength={100} />
      <path className="runner head" d={INF_PATH} pathLength={100} />
    </>
  );
}

const WEEK_POINTS: Point[] = [
  [64, 118],
  [84, 84],
  [110, 98],
  [128, 66],
  [142, 112],
];

function Week({ uid, done }: { uid: string; done: number }) {
  // 5 段 = 本周 5 题；已完成的段点亮，下一题为虚线「进行中」。
  const segments = Array.from({ length: 5 }, (_, i) => {
    const a0 = -90 + i * 72 + 4;
    const [x0, y0] = polar(100, 100, 76, a0);
    const [x1, y1] = polar(100, 100, 76, a0 + 64);
    const state = i < done ? "on" : i === done ? "now" : "";
    return (
      <path
        key={i}
        className={`seg ${state}`.trim()}
        d={`M${x0.toFixed(1)},${y0.toFixed(1)}A76,76 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`}
      />
    );
  });
  const litCount = Math.max(0, Math.min(5, done));
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-g`}>
          <stop offset="0" style={{ stopColor: "var(--lit)" }} stopOpacity=".22" />
          <stop offset="1" style={{ stopColor: "var(--lit)" }} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill={`url(#${uid}-g)`} />
      {segments}
      <circle className="orbit" cx="100" cy="100" r="62" />
      <polyline className="const" points={fmt(WEEK_POINTS)} />
      {litCount > 1 && (
        <polyline className="const lit" points={fmt(WEEK_POINTS.slice(0, litCount))} />
      )}
      {WEEK_POINTS.map(([x, y], i) =>
        i < litCount ? (
          <path key={i} className="spark" d={star4(x, y, 7)} />
        ) : (
          <circle key={i} className="node" cx={x} cy={y} r="3.2" />
        ),
      )}
      <path className="hand" d="M100,100L100,40" />
      <circle cx="100" cy="100" r="3" className="dot" />
    </>
  );
}

function Duel({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-g`}>
          <stop offset="0" style={{ stopColor: "#fff" }} stopOpacity=".18" />
          <stop offset="1" style={{ stopColor: "#fff" }} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-c1`} x1="0" x2="1">
          <stop offset="0" style={{ stopColor: "var(--lit)" }} stopOpacity="0" />
          <stop offset="1" style={{ stopColor: "var(--lit)" }} />
        </linearGradient>
        <linearGradient id={`${uid}-c2`} x1="1" x2="0">
          <stop offset="0" style={{ stopColor: "var(--near)" }} stopOpacity="0" />
          <stop offset="1" style={{ stopColor: "var(--near)" }} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="70" fill={`url(#${uid}-g)`} />
      <ellipse className="ln" cx="100" cy="100" rx="86" ry="30" transform="rotate(-28 100 100)" />
      <ellipse className="ln" cx="100" cy="100" rx="86" ry="30" transform="rotate(28 100 100)" />
      <g className="comet c1">
        <path d="M30,140L74,116" stroke={`url(#${uid}-c1)`} strokeWidth="3" strokeLinecap="round" />
        <circle cx="74" cy="116" r="5" style={{ fill: "var(--lit)" }} />
      </g>
      <g className="comet c2">
        <path
          d="M170,140L126,116"
          stroke={`url(#${uid}-c2)`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="126" cy="116" r="5" style={{ fill: "var(--near)" }} />
      </g>
      <path className="spark big" d={star4(100, 100, 16)} />
    </>
  );
}

/* 更多玩法列表的小图标（48×48） */
function PortraitGlyph() {
  return (
    <>
      <rect className="ln" x="11" y="8" width="26" height="32" rx="3" />
      <path
        className="ln"
        d="M15 34c2-6 5-8 9-8s7 2 9 8M24 23a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
        opacity=".45"
      />
      <circle className="acc" cx="30" cy="28" r="8" />
      <path className="acc" d="m36 34 5 5" />
    </>
  );
}

function CoinGlyph() {
  return (
    <>
      <ellipse className="ln" cx="22" cy="33" rx="12" ry="4.5" />
      <path className="ln" d="M10 33v-5M34 33v-5" />
      <ellipse className="ln" cx="22" cy="28" rx="12" ry="4.5" />
      <path className="ln" d="M10 28v-5M34 28v-5" />
      <ellipse className="acc" cx="22" cy="23" rx="12" ry="4.5" />
      <path className="acc fill" d={star4(36, 13, 5)} />
    </>
  );
}

function AeonGlyph() {
  return (
    <>
      <circle className="ln" cx="24" cy="24" r="17" />
      <circle className="ln" cx="24" cy="24" r="11" strokeDasharray="2 3" />
      <path className="acc fill" d={star4(24, 24, 8)} />
      <circle className="acc fill" cx="24" cy="7" r="2" />
    </>
  );
}

const ILL_CLASS: Partial<Record<ModeArtKind, string>> = {
  practice: "ill-d20",
  endless: "ill-inf",
  weekly: "ill-week",
  duel: "ill-duel",
};

export function ModeArt({ kind, className, weeklyDone = 0 }: ModeArtProps): JSX.Element {
  const uid = `ma${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const glyph = kind === "portrait" || kind === "currency-wars" || kind === "aeon";
  const classes = [
    "mode-art",
    glyph ? "mode-glyph" : `ill-svg ${ILL_CLASS[kind]}`,
    `mode-art--${kind}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      data-mode-art={kind}
      viewBox={glyph ? "0 0 48 48" : "0 0 200 200"}
      aria-hidden="true"
      focusable="false"
    >
      {kind === "practice" && <D20 uid={uid} />}
      {kind === "endless" && <InfinityLoop uid={uid} />}
      {kind === "weekly" && <Week uid={uid} done={weeklyDone} />}
      {kind === "duel" && <Duel uid={uid} />}
      {kind === "portrait" && <PortraitGlyph />}
      {kind === "currency-wars" && <CoinGlyph />}
      {kind === "aeon" && <AeonGlyph />}
    </svg>
  );
}
