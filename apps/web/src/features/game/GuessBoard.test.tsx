import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { FieldDefinition, GuessResult } from "@fireflydle/contracts";

const storage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
globalThis.window = { localStorage: storage, navigator: { language: "zh-CN" } } as never;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { language: "zh-CN" },
});
globalThis.localStorage = storage as never;

await import("../../i18n");
const { GuessBoard } = await import("./GuessBoard");

const character = {
  id: "test-character",
  names: { "zh-CN": "测试角色", en: "Test Character", ja: "テストキャラ" },
  aliases: { "zh-CN": [], en: [], ja: [] },
  element: "fire" as const,
  path: "harmony" as const,
  rarity: 5 as const,
  factionId: "astral-express",
  factionGroupId: "astral-express",
  releaseVersionId: "3.0",
  releaseOrder: 16,
  assets: {
    avatarPath: "/characters/test.webp",
    portraitPath: "/characters/test.webp",
    sourceUrl: "https://example.com/test",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    sha256: "a".repeat(64),
    rightsNotice: "仅用于测试",
  },
};

const fields: FieldDefinition[] = [
  {
    id: "path",
    label: { "zh-CN": "命途", en: "Path", ja: "運命" },
    valueType: "enum",
    comparison: "exact",
    required: true,
  },
  {
    id: "element",
    label: { "zh-CN": "属性", en: "Element", ja: "属性" },
    valueType: "enum",
    comparison: "exact",
    required: true,
  },
  {
    id: "missing-field",
    label: { "zh-CN": "缺失字段", en: "Missing", ja: "欠落" },
    valueType: "enum",
    comparison: "exact",
    required: false,
  },
  {
    id: "rarity",
    label: { "zh-CN": "稀有度", en: "Rarity", ja: "レアリティ" },
    valueType: "number",
    comparison: "direction",
    required: true,
  },
];

const guess: GuessResult = {
  character,
  cells: [
    { field: "path", state: "exact", direction: "none" },
    { field: "element", state: "close", direction: "higher" },
    { field: "unavailable-field", state: "unavailable", direction: "none" },
    { field: "rarity", state: "miss", direction: "lower" },
  ],
  isCorrect: false,
  guessedAt: "2026-08-16T00:00:00.000Z",
};

describe("动态 GuessBoard", () => {
  test("按题池顺序渲染三语标签，并显式展示状态与方向", () => {
    const markup = renderToStaticMarkup(
      <GuessBoard guesses={[guess]} locale="zh-CN" fields={fields} animateLatest />,
    );

    expect(markup.indexOf(">命途<")).toBeLessThan(markup.indexOf(">属性<"));
    expect(markup).toContain(">一致<");
    expect(markup).toContain(">接近<");
    expect(markup).toContain(">不可用<");
    expect(markup).toContain("↑ 更晚");
    expect(markup).toContain('aria-label="属性: 火; 接近; ↑ 更晚"');
    expect(markup).toContain("state-unavailable");
    expect(markup).toContain("guess-row is-latest is-incorrect");
    expect(markup).toContain("state-exact direction-none");
    expect(markup).toContain("state-close direction-higher");
    expect(markup).toContain("state-miss direction-lower");
    expect(markup).toContain("↓ 更早");
    expect(markup).toContain("--cell-delay:90ms");
    expect(markup).toContain("--cell-delay:195ms");
  });

  test("只将最新一次猜测标记为一次性反馈行", () => {
    const previousGuess = {
      ...guess,
      guessedAt: "2026-08-15T00:00:00.000Z",
    };
    const markup = renderToStaticMarkup(
      <GuessBoard guesses={[previousGuess, guess]} locale="zh-CN" fields={fields} animateLatest />,
    );

    expect(markup.match(/is-latest/g)).toHaveLength(1);
    expect(markup.match(/is-incorrect/g)).toHaveLength(2);
  });

  test("旧多人结果缺少字段定义时使用普通角色六列兼容规则", () => {
    const markup = renderToStaticMarkup(<GuessBoard guesses={[]} locale="zh-CN" />);

    expect(markup).toContain(">属性<");
    expect(markup).toContain(">版本<");
    expect(markup).toContain(">地区<");
  });
});
