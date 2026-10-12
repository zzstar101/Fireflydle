/**
 * 文字 → 粒子点集：把文字画到离屏 2D canvas，按「有墨像素面积 / 目标点数」推算网格步长，
 * 再按网格采样出笔画上的点。步长随笔画面积自适应，字数变化时点密度保持稳定。
 */

export interface GlyphSampleOptions {
  /** 目标点数（估算值），默认 5200。 */
  maxPoints?: number;
  /** 基础字号（像素），默认 260。 */
  fontSize?: number;
  /** 采样阈值（alpha，0–255），默认 140。 */
  threshold?: number;
}

export interface GlyphSampleResult {
  /** 归一化坐标（x 向右、y 向下），长度 = 点数 * 2。 */
  points: Float32Array;
  /** 采样画布尺寸，调用方据此反推字形长宽比。 */
  width: number;
  height: number;
  /** 实际使用的网格步长（像素）。 */
  step: number;
  /** 有墨像素数。 */
  inkPixels: number;
}

const FONT_STACK = '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", system-ui, sans-serif';
const FONT_WEIGHT = 900;

/** 采样失败（无 canvas / 2D 上下文 / 字体缺字）时返回空点集。 */
export function sampleTextToPoints(
  text: string,
  options: GlyphSampleOptions = {},
): GlyphSampleResult {
  const empty: GlyphSampleResult = {
    points: new Float32Array(0),
    width: 1,
    height: 1,
    step: 1,
    inkPixels: 0,
  };
  const content = text.trim();
  if (!content || typeof document === "undefined") return empty;

  const maxPoints = Math.max(64, options.maxPoints ?? 5200);
  const fontSize = options.fontSize ?? 260;
  const threshold = options.threshold ?? 140;

  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return empty;
  measure.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_STACK}`;
  const metrics = measure.measureText(content);
  const textWidth = Math.max(1, Math.ceil(metrics.width));
  // 上下留出一点呼吸空间，避免笔画贴边被裁掉
  const width = textWidth + Math.ceil(fontSize * 0.2);
  const height = Math.ceil(fontSize * 1.36);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return empty;
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_STACK}`;
  context.fillText(content, width / 2, height / 2);

  let data: Uint8ClampedArray;
  try {
    data = context.getImageData(0, 0, width, height).data;
  } catch {
    return empty;
  }

  let inkPixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if ((data[i] ?? 0) > threshold) inkPixels += 1;
  }
  if (inkPixels === 0) return { ...empty, width, height };

  // 笔画面积 / 目标点数 = 每个采样点分摊到的面积 → 边长就是步长
  const step = Math.max(2, Math.round(Math.sqrt(inkPixels / maxPoints)));
  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  const sampled: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const px = Math.min(width - 1, Math.floor((col + 0.5) * step));
      const py = Math.min(height - 1, Math.floor((row + 0.5) * step));
      const alpha = data[(py * width + px) * 4 + 3] ?? 0;
      if (alpha <= threshold) continue;
      // 格内抖动，避免出现规则的网格纹路
      const jitterX = (Math.random() - 0.5) * step * 0.85;
      const jitterY = (Math.random() - 0.5) * step * 0.85;
      sampled.push(((col + 0.5) * step + jitterX) / width, ((row + 0.5) * step + jitterY) / height);
    }
  }
  return {
    points: new Float32Array(sampled),
    width,
    height,
    step,
    inkPixels,
  };
}

/**
 * 把归一化点集换算成 setTargets 需要的 NDC 尺寸，保证字形不被拉伸。
 * `width` 是点阵在 NDC 里的宽度，`viewportAspect` = 视口宽 / 高。
 */
export function glyphBox(
  sample: Pick<GlyphSampleResult, "width" | "height">,
  ndcWidth: number,
  viewportAspect: number,
): { width: number; height: number } {
  return {
    width: ndcWidth,
    height: (ndcWidth * viewportAspect * sample.height) / sample.width,
  };
}
