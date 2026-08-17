import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FieldDefinition, Locale } from "@fireflydle/contracts";
import { RulesPanel } from "./RulesPanel";

const fields: FieldDefinition[] = [
  {
    id: "element",
    label: { "zh-CN": "属性", en: "Element", ja: "属性" },
    valueType: "enum",
    comparison: "exact",
    required: true,
  },
  {
    id: "version",
    label: { "zh-CN": "版本", en: "Version", ja: "バージョン" },
    valueType: "number",
    comparison: "direction",
    required: true,
    directional: true,
  },
];

describe("动态规则面板入口", () => {
  it.each([
    ["zh-CN", "查看游戏规则", "当前题池"],
    ["en", "View matching rules", "Current pool"],
    ["ja", "判定ルールを見る", "現在の問題プール"],
  ] as [Locale, string, string][])("保留 %s 入口文案", (locale, open, range) => {
    const markup = renderToStaticMarkup(
      <RulesPanel
        locale={locale}
        title="Rules"
        intro="Compare fields"
        poolSize={42}
        maxAttempts={6}
        fields={fields}
        labels={{
          open,
          close: "Close",
          range,
          guesses: "Guesses",
          fields: "Fields",
          colors: "Colors",
          directions: "Direction",
          example: "Example",
          exact: "Exact",
          closeMatch: "Close",
          miss: "Miss",
          higher: "Higher",
          lower: "Lower",
        }}
      />,
    );
    expect(markup).toContain(open);
    expect(markup).toContain("rules-panel-trigger");
  });
});
