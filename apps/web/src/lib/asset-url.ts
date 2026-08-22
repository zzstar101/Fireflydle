const LOGICAL_PREFIX = "/assets/";
const DEFAULT_PRODUCTION_BASE = "https://assets.fireflydle.games";

function configuredBaseUrl(): string {
  const configured = import.meta.env.VITE_ASSET_BASE_URL?.trim();
  if (configured) return configured;
  return import.meta.env.DEV ? "/assets" : DEFAULT_PRODUCTION_BASE;
}

function isAbsoluteUrl(value: string): boolean {
  return /^(?:https?:|data:|blob:)/i.test(value);
}

/** 将 manifest 中的逻辑路径解析为本地开发或生产 CDN URL。 */
export function assetUrl(path: string, baseUrl = configuredBaseUrl()): string {
  const value = path.trim();
  if (!value || isAbsoluteUrl(value)) return value;
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  const relativePath = normalizedPath.startsWith(LOGICAL_PREFIX)
    ? normalizedPath.slice(LOGICAL_PREFIX.length)
    : normalizedPath.slice(1);
  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  if (!normalizedBase) return `/${relativePath}`;
  if (normalizedBase === "/assets") return `/assets/${relativePath}`;
  if (normalizedBase.endsWith("/assets")) return `${normalizedBase}/${relativePath}`;
  return `${normalizedBase}/${relativePath}`;
}

export function assetUrls(paths: readonly string[], baseUrl?: string): string[] {
  return paths.map((path) => assetUrl(path, baseUrl));
}
