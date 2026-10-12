/**
 * 点阵场：把一组归一化坐标 [0,1]² 的点，用 uMorph 从「散在星空里」插值成目标形状。
 * 总站的「萤一把」粒子字和结算揭晓的立绘点云共用这一套几何与着色器，
 * 区别只在于喂进来的目标点集不同。
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";

export type PointFieldTone = "gold" | "violet" | "ink";

const TONE_VECTORS: Record<PointFieldTone, [number, number, number]> = {
  gold: [0.98, 0.84, 0.55],
  violet: [0.68, 0.56, 1.0],
  ink: [0.94, 0.92, 0.86],
};

const FIELD_VERTEX = /* glsl */ `
uniform float uMorph;
uniform float uTime;
uniform float uPR;
uniform float uSize;
uniform vec2 uParallax;
attribute vec3 aScatter;
attribute vec3 aTarget;
attribute float aDelay;
attribute float aSeed;
varying float vAlpha;
varying float vSeed;
varying float vGather;
void main() {
  float m = smoothstep(aDelay, min(aDelay + 0.55, 1.0), uMorph);
  vec3 p = mix(aScatter, aTarget, m);
  p.xy += uParallax * (0.35 + aSeed * 0.5);
  // 聚合后轻微呼吸，避免死板的静态点阵
  p.xy += vec2(sin(uTime * 0.6 + aSeed * 21.0), cos(uTime * 0.5 + aSeed * 17.0)) * 0.0035 * m;
  gl_Position = vec4(p.xy, 0.0, 1.0);
  gl_PointSize = mix(uSize * 0.8, uSize, m) * uPR * (0.7 + aSeed * 0.55);
  vAlpha = mix(0.42, 1.0, m) * (0.82 + 0.18 * sin(uTime * (0.7 + aSeed) + aSeed * 30.0));
  vSeed = aSeed;
  vGather = m;
}
`;

