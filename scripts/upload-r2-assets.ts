import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const assetsDir = join(root, "apps", "web", "public", "assets");
const manifestPath = join(assetsDir, "manifest.json");

// 直接调用工作区内 Wrangler，避免并发 bunx 进程争用临时安装缓存。
const wranglerEntry = join(
  root,
  "apps",
  "api",
  "node_modules",
  "wrangler",
  "bin",
  "wrangler.js",
);

const bucket = process.env.R2_BUCKET_NAME?.trim();

if (!bucket) {
  throw new Error("R2_BUCKET_NAME 未配置。");
}

if (!process.env.CLOUDFLARE_API_TOKEN) {
  throw new Error("CLOUDFLARE_API_TOKEN 未配置。");
}

if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID 未配置。");
}

const STATE_KEY = "_meta/assets-sync-state.json";
const STATE_SCHEMA_VERSION = 1;

type ManifestFile = {
  path: string;
  bytes: number;
  sha256: string;
  mimeType: string;
};

type AssetManifest = {
  schemaVersion?: number;
  files: ManifestFile[];
};

type SyncStateFile = {
  sha256: string;
  bytes: number;
};

type SyncState = {
  schemaVersion: number;
  files: Record<string, SyncStateFile>;
};

type WranglerResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type UploadEntry = {
  key: string;
  localPath: string;
  bytes: number;
  sha256: string;
  mimeType: string;
};

/**
 * 执行项目内 Wrangler。
 */
