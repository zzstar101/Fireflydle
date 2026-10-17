import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, JSX } from "react";
import type { GameEntitySummary, Locale } from "@fireflydle/contracts";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import type { CharacterSprite } from "../../lib/character-art";
import "./inference-replay.css";

/** 黄金角（弧度），葵花阵的相邻夹角。 */
const GOLDEN_ANGLE = 2.399963229728653;
/** 每一猜之间的停顿，给坠落与重新排布留出时间。 */
const STEP_MS = 1400;
/** 只有最前面这几个头像立即加载，避免 92 张图同时抢带宽。 */
const PRIORITY_COUNT = 12;
/**
 * 雪碧图第 `index` 格（共 `count` 格）的百分比坐标。background-position 的百分比是
 * 「(容器 - 图片) × p」，所以第 i 格对应 i / (count - 1)。
 */
function spritePercent(index: number, count: number): string {
  if (count <= 1) return "0%";
  return `${+((index / (count - 1)) * 100).toFixed(4)}%`;
}
/** 原型 `.cav` 的基准边长（px）。 */
const CAV_PX = 44;
/** 原型 `spiral()`：`R = Math.min(w, hgt) * 0.36`。 */
const SPIRAL_RADIUS_RATIO = 0.36;
/** 原型 `spiral()` 里缩放系数 `s` 的上下限 `Math.max(0.42, Math.min(2.1, …))`。 */
const SPIRAL_SCALE_MIN = 0.42;
const SPIRAL_SCALE_MAX = 2.1;
/** 原型里候选不超过 4 个时不用葵花阵，而是排成一行。 */
const SPIRAL_ROW_LIMIT = 4;
/** 原型行布局的间距系数：`44 * 1.3`。 */
const ROW_GAP_PX = CAV_PX * 1.3;
/** 行布局的缩放上限 `Math.min(2.4, …)`。 */
const ROW_SCALE_MAX = 2.4;

const COPY = {
  "zh-CN": {
    title: "推理回放",
    remaining: "位候选",
    skip: "跳过",
    opening: "推理回放 · 开局",
    step: "第 {n} 猜 · {name}",
  },
  ja: {
    title: "推理リプレイ",
    remaining: "候補",
    skip: "スキップ",
    opening: "推理リプレイ · 開始",
    step: "第{n}推測 · {name}",
  },
  en: {
    title: "Inference replay",
    remaining: "candidates",
    skip: "Skip",
    opening: "Inference replay · start",
    step: "Guess {n} · {name}",
  },
} satisfies Record<Locale, unknown>;

export interface InferenceReplayStep {
  /** 这一猜的角色 ID */
  guessId: string;
  /** 这一猜之后仍然存活的候选角色 ID */
  remainingIds: readonly string[];
}

export interface InferenceReplayProps {
  /** 初始候选池，顺序稳定；约 92 个 */
  characters: readonly GameEntitySummary[];
  /** 每一步猜测之后的存活候选 */
  steps: readonly InferenceReplayStep[];
  locale: Locale;
  /**
   * 构建期合成的头像雪碧图。传 null / 不传时回退到逐个头像请求
   * —— 组件本身不读取数据源，方便在无 react-query provider 的测试里直接渲染。
   */
  sprite?: CharacterSprite | null;
  /** true = 直接渲染最终状态，不播动画 */
  final?: boolean;
  /** 动画播完或被跳过后调用一次 */
  onDone?: () => void;
  /**
   * HUD 顶部那行标签（原型 `.label`「推理回放」）。
   * 由父组件按当前语言传入；缺省时回退到组件内置文案。
   */
  hudLabel?: string;
  /** 每一猜那行「第 N 猜 · 角色名」的进度文案，由父组件根据 guesses 生成。 */
  stepLabels?: readonly string[];
}

/** 位置写在自定义属性里（cqmin / cqw = 舞台的 1%），只喂给 left / top，不参与内容布局。 */
type ReplayStyle = CSSProperties & Record<`--${string}`, string>;

interface ReplayPosition {
  /** 相对舞台中心的横向偏移，CSS 长度 */
  x: string;
  /** 相对舞台中心的纵向偏移，CSS 长度 */
  y: string;
  /** 头像边长，CSS 长度 */
  size: string;
}

/** 兜底位置：正常不会用到。 */
const CENTER: ReplayPosition = { x: "0px", y: "0px", size: `${CAV_PX}px` };

/** 三位小数足够定位，同时让服务端渲染的标记稳定可比。 */
function trim(value: number): number {
  return Number(value.toFixed(3));
}

