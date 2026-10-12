/**
 * 降级开关。URL 参数优先于系统偏好，方便真机验收与截图回归强制走降级路径：
 *   `?nogl`   —— 模拟 WebGL 不可用：跳过星空画布，只保留 CSS 星云渐变与 DOM 文字
 *   `?reduce` —— 模拟「减少动态效果」：星空只渲染一帧静态画面，跃迁 / 回放 / 星尘全部关闭
 * 参数只解析一次并缓存；各组件读 <html> 上的 dataset，不各自解析 URL。
 */

export interface QualityFlags {
  /** 模拟 WebGL 不可用。 */
  noGl: boolean;
  /** 强制「减少动态效果」。 */
  reduceMotion: boolean;
}

let cached: QualityFlags | null = null;

export function qualityFlags(): QualityFlags {
  if (cached) return cached;
  let search = "";
  if (typeof window !== "undefined") search = window.location.search;
  const params = new URLSearchParams(search);
  cached = {
    noGl: params.has("nogl"),
    reduceMotion: params.has("reduce") || params.has("reduce-motion"),
  };
  return cached;
}

/** 把降级状态写到 <html> 的 dataset 上，供 CSS 与画布判断。 */
export function applyQualityFlags(root?: HTMLElement | null): void {
  if (typeof document === "undefined") return;
  const target = root ?? document.documentElement;
  if (!target) return;
  const flags = qualityFlags();
  if (flags.noGl) target.dataset.gl = "off";
  else delete target.dataset.gl;
  if (flags.reduceMotion) target.dataset.motion = "reduced";
}

/** 仅测试用：清掉缓存，便于换 URL 重新解析。 */
export function resetQualityFlagsForTest(): void {
  cached = null;
}