function runWrangler(
  args: string[],
  options: {
    logStderr?: boolean;
  } = {},
): Promise<WranglerResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [wranglerEntry, ...args], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      const exitCode = code ?? 1;

      if (exitCode !== 0 && stderr && options.logStderr !== false) {
        process.stderr.write(stderr);
      }

      resolvePromise({
        code: exitCode,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * manifest 使用 /assets/foo/bar.webp，
 * R2 中实际 key 使用 foo/bar.webp。
 */
function manifestPathToR2Key(path: string): string {
  const prefix = "/assets/";

  if (!path.startsWith(prefix)) {
    throw new Error(`非法 asset manifest 路径：${path}`);
  }

  const key = path.slice(prefix.length);

  if (!key || key.includes("..") || key.startsWith("/")) {
    throw new Error(`非法 R2 object key：${path}`);
  }

  return key;
}

/**
 * 本地素材绝对路径。
 */
function manifestPathToLocalPath(path: string): string {
  return join(assetsDir, manifestPathToR2Key(path));
}

/**
 * 判断资源名是否包含 content hash。
 *
 * 例如：
 *   firefly-aabbccddeeff.webp
 *   firefly_aabbccddeeff-160.avif
 */
function isHashedAsset(key: string): boolean {
  return /(?:-[a-f0-9]{10,}|_[a-f0-9]{10,})(?:-\d+)?\.[a-z0-9]+$/i.test(
    key,
  );
}

/**
 * hashed asset 可以永久缓存；
 * 非 hashed asset 保持短缓存。
 */
function getCacheControl(key: string): string {
  if (isHashedAsset(key)) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=60, stale-while-revalidate=300";
}

/**
 * 读取并验证本地 manifest。
 *
 * 真正的 SHA256 内容验证已经由 assets:validate 负责，
 * 这里主要确保上传脚本拿到的结构正常。
 */
async function loadManifest(): Promise<AssetManifest> {
  const raw = await readFile(manifestPath, "utf8");

  let manifest: AssetManifest;

  try {
    manifest = JSON.parse(raw) as AssetManifest;
  } catch (error) {
    throw new Error(
      `无法解析 assets manifest：${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!Array.isArray(manifest.files)) {
    throw new Error("assets/manifest.json 缺少 files 数组。");
  }

  if (manifest.files.length === 0) {
    throw new Error("assets/manifest.json 没有可上传素材。");
  }

  const seen = new Set<string>();

  for (const entry of manifest.files) {
    if (
      typeof entry.path !== "string" ||
      typeof entry.sha256 !== "string" ||
      typeof entry.bytes !== "number" ||
      typeof entry.mimeType !== "string"
    ) {
      throw new Error(`assets manifest 存在非法记录：${JSON.stringify(entry)}`);
    }

    if (!/^[a-f0-9]{64}$/i.test(entry.sha256)) {
      throw new Error(`assets manifest SHA256 非法：${entry.path}`);
    }

    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0) {
      throw new Error(`assets manifest 文件大小非法：${entry.path}`);
    }

    const key = manifestPathToR2Key(entry.path);

    if (seen.has(key)) {
      throw new Error(`assets manifest 存在重复路径：${entry.path}`);
    }

    seen.add(key);
  }

  return manifest;
}

/**
 * 从 R2 读取上一次成功部署的同步状态。
 *
 * state 不存在：
 *   视为首次部署，返回空状态。
 *
 * state 存在但损坏：
 *   直接失败。
 *
 * 这里故意不把损坏的 state 当空状态，
 * 避免状态异常时静默触发一次无法解释的全量覆盖。
 */
async function loadRemoteState(tempDir: string): Promise<SyncState> {
  const statePath = join(tempDir, "remote-assets-sync-state.json");

  const result = await runWrangler(
    [
      "r2",
      "object",
      "get",
      `${bucket}/${STATE_KEY}`,
      `--file=${statePath}`,
      "--remote",
    ],
    {
      logStderr: false,
    },
  );

  if (result.code !== 0) {
  const stderr = result.stderr.toLowerCase();

  const looksMissing =
    stderr.includes("404") ||
    stderr.includes("not found") ||
    stderr.includes("no such");

  if (!looksMissing) {
    throw new Error(
      `无法读取 R2 同步状态 ${STATE_KEY}：${result.stderr.trim()}`,
    );
  }

  console.log("R2 同步状态尚不存在，执行首次全量同步。");

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    files: {},
  };
}

  let state: SyncState;

  try {
    const raw = await readFile(statePath, "utf8");
    state = JSON.parse(raw) as SyncState;
  } catch (error) {
    throw new Error(
      `R2 同步状态无法解析：${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (state.schemaVersion !== STATE_SCHEMA_VERSION) {
    throw new Error(
      `不支持的 R2 同步状态版本：${state.schemaVersion}，期望 ${STATE_SCHEMA_VERSION}。`,
    );
  }

  if (
    !state.files ||
    typeof state.files !== "object" ||
    Array.isArray(state.files)
  ) {
    throw new Error("R2 同步状态中的 files 非法。");
  }

  return state;
}

/**
 * 将 manifest 转换为实际上传条目。
 */
function createUploadEntries(manifest: AssetManifest): UploadEntry[] {
  return manifest.files.map((entry) => {
    const key = manifestPathToR2Key(entry.path);

    return {
      key,
      localPath: manifestPathToLocalPath(entry.path),
      bytes: entry.bytes,
      sha256: entry.sha256.toLowerCase(),
      mimeType: entry.mimeType,
    };
  });
}

/**
 * 判断这个 asset 与上一次成功同步的版本是否完全一致。
 */
function isUnchanged(entry: UploadEntry, state: SyncState): boolean {
  const remote = state.files[entry.key];

  if (!remote) {
    return false;
  }

  return (
    remote.sha256.toLowerCase() === entry.sha256 &&
    remote.bytes === entry.bytes
  );
}

/**
 * 上传单个 R2 object。
 */
async function uploadAsset(entry: UploadEntry): Promise<void> {
  const cacheControl = getCacheControl(entry.key);

  const args = [
    "r2",
    "object",
    "put",
    `${bucket}/${entry.key}`,
    `--file=${entry.localPath}`,
    "--remote",
    `--cache-control=${cacheControl}`,
    `--content-type=${entry.mimeType}`,
  ];

  const result = await runWrangler(args);

  if (result.code === 0) {
    return;
  }

  const hint = result.stderr.includes("403")
    ? "请确认仓库 Secret CLOUDFLARE_API_TOKEN 对 CLOUDFLARE_ACCOUNT_ID 拥有 R2 Object Read & Write 权限，且 Token 尚未过期。"
    : "请检查 Cloudflare Account ID、API Token、R2_BUCKET_NAME 和 Wrangler 配置。";

  throw new Error(`R2 上传失败：${entry.key}。${hint}`);
}

/**
 * 并发执行上传任务。
 *
 * 一旦有任务失败：
 * - 不再领取新的任务
 * - 等待已经开始的任务结束
 * - 最终抛出第一个错误
 *
 * 最重要的是：调用方不会更新 sync state。
 */
async function uploadWithConcurrency(
  entries: UploadEntry[],
  concurrency: number,
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  let nextIndex = 0;
  let firstError: unknown;

  const worker = async (): Promise<void> => {
    while (!firstError) {
      const index = nextIndex++;

      if (index >= entries.length) {
        return;
      }

      const entry = entries[index];

      try {
        await uploadAsset(entry);
        console.log(`已上传 ${entry.key}`);
      } catch (error) {
        firstError ??= error;
        return;
      }
    }
  };

  const workerCount = Math.min(concurrency, entries.length);

  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  );

  if (firstError) {
    throw firstError;
  }
}

/**
 * 根据当前 manifest 构造新的完整同步状态。
 *
 * 注意这里不是 previousState + changed files，
 * 而是直接以当前 manifest 作为 source of truth。
 *
 * 旧 asset 不会从 R2 删除，
 * 但它们会从 current state 中消失。
 */
function createNextState(entries: UploadEntry[]): SyncState {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    files: Object.fromEntries(
      entries.map((entry) => [
        entry.key,
        {
          sha256: entry.sha256,
          bytes: entry.bytes,
        },
      ]),
    ),
  };
}

/**
 * 所有 asset PUT 成功后，最后更新远端同步状态。
 */
async function uploadState(
  tempDir: string,
  state: SyncState,
): Promise<void> {
  const localStatePath = join(tempDir, "next-assets-sync-state.json");

  await writeFile(
    localStatePath,
    `${JSON.stringify(state, null, 2)}\n`,
    "utf8",
  );

  const result = await runWrangler([
    "r2",
    "object",
    "put",
    `${bucket}/${STATE_KEY}`,
    `--file=${localStatePath}`,
    "--remote",
    "--content-type=application/json",
    "--cache-control=no-store",
  ]);

  if (result.code !== 0) {
    const hint = result.stderr.includes("403")
      ? "请确认 CLOUDFLARE_API_TOKEN 具备 R2 Object Read & Write 权限。"
      : "请检查 R2 配置和 Wrangler 输出。";

    throw new Error(`R2 同步状态更新失败。${hint}`);
  }
}

/**
 * 主流程。
 */
async function main(): Promise<void> {
  await mkdir(join(root, "tmp"), {
    recursive: true,
  });

  const tempDir = await mkdtemp(
    join(root, "tmp", "r2-sync-"),
  );

  try {
    const manifest = await loadManifest();
    const entries = createUploadEntries(manifest);

    console.log(`本地 manifest：${entries.length} 个素材。`);

    const previousState = await loadRemoteState(tempDir);

    const changedEntries = entries.filter(
      (entry) => !isUnchanged(entry, previousState),
    );

    const skipped = entries.length - changedEntries.length;

    console.log(
      `R2 增量计划：上传 ${changedEntries.length}，跳过 ${skipped}。`,
    );

    const requestedConcurrency = Number.parseInt(
      process.env.R2_UPLOAD_CONCURRENCY ?? "8",
      10,
    );

    const concurrency = Number.isFinite(requestedConcurrency)
      ? Math.min(Math.max(requestedConcurrency, 1), 16)
      : 8;

    if (changedEntries.length > 0) {
      console.log(`R2 上传并发：${concurrency}。`);

      await uploadWithConcurrency(
        changedEntries,
        concurrency,
      );
    }

    //
    // 只有全部 asset 上传成功之后，才允许更新 state。
    //
    // 如果任何 asset PUT 失败，上面的函数会 throw，
    // 这里不会被执行。
    //
    const nextState = createNextState(entries);

    await uploadState(tempDir, nextState);

    console.log(
      `R2 同步完成：上传 ${changedEntries.length}，跳过 ${skipped}，总计 ${entries.length}。`,
    );
  } finally {
    await rm(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

await main();