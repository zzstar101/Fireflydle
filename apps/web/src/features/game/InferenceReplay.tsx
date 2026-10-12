import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, JSX } from "react";
import type { GameEntitySummary, Locale } from "@fireflydle/contracts";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import type { CharacterSprite } from "../../lib/character-art";
import "./inference-replay.css";

/** 黄金角（弧度），葵花阵的相邻夹角。 */
const GOLDEN_ANGLE = 2.399963229728653;
/** 每一猜之间的停顿，给坠落与重新排布留出时间。 */
const STEP_MS = 850;
/** 只有最前面这几个头像立即加载，避免 92 张图同时抢带宽。 */
const PRIORITY_COUNT = 12;
/** 头像在舞台上的显示边长，与 CharacterAvatar 的 size="small" 保持一致。 */
const AVATAR_PX = 38;

const COPY = {
  "zh-CN": {
    title: "推理回放",
    remaining: "剩余候选",
    skip: "跳过",
  },
  ja: {
    title: "推理リプレイ",
    remaining: "残り候補",
    skip: "スキップ",
  },
  en: {
    title: "Inference replay",
    remaining: "Candidates left",
    skip: "Skip",
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
  /** true = 当天第二次打开结算，直接渲染最终状态，不播动画 */
  final?: boolean;
  /** 动画播完或被跳过后调用一次 */
  onDone?: () => void;
}

/** 位置写在自定义属性里（cqw / cqh = 舞台的 1%），只喂给 transform，不参与布局。 */
type ReplayStyle = CSSProperties & Record<`--${string}`, string>;

interface ReplayPosition {
  left: number;
  top: number;
}

/** 居中的兜底位置：正常不会用到。 */
const CENTER: ReplayPosition = { left: 50, top: 50 };

/** 葵花阵（Fermat 螺旋）：最外层半径刚好是舞台半径，即 25% 处。 */
function phyllotaxis(index: number, count: number): ReplayPosition {
  const radius = 0.5 * Math.sqrt(index / (count - 1 || 1));
  const theta = index * GOLDEN_ANGLE;
  return {
    left: 50 + 50 * radius * Math.cos(theta),
    top: 50 + 50 * radius * Math.sin(theta),
  };
}

/** 三位小数足够定位，同时让服务端渲染的标记稳定可比。 */
function trim(value: number): number {
  return Number(value.toFixed(3));
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

export function InferenceReplay({
  characters,
  steps,
  locale,
  final = false,
  sprite = null,
  onDone,
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
      pool.forEach((id, index) => map.set(id, phyllotaxis(index, pool.length)));
    }
    return map;
  }, [pools, cursorIndex]);

  // 回放队列：每 850ms 推进一猜，走到最后就交回给父组件（只会调用一次）。
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
  const lone = remainingCount === 1;

  const skip = () => {
    // 直接落到最终状态；未执行的步骤定时器由 effect 清理函数收掉。
    setCursor(steps.length);
  };

  return (
    <section className="replay" aria-label={text.title}>
      <div className="replay-hud">
        <p className="replay-counter" role="status" aria-live="polite">
          <span>{text.remaining}</span>
          <b className="num">{remainingCount}</b>
        </p>
        {done ? null : (
          <button type="button" className="replay-skip" onClick={skip}>
            {text.skip}
          </button>
        )}
      </div>
      <div className="replay-stage" aria-hidden="true">
        {characters.map((character, index) => {
          const alive = aliveIds.has(character.id);
          const position = positions.get(character.id) ?? CENTER;
          const style: ReplayStyle = {
            "--replay-left": `${trim(position.left)}cqw`,
            "--replay-top": `${trim(position.top)}cqh`,
            "--replay-delay": `${(index * 37) % 90}ms`,
          };
          const className = [
            "replay-avatar",
            alive ? null : "is-fallen",
            alive && lone ? "is-lone" : null,
          ]
            .filter(Boolean)
            .join(" ");
          // 雪碧图可用时用 background-position 取格子，否则回退到逐个头像请求。
          const spriteCell = sprite ? sprite.cells[character.id] : undefined;
          const spriteStyle =
            sprite && spriteCell !== undefined
              ? {
                  backgroundImage: `url(${sprite.path})`,
                  backgroundSize: `${sprite.columns * AVATAR_PX}px ${sprite.rows * AVATAR_PX}px`,
                  backgroundPosition: `${-(spriteCell % sprite.columns) * AVATAR_PX}px ${
                    -Math.floor(spriteCell / sprite.columns) * AVATAR_PX
                  }px`,
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
    </section>
  );
}
