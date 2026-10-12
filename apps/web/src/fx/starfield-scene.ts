/**
 * 星空背景场景（懒加载模块，three 只在这里被静态引入）。
 * 结构：烘焙一次的星云纹理 → 漂移星点（含四芒亮星）→ 三条星轨。
 * 只有一个 draw loop；页面隐藏 / 减少动效 / 浅色主题时由外部暂停。
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
import type { FxBurstOptions, FxScene } from "./fx";
import { createPointField } from "./point-field";
import { createStardust } from "./stardust";
import { glyphBox, sampleTextToPoints } from "./glyph-sampler";

export type StarFieldIntensity = "full" | "calm";

export interface StarFieldHandle extends FxScene {
  setRunning(running: boolean): void;
  setIntensity(intensity: StarFieldIntensity): void;
  dispose(): void;
}

const CAMERA_Z = 10;
const FOV = 50;

const STAR_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uProj;
uniform float uPR;
uniform float uSize;
uniform float uWarp;
uniform float uFly;
uniform vec2 uParallax;
attribute vec4 aRand;
varying vec3 vColor;
varying float vAlpha;
varying float vSpike;
varying vec2 vDir;
void main() {
  vec3 p = position;
  float phase = aRand.z * 6.2831;
  p.x += sin(uTime * 0.05 + phase) * 0.18;
  p.y += cos(uTime * 0.04 + phase) * 0.14;
  p.z = mod(p.z + 14.0 + uFly, 16.0) - 14.0;
  float depth = (p.z + 14.0) / 15.0;
  p.xy += uParallax * (0.35 + depth);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vDir = normalize(ndc + 1e-4);
  float spike = step(1.56, aRand.y);
  float twinkle = 0.62 + 0.38 * sin(uTime * (0.5 + aRand.x * 1.7) + aRand.z * 40.0);
  float size = uSize * aRand.y * (1.0 + spike * 2.4) * (1.0 + uWarp * length(ndc) * 2.5);
  gl_PointSize = min(max(size * uProj * uPR / -mv.z, 1.0), 72.0);
  vec3 color = vec3(0.82, 0.88, 1.0);
  if (aRand.z > 0.8) color = vec3(1.0, 0.86, 0.6);
  if (aRand.z > 0.94) color = vec3(0.78, 0.7, 1.0);
  vColor = color;
  vSpike = spike;
  vAlpha = twinkle * smoothstep(-14.0, -10.5, p.z) * smoothstep(2.5, 0.0, p.z);
}
`;

const STAR_FRAGMENT = /* glsl */ `
uniform float uWarp;
varying vec3 vColor;
varying float vAlpha;
varying float vSpike;
varying vec2 vDir;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  if (uWarp > 0.01) {
    vec2 dir = vec2(vDir.x, -vDir.y);
    float along = dot(q, dir);
    float across = dot(q, vec2(-dir.y, dir.x));
    q = vec2(along / (1.0 + uWarp * 3.0), across);
  }
  float d = length(q);
  float dotA = smoothstep(0.5, 0.0, d);
  dotA = dotA * dotA + smoothstep(0.16, 0.0, d) * 0.45;
  float cross = exp(-abs(q.x) * 70.0) * smoothstep(0.5, 0.0, abs(q.y))
              + exp(-abs(q.y) * 70.0) * smoothstep(0.5, 0.0, abs(q.x));
  float core = smoothstep(0.12, 0.0, d);
  float a = mix(dotA, max(cross * 0.85, core), vSpike) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a, a);
}
`;

