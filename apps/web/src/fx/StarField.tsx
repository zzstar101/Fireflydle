import { useEffect, useRef } from "react";
import type { StarFieldHandle, StarFieldIntensity } from "./starfield-scene";
import { registerFxScene } from "./fx";
import { qualityFlags } from "../components/quality-flags";

interface StarFieldProps {
  intensity: StarFieldIntensity;
}

function shouldRun(): boolean {
  if (qualityFlags().noGl) return false;
  const root = document.documentElement;
  return (
    root.dataset.theme !== "light" &&
    root.dataset.motion !== "reduced" &&
    root.dataset.motionPaused !== "true"
  );
}

/**
 * 全站固定的星空画布。three 通过动态 import 在空闲时加载，不进入首屏包；
 * WebGL 不可用（`?nogl`、初始化失败）时保留 CSS 星云渐变兜底。
 *
 * 场景创建后注册进 fx 单例，页面通过 `fx.setText / fx.setPortrait / fx.burst / fx.warp`
 * 驱动它，组件本身不认识任何业务。
 */
export function StarField({ intensity }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<StarFieldHandle | null>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || qualityFlags().noGl) return;
    let cancelled = false;
    let observer: MutationObserver | undefined;

    const start = () => {
      void import("./starfield-scene")
        .then(({ createStarField }) => {
          if (cancelled) return;
          const handle = createStarField(canvas);
          if (!handle) return;
          handleRef.current = handle;
          handle.setIntensity(intensityRef.current);
          handle.setRunning(shouldRun());
          // 先注册再亮起，避免首帧出现未应用的期望状态
          registerFxScene(handle);
          if (shouldRun()) canvas.classList.add("is-ready");
          observer = new MutationObserver(() => {
            const run = shouldRun();
            handle.setRunning(run);
            canvas.classList.toggle("is-ready", run);
          });
          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "data-motion", "data-motion-paused"],
          });
        })
        .catch(() => undefined);
    };

    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle
      ? window.requestIdleCallback(start, { timeout: 1200 })
      : window.setTimeout(start, 300);

    return () => {
      cancelled = true;
      if (hasIdle) {
        window.cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle);
      }
      observer?.disconnect();
      // 先摘掉单例引用再释放上下文，期望状态会保留给下一次注册
      if (handleRef.current) registerFxScene(null);
      handleRef.current?.dispose();
      handleRef.current = null;
      canvas.classList.remove("is-ready");
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setIntensity(intensity);
  }, [intensity]);

  return <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />;
}
