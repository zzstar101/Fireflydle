/**
 * 星空场景 —— 直接移植自 docs/design/redesign-v2/prototype.html 的 initGL()。
 *
 * 一个 Points 同时承担「萤火星场」与「文字 / 立绘形态」（aShape + uMorph 插值），
 * 再加星云底图（半分辨率烘焙一次）、三条星轨、命中迸发环形缓冲。
 * 所有逐帧运动都在顶点着色器里；CPU 只在状态切换时写 attribute。
 * 动画状态 S（morph / scatter / warp …）由 fx.ts 持有并补间，这里每帧采样。
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import type { FxPortraitCloud, FxRect, FxScene, FxSceneHost } from "./fx";

export type StarFieldIntensity = "full" | "calm";

export interface StarFieldHandle extends FxScene {
  setRunning(running: boolean): void;
  setIntensity(intensity: StarFieldIntensity): void;
  dispose(): void;
}

const FRAG = /* glsl */ `
varying vec3 vColor; varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a = a * a + smoothstep(0.16, 0.0, d) * 0.45;
  a *= vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}`;

const STAR_FRAG = /* glsl */ `
varying vec3 vColor; varying float vAlpha; varying float vWarp; varying vec2 vDir; varying float vSpike;
void main() {
  vec2 q = gl_PointCoord - 0.5; q.y = -q.y;
  // 跃迁：沿径向拉成光轨
  float along = dot(q, vDir), across = dot(q, vec2(-vDir.y, vDir.x));
  float d = length(vec2(along, across / mix(1.0, 0.05, vWarp))) * mix(1.0, 2.8, vSpike * (1.0 - vWarp));
  float a = smoothstep(0.5, 0.0, d); a = a * a + smoothstep(0.14, 0.0, d) * 0.5;
  // 亮星的四芒
  float sp = exp(-abs(q.x) * 70.0) * smoothstep(0.5, 0.0, abs(q.y)) + exp(-abs(q.y) * 70.0) * smoothstep(0.5, 0.0, abs(q.x));
  a += sp * vSpike * (1.0 - vWarp);
  a *= vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}`;

const STAR_VERT = /* glsl */ `
uniform float uTime, uMorph, uScatter, uDim, uWarm, uProj, uPR, uFieldSize, uShapeSize, uShapeAlpha, uWarp, uFly, uAspect;
uniform vec2 uMouse, uParallax, uShapeOffset;
attribute vec3 aShape; attribute vec3 aColor; attribute vec4 aRand;
varying vec3 vColor; varying float vAlpha; varying float vWarp; varying vec2 vDir; varying float vSpike;
void main() {
  float t = uTime, ph = aRand.z * 6.2831;
  vec3 f = position;
  f.x += sin(t * 0.05 + ph + f.y * 0.2) * 0.25;
  f.y += cos(t * 0.04 + ph * 1.3 + f.x * 0.15) * 0.2;
  f.z = mod(f.z + 14.0 + uFly, 16.0) - 14.0;
  float depth = clamp((f.z + 14.0) / 16.0, 0.0, 1.0);
  f.xy += uParallax * (0.2 + depth);
  vec3 s = aShape;
  s.xy += uShapeOffset;
  s.x += sin(t * 1.3 + ph * 5.0) * 0.012;
  s.y += cos(t * 1.1 + ph * 7.0) * 0.012;
  vec2 dm = s.xy - uMouse; float dl = length(dm);
  s.xy += dm / max(dl, 1e-3) * smoothstep(0.9, 0.0, dl) * 0.3;
  s += vec3((aRand.z - 0.5) * 10.0, (fract(aRand.z * 7.31) - 0.5) * 7.0, 2.0 + aRand.y * 4.0) * uScatter * uScatter;
  float m = smoothstep(0.0, 1.0, clamp(uMorph * 1.7 - aRand.x * 0.7, 0.0, 1.0)) * aRand.w;
  vec3 p = mix(f, s, m);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.5 + 0.5 * sin(t * (0.8 + aRand.y * 2.2) + ph * 9.0);
  float spike = step(1.56, aRand.y) * (1.0 - m);
  float w = uWarp * (1.0 - m);
  vec2 sc = gl_Position.xy / gl_Position.w;
  // 光轨长度随离屏幕中心的距离增长（越靠边越长），只在跃迁的 1 秒多里放大点精灵
  float size = mix(uFieldSize * aRand.y * (1.0 + spike * 2.2 * (1.0 - w)), uShapeSize * (0.85 + 0.3 * aRand.y), m) * (1.0 + w * 6.0 * min(length(sc), 1.2));
  gl_PointSize = min(max(size * uProj * uPR / -mv.z, 1.0), 96.0);
  vDir = normalize(vec2(sc.x * uAspect, sc.y) + 1e-4);
  vWarp = w; vSpike = spike;
  vec3 star = mix(vec3(0.82, 0.88, 1.0), vec3(1.0, 0.86, 0.6), step(0.8, aRand.z));
  star = mix(star, vec3(0.78, 0.7, 1.0), step(0.94, aRand.z));
  star = mix(star, vec3(1.0, 0.84, 0.5), uWarm * 0.6);
  vColor = mix(star, aColor, m);
  float fieldA = (0.35 + 0.65 * tw) * uDim * (0.15 + 0.85 * depth) * (1.0 + uWarm * 0.5) * (1.0 + w * 1.2);
  vAlpha = mix(fieldA, uShapeAlpha * (0.82 + 0.18 * tw), m) * (1.0 - min(uScatter, 1.0) * 0.75);
}`;

