/**
 * 表现层单例 —— 对应原型里的 `S` 状态 + `FX` 门面。React 只通过这里驱动 WebGL 层，
 * 永远不直接接触 three。
 *
 * - `fxState`（原型的 S）是一组 0~1 的动画量，由这里的补间引擎驱动，场景每帧采样；
 * - 形态（文字 / 立绘）记在期望状态里：场景还没加载时先存着，就绪后回放；
 * - 瞬时效果（命中迸发）只在场景已在运行时生效，不延后播放。
 * 场景缺席（WebGL 不可用 / 减少动效）时最坏只是少一段动画，功能不受影响。
 */

export interface FxState {
  morph: number;
  scatter: number;
  disperse: number;
  dim: number;
  warm: number;
  shapeAlpha: number;
  warp: number;
  rail: number;
}

export type FxMode = "hub" | "game" | "result";

export interface FxRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 立绘点云：w×h 网格坐标 + 颜色。`data` 每点 5 个数：gx, gy（网格单位）, r, g, b（0~1）。
 * 与原型 `setPortrait(el, P)` 的 P 一致（原型用字节，这里直接存浮点）。
 */
export interface FxPortraitCloud {
  w: number;
  h: number;
  count: number;
  data: Float32Array;
}

export interface FxScene {
  setText(rect: FxRect, text: string): void;
  setPortrait(rect: FxRect, cloud: FxPortraitCloud): void;
  burst(rect: FxRect, n?: number): void;
  render(): void;
}

export interface FxSceneHost {
  readonly state: FxState;
  scroll(): number;
  mode(): FxMode;
  measure(): FxRect | null;
}

const INITIAL_STATE: FxState = {
  morph: 0,
  scatter: 0,
  disperse: 0,
  dim: 1,
  warm: 0,
  shapeAlpha: 1,
  warp: 0,
  rail: 1,
};

export const fxState: FxState = { ...INITIAL_STATE };

type Desired =
  | { kind: "text"; el: Element; text: string }
  | { kind: "portrait"; el: Element; cloud: FxPortraitCloud }
  | null;

let scene: FxScene | null = null;
let desired: Desired = null;
let mode: FxMode = "hub";
let scroller: (() => number) | null = null;

