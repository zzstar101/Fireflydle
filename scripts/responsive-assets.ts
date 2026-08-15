import { createHash } from "node:crypto";
import sharp from "sharp";

export const RESPONSIVE_AVATAR_WIDTHS = [40, 80, 160] as const;
export type ResponsiveAvatarWidth = (typeof RESPONSIVE_AVATAR_WIDTHS)[number];

export interface ResponsiveVariantResult {
  width: ResponsiveAvatarWidth;
  avif: Uint8Array;
  webp: Uint8Array;
  avifBytes: number;
  webpBytes: number;
  avifSha256: string;
  webpSha256: string;
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function generateResponsiveVariants(
  source: Uint8Array,
): Promise<ResponsiveVariantResult[]> {
  return Promise.all(
    RESPONSIVE_AVATAR_WIDTHS.map(async (width) => {
      // 固定中心裁剪、编码质量和 effort，保证同一输入在不同运行中可复现。
      const resized = sharp(Buffer.from(source), { failOn: "error" }).resize(width, width, {
        fit: "cover",
        position: "centre",
      });
      const [avif, webp] = await Promise.all([
        resized.clone().avif({ chromaSubsampling: "4:4:4", effort: 4, quality: 60 }).toBuffer(),
        resized.clone().webp({ effort: 4, quality: 70 }).toBuffer(),
      ]);
      return {
        width,
        avif,
        webp,
        avifBytes: avif.byteLength,
        webpBytes: webp.byteLength,
        avifSha256: digest(avif),
        webpSha256: digest(webp),
      };
    }),
  );
}