const QUAD_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const NEBULA_FRAG = /* glsl */ `
varying vec2 vUv; uniform float uAspect;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = r * p * 2.03 + 3.1; a *= 0.5; } return v; }
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  vec2 q = vec2(fbm(p * 1.5 + 1.7), fbm(p * 1.5 + 9.2));
  float n = fbm(p * 2.1 + q * 1.9);
  float band = exp(-pow((p.y + p.x * 0.42 - 0.06) * 2.4, 2.0));
  vec3 col = mix(vec3(0.018, 0.026, 0.075), vec3(0.035, 0.05, 0.13), vUv.y);
  col += vec3(0.22, 0.13, 0.45) * smoothstep(0.38, 0.95, n) * (0.3 + band * 0.9);
  col += vec3(0.05, 0.17, 0.36) * smoothstep(0.45, 1.0, fbm(p * 3.1 - q)) * (0.45 + band * 0.6);
  col += vec3(0.55, 0.38, 0.16) * pow(smoothstep(0.55, 1.0, n), 3.0) * band * 0.8;
  col *= 1.0 - 0.5 * length(vUv - 0.5);
  gl_FragColor = vec4(col, 1.0);
}`;

const BG_FRAG = /* glsl */ `uniform sampler2D uTex; uniform vec2 uOff; uniform float uBright; varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(uTex, (vUv - 0.5) * 0.96 + 0.5 + uOff).rgb * uBright, 1.0); }`;

const RAIL_VERT = /* glsl */ `
uniform float uTime, uProj, uPR, uRail; uniform vec2 uParallax;
attribute float aU, aRail; varying vec3 vColor; varying float vAlpha;
void main() {
  vec3 p = position;
  p.xy += uParallax * (0.2 + clamp((p.z + 14.0) / 16.0, 0.0, 1.0));
  float head = fract(uTime * (0.028 + aRail * 0.008) + aRail * 0.37);
  float d = fract(head - aU);
  float g = exp(-d * 28.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 0.05 * (1.0 + g * 1.8) * uProj * uPR / -mv.z;
  vec3 c = aRail == 1.0 ? vec3(0.62, 0.82, 1.0) : vec3(1.0, 0.84, 0.55);
  vColor = mix(c, vec3(1.0), g * 0.6);
  vAlpha = uRail * (0.12 + g * 0.95) * smoothstep(0.0, 0.08, aU) * smoothstep(1.0, 0.92, aU);
}`;

const BURST_VERT = /* glsl */ `
uniform float uTime, uProj, uPR;
attribute vec3 aVel; attribute float aBirth; attribute float aSeed;
varying vec3 vColor; varying float vAlpha;
void main() {
  float age = uTime - aBirth, life = 2.0;
  float alive = step(0.0, age) * step(age, life);
  float e = (1.0 - exp(-age * 1.8)) / 1.8;
  vec3 p = position + aVel * e + vec3(sin(age * 2.4 + aSeed * 6.28) * 0.15, age * 0.3, 0.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = alive * 0.09 * (0.7 + aSeed * 0.6) * uProj * uPR / -mv.z;
  vColor = vec3(1.0, 0.86, 0.52);
  vAlpha = alive * pow(1.0 - clamp(age / life, 0.0, 1.0), 1.4) * smoothstep(0.0, 0.05, age) * (0.75 + 0.25 * sin(age * 9.0 + aSeed * 20.0));
}`;

