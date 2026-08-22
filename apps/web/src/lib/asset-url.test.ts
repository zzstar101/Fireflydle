import { describe, expect, it } from "vitest";
import { assetUrl, assetUrls } from "./asset-url";

describe("assetUrl", () => {
  it.each([
    ["/assets/foo.png", "https://assets.fireflydle.games/foo.png"],
    ["foo.png", "https://assets.fireflydle.games/foo.png"],
    ["/assets/foo.png?x=1", "https://assets.fireflydle.games/foo.png?x=1"],
  ])("解析逻辑路径 %s", (path, expected) => {
    expect(assetUrl(path, "https://assets.fireflydle.games/")).toBe(expected);
  });

  it("保留完整 URL", () => {
    expect(assetUrl("https://example.com/foo.png", "https://assets.fireflydle.games")).toBe(
      "https://example.com/foo.png",
    );
  });

  it("支持本地 /assets 基址和 trailing slash", () => {
    expect(assetUrl("/assets/foo.png", "/assets/")).toBe("/assets/foo.png");
    expect(assetUrl("foo.png", "http://localhost:5173/assets/")).toBe(
      "http://localhost:5173/assets/foo.png",
    );
  });

  it("批量解析不改变输入顺序", () => {
    expect(assetUrls(["/assets/a.png", "assets/b.webp"], "https://cdn.example")).toEqual([
      "https://cdn.example/a.png",
      "https://cdn.example/b.webp",
    ]);
  });
});
