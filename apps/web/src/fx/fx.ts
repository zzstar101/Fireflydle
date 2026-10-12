/**
 * 表现层单例。React 只通过这里驱动 WebGL 层，永远不直接接触 three。
 *
 * 这个模块刻意不 import three：场景还没加载（或 WebGL 不可用、用户开了减少动效）时，
 * 状态类的调用（文字、立绘、聚合进度）会记在期望状态里，等场景就绪后一次性回放；
 * 瞬时类的调用（星尘爆开、跃迁）只在场景已就绪时生效，不会延后播放。
 * 所以最坏情况只是「少了一段动画」，功能完全不受影响。
 */

/** 点云：归一化坐标 + 源图长宽比，场景据此还原不被拉伸的形状。 */
export interface FxPointCloud {
  /** 源图长宽比（宽 / 高）。 */
  aspect: number;
  /** 归一化 [0,1] 的点（y 向下），长度 = 点数 * 2。 */
  points: Float32Array;
}

export type FxTone = "gold" | "violet" | "ink";

export interface FxBurstOptions {
  /** 一次写入的粒子数，默认 26。 */
  count?: number;
  /** 初速（NDC/秒），默认 0.34。 */
  speed?: number;
  /** 0 = 星光金，1 = 星云紫。 */
  tone?: number;
}

export interface FxTextOptions {
  /** 字块中心的 NDC x / y，默认水平居中、略高于中线。 */
  centerX?: number;
  centerY?: number;
  /** 字块在 NDC 里的宽度，默认 0.86。 */
  width?: number;
  /** 目标点数上限，默认按视口宽度取 2600–5200。 */
  maxPoints?: number;
  tone?: FxTone;
  /** 点尺寸（CSS 像素）。 */
  size?: number;
}

export interface FxPortraitOptions {
  centerX?: number;
  centerY?: number;
  /** 立绘点云在 NDC 里的高度，默认 1.15。 */
  height?: number;
  tone?: FxTone;
  size?: number;
}

/** 场景句柄：由 fx/starfield-scene 提供实现。 */
export interface FxScene {
  text(content: string | null, options: FxTextOptions | undefined, morph: number): void;
  textMorph(value: number): void;
  portrait(cloud: FxPointCloud | null, options: FxPortraitOptions | undefined, morph: number): void;
  portraitMorph(value: number): void;
  burst(x: number, y: number, options: FxBurstOptions): void;
  warp(): void;
}

interface DesiredState {
  text: { content: string | null; options: FxTextOptions | undefined; morph: number } | null;
  portrait: {
    cloud: FxPointCloud | null;
    options: FxPortraitOptions | undefined;
    morph: number;
  } | null;
}

const desired: DesiredState = { text: null, portrait: null };
const pendingBursts: { at: number; x: number; y: number; options: FxBurstOptions }[] = [];
let scene: FxScene | null = null;

/** 排队等待场景就绪的瞬时事件最多保留 500ms，避免加载慢时补放一堆过期动画。 */
const BURST_TTL_MS = 500;
const MAX_PENDING_BURSTS = 12;

function applyDesired(target: FxScene): void {
  if (desired.text) target.text(desired.text.content, desired.text.options, desired.text.morph);
  if (desired.portrait) {
    target.portrait(desired.portrait.cloud, desired.portrait.options, desired.portrait.morph);
  }
}

/**
 * 由星空场景在创建 / 销毁时调用。传入 null 表示场景已释放，
 * 此时期望状态会保留，供下一次注册时回放（例如主题从浅色切回深色）。
 */
export function registerFxScene(next: FxScene | null): void {
  scene = next;
  if (!next) return;
  applyDesired(next);
  const now = performance.now();
  for (const pending of pendingBursts.splice(0)) {
    if (now - pending.at <= BURST_TTL_MS) next.burst(pending.x, pending.y, pending.options);
  }
}

/** 场景是否已就绪；测试与调试用。 */
export function fxSceneReady(): boolean {
  return scene !== null;
}

export const fx = {
  /** 把粒子聚成文字；传 null 让字形散回星空。 */
  setText(content: string | null, options?: FxTextOptions): void {
    const morph = desired.text?.morph ?? 0;
    desired.text = { content, options, morph };
    scene?.text(content, options, morph);
  },
  /** 文字点阵的聚合进度：0 = 散在星空，1 = 完全成字。 */
  setTextMorph(value: number): void {
    if (!desired.text) desired.text = { content: null, options: undefined, morph: value };
    else desired.text.morph = value;
    scene?.textMorph(value);
  },
  /** 让粒子聚成答案立绘；传 null 清除。 */
  setPortrait(cloud: FxPointCloud | null, options?: FxPortraitOptions): void {
    const morph = desired.portrait?.morph ?? 0;
    desired.portrait = { cloud, options, morph };
    scene?.portrait(cloud, options, morph);
  },
  /** 立绘点云的聚合进度。 */
  setPortraitMorph(value: number): void {
    if (!desired.portrait) desired.portrait = { cloud: null, options: undefined, morph: value };
    else desired.portrait.morph = value;
    scene?.portraitMorph(value);
  },
  /** 从屏幕坐标（CSS 像素）炸开一簇星尘。 */
  burst(clientX: number, clientY: number, options: FxBurstOptions = {}): void {
    if (typeof window === "undefined") return;
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = 1 - (clientY / window.innerHeight) * 2;
    if (scene) {
      scene.burst(x, y, options);
      return;
    }
    if (pendingBursts.length >= MAX_PENDING_BURSTS) pendingBursts.shift();
    pendingBursts.push({ at: performance.now(), x, y, options });
  },
  /** 跃迁：径向拉长 + 沿 z 轴循环飞行，约 1.1s。 */
  warp(): void {
    scene?.warp();
  },
};

/** 仅供测试重置模块级状态。 */
export function resetFxForTest(): void {
  scene = null;
  desired.text = null;
  desired.portrait = null;
  pendingBursts.length = 0;
}
