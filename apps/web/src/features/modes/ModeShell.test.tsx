import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Locale } from "@fireflydle/contracts";
import { getDefaultMode } from "./mode-registry";
import { ModeShell } from "./ModeShell";

const locales: readonly Locale[] = ["zh-CN", "en", "ja"];

describe("模式页面外壳", () => {
  it.each(locales)("用 %s 不渲染独立模式活动导航", (locale) => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/playable/practice"]}>
        <ModeShell mode={getDefaultMode()} locale={locale}>
          <main>Practice page</main>
        </ModeShell>
      </MemoryRouter>,
    );

    expect(markup).toContain("Practice page");
    expect(markup).not.toContain("mode-shell-navigation");
    expect(markup).not.toContain('href="/playable/practice"');
  });
});
