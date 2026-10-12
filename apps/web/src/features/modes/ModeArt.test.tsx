import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ModeArt, type ModeArtKind } from "./ModeArt";

const kinds: readonly ModeArtKind[] = [
  "practice",
  "endless",
  "weekly",
  "duel",
  "portrait",
  "currency-wars",
  "aeon",
];

/** 打点类图元；svg 内不会出现 fill 子元素，直接数标签即可。 */
const DRAWING_ELEMENT = /<(?:path|circle|ellipse|line|polyline|polygon|rect)\b/g;

function renderKind(kind: ModeArtKind): string {
  return renderToStaticMarkup(<ModeArt kind={kind} />);
}

describe("ModeArt 玩法线稿", () => {
  it.each(kinds)("%s 渲染装饰性 96×96 内联 SVG 线稿", (kind) => {
    const markup = renderKind(kind);

    expect(markup).toContain("<svg");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('viewBox="0 0 96 96"');
    expect(markup).toContain('focusable="false"');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).toContain('stroke-width="2"');
    expect(markup).toContain(`data-mode-art="${kind}"`);

    const drawn = markup.match(DRAWING_ELEMENT) ?? [];
    expect(drawn.length).toBeGreaterThanOrEqual(3);
  });

  it("七种玩法的图形两两不同", () => {
    const markups = kinds.map((kind) => renderKind(kind));
    expect(new Set(markups).size).toBe(kinds.length);
  });

  it("接受调用方类名且保留 kind 类名", () => {
    const markup = renderToStaticMarkup(<ModeArt kind="duel" className="mode-card-art" />);
    expect(markup).toContain('class="mode-art mode-art--duel mode-card-art"');
  });

  it("没有动画元素时也保持静态几何", () => {
    // 结构上的光点 / 轨道节点必须始终存在，动画只由 CSS 提供。
    expect(renderKind("endless")).toContain("mode-art__dot");
    expect(renderKind("duel")).toContain("mode-art__orbit-a");
    expect(renderKind("weekly")).toContain("mode-art__ring--active");
  });
});
