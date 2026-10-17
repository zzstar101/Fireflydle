import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { fx } from "../../fx/fx";
import {
  loadCharacterPointCloud,
  loadPortraitPixels,
  toFxPortraitCloud,
  useCharacterPointCloudPath,
} from "../../lib/character-art";
import { qualityFlags } from "../../components/quality-flags";
import { hasSeenResultReveal, markResultRevealSeen } from "./reveal-memory";
import "./result-reveal.css";

/**
 * 结算揭晓：照搬原型 `playResult` 的收尾段（prototype.html:4797-4995）。
 *
 * 推理回放把答案头像推到台前之后（`start` 变为 true），以 T0 为起点：
 * - T0        `FX.setPortrait(slot, cloud)`，`S.warp → .75`（.45s power2.in）
 * - T0+.45    闪光 0→1（.12s）→0（1.1s）；`warp → 0`（1s power3.out）
 * - T0+.57    `morph → 1`（2.2s power2.inOut）：星海粒子汇聚成答案立绘
 * - T0+1.87   真实立绘 opacity 0 / scale 1.03 → 1（1.4s），同时 `shapeAlpha → .18`，
 *             父组件收到 `onReveal` 后淡入 `.art-cap` 与 `.panel`
 *
 * 已看过（或降级、无点云）时直接呈现终态：点云以 shapeAlpha .18 留在立绘背后。
 */

const WARP_MS = 450;
const MORPH_DELAY_MS = 570;
const ART_DELAY_MS = 1_870;

/** 闪光色：5★ 星光金，4★ 星云紫（原型 playResult 里的 --flash）。 */
const FLASH_GOLD = "#ffe2a0";
const FLASH_VIOLET = "#a68cff";

type RevealStyle = CSSProperties & Record<`--${string}`, string>;

export interface ResultRevealProps {
  characterId: string;
  /** 超分后的真实立绘；同时用来给点云取色。 */
  portraitSrc: string;
  /** 稀有度，决定闪光色（5★ 星光金、4★ 星云紫）。 */
  rarity: number;
  /** 是否播放序列；false 时立即呈现终态。 */
  active: boolean;
  /** 推理回放是否已经结束；序列在它变成 true 之后才开始（原型的收尾段紧接回放）。 */
  start: boolean;
  /** 演出记忆的键（用对局 id），同一局第二次打开直接跳终态。 */
  revealKey: string;
  /** 立绘开始淡入时回调一次；父组件用它串起 `.art-cap` / `.panel` 的入场。 */
  onReveal?: () => void;
}

function prefersReducedMotion(): boolean {
  if (qualityFlags().reduceMotion) return true;
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ResultReveal({
  characterId,
  portraitSrc,
  rarity,
  active,
  start,
  revealKey,
  onReveal,
}: ResultRevealProps): JSX.Element {
  const cloudPath = useCharacterPointCloudPath(characterId);
  const artRef = useRef<HTMLImageElement>(null);
  // 播放态：idle（等回放）→ flash（闪光已挂载）→ revealed（立绘淡入）
  const [phase, setPhase] = useState<"idle" | "flash" | "revealed">(() =>
    !active || hasSeenResultReveal(revealKey) ? "revealed" : "idle",
  );
  const play = active && phase !== "revealed";

  useEffect(() => {
    const slot = artRef.current?.parentElement ?? null;
    const glOff = qualityFlags().noGl;
    const animate = play && start && !glOff && !prefersReducedMotion();
    if (play && !start) return undefined;

    let cancelled = false;
    const timers: number[] = [];
    const cancels: Array<() => void> = [];
    const later = (ms: number, run: () => void) => {
      timers.push(window.setTimeout(() => !cancelled && run(), ms));
    };

    const finishNow = () => {
      markResultRevealSeen(revealKey);
      setPhase("revealed");
    };

    if (!animate) {
      finishNow();
    } else {
      fx.set({ morph: 0, shapeAlpha: 1, scatter: 0, disperse: 0 });
    }

    if (!glOff && slot && cloudPath) {
      void Promise.all([loadCharacterPointCloud(cloudPath), loadPortraitPixels(portraitSrc)]).then(
        ([cloud, pixels]) => {
          if (cancelled) return;
          if (!cloud) {
            if (animate) finishNow();
            return;
          }
          fx.setPortrait(slot, toFxPortraitCloud(cloud, pixels));
          if (!animate) {
            // 终态：点云已成形，淡淡地留在立绘背后。
            fx.set({ morph: 1, shapeAlpha: 0.18, warp: 0 });
            return;
          }
          cancels.push(fx.tween({ warp: 0.75 }, { duration: 0.45, ease: "power2.in" }));
          later(WARP_MS, () => {
            setPhase("flash");
            cancels.push(fx.tween({ warp: 0 }, { duration: 1, ease: "power3.out" }));
          });
          later(MORPH_DELAY_MS, () => {
            cancels.push(fx.tween({ morph: 1 }, { duration: 2.2, ease: "power2.inOut" }));
          });
          later(ART_DELAY_MS, () => {
            cancels.push(fx.tween({ shapeAlpha: 0.18 }, { duration: 1.4 }));
            finishNow();
          });
        },
      );
    } else if (animate) {
      // 没有点云资产 / 拿不到舞台：只留闪光，不阻塞真实立绘。
      setPhase("flash");
      later(320, finishNow);
    }

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      cancels.forEach((cancel) => cancel());
      if (slot && fx.clearShape(slot)) fx.set({ morph: 0, shapeAlpha: 1, warp: 0 });
    };
    // phase 不进依赖：序列一旦开始就由内部计时器推进到底。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, start, revealKey, cloudPath, portraitSrc]);

  const revealed = phase === "revealed";

  // 只在「已揭晓」这一刻通知一次，避免每次父组件重渲染都回调。
  const onRevealRef = useRef(onReveal);
  useEffect(() => {
    onRevealRef.current = onReveal;
  });
  useEffect(() => {
    if (revealed) onRevealRef.current?.();
  }, [revealed]);

  const flashStyle: RevealStyle = {
    "--flash": rarity >= 5 ? FLASH_GOLD : FLASH_VIOLET,
  };

  // 原型把圆心写成舞台中心的像素坐标（`--fx` / `--fy`）。闪光层是铺满视口的
  // fixed 元素，所以必须自己量一次父级 `.art-slot` 的位置，不能用 50%。
  const flashRef = useRef<HTMLSpanElement>(null);
  const showFlash = phase === "flash" || (revealed && active);
  useLayoutEffect(() => {
    const node = flashRef.current;
    const slot = node?.parentElement;
    if (!node || !slot) return undefined;
    const sync = () => {
      const rect = slot.getBoundingClientRect();
      node.style.setProperty("--fx", `${rect.left + rect.width / 2}px`);
      node.style.setProperty("--fy", `${rect.top + rect.height / 2}px`);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [showFlash]);

  return (
    <>
      {/* 闪光只挂载一次：CSS 关键帧 0→1→0 自己烧完，之后留在 DOM 里保持透明。 */}
      {showFlash ? (
        <span className="flash" aria-hidden="true" ref={flashRef} style={flashStyle} />
      ) : null}
      <img
        ref={artRef}
        className="art"
        src={portraitSrc}
        alt=""
        decoding="async"
        data-revealed={revealed ? "true" : "false"}
      />
    </>
  );
}