const FIELD_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uCore;
varying float vAlpha;
varying float vSeed;
varying float vGather;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  float core = smoothstep(0.5, 0.0, d);
  float glint = exp(-abs(q.x) * 30.0) * smoothstep(0.5, 0.0, abs(q.y))
              + exp(-abs(q.y) * 30.0) * smoothstep(0.5, 0.0, abs(q.x));
  float spike = step(0.86, vSeed) * vGather;
  float a = (core * core * 0.95 + glint * (0.2 + spike * 0.55)) * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uColor, uCore, core * core * 0.32) * a, a);
}
`;

export interface PointFieldOptions {
  /** 目标点集映射到 NDC 时的中心与尺寸。 */
  centerX?: number;
  centerY?: number;
  width?: number;
  height?: number;
  /** 点尺寸（CSS 像素）。 */
  size?: number;
  tone?: PointFieldTone;
  /** 散开状态的半径（NDC）。 */
  spread?: number;
  /** 每点的错峰延迟系数，0 表示同时聚合。 */
  stagger?: number;
}

export interface PointFieldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PointFieldHandle {
  readonly object: Points;
  /**
   * 用归一化坐标（y 向下）重建目标形状。空数组等价于 clear()。
   * 返回实际写入的点数。
   */
  setTargets(targets: Float32Array, options?: PointFieldOptions): number;
  /** 驱动聚合进度：0 = 散在星空，1 = 完全聚成形状。 */
  setMorph(value: number): void;
  /** 当前点集在归一化坐标下的包围盒，供调用方做居中 / 缩放。 */
  readonly bounds: PointFieldBounds;
  /** 当前场内的点数。 */
  readonly count: number;
  tick(time: number): void;
  setPixelRatio(ratio: number): void;
  setParallax(x: number, y: number): void;
  clear(): void;
  dispose(): void;
}

export function createPointField(): PointFieldHandle {
  const geometry = new BufferGeometry();
  const uniforms = {
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uPR: { value: 1 },
    uSize: { value: 2.1 },
    uParallax: { value: new Vector2() },
    uColor: { value: new Vector3(0.98, 0.84, 0.55) },
    uCore: { value: new Vector3(1, 1, 0.92) },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: FIELD_VERTEX,
    fragmentShader: FIELD_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;

  const bounds: PointFieldBounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  let count = 0;

  function clear(): void {
    count = 0;
    points.visible = false;
    geometry.setDrawRange(0, 0);
  }

  return {
    object: points,
    bounds,
    get count() {
      return count;
    },
    setTargets(targets, options = {}) {
      const nextCount = Math.floor(targets.length / 2);
      if (nextCount === 0) {
        clear();
        return 0;
      }
      const centerX = options.centerX ?? 0;
      const centerY = options.centerY ?? 0;
      const width = options.width ?? 1;
      const height = options.height ?? 1;
      const spread = options.spread ?? 2.2;
      const stagger = options.stagger ?? 0.45;
      const tone = TONE_VECTORS[options.tone ?? "gold"];

      // 先求归一化坐标下的包围盒，调用方可以据此做居中 / 缩放。
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < nextCount; i += 1) {
        const x = targets[i * 2] ?? 0;
        const y = targets[i * 2 + 1] ?? 0;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      bounds.minX = minX;
      bounds.minY = minY;
      bounds.maxX = maxX;
      bounds.maxY = maxY;

      const positions = new Float32Array(nextCount * 3);
      const scatter = new Float32Array(nextCount * 3);
      const delay = new Float32Array(nextCount);
      const seed = new Float32Array(nextCount);
      for (let i = 0; i < nextCount; i += 1) {
        const nx = targets[i * 2] ?? 0;
        const ny = targets[i * 2 + 1] ?? 0;
        // 归一化 [0,1] → NDC：y 轴翻转
        const targetX = centerX + (nx - 0.5) * width;
        const targetY = centerY - (ny - 0.5) * height;
        positions[i * 3] = targetX;
        positions[i * 3 + 1] = targetY;
        positions[i * 3 + 2] = 0;
        // 散开状态：以目标为中心的一个大圆盘，看起来就是普通星空
        const angle = Math.random() * Math.PI * 2;
        const radius = spread * (0.35 + Math.random() * 0.65);
        scatter[i * 3] = targetX + Math.cos(angle) * radius * 1.35;
        scatter[i * 3 + 1] = targetY + Math.sin(angle) * radius;
        scatter[i * 3 + 2] = 0;
        // 越靠外的点越晚聚合，形成「从中心漫开」的观感
        const distance = Math.min(1, Math.hypot(nx - 0.5, ny - 0.5) * 2);
        delay[i] = distance * stagger + Math.random() * 0.12;
        seed[i] = Math.random();
      }

      geometry.setAttribute("position", new BufferAttribute(positions, 3));
      geometry.setAttribute("aScatter", new BufferAttribute(scatter, 3));
      geometry.setAttribute("aTarget", new BufferAttribute(positions, 3));
      geometry.setAttribute("aDelay", new BufferAttribute(delay, 1));
      geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));
      geometry.setDrawRange(0, nextCount);
      geometry.computeBoundingSphere();
      uniforms.uSize.value = options.size ?? 2.1;
      uniforms.uColor.value.set(...tone);
      uniforms.uCore.value.set(
        options.tone === "violet" ? 1 : 1,
        options.tone === "violet" ? 0.95 : 1,
        0.92,
      );
      count = nextCount;
      points.visible = true;
      return nextCount;
    },
    setMorph(value) {
      uniforms.uMorph.value = Math.max(0, Math.min(1, value));
    },
    tick(time) {
      uniforms.uTime.value = time;
    },
    setPixelRatio(ratio) {
      uniforms.uPR.value = ratio;
    },
    setParallax(x, y) {
      uniforms.uParallax.value.set(x, y);
    },
    clear,
    dispose() {
      clear();
      geometry.dispose();
      material.dispose();
    },
  };
}
