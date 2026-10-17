import { useEffect, type RefObject } from "react";
import { qualityFlags } from "../../components/quality-flags";
import { fx } from "../../fx/fx";

export interface HeroStarfieldOptions {
  /** 粒子字落位的元素（原型 #heroMark）。 */
  markRef: RefObject<HTMLElement | null>;
  /** 驱动"向下滚动 → 字形散开"进度的 hero 区块（原型 #hero）。 */
  heroRef: RefObject<HTMLElement | null>;
  /** 要聚成粒子字的文案，通常是品牌名。 */
  text: string;
}

/**
 * 总站 hero 的粒子字 —— 对应原型 boot / showHub / ScrollTrigger / go("game")：
 *
 * - 进入：mode = hub，形态跟随 window 滚动，背景提亮（dim/rail → 1），
 *   setText(#heroMark) 后 morph 0 → 1（首次加载 2.6s，回到总站 2.2s）；
 * - 滚动：hero 顶部到底部之间，disperse = 进度（scrub 0.6）；
 * - 离开：粒子吸散（scatter 1）+ 跃迁（warp 1 → 0），背景压暗到对局态（dim .45 / rail .25）。
 */
export function useHeroStarfield({ markRef, heroRef, text }: HeroStarfieldOptions): void {
  useEffect(() => {
    const mark = markRef.current;
    if (!mark || !text || qualityFlags().noGl) return;

    const booting = !fx.ready();
    fx.setMode("hub");
    fx.setScroller(() => window.scrollY);
    fx.set({ scatter: 0, disperse: 0, shapeAlpha: 1, morph: 0 });
    if (booting) fx.set({ dim: 1, warm: 0, rail: 1, warp: 0 });
    else fx.tween({ dim: 1, warm: 0, rail: 1, warp: 0 }, { duration: 1 });

    fx.setText(mark, text);
    let cancelMorph: (() => void) | null = null;
    const cancelReady = fx.whenReady(() => {
      cancelMorph = fx.tween(
        { morph: 1 },
        booting
          ? { duration: 2.6, ease: "power2.inOut", delay: 0.1 }
          : { duration: 2.2, ease: "power2.inOut" },
      );
    });

    // 原型：ScrollTrigger { trigger: #hero, start: "top top", end: "bottom top", scrub: 0.6 }
    let raf = 0;
    const sync = () => {
      raf = 0;
      const hero = heroRef.current;
      if (!hero || fx.getMode() !== "hub") return;
      const span = Math.max(1, hero.offsetHeight);
      const top = hero.getBoundingClientRect().top + window.scrollY;
      const progress = Math.min(1, Math.max(0, (window.scrollY - top) / span));
      fx.tween({ disperse: progress }, { duration: 0.6, ease: "power3.out" });
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      cancelReady();
      cancelMorph?.();
      if (!fx.ownsShape(mark)) return;
      // 原型 go("game")：粒子吸散 + 跃迁，然后切到对局态
      fx.tween({ scatter: 1 }, { duration: 0.7, ease: "power2.in" });
      fx.tween(
        { warp: 1 },
        {
          duration: 0.6,
          ease: "power2.in",
          delay: 0.05,
          onComplete: () => {
            if (fx.clearShape(mark)) fx.set({ morph: 0, scatter: 0, disperse: 0 });
            else fx.set({ scatter: 0, disperse: 0 });
            fx.tween({ warp: 0 }, { duration: 1, ease: "power3.out" });
          },
        },
      );
      fx.tween({ dim: 0.45, rail: 0.25 }, { duration: 1.2 });
    };
  }, [markRef, heroRef, text]);
}
