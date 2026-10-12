import type { JSX } from "react";
import "./mode-art.css";

/**
 * 玩法卡自绘线稿（docs/design/redesign-v2/README.md §7「图像资源」/ 玩法卡）。
 * 纯内联 SVG 线稿，不使用位图、three.js 或任何新依赖；线色一律取 currentColor，
 * 由调用方决定金色 / 星云紫 / 弱化色。组件完全装饰性，不参与无障碍树。
 *
 * 动效契约见 mode-art.css 顶部注释：动画默认暂停，父卡片可见时才会运行。
 */

export type ModeArtKind =
  | "practice" // 练习 —— 星图骰
  | "endless" // 无尽 —— 无限轨道
  | "weekly" // 周赛 —— 5 段进度环 + 星座
  | "duel" // 实时对战 —— 双星轨道
  | "portrait" // 立绘挑战 —— 局部立绘取景框
  | "currency-wars" // 货币战争 —— 硬币堆
  | "aeon"; // 星神 —— 遮罩图像

export interface ModeArtProps {
  kind: ModeArtKind;
  /** 可选类名，调用方用来控制尺寸；默认 100% 宽高由父元素决定。 */
  className?: string;
}

/** 环上取点（角度以 12 点方向为 0°，顺时针为正）。 */
function pointOnCircle(cx: number, cy: number, radius: number, degrees: number): [number, number] {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
}

