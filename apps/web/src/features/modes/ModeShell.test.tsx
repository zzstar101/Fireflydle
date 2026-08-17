import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Locale } from "@fireflydle/contracts";
import { getDefaultMode } from "./mode-registry";
import { ModeShell } from "./ModeShell";

const translations: Record<Locale, readonly string[]> = {
  "zh-CN": ["普通角色", "每日题", "练习", "对战"],
  en: ["Characters", "Daily", "Practice", "Duel"],
  ja: ["キャラクター", "デイリー", "練習", "対戦"],
};

describe("模式页面外壳", () => {
  it.each(Object.entries(translations) as [Locale, readonly string[]][])(
    "用 %s 只显示已注册模式和当前支持的活动",
    (locale, labels) => {
      const markup = renderToStaticMarkup(
        <MemoryRouter initialEntries={["/playable/practice"]}>
          <ModeShell mode={getDefaultMode()} locale={locale}>
            <main>Practice page</main>
          </ModeShell>
        </MemoryRouter>,
      );

      expect({
        labels: labels.map((label) => markup.includes(label)),
        paths: ["daily", "practice", "duel"].map((activity) =>
          markup.includes(`href="/playable/${activity}"`),
        ),
        activeActivity: markup.includes('aria-current="page"'),
        motionScope: markup.includes('data-motion-scope="mode-navigation"'),
        unavailableModes: ["NPC", "Currency Wars", "Aeons"].some((label) => markup.includes(label)),
      }).toEqual({
        labels: [true, true, true, true],
        paths: [true, true, true],
        activeActivity: true,
        motionScope: true,
        unavailableModes: false,
      });
    },
  );
});
