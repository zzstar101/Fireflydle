import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ModeArt, type ModeArtKind } from "./ModeArt";

const cardKinds: readonly ModeArtKind[] = ["practice", "endless", "weekly", "duel"];
const glyphKinds: readonly ModeArtKind[] = ["portrait", "currency-wars", "aeon"];
const kinds = [...cardKinds, ...glyphKinds];

const DRAWING_ELEMENT = /<(?:path|circle|ellipse|line|polyline|polygon|rect)\b/g;

function renderKind(kind: ModeArtKind, weeklyDone?: number): string {
  return renderToStaticMarkup(<ModeArt kind={kind} weeklyDone={weeklyDone} />);
}

describe("ModeArt 玩法插画", () => {
  it.each(cardKinds)("%s 渲染 200×200 原型插画", (kind) => {
    const markup = renderKind(kind);
    expect(markup).toContain('viewBox="0 0 200 200"');
    expect(markup).toContain("ill-svg");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain(`data-mode-art="${kind}"`);
    expect((markup.match(DRAWING_ELEMENT) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it.each(glyphKinds)("%s 渲染 48×48 更多玩法小图标", (kind) => {
    const markup = renderKind(kind);
    expect(markup).toContain('viewBox="0 0 48 48"');
    expect(markup).toContain("mode-glyph");
    expect(markup).toContain('class="acc');
  });

  it("七种玩法的图形两两不同", () => {
    expect(new Set(kinds.map((kind) => renderKind(kind))).size).toBe(kinds.length);
  });

  it("接受调用方类名", () => {
    const markup = renderToStaticMarkup(<ModeArt kind="duel" className="mode-card-art" />);
    expect(markup).toContain("mode-art--duel mode-card-art");
  });

  it("周赛进度环按已完成题数点亮", () => {
    const markup = renderKind("weekly", 2);
    expect(markup.match(/class="seg on"/g)).toHaveLength(2);
    expect(markup.match(/class="seg now"/g)).toHaveLength(1);
    expect(renderKind("weekly", 5)).not.toContain('class="seg now"');
  });

  it("同页多份插画的渐变 id 不冲突", () => {
    const markup = renderToStaticMarkup(
      <>
        <ModeArt kind="practice" />
        <ModeArt kind="practice" />
      </>,
    );
    const ids = [...markup.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