/**
 * 照抄原型 `spiral(n, w, hgt)`（prototype.html:4779）。
 *
 * 原型用 GSAP 把 `x / y / scale` 写成像素变换；这里换成容器查询单位：
 * `1cqmin` 就是 `min(舞台宽, 舞台高)` 的 1%，而 `.art-slot` 是 size container，
 * 所以不需要测量 DOM 也能得到与原型逐值相同的几何。
 */
function spiralAt(index: number, count: number): ReplayPosition {
  if (count <= SPIRAL_ROW_LIMIT) {
    // 原型：`s = Math.min(2.4, (w * 0.7) / (n * 44 * 1.3))`，候选不多时横向排成一行。
    const gap = `min(${trim(ROW_GAP_PX * ROW_SCALE_MAX)}px, ${trim(70 / count)}cqw)`;
    const offset = index - (count - 1) / 2;
    return {
      // 横向偏移与螺旋分支共用 cqmin 之外的同一套消费方式；0 用 cqmin 写，单位保持统一。
      x: offset === 0 ? "0cqmin" : `calc(${trim(offset)} * ${gap})`,
      y: "0cqmin",
      size: `min(${trim(CAV_PX * ROW_SCALE_MAX)}px, ${trim(
        (CAV_PX * 70) / ROW_GAP_PX / count,
      )}cqw)`,
    };
  }
  // 原型：`c = R / sqrt(n)`，`r = c * sqrt(i + 0.5)`，y 方向压到 0.9。
  const theta = index * GOLDEN_ANGLE;
  const radius = SPIRAL_RADIUS_RATIO * Math.sqrt((index + 0.5) / count);
  return {
    x: `${trim(radius * Math.cos(theta) * 100)}cqmin`,
    y: `${trim(radius * Math.sin(theta) * 0.9 * 100)}cqmin`,
    // `44 * s`，其中 `s = clamp(0.42, 2.1, c * 1.5 / 44)`，即 `0.54 * min(w, h) / sqrt(n)`。
    size: `clamp(${trim(CAV_PX * SPIRAL_SCALE_MIN)}px, ${trim(
      CAV_PX * SPIRAL_SCALE_MAX,
    )}px, ${trim((SPIRAL_RADIUS_RATIO * 1.5 * 100) / Math.sqrt(count))}cqmin)`,
  };
}

/** 挂载时读一次：设计文档要求「减少动态效果」时直接显示最终状态。 */
function prefersReducedMotion(): boolean {
  if (typeof document !== "undefined" && document.documentElement?.dataset.motion === "reduced") {
    return true;
  }
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}

/**
 * 推理回放。
 *
 * 结构对照原型 `#result > .art-slot`：HUD 钉在舞台顶部居中、跳过按钮钉在右上角、
 * 头像云以舞台中心为原点排葵花阵。组件本身不渲染定位容器——它直接把这三样
 * 作为 `.art-slot` 的直接子元素输出，因此父级必须是一个 `position: relative` 的舞台。
 */