const RAIL_DEFS: [number, number, number][][] = [
  [
    [-17, -7.5, -9],
    [-6, -2.8, -6],
    [2, 0.4, -5],
    [9, 3, -6],
    [17, 6.5, -9],
  ],
  [
    [-17, 5, -11],
    [-5, 1.8, -9],
    [4, -1.8, -8],
    [17, -6.5, -10],
  ],
  [
    [-15, -9.5, -4],
    [-5, -4.6, -3],
    [3, -4.1, -3.2],
    [15, -8.5, -4],
  ],
];

const FONT = (size: number) =>
  `900 ${size}px "PingFang SC","HarmonyOS Sans SC","MiSans","Noto Sans SC","Microsoft YaHei",sans-serif`;

function pickSubset(total: number, want: number): number[] {
  const idx = Array.from({ length: total }, (_, i) => i);
  const n = Math.min(want, total);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (total - i));
    const a = idx[i] ?? 0;
    idx[i] = idx[j] ?? 0;
    idx[j] = a;
  }
  return idx.slice(0, n);
}

export function createStarField(
  canvas: HTMLCanvasElement,
  host: FxSceneHost,
): StarFieldHandle | null {
  const S = host.state;
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || nav.connection?.saveData === true;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: false,
    });
  } catch {
    return null;
  }
  let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x050817, 1);
  renderer.autoClear = false;

  const scene = new Scene();
  const FOV = 40;
  const CAMZ = 10;
  const camera = new PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 60);
  camera.position.z = CAMZ;
  const tanH = Math.tan(((FOV / 2) * Math.PI) / 180);
  let k = (2 * CAMZ * tanH) / innerHeight; // 每 CSS 像素在 z=0 平面上的世界单位
  const toWorld = (x: number, y: number): [number, number] => [
    (x - innerWidth / 2) * k,
    -(y - innerHeight / 2) * k,
  ];

  // —— 萤火 + 形态 ——
  const N = lowEnd ? 2600 : mobile ? 4200 : 9000;
  const field = new Float32Array(N * 3);
  const shape = new Float32Array(N * 3);
  const color = new Float32Array(N * 3);
  const rnd = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    field[i * 3] = (Math.random() - 0.5) * 34;
    field[i * 3 + 1] = (Math.random() - 0.5) * 20;
    field[i * 3 + 2] = -14 + Math.random() * 15;
    rnd[i * 4] = Math.random();
    rnd[i * 4 + 1] = 0.35 + Math.random() * 1.3;
    rnd[i * 4 + 2] = Math.random();
    rnd[i * 4 + 3] = 0;
  }
  shape.set(field);
  color.fill(1);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(field, 3));
  const aShape = new BufferAttribute(shape, 3);
  const aColor = new BufferAttribute(color, 3);
  const aRand = new BufferAttribute(rnd, 4);
  geo.setAttribute("aShape", aShape);
  geo.setAttribute("aColor", aColor);
  geo.setAttribute("aRand", aRand);
  const U = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uScatter: { value: 0 },
    uDim: { value: 1 },
    uWarm: { value: 0 },
    uWarp: { value: 0 },
    uFly: { value: 0 },
    uAspect: { value: innerWidth / innerHeight },
    uProj: { value: innerHeight / (2 * tanH) },
    uPR: { value: dpr },
    uFieldSize: { value: 0.05 },
    uShapeSize: { value: 0.05 },
    uShapeAlpha: { value: 1 },
    uMouse: { value: new Vector2(99, 99) },
    uParallax: { value: new Vector2() },
    uShapeOffset: { value: new Vector2() },
  };
  const mat = new ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // —— 星云：启动和 resize 时以半分辨率烘焙一次 ——
  const quadGeo = new PlaneGeometry(2, 2);
  const quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const nebMat = new ShaderMaterial({
    uniforms: { uAspect: { value: innerWidth / innerHeight } },
    vertexShader: QUAD_VERT,
    fragmentShader: NEBULA_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const nebScene = new Scene();
  nebScene.add(new Mesh(quadGeo, nebMat));
  const nebRT = new WebGLRenderTarget(1, 1, { depthBuffer: false });
  const bakeNebula = () => {
    nebRT.setSize(Math.ceil(innerWidth * 0.5), Math.ceil(innerHeight * 0.5));
    nebMat.uniforms.uAspect!.value = innerWidth / innerHeight;
    renderer.setRenderTarget(nebRT);
    renderer.render(nebScene, quadCam);
    renderer.setRenderTarget(null);
  };
  const bgUniforms = {
    uTex: { value: nebRT.texture },
    uOff: { value: new Vector2() },
    uBright: { value: 1 },
  };
  const bgMat = new ShaderMaterial({
    uniforms: bgUniforms,
    vertexShader: QUAD_VERT,
    fragmentShader: BG_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const bgScene = new Scene();
  bgScene.add(new Mesh(quadGeo, bgMat));
  bakeNebula();

  // —— 星轨 ——
  const RP = mobile ? 420 : 820;
  const rPos = new Float32Array(RP * 3 * RAIL_DEFS.length);
  const rU = new Float32Array(RP * RAIL_DEFS.length);
  const rId = new Float32Array(RP * RAIL_DEFS.length);
  RAIL_DEFS.forEach((pts, r) => {
    const curve = new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z)));
    curve.getSpacedPoints(RP - 1).forEach((v, i) => {
      const j = r * RP + i;
      rPos[j * 3] = v.x;
      rPos[j * 3 + 1] = v.y;
      rPos[j * 3 + 2] = v.z;
      rU[j] = i / (RP - 1);
      rId[j] = r;
    });
  });
  const rGeo = new BufferGeometry();
  rGeo.setAttribute("position", new BufferAttribute(rPos, 3));
  rGeo.setAttribute("aU", new BufferAttribute(rU, 1));
  rGeo.setAttribute("aRail", new BufferAttribute(rId, 1));
  const uRail = { value: 1 };
  const railMat = new ShaderMaterial({
    uniforms: { uTime: U.uTime, uProj: U.uProj, uPR: U.uPR, uParallax: U.uParallax, uRail },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: RAIL_VERT,
    fragmentShader: FRAG,
  });
  const railPts = new Points(rGeo, railMat);
  railPts.frustumCulled = false;
  scene.add(railPts);

  // —— 命中迸发：固定大小环形缓冲 ——
  const B = 384;
  const bPos = new Float32Array(B * 3);
  const bVel = new Float32Array(B * 3);
  const bBirth = new Float32Array(B).fill(-99);
  const bSeed = new Float32Array(B).map(() => Math.random());
  const bGeo = new BufferGeometry();
  const bPosA = new BufferAttribute(bPos, 3);
  const bVelA = new BufferAttribute(bVel, 3);
  const bBirthA = new BufferAttribute(bBirth, 1);
  bGeo.setAttribute("position", bPosA);
  bGeo.setAttribute("aVel", bVelA);
  bGeo.setAttribute("aBirth", bBirthA);
  bGeo.setAttribute("aSeed", new BufferAttribute(bSeed, 1));
  const bMat = new ShaderMaterial({
    uniforms: { uTime: U.uTime, uProj: U.uProj, uPR: U.uPR },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: BURST_VERT,
    fragmentShader: FRAG,
  });
  const bursts = new Points(bGeo, bMat);
  bursts.frustumCulled = false;
  scene.add(bursts);

  let time = 0;
  let bi = 0;
  let busyUntil = 0;
  let running = false;
  let intensity: StarFieldIntensity = "full";

  function burst(rect: FxRect, n = 10) {
    const [cx, cy] = toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    for (let j = 0; j < n; j++) {
      const i = bi++ % B;
      bPos[i * 3] = cx + (Math.random() - 0.5) * rect.width * k * 0.9;
      bPos[i * 3 + 1] = cy + (Math.random() - 0.5) * rect.height * k * 0.6;
      bPos[i * 3 + 2] = 0.3;
      bVel[i * 3] = (Math.random() - 0.5) * 1.8;
      bVel[i * 3 + 1] = 0.5 + Math.random() * 1.8;
      bVel[i * 3 + 2] = -(1 + Math.random() * 5);
      bBirth[i] = time + Math.random() * 0.12;
    }
    bPosA.needsUpdate = true;
    bVelA.needsUpdate = true;
    bBirthA.needsUpdate = true;
    busyUntil = time + 2.2;
  }

  // —— 形态：写入 aShape / aColor / aRand(x=延迟, w=是否参与) ——
  let shapeScroll0 = 0;
  let rebuild: (() => void) | null = null;
  function writeShape(pts: Float32Array, cols: Float32Array, delays: Float32Array, count: number) {
    const n = Math.min(count, N);
    for (let i = 0; i < N; i++) {
      if (i < n) {
        shape[i * 3] = pts[i * 3] ?? 0;
        shape[i * 3 + 1] = pts[i * 3 + 1] ?? 0;
        shape[i * 3 + 2] = pts[i * 3 + 2] ?? 0;
        color[i * 3] = cols[i * 3] ?? 1;
        color[i * 3 + 1] = cols[i * 3 + 1] ?? 1;
        color[i * 3 + 2] = cols[i * 3 + 2] ?? 1;
        rnd[i * 4] = delays[i] ?? 0;
        rnd[i * 4 + 3] = 1;
      } else rnd[i * 4 + 3] = 0;
    }
    aShape.needsUpdate = true;
    aColor.needsUpdate = true;
    aRand.needsUpdate = true;
    shapeScroll0 = host.scroll();
  }

  function setText(rect: FxRect, text: string) {
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let fs = H * 0.9;
    ctx.font = FONT(fs);
    const w = ctx.measureText(text).width;
    if (w > W * 0.96) {
      fs *= (W * 0.96) / w;
      ctx.font = FONT(fs);
    }
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, W / 2, H / 2 + fs * 0.04);
    const img = ctx.getImageData(0, 0, W, H).data;
    // 按笔画面积反推网格步长：均匀网格比随机抽样更易读
    let filled = 0;
    for (let i = 3; i < img.length; i += 4) if ((img[i] ?? 0) > 140) filled++;
    const want = Math.floor(N * 0.62);
    const step = Math.max(2, Math.sqrt(filled / want));
    const cand: number[] = [];
    for (let y = step / 2; y < H; y += step)
      for (let x = step / 2; x < W; x += step)
        if ((img[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] ?? 0) > 140)
          cand.push(x + (Math.random() - 0.5) * step * 0.5, y + (Math.random() - 0.5) * step * 0.5);
    const sel = pickSubset(cand.length / 2, want);
    const pts = new Float32Array(sel.length * 3);
    const cols = new Float32Array(sel.length * 3);
    const dl = new Float32Array(sel.length);
    sel.forEach((s, i) => {
      const x = cand[s * 2] ?? 0;
      const y = cand[s * 2 + 1] ?? 0;
      const [wx, wy] = toWorld(rect.left + x, rect.top + y);
      pts[i * 3] = wx;
      pts[i * 3 + 1] = wy;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
      const g = y / H;
      cols[i * 3] = 1;
      cols[i * 3 + 1] = 0.97 - g * 0.17;
      cols[i * 3 + 2] = 0.9 - g * 0.45;
      dl[i] = Math.random() * 0.7 + (x / W) * 0.3;
    });
    U.uShapeSize.value = step * 1.9 * k;
    writeShape(pts, cols, dl, sel.length);
  }

  function setPortrait(rect: FxRect, P: FxPortraitCloud) {
    const total = P.count;
    const scale = Math.min(rect.width / P.w, rect.height / P.h);
    const ox = rect.left + (rect.width - P.w * scale) / 2;
    const oy = rect.top + (rect.height - P.h * scale) / 2;
    const sel = pickSubset(total, Math.floor(N * 0.85));
    const pts = new Float32Array(sel.length * 3);
    const cols = new Float32Array(sel.length * 3);
    const dl = new Float32Array(sel.length);
    sel.forEach((s, i) => {
      const o = s * 5;
      const gx = P.data[o] ?? 0;
      const gy = P.data[o + 1] ?? 0;
      const [wx, wy] = toWorld(
        ox + (gx + 0.5 + (Math.random() - 0.5) * 0.6) * scale,
        oy + (gy + 0.5 + (Math.random() - 0.5) * 0.6) * scale,
      );
      pts[i * 3] = wx;
      pts[i * 3 + 1] = wy;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
      cols[i * 3] = Math.min(1, (P.data[o + 2] ?? 0) * 1.1);
      cols[i * 3 + 1] = Math.min(1, (P.data[o + 3] ?? 0) * 1.1);
      cols[i * 3 + 2] = Math.min(1, (P.data[o + 4] ?? 0) * 1.1);
      const dx = gx / P.w - 0.5;
      const dy = gy / P.h - 0.42;
      dl[i] = Math.min(1, Math.hypot(dx, dy) * 1.5) * 0.65 + Math.random() * 0.35;
    });
    // 采样越稀疏，点越大，保证覆盖
    const density = Math.sqrt(total / Math.max(1, sel.length));
    U.uShapeSize.value = scale * k * 1.7 * density;
    writeShape(pts, cols, dl, sel.length);
  }

  // —— 指针：鼠标排斥 + 视差 ——
  const ptr = { x: 99, y: 99, px: 0, py: 0 };
  const onPointer = (e: PointerEvent) => {
    const [wx, wy] = toWorld(e.clientX, e.clientY);
    ptr.x = wx;
    ptr.y = wy;
    ptr.px = (e.clientX / innerWidth - 0.5) * -0.5;
    ptr.py = (e.clientY / innerHeight - 0.5) * 0.35;
  };
  addEventListener("pointermove", onPointer, { passive: true });

  let resizeTimer: number | undefined;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      renderer.setSize(innerWidth, innerHeight, false);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      k = (2 * CAMZ * tanH) / innerHeight;
      U.uProj.value = innerHeight / (2 * tanH);
      U.uAspect.value = innerWidth / innerHeight;
      bakeNebula();
      rebuild?.();
      render();
    }, 150);
  };
  addEventListener("resize", onResize);

  const syncUniforms = () => {
    U.uMorph.value = S.morph * (1 - S.disperse * 0.85);
    U.uScatter.value = Math.max(S.scatter, S.disperse * 0.7);
    U.uDim.value = S.dim;
    U.uWarm.value = S.warm;
    U.uShapeAlpha.value = S.shapeAlpha;
    U.uWarp.value = S.warp;
    uRail.value = S.rail;
    bgUniforms.uBright.value = 0.7 + 0.3 * S.dim;
    bgUniforms.uOff.value.set(U.uParallax.value.x * -0.006, U.uParallax.value.y * -0.006);
    U.uShapeOffset.value.y = (host.scroll() - shapeScroll0) * k;
  };
  function render() {
    syncUniforms();
    renderer.clear();
    renderer.render(bgScene, quadCam);
    renderer.render(scene, camera);
  }

  // —— 渲染循环：对局中且没有迸发时降到 30fps ——
  let last = performance.now();
  let slow = 0;
  let quality = 2;
  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const calm =
      (intensity === "calm" || host.mode() === "game") &&
      host.mode() !== "result" &&
      time > busyUntil &&
      S.warp < 0.01;
    if (calm && now - last < 30) return; // ~30fps
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt * (calm ? 0.5 : 1);
    U.uTime.value = time;
    U.uFly.value += dt * S.warp * 26;
    const um = U.uMouse.value;
    const upx = U.uParallax.value;
    um.x += (ptr.x - um.x) * 0.15;
    um.y += (ptr.y - um.y) * 0.15;
    upx.x += (ptr.px - upx.x) * 0.05;
    upx.y += (ptr.py - upx.y) * 0.05;
    render();
    // 自适应降级：持续 2 秒以上低于 ~40fps 就降一档
    slow = dt > 0.025 && !calm ? slow + 1 : Math.max(0, slow - 2);
    if (slow > 120 && quality > 0) {
      quality--;
      slow = 0;
      if (quality === 1) {
        dpr = 1;
        renderer.setPixelRatio(1);
        renderer.setSize(innerWidth, innerHeight, false);
        U.uPR.value = 1;
      } else geo.setDrawRange(0, Math.floor(N * 0.5));
    }
  }

  // 静止（减少动效 / 页面隐藏）时：滚动仍然要让形态跟随页面
  const onScroll = () => {
    if (!running) requestAnimationFrame(render);
  };
  addEventListener("scroll", onScroll, { passive: true });

  render();

  return {
    setText(rect, text) {
      setText(rect, text);
      rebuild = () => {
        const next = host.measure();
        if (next) setText(next, text);
      };
      if (!running) render();
    },
    setPortrait(rect, cloud) {
      setPortrait(rect, cloud);
      rebuild = () => {
        const next = host.measure();
        if (next) setPortrait(next, cloud);
      };
      if (!running) render();
    },
    burst(rect, n) {
      if (!running) return;
      burst(rect, n);
    },
    render() {
      if (!running) render();
    },
    setRunning(next) {
      if (next === running) return;
      running = next;
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        render();
      }
    },
    setIntensity(next) {
      intensity = next;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      removeEventListener("pointermove", onPointer);
      removeEventListener("resize", onResize);
      removeEventListener("scroll", onScroll);
      geo.dispose();
      mat.dispose();
      quadGeo.dispose();
      nebMat.dispose();
      nebRT.dispose();
      bgMat.dispose();
      rGeo.dispose();
      railMat.dispose();
      bGeo.dispose();
      bMat.dispose();
      renderer.dispose();
    },
  };
}
