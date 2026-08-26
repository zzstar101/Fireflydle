import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const assetsDir = join(root, "apps", "web", "public", "assets");
// 直接调用工作区内的 Wrangler，避免并发 bunx 进程争用临时安装缓存。
const wranglerEntry = join(root, "apps", "api", "node_modules", "wrangler", "bin", "wrangler.js");
await mkdir(join(root, "tmp"), { recursive: true });
const probeDir = await mkdtemp(join(root, "tmp", "r2-probe-"));
const bucket = process.env.R2_BUCKET_NAME?.trim();
if (!bucket) throw new Error("R2_BUCKET_NAME 未配置。");
if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error("CLOUDFLARE_API_TOKEN 未配置。");
if (!process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error("CLOUDFLARE_ACCOUNT_ID 未配置。");

const mimeTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

async function filesIn(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await filesIn(path)));
    else result.push(path);
  }
  return result;
}

function runWrangler(
  args: string[],
  options: { logStderr?: boolean } = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [wranglerEntry, ...args], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code && stderr && options.logStderr !== false) process.stderr.write(stderr);
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });
  });
}

function isHashedAsset(key: string): boolean {
  return /(?:-[a-f0-9]{10,}|_[a-f0-9]{10,})(?:-\d+)?\.[a-z0-9]+$/i.test(key);
}

const files = (await filesIn(assetsDir)).filter(
  (path) => !path.endsWith("manifest.json") && !path.endsWith("manifest.sha256"),
);
const requestedConcurrency = Number.parseInt(process.env.R2_UPLOAD_CONCURRENCY ?? "8", 10);
const concurrency = Number.isFinite(requestedConcurrency)
  ? Math.min(Math.max(requestedConcurrency, 1), 16)
  : 8;
let uploaded = 0;
let skipped = 0;

async function syncFile(file: string): Promise<void> {
  const key = relative(assetsDir, file).replaceAll("\\", "/");
  const extension = extname(key).toLowerCase();
  const hashed = isHashedAsset(key);
  const cacheControl = hashed
    ? "public, max-age=31536000, immutable"
    : "public, max-age=60, stale-while-revalidate=300";
  const probePath = join(probeDir, key.replaceAll("/", "_"));
  const exists =
    hashed &&
    (
      await runWrangler(
        ["r2", "object", "get", `${bucket}/${key}`, `--file=${probePath}`, "--remote"],
        { logStderr: false },
      )
    ).code === 0;
  if (exists) {
    skipped += 1;
    return;
  }
  const args = [
    "r2",
    "object",
    "put",
    `${bucket}/${key}`,
    `--file=${file}`,
    "--remote",
    `--cache-control=${cacheControl}`,
  ];
  const mimeType = mimeTypes[extension];
  if (mimeType) args.push(`--content-type=${mimeType}`);
  const result = await runWrangler(args);
  if (result.code !== 0) {
    const hint = result.stderr.includes("403")
      ? "请确认仓库 Secret CLOUDFLARE_API_TOKEN 对 CLOUDFLARE_ACCOUNT_ID 拥有 R2 Object Read & Write 权限，且 Token 尚未过期。"
      : "请检查仓库中的 Cloudflare 账号、Token 和 R2_BUCKET_NAME 配置。";
    throw new Error(`R2 上传失败：${key}。${hint}`);
  }
  uploaded += 1;
  console.log(`已上传 ${key}`);
}

try {
  let nextIndex = 0;
  let firstError: unknown;
  const worker = async (): Promise<void> => {
    while (!firstError) {
      const index = nextIndex++;
      if (index >= files.length) return;
      try {
        await syncFile(files[index]);
      } catch (error) {
        firstError ??= error;
        return;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()));
  if (firstError) throw firstError;
} finally {
  await rm(probeDir, { recursive: true, force: true });
}
console.log(`R2 同步完成：上传 ${uploaded}，跳过 ${skipped}。`);
