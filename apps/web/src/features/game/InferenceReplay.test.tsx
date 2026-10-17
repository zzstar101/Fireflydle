import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { GameEntitySummary, Locale } from "@fireflydle/contracts";
import { InferenceReplay } from "./InferenceReplay";
import type { InferenceReplayProps, InferenceReplayStep } from "./InferenceReplay";

/**
 * apps/web 的测试跑在 node 环境（没有 jsdom / @testing-library），
 * 仓库里既有的组件测试也一律用 renderToStaticMarkup，
 * 所以这里只覆盖「渲染出来的标记」：候选数量、葵花阵位置、
 * final 的最终状态、可访问性与各语言文案。
 * 定时器推进与 onDone 调用次数需要真实 DOM 才能断言，不在本文件覆盖。
 */

const TOTAL = 92;

function makeCharacter(index: number): GameEntitySummary {
  const id = `c${String(index).padStart(3, "0")}`;
  return {
    id,
    names: { "zh-CN": `角色${index}`, en: `Char ${index}`, ja: `キャラ${index}` },
    aliases: { "zh-CN": [], en: [], ja: [] },
    element: "fire",
    path: "destruction",
    rarity: 5,
    factionId: "faction",
    factionGroupId: "group",
    regionId: "region",
    releaseVersionId: "1.0",
    releaseOrder: index,
    assets: {
      avatarPath: `/avatars/${id}.png`,
      portraitPath: `/avatars/${id}.png`,
      sourceUrl: `https://example.test/${id}.png`,
      sourceUpdatedAt: "2026-01-01T00:00:00.000Z",
      sha256: "0".repeat(64),
      rightsNotice: "test",
    },
  } as unknown as GameEntitySummary;
}

const characters = Array.from({ length: TOTAL }, (_, index) => makeCharacter(index));

const steps: InferenceReplayStep[] = [
  { guessId: "c000", remainingIds: characters.slice(0, 24).map((item) => item.id) },
  { guessId: "c001", remainingIds: ["c010", "c011"] },
  { guessId: "c010", remainingIds: ["c010"] },
];

interface RenderedAvatar {
  id: string;
  /** 离舞台中心的横向偏移，单位 cqmin（min(舞台宽, 舞台高) 的 1%）。 */
  x: number;
  /** 离舞台中心的纵向偏移，单位 cqmin。 */
  y: number;
  /** 该头像的边长声明，例如 `clamp(18.48px, 92.4px, 5.63cqmin)`。 */
  size: string;
  fallen: boolean;
  hidden: boolean;
}

/** 每个头像外层 span 的属性解析，避免依赖整段标记的排列。 */
function parseAvatars(markup: string): RenderedAvatar[] {
  return markup
    .split("<span")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf(">")))
    .filter((tag) => tag.includes("data-character-id="))
    .map((tag) => {
      const id = /data-character-id="([^"]+)"/.exec(tag)?.[1] ?? "";
      const style = /style="([^"]*)"/.exec(tag)?.[1] ?? "";
      return {
        id,
        x: Number(/--replay-x:([-\d.]+)cqmin/.exec(style)?.[1] ?? NaN),
        y: Number(/--replay-y:([-\d.]+)cqmin/.exec(style)?.[1] ?? NaN),
        size: /--replay-size:([^;"]+)/.exec(style)?.[1] ?? "",
        fallen: tag.includes('data-fallen="true"'),
        hidden: tag.includes('aria-hidden="true"'),
      };
    });
}

function render(props: Partial<InferenceReplayProps> = {}) {
  return renderToStaticMarkup(
    <InferenceReplay characters={characters} steps={steps} locale="zh-CN" {...props} />,
  );
}

/**
 * 离舞台中心的归一化距离（cqmin），缺数据时返回 undefined，让断言直接失败。
 * 原型 spiral() 在 y 方向压缩 0.9（葵花阵呈椭圆），这里先还原再量半径。
 */
function radiusOf(avatar: RenderedAvatar | undefined) {
  if (!avatar) return undefined;
  return Math.hypot(avatar.x, avatar.y / 0.9);
}

/**
 * 原型 spiral() 的半径：`r = c * sqrt(i + 0.5)`，`c = R / sqrt(n)`，`R = 0.36 * min(w, h)`，
 * 换成 cqmin 就是 `0.36 * sqrt((i + 0.5) / n) * 100`。
 */
function expectedRadius(index: number, count: number) {
  return 0.36 * Math.sqrt((index + 0.5) / count) * 100;
}

