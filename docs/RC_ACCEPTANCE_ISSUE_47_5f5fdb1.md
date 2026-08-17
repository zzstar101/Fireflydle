# Fireflydle v1.0 RC 全量验收记录

- 验收范围：issue #47，基线 `5f5fdb1`
- 验收日期：2026-08-18（Asia/Hong_Kong）
- 结论：**BLOCKED，不允许发布 v1.0**
- 发布动作：未 push、未关闭 issue；本文件为唯一 RC 记录。

## 可复现命令与结果

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 工作区/基线 | PASS | `git log -1 --oneline` = `5f5fdb1 feat: integrate special mode friend challenges`；验收前 `git status --short` 干净 |
| 依赖准备 | PASS | `bun install --frozen-lockfile` 成功，484 packages |
| 格式 | BLOCKED | `bun run format:check` 失败，Prettier 报告 225 个既有文件格式不符；未执行格式化 |
| 类型 | BLOCKED | `bun run typecheck` 在 `apps/api` 被 `wrangler types --check` 阻断：`worker-configuration.d.ts` out of date；未生成/修改类型文件 |
| 全量测试 | PASS | `bun run test`：NPC census 436（target 3/candidate-only 0/pending 431/excluded 2）；web 20 files/65 tests；api 9 files/64 tests；其余 contracts 13、game-data 29、game-engine 27、assets 3，全部通过 |
| 构建 | BLOCKED | `bun run build` 同样在过期 `worker-configuration.d.ts` 处失败 |
| web 性能预算/分包 | BLOCKED | `bun run test:web-budget` 因构建未产出 `apps/web/dist/index.html` 无法执行；没有伪造预算结论 |
| NPC census/manifest/素材 | PASS（数据 gate） | `bun run validate:npc-census; bun run test:npc-manifest; bun run test:npc-content` 全部通过；正式 target 为 `npc-pom-pom`、`npc-siobhan`、`npc-skott`，素材 3，审核证据闭合 |
| NPC 正式运行时门禁 | BLOCKED | 文档 `docs/NPC_MANIFEST.md` 明确：数据 gate passed 不等于发布；仍需 Worker/真实浏览器证明独立题池、搜索隔离、四猜、三语核心流程及不泄露未提交属性；本次 Worker seam 未闭合 |
| 浏览器桌面 | PASS（入口/路由） | Edge + Playwright CLI：`npx --yes --package @playwright/cli playwright-cli open http://localhost:5173/ --browser msedge`；首页 `/playable` 快照可见普通角色、NPC、货币战争、星神及活动入口 |
| 浏览器移动 390px | PASS（入口/响应式路径） | `playwright-cli resize 390 844` 后首页快照通过；NPC、货币战争、星神 practice 路由均可导航并显示各自规则（NPC 4 猜，币战 6 猜，星神 6 猜） |
| 三语 | PASS（首页） | Playwright 将语言选择切换为 `zh-CN`、`en`、`ja` 并重新快照；中文、English、日本語标题和模式名称均渲染 |
| 四模式冒烟 | BLOCKED（完整对局） | 入口页面可达，但未能完成真实提交/结算流程；Worker HTTP seam 不可达，不能把入口快照升级为发布级对局证据 |
| Worker HTTP | BLOCKED（环境） | 本地 `bun run dev` 日志显示 Wrangler ready（8792），但 PowerShell `Invoke-WebRequest` 对 8787/8788/8792 `/api/health` 均在 5–10 秒超时；未修改服务或实现 |
| Worker WebSocket | BLOCKED（环境） | `/api/rooms/{roomId}/socket` 探针随 HTTP 客户端阻塞，已停止等待；没有可复现的 101 handshake/消息证据 |
| PWA 安装资格/现有离线包 | BLOCKED（发布级） | 静态检查确认存在 `manifest.webmanifest`、`sw.js`，shell 缓存和角色素材预缓存逻辑；未能在真实浏览器完成安装资格、离线切换、特殊模式按需缓存/未缓存置灰验收 |
| 发布回退/manifest 绑定 | BLOCKED | `apps/web/public/assets/manifest.sha256` 与静态 NPC 校验通过；但构建/部署门禁未通过，无法证明产物 manifest 与回退版本绑定 |

## 门禁判定

必须阻止 v1.0。阻塞项包括：

1. Worker `worker-configuration.d.ts` 过期导致类型检查和构建失败。
2. Worker HTTP/WebSocket 真实 seam 未取得可复现响应/101 handshake。
3. NPC 仅数据 gate 通过；正式运行时、搜索隔离、四猜、三语和泄露防护尚未形成发布证据。
4. 构建未产出 dist，因此性能预算、分包回归和 manifest 绑定不能判 PASS。
5. PWA 安装与离线/按需缓存真实浏览器验收未完成。

本记录不包含产品实现变更，不替代上一可用版本，不关闭 issue #47。