export function InferenceReplay({
  characters,
  steps,
  locale,
  final = false,
  sprite = null,
  onDone,
  hudLabel,
  stepLabels,
}: InferenceReplayProps): JSX.Element {
  const text = COPY[locale] ?? COPY.en;
  // 减少动态效果只在挂载时读一次，之后不再变化。
  const [reducedMotion] = useState(prefersReducedMotion);
  const instant = final === true || reducedMotion;
  const [cursor, setCursor] = useState(() => (instant ? steps.length : 0));

  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  // 稳定引用：父组件每次渲染都传新的 onDone 也不会重置回放定时器。
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current?.();
  }, []);

  // 每一步之后的存活候选，按初始候选池的稳定顺序排列。
  const pools = useMemo(() => {
    const initial = characters.map((character) => character.id);
    const byStep = steps.map((step) => {
      const survivors = new Set(step.remainingIds);
      return characters.filter((character) => survivors.has(character.id)).map((c) => c.id);
    });
    return [initial, ...byStep];
  }, [characters, steps]);

  const cursorIndex = Math.min(cursor, pools.length - 1);
  const aliveIds = useMemo(() => new Set(pools[cursorIndex] ?? []), [pools, cursorIndex]);

  // 逐个池子算葵花阵：被淘汰的头像保留它最后一次存活时的位置，
  // 这样坠落动画从原地开始，而不是跳到别处。
  const positions = useMemo(() => {
    const map = new Map<string, ReplayPosition>();
    for (let step = 0; step <= cursorIndex; step += 1) {
      const pool = pools[step] ?? [];
      pool.forEach((id, index) => map.set(id, spiralAt(index, pool.length)));
    }
    return map;
  }, [pools, cursorIndex]);

  // 回放队列：每 STEP_MS 推进一猜，走到最后就交回给父组件（只会调用一次）。
  useEffect(() => {
    if (cursor >= steps.length) {
      finish();
      return;
    }
    const timer = setTimeout(() => setCursor((current) => current + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [cursor, steps.length, finish]);

  // final 在挂载后变为 true 时同样直接跳到最终状态。
  useEffect(() => {
    if (instant) setCursor(steps.length);
  }, [instant, steps.length]);

  const remainingCount = aliveIds.size;
  const done = cursor >= steps.length;
  // 走到最后一步时，答案头像就是唯一幸存者：留在中心并带上金色 / 紫色光环。
  const answerId = done ? (steps.at(-1)?.remainingIds[0] ?? null) : null;
  const answerEntity = answerId
    ? characters.find((character) => character.id === answerId)
    : undefined;
  const answerRarity = answerEntity && "rarity" in answerEntity ? answerEntity.rarity : 5;
  const answerR4 = answerRarity < 5;
  // 原型每一步都把 HUD 首行改成「第 N 猜 · 角色名」，开局是「推理回放 · 开局」。
  const stepLabel = (step: number): string => {
    const frame = steps[step];
    const name = frame
      ? (characters.find((character) => character.id === frame.guessId)?.names[locale] ??
        frame.guessId)
      : "";
    return text.step.replace("{n}", String(step + 1)).replace("{name}", name);
  };
  const lastStep = steps.length - 1;
  const stageLabel = done
    ? (stepLabels?.at(-1) ?? (lastStep >= 0 ? stepLabel(lastStep) : text.title))
    : cursor === 0
      ? (hudLabel ?? text.opening)
      : (stepLabels?.[cursor - 1] ?? stepLabel(cursor - 1));

  const skip = () => {
    // 直接落到最终状态；未执行的步骤定时器由 effect 清理函数收掉。
    setCursor(steps.length);
  };

  return (
    <>
      <div className="hud" role="status" aria-live="polite" data-done={done ? "true" : undefined}>
        <span className="label">{stageLabel}</span>
        <b className="num">{remainingCount}</b>
        <span className="label">{text.remaining}</span>
      </div>
      {done ? null : (
        <button type="button" className="btn sm skip replay-skip" onClick={skip}>
          {text.skip}
        </button>
      )}
      <div
        className="replay-stage cloud"
        aria-hidden="true"
        data-settled={done ? "true" : undefined}
      >
        {characters.map((character, index) => {
          const alive = aliveIds.has(character.id);
          const position = positions.get(character.id) ?? CENTER;
          const style: ReplayStyle = {
            "--replay-x": position.x,
            "--replay-y": position.y,
            "--replay-size": position.size,
            // 原型入场 stagger：每个头像错开 5ms 从舞台中心弹出。
            "--replay-delay": `${Math.min(index * 5, 500)}ms`,
          };
          const isAnswer = character.id === answerId;
          const className = [
            "cav",
            "replay-avatar",
            answerR4 ? "r4" : "r5",
            alive ? null : "is-fallen",
            isAnswer ? "ans" : null,
            isAnswer ? "is-answer" : null,
          ]
            .filter(Boolean)
            .join(" ");
          // 雪碧图可用时用 background-position 取格子，否则回退到逐个头像请求。
          // 用百分比坐标：方块尺寸随螺旋布局变化（答案最终放大到 2.6 倍），
          // 百分比让任意尺寸都正好露出一个格子。
          const spriteCell = sprite ? sprite.cells[character.id] : undefined;
          const spriteStyle =
            sprite && spriteCell !== undefined
              ? {
                  backgroundImage: `url(${sprite.path})`,
                  backgroundSize: `${sprite.columns * 100}% ${sprite.rows * 100}%`,
                  backgroundPosition: `${spritePercent(spriteCell % sprite.columns, sprite.columns)} ${spritePercent(
                    Math.floor(spriteCell / sprite.columns),
                    sprite.rows,
                  )}`,
                }
              : null;
          return (
            <span
              key={character.id}
              className={className}
              data-character-id={character.id}
              data-fallen={alive ? undefined : "true"}
              aria-hidden={alive ? undefined : "true"}
              style={style}
            >
              {spriteStyle ? (
                <span className="replay-avatar-art" style={spriteStyle} />
              ) : (
                <CharacterAvatar
                  character={character}
                  size="small"
                  priority={instant ? alive : index < PRIORITY_COUNT}
                />
              )}
            </span>
          );
        })}
      </div>
    </>
  );
}