describe("推理回放", () => {
  test("初始候选池每个角色一个头像，计数器显示初始数量", () => {
    const markup = render();
    const avatars = parseAvatars(markup);
    expect(avatars).toHaveLength(TOTAL);
    expect(avatars.map((avatar) => avatar.id)).toEqual(characters.map((item) => item.id));
    expect(markup).toContain("位候选");
    expect(markup).toMatch(/>92<\/b>/);
    // 回放从完整候选池开始：还没有人坠落，跳过按钮可用。
    expect(avatars.every((avatar) => !avatar.fallen)).toBe(true);
    expect(markup).toContain("跳过");
  });

  test("葵花阵：半径按 sqrt(i + 0.5) 递增，最外层贴近舞台半径", () => {
    const avatars = parseAvatars(render());
    // 原型 spiral() 的第一个候选不在正中（r = c * sqrt(0.5)），这一圈半径都大于 0。
    expect(radiusOf(avatars[0])).toBeCloseTo(expectedRadius(0, TOTAL), 2);
    // 最外层 i = N - 1 时半径 ≈ 0.36 * min(舞台宽, 舞台高)，映射到 cqmin 即 35.9。
    const outer = radiusOf(avatars[TOTAL - 1]) ?? 0;
    expect(outer).toBeCloseTo(expectedRadius(TOTAL - 1, TOTAL), 2);
    expect(outer).toBeGreaterThan(35);
    // 半径随序号单调递增：最后一个一定比中间那个离中心更远。
    expect(outer).toBeGreaterThan(radiusOf(avatars[Math.floor(TOTAL / 2)]) ?? 0);
    // 同一池里所有头像共用一个缩放（原型 spiral() 的 s 只由 n 与 R 决定）。
    expect(new Set(avatars.map((avatar) => avatar.size)).size).toBe(1);
  });

  test("final 直接呈现最后一步的存活候选，落败者已坠落", () => {
    const markup = render({ final: true });
    const avatars = parseAvatars(markup);
    expect(avatars).toHaveLength(TOTAL);
    const alive = avatars.filter((avatar) => !avatar.fallen);
    expect(alive.map((avatar) => avatar.id)).toEqual(["c010"]);
    // 只剩一个候选时原型走 n <= 4 的横向一行分支，offset 为 0 所以正好落在舞台中心。
    expect(alive[0]?.x).toBeCloseTo(0, 3);
    expect(alive[0]?.y).toBeCloseTo(0, 3);
    // 落败者留在树里但退出可访问性树。
    const fallen = avatars.filter((avatar) => avatar.fallen);
    expect(fallen).toHaveLength(TOTAL - 1);
    expect(fallen.every((avatar) => avatar.hidden)).toBe(true);
    expect(markup).toMatch(/>1<\/b>/);
    // 已经是最终状态，没有可跳过的内容。
    expect(markup).not.toContain("跳过");
  });

  test("减少动态效果时与 final 一样直接呈现最终状态", () => {
    // 组件在挂载时读 document.documentElement.dataset.motion；
    // node 环境没有 document，这里只补上这一个属性，验证降级分支。
    const original = Reflect.get(globalThis, "document");
    Reflect.set(globalThis, "document", { documentElement: { dataset: { motion: "reduced" } } });
    try {
      const markup = render();
      const alive = parseAvatars(markup).filter((avatar) => !avatar.fallen);
      expect(alive.map((avatar) => avatar.id)).toEqual(["c010"]);
      expect(markup).not.toContain("跳过");
    } finally {
      if (original === undefined) Reflect.deleteProperty(globalThis, "document");
      else Reflect.set(globalThis, "document", original);
    }
  });

  test("舞台是装饰性的，计数器与跳过按钮保留给辅助技术", () => {
    const markup = render();
    expect(markup).toContain('<div class="replay-stage cloud" aria-hidden="true">');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    // 跳过按钮沿用全局 .btn.sm 的外观（原型 .skip），类名保留 replay-skip 供样式与测试挂钩。
    expect(markup).toMatch(/<button type="button" class="[^"]*\breplay-skip\b[^"]*">/);
    expect(markup).toContain("推理回放");
  });

  test("给了雪碧图就用取格渲染，不再逐个渲染头像组件", () => {
    const cells: Record<string, number> = {};
    characters.forEach((character, index) => {
      cells[character.id] = index;
    });
    const markup = render({
      sprite: {
        path: "/assets/character-art/replay-sprite-test.webp",
        size: 64,
        columns: 10,
        rows: 10,
        cells,
      },
    });
    expect(markup).not.toContain("character-avatar");
    // 百分比取格：10 列 10 行 → 1000%×1000%；第 12 个候选（index 11）落在第 2 行第 2 列 → 1/9。
    expect(markup).toContain("background-size:1000% 1000%");
    expect(markup).toContain("background-position:11.1111% 11.1111%");
    expect(parseAvatars(markup)).toHaveLength(TOTAL);
  });

  test("没有雪碧图时回退到逐个头像组件", () => {
    expect(render()).toContain("character-avatar");
  });

  test.each([
    ["zh-CN", "跳过"],
    ["ja", "スキップ"],
    ["en", "Skip"],
  ] as const)("%s 语言给出跳过文案", (locale: Locale, label: string) => {
    expect(render({ locale })).toContain(label);
  });
});
