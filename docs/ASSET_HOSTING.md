# Fireflydle 素材托管

## 架构

GitHub Pages 只发布 HTML、JS、CSS、PWA shell、favicon、`manifest.webmanifest` 和小型素材索引。角色、NPC、星神、皮肤、阵营壁纸以及 responsive AVIF/WebP/PNG 等游戏内容素材由 Cloudflare R2 提供，生产域名为 `https://assets.fireflydle.games`。

game-data 和 `apps/web/public/assets/manifest.json` 始终保存 `/assets/...` 逻辑路径。前端通过 `apps/web/src/lib/asset-url.ts` 解析路径，因此切换 CDN 不需要重生成题库。开发环境默认使用本地 `/assets`，不需要 Cloudflare 凭据。

## Cloudflare 设置

1. 创建 R2 bucket，建议名为 `fireflydle-assets`（bucket 名不等于公开 URL）。
2. 在 R2 bucket 的 **Settings → Custom Domains** 添加 `assets.fireflydle.games`。
3. 在 Cloudflare DNS 为该 custom domain 配置记录并确认 TLS 生效。
4. 不要使用 `*.r2.dev` 作为生产地址，也不要在仓库写入 Global API Key。
5. 为 CI 创建只允许指定账户 R2 Object Read/Write 的 API Token。
6. 应用仓库中的 `config/r2-cors.json`：

```bash
bunx wrangler r2 bucket cors set fireflydle-assets --file config/r2-cors.json
bunx wrangler r2 bucket cors list fireflydle-assets
```

## GitHub 配置

Secrets：

- `CLOUDFLARE_API_TOKEN`：最小权限 R2 token；
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare account ID。

Variables：

- `R2_BUCKET_NAME`：R2 bucket 名；
- `VITE_ASSET_BASE_URL`：公开资源基址，生产默认 `https://assets.fireflydle.games`。

这些值只用于 Actions 和构建时 URL 解析，不会把 token 编译进前端 bundle。

## 命令与缓存

```bash
bun run assets:build
bun run assets:validate
bun run assets:upload
```

`assets:upload` 使用 Wrangler，已存在的 content-hashed 文件跳过上传；稳定文件只有在设置 `R2_FORCE_MUTABLE=1` 时才强制覆盖。上传会设置 MIME 类型。带内容哈希的媒体使用 `public, max-age=31536000, immutable`，其他内容使用短缓存 `public, max-age=60, stale-while-revalidate=300`。Cloudflare custom domain 默认只缓存部分文件扩展名；若要让 JSON 等所有 R2 素材都进入边缘缓存，请在 `assets.fireflydle.games` 上建立 Cache Rule，匹配 `*`，启用 Cache Everything，并保留源站 `Cache-Control`。

Vite 构建后会从 Pages 产物移除 R2 托管目录，只保留 `assets/manifest.json` 和 `manifest.sha256`。因此新素材不会进入生产 bundle。

响应式角色变体由 `assets:build` 从审核过的 PNG 基线生成，新增的 `*-40/80/160.avif|webp` 文件已加入 `.gitignore`；它们在 CI 中生成后上传 R2。现有仓库历史中的二进制文件不会被自动重写或删除。

## CI / 部署顺序

PR 只执行生成、校验、格式、类型、测试和构建，不写 production R2。生产 release workflow 在构建后先运行 `assets:validate` 和 `assets:upload`，成功后才生成并部署 GitHub Pages artifact；R2 上传失败时 Pages 不会发布新版本。

## PWA 与离线模式

Service Worker 继续缓存同源 shell，并对 `assets.fireflydle.games` 的 CORS GET 响应执行 Cache API 缓存。安装时会根据同源 manifest 解析角色素材到 CDN；特殊模式离线包保存逻辑路径，下载和检查阶段统一调用同一套 `assetUrl()`，避免在线与离线 URL 分叉。

R2 custom domain 需要允许应用来源 `https://fireflydle.games` 的 GET CORS（如需本地联调，可额外允许明确的 localhost 端口）。仓库中的 `config/r2-cors.json` 是当前建议配置。仅 `<img>` 使用时不需要开放 `*`；Service Worker/offline pack 使用 fetch 时必须保证正常 CORS 响应。修改 CORS 后需要 purge `assets.fireflydle.games` 的缓存，已有缓存响应不会自动补上 CORS 头。

## 故障排查

- 图片 404：检查 `VITE_ASSET_BASE_URL`、R2 custom domain 和对象 key 是否去掉了逻辑路径前缀 `/assets/`。
- 离线包失败：检查 CDN CORS、浏览器 Cache Storage 以及 manifest 中每个路径是否已经上传。
- 发布阻断：查看 `assets:validate` 的本地字节数/SHA-256 报错，再确认 Actions 的 R2 token、account ID 与 bucket variable。
- 更换 CDN：只需修改 `VITE_ASSET_BASE_URL` 和 resolver 配置，不要修改 game-data 中的逻辑路径；历史 Git 大文件清理（filter-repo/BFG/force push）是可选后续操作，本次不会自动执行。
