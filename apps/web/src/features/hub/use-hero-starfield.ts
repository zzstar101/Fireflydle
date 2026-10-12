import { useEffect } from "react";
import { qualityFlags } from "../../components/quality-flags";
import { fx } from "../../fx/fx";

export interface HeroStarfieldOptions {
  /** 要聚成粒子字的文案，通常是品牌名。 */
  text: string;
  /** 关掉时完全不驱动场景（例如还没拿到文案）。 */
  enabled?: boolean;
}

/** 向下滚动视口高度的多少倍，字形就完全散回星空。 */
const SCATTER_SPAN_RATIO = 0.75;
/** 字块中心略高于中线，给下方的标题和 CTA 留位置。 */
const HERO_CENTER_Y = 0.24;
const HERO_WIDTH = 0.92;

/**
 * 总站 hero 的粒子字：进入时星点汇聚成文字，向下滚动时散回星空。
 *
 * 只读滚动位置，不劫持滚动；每帧最多更新一次聚合进度 uniform。
 * 场景没就绪（还在懒加载、WebGL 不可用、减少动效）时 fx 会把期望状态记下来，
 * 就绪后一次性回放，所以这里的调用顺序不需要额外同步。
 */
export function useHeroStarfield({ text, enabled = true }: HeroStarfieldOptions): void {
  useEffect(() => {
    if (!enabled || !text || qualityFlags().noGl) return;

    fx.setText(text, { centerY: HERO_CENTER_Y, width: HERO_WIDTH });

    let ticking = false;
    const sync = () => {
      ticking = false;
      const span = Math.max(1, window.innerHeight * SCATTER_SPAN_RATIO);
      const progress = Math.min(1, Math.max(0, window.scrollY / span));
      fx.setTextMorph(1 - progress);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    };

    // 首帧就把目标值设成当前滚动位置：初始聚合进度是 0，于是顶点着色器自己补上汇聚动画。
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      fx.setText(null);
    };
  }, [text, enabled]);
}