function rectOf(el: Element): FxRect {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function applyDesired() {
  if (!scene || !desired || !desired.el.isConnected) return;
  const rect = rectOf(desired.el);
  if (rect.width < 2 || rect.height < 2) return;
  if (desired.kind === "text") scene.setText(rect, desired.text);
  else scene.setPortrait(rect, desired.cloud);
}

export const fxSceneHost: FxSceneHost = {
  state: fxState,
  // 原型：FX.scroller ? FX.scroller() : 0 —— 没有滚动源时形态不跟随滚动
  scroll: () => (scroller ? scroller() : 0),
  mode: () => mode,
  measure: () => (desired && desired.el.isConnected ? rectOf(desired.el) : null),
};

const readyListeners = new Set<() => void>();

export function registerFxScene(next: FxScene | null): void {
  scene = next;
  applyDesired();
  if (next) {
    const pending = [...readyListeners];
    readyListeners.clear();
    for (const cb of pending) cb();
  }
}

/** 场景已就绪则立即回调，否则等注册后回调。返回取消函数。 */
function whenReady(cb: () => void): () => void {
  if (scene) {
    cb();
    return () => {};
  }
  readyListeners.add(cb);
  return () => {
    readyListeners.delete(cb);
  };
}

export function fxSceneReady(): boolean {
  return scene !== null;
}

// —— 补间引擎（替代原型里的 gsap.to(S, …)）——

export type FxEase =
  | "linear"
  | "power2.in"
  | "power2.out"
  | "power2.inOut"
  | "power3.in"
  | "power3.out"
  | "power3.inOut"
  | "sine.inOut";

const EASES: Record<FxEase, (t: number) => number> = {
  linear: (t) => t,
  "power2.in": (t) => t * t * t,
  "power2.out": (t) => 1 - (1 - t) ** 3,
  "power2.inOut": (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  "power3.in": (t) => t ** 4,
  "power3.out": (t) => 1 - (1 - t) ** 4,
  "power3.inOut": (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
  "sine.inOut": (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

export interface FxTweenOptions {
  duration: number;
  ease?: FxEase;
  delay?: number;
  onComplete?: () => void;
}

interface Tween {
  key: keyof FxState;
  from: number;
  to: number;
  start: number;
  duration: number;
  ease: (t: number) => number;
  done?: (() => void) | undefined;
  started: boolean;
}

const tweens = new Set<Tween>();
let tweenRaf = 0;

function reducedMotion(): boolean {
  if (typeof document === "undefined") return true;
  return (
    document.documentElement.dataset.motion === "reduced" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function tick() {
  tweenRaf = 0;
  const now = performance.now();
  const finished: (() => void)[] = [];
  for (const tw of tweens) {
    if (now < tw.start) continue;
    if (!tw.started) {
      // 起点在真正开始时采样，跟 gsap 的延迟补间一致
      tw.started = true;
      tw.from = fxState[tw.key];
    }
    const t = tw.duration <= 0 ? 1 : Math.min(1, (now - tw.start) / (tw.duration * 1000));
    fxState[tw.key] = tw.from + (tw.to - tw.from) * tw.ease(t);
    if (t >= 1) {
      tweens.delete(tw);
      if (tw.done) finished.push(tw.done);
    }
  }
  scene?.render();
  for (const done of finished) done();
  if (tweens.size > 0) tweenRaf = requestAnimationFrame(tick);
}

/** 把 fxState 的若干字段补间到目标值；同一字段的新补间会覆盖旧的。返回取消函数。 */
function tween(props: Partial<FxState>, options: FxTweenOptions): () => void {
  const reduce = reducedMotion();
  const now = performance.now();
  const created: Tween[] = [];
  const keys = Object.keys(props) as (keyof FxState)[];
  let notified = false;
  const done = options.onComplete
    ? () => {
        if (notified) return;
        notified = true;
        options.onComplete?.();
      }
    : undefined;
  for (const key of keys) {
    for (const tw of tweens) if (tw.key === key) tweens.delete(tw);
    const to = props[key];
    if (to === undefined) continue;
    const tw: Tween = {
      key,
      from: fxState[key],
      to,
      start: now + (reduce ? 0 : (options.delay ?? 0) * 1000),
      duration: reduce ? 0 : options.duration,
      ease: EASES[options.ease ?? "power2.out"],
      done,
      started: false,
    };
    tweens.add(tw);
    created.push(tw);
  }
  if (created.length === 0) {
    done?.();
  } else if (!tweenRaf && typeof requestAnimationFrame !== "undefined") {
    tweenRaf = requestAnimationFrame(tick);
  }
  return () => {
    for (const tw of created) tweens.delete(tw);
  };
}

/** 立即设置（相当于 gsap.set），会取消对应字段上的补间。 */
function set(props: Partial<FxState>) {
  for (const key of Object.keys(props) as (keyof FxState)[]) {
    for (const tw of tweens) if (tw.key === key) tweens.delete(tw);
    const v = props[key];
    if (v !== undefined) fxState[key] = v;
  }
  scene?.render();
}

export const fx = {
  state: fxState,
  tween,
  set,
  whenReady,
  ready: fxSceneReady,
  setMode(next: FxMode) {
    mode = next;
  },
  getMode(): FxMode {
    return mode;
  },
  /** 形态跟随的滚动源；null = 不跟随（原型 FX.scroller）。 */
  setScroller(next: (() => number) | null) {
    scroller = next;
  },
  /** 让粒子在 el 的位置排成 text（原型 FX.setText）。 */
  setText(el: Element, text: string) {
    desired = { kind: "text", el, text };
    applyDesired();
  },
  /** 让粒子在 el 的位置排成立绘点云（原型 FX.setPortrait）。 */
  setPortrait(el: Element, cloud: FxPortraitCloud) {
    desired = { kind: "portrait", el, cloud };
    applyDesired();
  },
  /** 只在仍然是这个元素的形态时清掉，避免卸载顺序把新页面的形态抹掉。返回是否清掉了。 */
  clearShape(el?: Element): boolean {
    if (el && desired?.el !== el) return false;
    desired = null;
    return true;
  },
  /** 当前形态是否属于 el。 */
  ownsShape(el: Element): boolean {
    return desired?.el === el;
  },
  /** 命中迸发（原型 FX.burst）。场景未运行时直接忽略。 */
  burst(target: Element | FxRect, n?: number) {
    if (!scene) return;
    scene.burst(target instanceof Element ? rectOf(target) : target, n);
  },
  render() {
    scene?.render();
  },
};

export function resetFxForTest(): void {
  scene = null;
  desired = null;
  mode = "hub";
  scroller = null;
  readyListeners.clear();
  tweens.clear();
  if (tweenRaf && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(tweenRaf);
  tweenRaf = 0;
  Object.assign(fxState, INITIAL_STATE);
}