const QUAD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const NEBULA_FRAGMENT = /* glsl */ `
uniform vec2 uAspect;
uniform float uSeed;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = (vUv - 0.5) * uAspect;
  vec2 w = vec2(fbm(p * 1.6 + 3.1), fbm(p * 1.6 - 7.4));
  float n = fbm(p * 2.2 + w * 1.4);
  float band = exp(-pow((p.y + p.x * 0.42 - 0.06) * 2.4, 2.0));
  vec3 col = mix(vec3(0.018, 0.026, 0.075), vec3(0.035, 0.05, 0.13), vUv.y);
  float cloud = smoothstep(0.35, 0.85, n);
  col += vec3(0.22, 0.13, 0.45) * cloud * band * 0.85;
  col += vec3(0.05, 0.17, 0.36) * smoothstep(0.45, 0.9, w.x) * band * 0.7;
  col += vec3(0.55, 0.38, 0.16) * pow(n, 3.0) * band * 0.35;
  float vig = smoothstep(1.25, 0.25, length(p * vec2(0.9, 1.2)));
  col *= 0.55 + 0.45 * vig;
  gl_FragColor = vec4(col, 1.0);
}
`;

const BACKGROUND_FRAGMENT = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uOff;
uniform float uBright;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, (vUv - 0.5) * 0.96 + 0.5 + uOff).rgb;
  gl_FragColor = vec4(c * uBright, 1.0);
}
`;

const RAIL_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uProj;
uniform float uPR;
uniform float uRail;
uniform vec2 uParallax;
attribute float aU;
attribute float aRail;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec3 p = position;
  p.xy += uParallax * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float head = fract(uTime * (0.028 + aRail * 0.008) + aRail * 0.37);
  float g = exp(-fract(head - aU) * 28.0);
  float ends = smoothstep(0.0, 0.08, aU) * smoothstep(1.0, 0.92, aU);
  vAlpha = uRail * (0.12 + g * 0.95) * ends;
  vColor = abs(aRail - 1.0) < 0.5 ? vec3(0.62, 0.82, 1.0) : vec3(1.0, 0.84, 0.55);
  gl_PointSize = max((0.03 + g * 0.07) * uProj * uPR / -mv.z, 1.0);
}
`;

