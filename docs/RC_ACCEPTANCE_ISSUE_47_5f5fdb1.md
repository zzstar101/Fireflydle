# Fireflydle v1.0 RC 全量验收记录

- 验收范围：issue #47，基线 `5f5fdb1`
- 验收日期：2026-08-18（Asia/Hong_Kong）
- 结论：**PASS，允许发布 v1.0**
- 发布动作：本记录随主线提交；issue #47 在确认 CI 绿后关闭。

## 可复现命令与结果

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 工作区/基线 | PASS | `git log -1 --oneline` = `5f5fdb1 feat: integrate special mode friend challenges`；用户未跟踪文件未纳入提交 |
| 依赖准备 | PASS | `bun install --frozen-lockfile` 成功；锁定 Bun 1.3.14 与 Wrangler 4.118.0 |
| 格式 | PASS | GitHub CI `5f5fdb1` 的 format job 通过；本次改动文件 Prettier 与 `git diff --check` 通过。Windows 工作树的既有 CRLF 格式噪音不改变 CI 结论 |
| 类型 | PASS | 锁定环境 `bun run typecheck` 通过，`worker-configuration.d.ts` 与 Wrangler 4.118.0 一致 |
| 全量测试 | PASS | GitHub CI：NPC census 436（target 3/candidate-only 0/pending 431/excluded 2）；web 65、api 64、contracts 13、game-data 29、game-engine 27、assets 3 全部通过 |
| 构建 | PASS | `bun run build` 通过；API Wrangler dry-run 通过 |
| web 性能预算/分包 | PASS | `bun run test:web-budget`：initial JS 26 requests / 483380 bytes raw / 157529 bytes gzip，initial CSS 21016 bytes，33 chunks，四模式动态入口均独立 |
| NPC census/manifest/素材 | PASS | `bun run validate:npc-census; bun run test:npc-manifest; bun run test:npc-content` 全部通过；正式 target 为 `npc-pom-pom`、`npc-siobhan`、`npc-skott`，素材 3，审核证据闭合 |
| NPC 正式运行时门禁 | PASS | 应用 0013–0025 迁移后真实探针：两游客 session、NPC room 创建 201、join 200，快照 `mode=npc`、`maxAttempts=4`；独立题池、三语字段、四猜和不泄露契约由 Worker/Web 测试覆盖 |
| Worker HTTP / WebSocket | PASS | `GET /api/health` = 200；NPC private room HTTP 创建 201、加入 200；owner cookie 连接 `ws://127.0.0.1:8792/api/rooms/{roomId}/socket`，.NET `ClientWebSocket` 状态 `Open` |
| 浏览器桌面 | PASS | Edge + Playwright CLI 首页和四模式入口可达；普通角色、NPC、货币战争、星神规则入口渲染 |
| 浏览器移动 390px | PASS | Edge 390x844 快照通过；四模式 practice 路由可达，NPC 4 猜、币战 6 猜、星神 6 猜显示正确 |
| 三语 | PASS | Edge 在 `zh-CN`、`en`、`ja` 切换后首页与四模式入口均渲染对应标题和模式名称 |
| 四模式冒烟 | PASS | Worker API/WebSocket 全量外部测试覆盖创建、加入、快照、提交、结算、回放和无剧透；浏览器入口/规则路径通过 |
| PWA service worker/离线包 | PASS | production preview 中 service worker `activated`；cache 含 `index.html`、manifest、角色素材及当前页面资源（670 entries）；`caches.match` 命中 shell/manifest；PWA 安装资格、冷却和事件处理测试通过。原生安装窗口按 issue 约定只做事件级验收 |
| 发布回退/manifest 绑定 | PASS | `apps/web/public/assets/manifest.sha256`、NPC gate、构建产物和 bundle budget 一致；线上回退演练不在本地工作区范围内 |

## 门禁判定

所有 v1.0 发布门禁均已闭合，允许发布。NPC 正式白名单不是仅数据通过：运行时独立题池、搜索/候选隔离、四猜、三语和 Worker/浏览器 seam 均已有证据。原生安装 UI 与线上回退动作按 issue 约定保留为平台/部署环境级操作，不阻塞本地 RC 标记。

本记录不包含产品实现变更；它是基线 `5f5fdb1` 的验收证据。
