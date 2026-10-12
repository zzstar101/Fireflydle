/**
 * 星尘：384 粒环形缓冲区，只在「猜中某个属性」这类命中时刻写入。
 * 逐帧位移在顶点着色器里用指数阻尼的解析解算出来，JS 每帧只更新 uTime，
 * 因此空闲时（没有任何存活粒子）这个 draw call 会被整段跳过。
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from "three";

/** 环形缓冲区容量，设计文档固定 384 粒。 */
export const DUST_CAPACITY = 384;

/** 单粒最长存活时间（秒），用于判断是否还需要绘制。 */
const MAX_LIFE = 2.0;

export interface StardustBurstOptions {
  /** 一次写入的粒子数，默认 26。 */
  count?: number;
  /** 初速（NDC/秒），默认 0.34。 */
  speed?: number;
  /** 0 = 星光金，1 = 星云紫。 */
  tone?: number;
}

const DUST_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uAspect;
uniform float uPR;
uniform float uSize;
attribute vec2 aOrigin;
attribute vec2 aVelocity;
attribute float aBirth;
attribute float aLife;
attribute float aTone;
varying float vAlpha;
varying float vTone;
varying float vSeed;
void main() {
  float age = uTime - aBirth;
  float alive = step(0.0, age) * step(age, aLife);
  float t = clamp(age / max(aLife, 0.0001), 0.0, 1.0);
  // 指数阻尼位移的解析积分：∫ v0·e^(-k·age) d(age)
  float k = 2.1;
  vec2 drift = aVelocity * (1.0 - exp(-k * age)) / k;
  // NDC 的 x 单位比 y 单位窄 aspect 倍，除一下让散开是各向同性的
  vec2 p = aOrigin + vec2(drift.x / uAspect, drift.y) + vec2(0.0, age * 0.055);
  gl_Position = vec4(p, 0.0, 1.0);
  gl_PointSize = alive * uSize * uPR * (0.55 + 0.45 * aTone);
  vAlpha = alive * pow(1.0 - t, 1.6);
  vTone = aTone;
  vSeed = fract(aBirth * 7.13);
}
`;

const DUST_FRAGMENT = /* glsl */ `
varying float vAlpha;
varying float vTone;
varying float vSeed;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  float core = smoothstep(0.5, 0.0, d);
  // 十字星芒，让靠近镜头的粒子有「星」的形状
  float glint = exp(-abs(q.x) * 26.0) * smoothstep(0.5, 0.0, abs(q.y))
              + exp(-abs(q.y) * 26.0) * smoothstep(0.5, 0.0, abs(q.x));
  float a = (core * core * 0.8 + glint * 0.32) * vAlpha;
  if (a < 0.004) discard;
  vec3 col = mix(vec3(0.98, 0.84, 0.55), vec3(0.68, 0.56, 1.0), vTone);
  col += vec3(0.35) * core * core;
  gl_FragColor = vec4(col * a, a);
}
`;

export interface StardustHandle {
  readonly object: Points;
  /** 从 NDC 坐标炸开一簇星尘。 */
  burst(x: number, y: number, options?: StardustBurstOptions): void;
  /** 推进时间；返回当前是否还有存活粒子（决定要不要画）。 */
  tick(time: number): boolean;
  setPixelRatio(ratio: number): void;
  setAspect(aspect: number): void;
  dispose(): void;
}

export function createStardust(): StardustHandle {
  const origin = new Float32Array(DUST_CAPACITY * 2);
  const velocity = new Float32Array(DUST_CAPACITY * 2);
  const birth = new Float32Array(DUST_CAPACITY);
  const life = new Float32Array(DUST_CAPACITY);
  const tone = new Float32Array(DUST_CAPACITY);
  // 初始全部处于「早已死亡」状态，alive 为 0，不会绘制。
  birth.fill(-1e6);
  life.fill(1);

  const geometry = new BufferGeometry();
  const aOrigin = new BufferAttribute(origin, 2);
  const aVelocity = new BufferAttribute(velocity, 2);
  const aBirth = new BufferAttribute(birth, 1);
  const aLife = new BufferAttribute(life, 1);
  const aTone = new BufferAttribute(tone, 1);
  aOrigin.setUsage(35048 /* DynamicDrawUsage */);
  aVelocity.setUsage(35048);
  aBirth.setUsage(35048);
  aLife.setUsage(35048);
  aTone.setUsage(35048);
  geometry.setAttribute("aOrigin", aOrigin);
  geometry.setAttribute("aVelocity", aVelocity);
  geometry.setAttribute("aBirth", aBirth);
  geometry.setAttribute("aLife", aLife);
  geometry.setAttribute("aTone", aTone);
  // three 需要 position 属性才能确定绘制范围，这里给一个占位。
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(DUST_CAPACITY * 3), 3));

  const uniforms = {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uPR: { value: 1 },
    uSize: { value: 2.4 },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  let head = 0;
  let clock = 0;
  let activeUntil = -1;

  return {
    object: points,
    burst(x, y, options = {}) {
      const count = Math.max(1, Math.min(options.count ?? 26, DUST_CAPACITY));
      const speed = options.speed ?? 0.34;
      const burstTone = Math.max(0, Math.min(1, options.tone ?? 0));
      for (let i = 0; i < count; i += 1) {
        const index = head;
        head = (head + 1) % DUST_CAPACITY;
        const angle = Math.random() * Math.PI * 2;
        const offset = 0.012 + Math.random() * 0.05;
        origin[index * 2] = x + Math.cos(angle) * offset;
        origin[index * 2 + 1] = y + Math.sin(angle) * offset;
        const magnitude = speed * (0.45 + Math.random() * 0.9);
        velocity[index * 2] = Math.cos(angle) * magnitude;
        velocity[index * 2 + 1] = Math.sin(angle) * magnitude * 0.85 + 0.04;
        birth[index] = clock;
        life[index] = 0.85 + Math.random() * 1.1;
        // 每粒都带一点色调抖动，避免整簇颜色完全一致
        tone[index] = Math.max(0, Math.min(1, burstTone + (Math.random() - 0.5) * 0.35));
      }
      aOrigin.needsUpdate = true;
      aVelocity.needsUpdate = true;
      aBirth.needsUpdate = true;
      aLife.needsUpdate = true;
      aTone.needsUpdate = true;
      activeUntil = Math.max(activeUntil, clock + MAX_LIFE);
    },
    tick(time) {
      clock = time;
      uniforms.uTime.value = time;
      return time < activeUntil;
    },
    setPixelRatio(ratio) {
      uniforms.uPR.value = ratio;
    },
    setAspect(aspect) {
      uniforms.uAspect.value = Math.max(aspect, 0.0001);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
