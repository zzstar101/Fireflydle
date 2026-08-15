import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CharacterSummary } from "@fireflydle/contracts";
import { CharacterAvatar, getCharacterImageSources } from "./CharacterAvatar";

const character = {
  id: "firefly",
  names: { "zh-CN": "流萤", en: "Firefly", ja: "ホタル" },
  element: "fire",
  assets: {
    avatarPath: "/assets/characters/firefly-avatar.png",
    portraitPath: "/assets/characters/firefly-avatar.png",
    sourceUrl: "https://example.com/firefly.png",
    sourceUpdatedAt: "2026-08-02T00:00:00.000Z",
    sha256: "a".repeat(64),
    rightsNotice: "test",
    responsive: [
      {
        width: 40,
        avifPath: "/assets/characters/firefly-avatar-40.avif",
        webpPath: "/assets/characters/firefly-avatar-40.webp",
        avifBytes: 100,
        webpBytes: 120,
        avifSha256: "b".repeat(64),
        webpSha256: "c".repeat(64),
      },
      {
        width: 80,
        avifPath: "/assets/characters/firefly-avatar-80.avif",
        webpPath: "/assets/characters/firefly-avatar-80.webp",
        avifBytes: 200,
        webpBytes: 240,
        avifSha256: "d".repeat(64),
        webpSha256: "e".repeat(64),
      },
      {
        width: 160,
        avifPath: "/assets/characters/firefly-avatar-160.avif",
        webpPath: "/assets/characters/firefly-avatar-160.webp",
        avifBytes: 400,
        webpBytes: 480,
        avifSha256: "f".repeat(64),
        webpSha256: "0".repeat(64),
      },
    ],
  },
} as unknown as CharacterSummary;

describe("响应式头像来源", () => {
  it("按真实像素尺寸选择最近的不小于目标的变体并生成 srcset", () => {
    expect(getCharacterImageSources(character, 38)).toMatchObject({
      width: 40,
      avifPath: "/assets/characters/firefly-avatar-40.avif",
      webpPath: "/assets/characters/firefly-avatar-40.webp",
      fallbackPath: "/assets/characters/firefly-avatar.png",
      avifSrcSet: expect.stringContaining("40w"),
      webpSrcSet: expect.stringContaining("160w"),
    });
  });

  it("兼容未生成响应式数据的旧摘要", () => {
    const legacy = { ...character, assets: { ...character.assets, responsive: undefined } };
    expect(getCharacterImageSources(legacy, 88)).toMatchObject({
      width: 88,
      fallbackPath: "/assets/characters/firefly-avatar.png",
      avifPath: undefined,
      webpPath: undefined,
    });
  });

  it("渲染现代格式 source、PNG 回退、实际尺寸和优先级属性", () => {
    const markup = renderToStaticMarkup(<CharacterAvatar character={character} size="small" />);
    expect(markup).toContain('type="image/avif"');
    expect(markup).toContain('type="image/webp"');
    expect(markup).toContain('sizes="38px"');
    expect(markup).toContain('src="/assets/characters/firefly-avatar.png"');
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('fetchPriority="auto"');

    const priorityMarkup = renderToStaticMarkup(
      <CharacterAvatar character={character} size="large" priority />,
    );
    expect(priorityMarkup).toContain('sizes="88px"');
    expect(priorityMarkup).toContain('loading="eager"');
    expect(priorityMarkup).toContain('fetchPriority="high"');
  });
});