const RAIL_FRAGMENT = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  if (a < 0.008) discard;
  gl_FragColor = vec4(vColor * a, a);
}
`;

const RAILS: [number, number, number][][] = [
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

function isCompactViewport(): boolean {
  return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
}

function isLowEnd(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2;
}

export function createStarField(canvas: HTMLCanvasElement): StarFieldHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
  } catch {
    return null;
  }

  const compact = isCompactViewport();
  const lowEnd = isLowEnd();
  const maxRatio = lowEnd ? 1 : compact ? 1.25 : 1.5;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, maxRatio);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.autoClear = false;
  renderer.setClearColor(0x050817, 1);

  const tanHalf = Math.tan((FOV * Math.PI) / 360);
  const camera = new PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.z = CAMERA_Z;
  const scene = new Scene();
  const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── 星点 ──
  const starCount = lowEnd ? 2600 : compact ? 4800 : 9600;
  const positions = new Float32Array(starCount * 3);
  const rands = new Float32Array(starCount * 4);
  for (let i = 0; i < starCount; i += 1) {
    positions[i * 3] = (Math.random() * 2 - 1) * 17;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * 10;
    positions[i * 3 + 2] = -14 + Math.random() * 15;
    rands[i * 4] = Math.random();
    rands[i * 4 + 1] = 0.35 + Math.pow(Math.random(), 2.2) * 1.3;
    rands[i * 4 + 2] = Math.random();
    rands[i * 4 + 3] = Math.random();
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  starGeometry.setAttribute("aRand", new BufferAttribute(rands, 4));
  const starUniforms = {
    uTime: { value: 0 },
    uProj: { value: window.innerHeight / (2 * tanHalf) },
    uPR: { value: pixelRatio },
    uSize: { value: 0.05 },
    uWarp: { value: 0 },
    uFly: { value: 0 },
    uParallax: { value: new Vector2() },
  };
  const starMaterial = new ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  scene.add(stars);

  // ── 星轨 ──
  const railPointsPerRail = compact ? 420 : 820;
  const railPositions: number[] = [];
  const railU: number[] = [];
  const railIndex: number[] = [];
  RAILS.forEach((rail, index) => {
    const curve = new CatmullRomCurve3(rail.map(([x, y, z]) => new Vector3(x, y, z)));
    curve.getPoints(railPointsPerRail - 1).forEach((point, step) => {
      railPositions.push(point.x, point.y, point.z);
      railU.push(step / (railPointsPerRail - 1));
      railIndex.push(index);
    });
  });
  const railGeometry = new BufferGeometry();
  railGeometry.setAttribute("position", new BufferAttribute(new Float32Array(railPositions), 3));
  railGeometry.setAttribute("aU", new BufferAttribute(new Float32Array(railU), 1));
  railGeometry.setAttribute("aRail", new BufferAttribute(new Float32Array(railIndex), 1));
  const railUniforms = {
    uTime: { value: 0 },
    uProj: starUniforms.uProj,
    uPR: starUniforms.uPR,
    uRail: { value: 1 },
    uParallax: starUniforms.uParallax,
  };
  const railMaterial = new ShaderMaterial({
    uniforms: railUniforms,
    vertexShader: RAIL_VERTEX,
    fragmentShader: RAIL_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const rails = new Points(railGeometry, railMaterial);
  rails.frustumCulled = false;
  scene.add(rails);

  // ── 覆盖层：星尘 + 文字点阵 + 立绘点云 ──
  // 三者都在正交相机下直接按 NDC 摆放，和透视相机解耦，尺寸就是 CSS 像素。
  // 空闲（没有星尘、没有点阵）时整个 overlayScene 不渲染，稳态仍是 4 次 draw call。
  const overlayScene = new Scene();
  const dust = createStardust();
  const textField = createPointField();
  const portraitField = createPointField();
  overlayScene.add(textField.object);
  overlayScene.add(portraitField.object);
  overlayScene.add(dust.object);
  dust.setAspect(window.innerWidth / window.innerHeight);
  dust.setPixelRatio(pixelRatio);
  textField.setPixelRatio(pixelRatio);
  portraitField.setPixelRatio(pixelRatio);

  // ── 星云：半分辨率烘焙一次 ──
  const quad = new PlaneGeometry(2, 2);
  let nebulaTarget = new WebGLRenderTarget(1, 1);
  const nebulaUniforms = {
    uAspect: { value: new Vector2(1, 1) },
    uSeed: { value: Math.random() * 10 },
  };
  const nebulaMaterial = new ShaderMaterial({
    uniforms: nebulaUniforms,
    vertexShader: QUAD_VERTEX,
    fragmentShader: NEBULA_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
  const nebulaScene = new Scene();
  nebulaScene.add(new Mesh(quad, nebulaMaterial));
  const backgroundUniforms = {
    uTex: { value: nebulaTarget.texture },
    uOff: { value: new Vector2() },
    uBright: { value: 1 },
  };
  const backgroundMaterial = new ShaderMaterial({
    uniforms: backgroundUniforms,
    vertexShader: QUAD_VERTEX,
    fragmentShader: BACKGROUND_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
  const backgroundScene = new Scene();
  backgroundScene.add(new Mesh(quad, backgroundMaterial));

  function bakeNebula(): void {
    const width = Math.max(1, Math.round(window.innerWidth / 2));
    const height = Math.max(1, Math.round(window.innerHeight / 2));
    nebulaTarget.dispose();
    nebulaTarget = new WebGLRenderTarget(width, height);
    const aspect = window.innerWidth / window.innerHeight;
    nebulaUniforms.uAspect.value.set(Math.max(aspect, 1), Math.max(1 / aspect, 1));
    renderer.setRenderTarget(nebulaTarget);
    renderer.render(nebulaScene, quadCamera);
    renderer.setRenderTarget(null);
    backgroundUniforms.uTex.value = nebulaTarget.texture;
  }
  bakeNebula();

  // ── 交互 / 状态 ──
  const pointerTarget = new Vector2();
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  function onPointerMove(event: PointerEvent): void {
    pointerTarget.set(
      (event.clientX / window.innerWidth - 0.5) * -0.5,
      (event.clientY / window.innerHeight - 0.5) * 0.35,
    );
  }
  if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });

  let resizeTimer = 0;
  function onResize(): void {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      starUniforms.uProj.value = window.innerHeight / (2 * tanHalf);
      dust.setAspect(camera.aspect);
      bakeNebula();
      if (!running) renderFrame();
    }, 150);
  }
  window.addEventListener("resize", onResize);

  let running = false;
  let intensity: StarFieldIntensity = "full";
  let frame = 0;
  let lastTime = 0;
  let lastDrawn = 0;
  let elapsed = Math.random() * 100;
  let warpStart = -1;
  // 自适应：持续慢帧时把像素比降到 1、星点减半
  let slowFrames = 0;
  let degraded = lowEnd;
  // 点阵的聚合进度：目标值由外部（滚动 / 揭晓时间线）驱动，这里做阻尼跟随
  let textMorph = 0;
  let textMorphTarget = 0;
  let portraitMorph = 0;
  let portraitMorphTarget = 0;
  let dustActive = false;

  /**
   * 暂停 / 减少动态效果时不做插值：直接把聚合进度落到目标值，只画一帧静态画面。
   * 这样 `?reduce` 与 `prefers-reduced-motion` 下仍能看到完整的点阵构图。
   */
  function settleOverlay(): void {
    if (running) return;
    textMorph = textMorphTarget;
    portraitMorph = portraitMorphTarget;
    if (textField.object.visible) {
      textField.setMorph(textMorph);
      textField.tick(elapsed);
    }
    if (portraitField.object.visible) {
      portraitField.setMorph(portraitMorph);
      portraitField.tick(elapsed);
    }
    renderFrame();
  }

  function renderFrame(): void {
    renderer.clear();
    renderer.render(backgroundScene, quadCamera);
    renderer.render(scene, camera);
    // 覆盖层只在真的有点阵 / 存活星尘时才多画一次，稳态仍是 4 次 draw call
    if (textField.object.visible || portraitField.object.visible || dustActive) {
      renderer.render(overlayScene, quadCamera);
    }
  }

  function loop(now: number): void {
    frame = window.requestAnimationFrame(loop);
    const calm = intensity === "calm" && warpStart < 0;
    if (calm && now - lastDrawn < 30) return;
    const dt = Math.min((now - (lastTime || now)) / 1000, 0.05);
    lastTime = now;
    lastDrawn = now;

    if (!degraded && dt > 0.028) {
      slowFrames += 1;
      if (slowFrames > 90) {
        degraded = true;
        pixelRatio = 1;
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        starUniforms.uPR.value = 1;
        starGeometry.setDrawRange(0, Math.floor(starCount / 2));
        dust.setPixelRatio(1);
        textField.setPixelRatio(1);
        portraitField.setPixelRatio(1);
      }
    } else if (slowFrames > 0) {
      slowFrames -= 1;
    }

    elapsed += dt * (calm ? 0.5 : 1);
    let warp = 0;
    if (warpStart >= 0) {
      const t = (now - warpStart) / 1100;
      if (t >= 1) warpStart = -1;
      else warp = Math.sin(Math.PI * t) ** 2;
    }
    starUniforms.uTime.value = elapsed;
    railUniforms.uTime.value = elapsed;
    starUniforms.uWarp.value = warp;
    starUniforms.uFly.value += dt * warp * 26;
    railUniforms.uRail.value = calm ? 0.55 : 1;
    const parallax = starUniforms.uParallax.value;
    parallax.lerp(pointerTarget, 0.05);
    const background = backgroundUniforms;
    background.uOff.value.set(-parallax.x * 0.006, -parallax.y * 0.006);
    background.uBright.value = calm ? 0.82 : 1;

    // 点阵与星尘：每帧只更新 uniform / 少数属性，几何在设置形状时一次性建好
    textMorph += (textMorphTarget - textMorph) * Math.min(1, dt * 3.2);
    portraitMorph += (portraitMorphTarget - portraitMorph) * Math.min(1, dt * 2.6);
    if (textField.object.visible) {
      textField.setMorph(textMorph);
      textField.setParallax(parallax.x, parallax.y);
      textField.tick(elapsed);
    }
    if (portraitField.object.visible) {
      portraitField.setMorph(portraitMorph);
      portraitField.setParallax(parallax.x, parallax.y);
      portraitField.tick(elapsed);
    }
    dustActive = dust.tick(elapsed);

    renderFrame();
  }

  // 首帧前预编译着色器：星云、星点、星轨和覆盖层的着色器都不长，但在 GPU 上编译仍会让
  // 第一帧掉到几十毫秒。compileAsync 走 KHR_parallel_shader_compile，不阻塞主线程；
  // 它只是优化，失败也不影响正确性，所以静默吞掉异常。
  void Promise.all([
    renderer.compileAsync(scene, camera),
    renderer.compileAsync(overlayScene, quadCamera),
    renderer.compileAsync(backgroundScene, quadCamera),
  ]).catch(() => undefined);

  renderFrame();

  return {
    setRunning(next) {
      if (next === running) return;
      running = next;
      if (running) {
        lastTime = 0;
        frame = window.requestAnimationFrame(loop);
      } else {
        window.cancelAnimationFrame(frame);
      }
    },
    setIntensity(next) {
      intensity = next;
      settleOverlay();
    },
    warp() {
      if (running) warpStart = performance.now();
    },
    text(content, options, morph) {
      if (!content) {
        textField.clear();
        textMorph = 0;
        textMorphTarget = 0;
        settleOverlay();
        return;
      }
      const compact = isCompactViewport();
      const sample = sampleTextToPoints(content, {
        maxPoints: options?.maxPoints ?? (compact ? 5000 : 12000),
      });
      if (sample.points.length === 0) {
        textField.clear();
        return;
      }
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const box = glyphBox(sample, options?.width ?? 0.86, aspect);
      textField.setTargets(sample.points, {
        centerX: options?.centerX ?? 0,
        centerY: options?.centerY ?? 0.22,
        width: box.width,
        height: box.height,
        size: options?.size ?? (compact ? 3.2 : 4),
        tone: options?.tone ?? "gold",
        spread: 2.6,
        stagger: 0.5,
      });
      textMorphTarget = morph;
      settleOverlay();
    },
    textMorph(value) {
      textMorphTarget = Math.max(0, Math.min(1, value));
      settleOverlay();
    },
    portrait(cloud, options, morph) {
      if (!cloud || cloud.points.length === 0) {
        portraitField.clear();
        portraitMorph = 0;
        portraitMorphTarget = 0;
        settleOverlay();
        return;
      }
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const ndcHeight = options?.height ?? 1.15;
      // 立绘点云来自竖直长图，按源图长宽比反推 NDC 宽度，避免被拉伸
      const ndcWidth = (ndcHeight * cloud.aspect) / Math.max(aspect, 0.0001);
      portraitField.setTargets(cloud.points, {
        centerX: options?.centerX ?? 0,
        centerY: options?.centerY ?? 0,
        width: ndcWidth,
        height: ndcHeight,
        size: options?.size ?? 2.6,
        tone: options?.tone ?? "gold",
        spread: 2.4,
        stagger: 0.55,
      });
      portraitMorphTarget = morph;
      settleOverlay();
    },
    portraitMorph(value) {
      portraitMorphTarget = Math.max(0, Math.min(1, value));
      settleOverlay();
    },
    burst(x, y, options: FxBurstOptions = {}) {
      if (!running) return;
      dust.burst(x, y, options);
      dustActive = true;
    },
    dispose() {
      running = false;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      starGeometry.dispose();
      starMaterial.dispose();
      railGeometry.dispose();
      railMaterial.dispose();
      quad.dispose();
      nebulaMaterial.dispose();
      backgroundMaterial.dispose();
      nebulaTarget.dispose();
      dust.dispose();
      textField.dispose();
      portraitField.dispose();
      renderer.dispose();
    },
  };
}
