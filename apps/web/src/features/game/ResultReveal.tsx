import { useEffect, useState } from "react";
import { fx } from "../../fx/fx";
import {
  loadCharacterPointCloud,
  toFxPointCloud,
  useCharacterPointCloudPath,
} from "../../lib/character-art";
import { qualityFlags } from "../../components/quality-flags";
import { hasSeenResultReveal, markResultRevealSeen } from "./reveal-memory";
import "./result-reveal.css";

/**
 * 结算揭晓：星尘汇聚成答案立绘 → 稀有度闪光 → 真实立绘淡入。
 *
 * 只有「猜中 + 常规角色玩法 + 没有降级」才播放；其它情况直接呈现终态，
 * 功能与文案完全不受影响（README §3「结算·揭晓」、§4 降级要求）。
 */

/** 点云聚合 + 停顿的总时长，之后真实立绘淡入。 */
const GATHER_MS = 1_600;

export interface ResultRevealProps {
  characterId: string;
  /** 超分后的真实立绘；null 时只播点云，不淡入图片。 */
  portraitSrc: string | null;
  /** 稀有度，决定闪光色（5★ 星光金、4★ 星云紫）。 */
  rarity: number;
  /** 是否播放序列；false 时立即呈现终态。 */
  active: boolean;
  /** 演出记忆的键（用对局 id），同一局第二次打开直接跳终态。 */
  revealKey: string;
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
  revealKey,
}: ResultRevealProps) {
  const cloudPath = useCharacterPointCloudPath(characterId);
  const [revealed, setRevealed] = useState(() => !active || hasSeenResultReveal(revealKey));

  useEffect(() => {
    if (!active) {
      setRevealed(true);
      return;
    }
    if (hasSeenResultReveal(revealKey) || qualityFlags().noGl || prefersReducedMotion()) {
      markResultRevealSeen(revealKey);
      setRevealed(true);
      return;
    }

    let cancelled = false;
    let timer = 0;
    const finish = () => {
      if (cancelled) return;
      markResultRevealSeen(revealKey);
      fx.setPortrait(null);
      setRevealed(true);
    };

    if (!cloudPath) {
      // 没有点云资产时只留闪光，不阻塞真实立绘。
      timer = window.setTimeout(finish, 320);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    setRevealed(false);
    void loadCharacterPointCloud(cloudPath).then((cloud) => {
      if (cancelled) return;
      if (!cloud) {
        timer = window.setTimeout(finish, 320);
        return;
      }
      // 先归零聚合进度，否则上一局残留的 morph=1 会让点云直接成形、没有汇聚过程。
      fx.setPortraitMorph(0);
      fx.setPortrait(toFxPointCloud(cloud), { height: 1.15, tone: "gold", size: 3.2 });
      fx.setPortraitMorph(1);
      timer = window.setTimeout(finish, GATHER_MS);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      fx.setPortrait(null);
    };
  }, [active, revealKey, cloudPath]);

  return (
    <div
      className="result-reveal"
      data-reveal-phase={revealed ? "revealed" : "gathering"}
      data-rarity={rarity >= 5 ? "gold" : rarity >= 4 ? "violet" : "dim"}
    >
      <span className="result-reveal-flash" aria-hidden="true" />
      {portraitSrc ? (
        <img className="sr-result-portrait" src={portraitSrc} alt="" decoding="async" />
      ) : null}
    </div>
  );
}
