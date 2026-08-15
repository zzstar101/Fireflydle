import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import manifest from "../apps/web/public/assets/manifest.json";
import { generateResponsiveVariants } from "./responsive-assets";

const publicRoot = new URL("../apps/web/public/", import.meta.url);

describe("响应式头像发布物", () => {
  it("manifest 为每个角色提供三档 AVIF/WebP，并校验本地字节哈希", async () => {
    const files = manifest.files as Array<{
      path: string;
      bytes: number;
      sha256: string;
      width?: number;
      format?: string;
    }>;
    const variants = files.filter((file) => file.width !== undefined);
    expect(variants).toHaveLength(90 * 3 * 2);
    expect(new Set(variants.map((file) => file.width))).toEqual(new Set([40, 80, 160]));
    expect(new Set(variants.map((file) => file.format))).toEqual(new Set(["avif", "webp"]));

    for (const file of variants) {
      const bytes = await readFile(new URL(`.${file.path}`, publicRoot));
      expect(bytes.byteLength).toBe(file.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(file.sha256);
    }
  });

  it("代表性搜索列表使用现代格式后至少减少一半传输量", () => {
    const files = manifest.files as Array<{
      path: string;
      bytes: number;
      width?: number;
      format?: string;
      roles?: string[];
    }>;
    const base = files.filter((file) => !file.width && file.roles?.includes("avatar")).slice(0, 10);
    const modern = base.map((file) => {
      const stem = file.path
        .replace(/\.png$/, "")
        .replace(/\.webp$/, "")
        .replace(/\.avif$/, "");
      return files.find(
        (candidate) => candidate.path.startsWith(`${stem}-40.`) && candidate.format === "avif",
      );
    });
    expect(modern.every(Boolean)).toBe(true);
    expect(modern.reduce((sum, file) => sum + (file?.bytes ?? 0), 0)).toBeLessThanOrEqual(
      base.reduce((sum, file) => sum + file.bytes, 0) * 0.5,
    );
  });

  it("相同输入重复生成得到相同的现代格式哈希", async () => {
    const source = await readFile(
      new URL(
        "../apps/web/public/assets/characters/firefly-avatar-95f3c017e490.png",
        import.meta.url,
      ),
    );
    const first = await generateResponsiveVariants(source);
    const second = await generateResponsiveVariants(source);
    expect(first.map((variant) => variant.avifSha256)).toEqual(
      second.map((variant) => variant.avifSha256),
    );
    expect(first.map((variant) => variant.webpSha256)).toEqual(
      second.map((variant) => variant.webpSha256),
    );
  });
});