/** 圆环上的开环弧段，用于周赛的 5 段进度环（含端点，线段宽度不受 stroke-width 影响）。 */
function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startDegrees: number,
  endDegrees: number,
): string {
  const [sx, sy] = pointOnCircle(cx, cy, radius, startDegrees);
  const [ex, ey] = pointOnCircle(cx, cy, radius, endDegrees);
  return `M${sx.toFixed(2)} ${sy.toFixed(2)} A${radius} ${radius} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

const WEEKLY_SEGMENTS = 5;
const WEEKLY_ARC_DEGREES = 60;
const WEEKLY_GAP_DEGREES = 12;

function weeklySegmentPaths(): string[] {
  return Array.from({ length: WEEKLY_SEGMENTS }, (_, index) =>
    arcPath(
      48,
      48,
      32,
      index * (WEEKLY_ARC_DEGREES + WEEKLY_GAP_DEGREES),
      index * (WEEKLY_ARC_DEGREES + WEEKLY_GAP_DEGREES) + WEEKLY_ARC_DEGREES,
    ),
  );
}

/** 星图骰：六边形骰面 + 问号状的星图。 */
function PracticeArt(): JSX.Element {
  return (
    <>
      <polygon className="mode-art__die" points="48,13 78,30.5 78,65.5 48,83 18,65.5 18,30.5" />
      <polygon
        className="mode-art__die-inner"
        opacity="0.35"
        points="48,23 70,35.5 70,60.5 48,73 26,60.5 26,35.5"
      />
      <path className="mode-art__chart" d="M40 40 Q48 29 56 40" />
      <path className="mode-art__chart" d="M48 39 V50" />
      <circle className="mode-art__chart-dot" cx="48" cy="59" r="2.6" fill="currentColor" />
      <circle
        className="mode-art__star"
        cx="35"
        cy="66"
        r="1.5"
        fill="currentColor"
        opacity="0.5"
      />
      <circle
        className="mode-art__star"
        cx="62"
        cy="25"
        r="1.5"
        fill="currentColor"
        opacity="0.5"
      />
    </>
  );
}

/** 无限轨道：双纽线轨道 + 一枚沿轨道行进的光点。 */
function EndlessArt(): JSX.Element {
  return (
    <>
      <path
        className="mode-art__orbit"
        d="M48 48 C42 39 35 34 28 35 C20 36 16 42 16 48 C16 54 20 60 28 61 C35 62 42 57 48 48 C54 39 61 34 68 35 C76 36 80 42 80 48 C80 54 76 60 68 61 C61 62 54 57 48 48 Z"
      />
      <path
        className="mode-art__orbit-inner"
        opacity="0.3"
        d="M48 48 C43 42 37 38 31 39 C25 40 22 44 22 48 C22 52 25 56 31 57 C37 58 43 54 48 48 C53 42 59 38 65 39 C71 40 74 44 74 48 C74 52 71 56 65 57 C59 58 53 54 48 48 Z"
      />
      <circle className="mode-art__dot" cx="48" cy="48" r="3" fill="currentColor" />
    </>
  );
}

/** 5 段进度环 + 星座：第一段为进行中的活动段。 */
function WeeklyArt(): JSX.Element {
  const segments = weeklySegmentPaths();
  return (
    <>
      {segments.map((path, index) => (
        <path
          key={index}
          className={
            index === 0
              ? "mode-art__ring mode-art__ring--active"
              : "mode-art__ring mode-art__ring--idle"
          }
          d={path}
          opacity={index === 0 ? 1 : 0.32}
        />
      ))}
      <path className="mode-art__constellation" opacity="0.5" d="M40 46 L49 39 L58 45 L50 54 Z" />
      <path className="mode-art__constellation" opacity="0.5" d="M49 39 L50 54" />
      <circle className="mode-art__star" cx="40" cy="46" r="1.6" fill="currentColor" />
      <circle className="mode-art__star" cx="49" cy="39" r="1.6" fill="currentColor" />
      <circle className="mode-art__star" cx="58" cy="45" r="1.6" fill="currentColor" />
      <circle className="mode-art__star" cx="50" cy="54" r="1.6" fill="currentColor" />
    </>
  );
}

/** 双星轨道：两条倾斜轨道绕共同中心反向旋转，各带一颗伴星。 */
function DuelArt(): JSX.Element {
  return (
    <>
      <g className="mode-art__orbit-a">
        <ellipse className="mode-art__track" cx="48" cy="48" rx="35" ry="15" />
        <circle className="mode-art__star-a" cx="83" cy="48" r="3.4" fill="currentColor" />
      </g>
      <g className="mode-art__orbit-b">
        <ellipse
          className="mode-art__track"
          cx="48"
          cy="48"
          rx="35"
          ry="15"
          transform="rotate(60 48 48)"
          opacity="0.55"
        />
        {/* 椭圆 rotate(60°) 后右顶点的位置，保证伴星始终落在轨道线上。 */}
        <circle
          className="mode-art__star-b"
          cx="65.5"
          cy="17.7"
          r="3.4"
          fill="currentColor"
          opacity="0.75"
        />
      </g>
      <circle className="mode-art__core" cx="48" cy="48" r="4" fill="currentColor" />
    </>
  );
}

/** 局部立绘：取景框上的放大镜，镜中是一尊抽象半身像。 */
function PortraitArt(): JSX.Element {
  return (
    <>
      <rect className="mode-art__frame" x="13" y="13" width="70" height="70" rx="15" />
      <path className="mode-art__handle" d="M59 59 L77 77" />
      <circle className="mode-art__lens" cx="48" cy="46" r="25" />
      <circle className="mode-art__bust-head" cx="48" cy="38" r="8" />
      <path className="mode-art__bust-shoulders" d="M27 66 C34 55 41 51 48 51 C55 51 62 55 69 66" />
      <path
        className="mode-art__guide"
        opacity="0.35"
        d="M29 30 V22 M67 30 V22 M29 62 V70 M67 62 V70"
      />
    </>
  );
}

/** 硬币堆：三枚叠放的硬币 + 两枚散落代币。 */
function CurrencyWarsArt(): JSX.Element {
  return (
    <>
      <ellipse className="mode-art__coin" cx="48" cy="72" rx="22" ry="10" />
      <path className="mode-art__coin-edge" opacity="0.45" d="M26 72 V60 M70 72 V60" />
      <ellipse className="mode-art__coin" cx="48" cy="60" rx="22" ry="10" />
      <path className="mode-art__coin-edge" opacity="0.45" d="M26 60 V48 M70 60 V48" />
      <ellipse className="mode-art__coin" cx="48" cy="48" rx="22" ry="10" />
      <circle className="mode-art__token" cx="26" cy="30" r="6.5" opacity="0.55" />
      <circle className="mode-art__token" cx="70" cy="27" r="5" opacity="0.35" />
    </>
  );
}

/** 遮罩图像：圆形遮罩后透出的抽象星神剪影。 */
function AeonArt(): JSX.Element {
  return (
    <>
      <defs>
        <clipPath id="mode-art-aeon-mask">
          <circle cx="48" cy="48" r="34" />
        </clipPath>
      </defs>
      <circle className="mode-art__mask" cx="48" cy="48" r="34" />
      <g className="mode-art__silhouette" opacity="0.45" clipPath="url(#mode-art-aeon-mask)">
        <circle cx="48" cy="38" r="8" />
        <path d="M48 46 C59 46 67 54 70 76 H26 C29 54 37 46 48 46 Z" />
      </g>
      <path className="mode-art__aura" opacity="0.35" d="M32 64 Q48 55 64 64" />
      <path className="mode-art__aura" opacity="0.25" d="M24 26 Q31 18 40 15" />
      <path className="mode-art__aura" opacity="0.25" d="M72 26 Q65 18 56 15" />
    </>
  );
}

const MODE_ART: Record<ModeArtKind, () => JSX.Element> = {
  practice: PracticeArt,
  endless: EndlessArt,
  weekly: WeeklyArt,
  duel: DuelArt,
  portrait: PortraitArt,
  "currency-wars": CurrencyWarsArt,
  aeon: AeonArt,
};

export function ModeArt({ kind, className }: ModeArtProps): JSX.Element {
  const Art = MODE_ART[kind];
  return (
    <svg
      className={["mode-art", `mode-art--${kind}`, className].filter(Boolean).join(" ")}
      data-mode-art={kind}
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <Art />
    </svg>
  );
}
