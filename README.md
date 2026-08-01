# 萤一把 · Fireflydle

一个以《崩坏：星穹铁道》角色为主题的免费猜谜与 1v1 对战网站。

> **非官方、非商业粉丝项目。** Fireflydle 与 HoYoverse / 米哈游没有隶属、授权、背书或合作关系，不提供广告、付费功能、赞助或捐赠。游戏名称、角色、图像、图标、商标及相关素材的权利归各自权利人所有。

## 功能

- 总站大厅平级展示每日题、随机题和实时对战；每日/随机先选难度，确认开始后才创建或恢复对局并计时；
- 每日题与随机题按属性、命途、稀有度、阵营和版本给出命中/接近/未命中反馈；
- 休闲、标准、困难三档规则，以及不剧透的分享结果；
- 1v1 匹配和房间对战，支持 BO1 / BO3 / BO5 / BO7、断线恢复与 Elo；
- 历史回放、个人统计、排行榜、账号与管理界面；公开页面不提供角色图鉴；
- 通过 Resend 发送、具有限流和防账号枚举处理的密码重置邮件；
- 简体中文、English、日本語，深色/浅色/跟随系统；
- 来源、更新时间、SHA-256 与权利声明可追踪的角色数据和本地素材；
- API 不可用时，用户可明确选择离线练习；离线结果不保存，也不计入统计或排行。

## 技术栈

- Bun workspaces、TypeScript、Zod；
- React、Vite、React Router、TanStack Query、Zustand；
- Hono、Cloudflare Workers、D1、SQLite Durable Objects；
- Vitest、Cloudflare Workers test pool、Bun test、Prettier；
- GitHub Pages 与 GitHub Actions。

```text
apps/web              React SPA
apps/api              Cloudflare Worker、D1 migrations、Durable Objects
packages/contracts    跨端 schema 与类型
packages/game-engine  可测试的纯规则
packages/game-data    角色数据、来源元数据与 D1 seed
scripts               素材与数据同步
```

完整设计见 [架构说明](docs/ARCHITECTURE.md)，生产账号、DNS、迁移和回滚见 [部署手册](docs/DEPLOYMENT.md)。

## 本地开发

安装依赖并准备本地数据库：

```bash
bun install --frozen-lockfile
bun run sync:data
cd apps/api
bunx wrangler d1 migrations apply fireflydle --local
bunx wrangler d1 execute fireflydle --local --file ../../packages/game-data/generated/characters.sql
cd ../..
bun run dev
```

Web 默认运行在 `http://localhost:5173`，并把 `/api` 代理到本地 Worker `http://127.0.0.1:8787`。本地 secret 写入 `apps/api/.dev.vars`，不要提交。

只验证上游数据而不改写工作区：

```bash
bun run sync:data -- --dry-run
```

## 质量检查

```bash
bun run format:check
bun run typecheck
bun test packages/game-data/src/index.test.ts
bun --cwd packages/game-engine test
bun --cwd apps/web test
bun run test:worker
bun run build
```

Pull request 和 `main` push 会运行同样的格式、类型、测试与构建检查。生产发布额外执行一次素材同步，并从同次生成的数据同时构建 Pages、填充 D1，再部署 Worker；素材没有独立更新任务。

## 部署摘要

- `fireflydle.games`：GitHub Pages，自定义域由 Cloudflare apex CNAME flattening 指向 `zzstar101.github.io`；
- `api.fireflydle.games`：Cloudflare Worker Custom Domain；
- `fireflydle`：D1 数据库；
- `GameRoom`、`Matchmaker`：SQLite Durable Objects；
- `account@fireflydle.games`：密码重置邮件发件地址，Resend key 只保存在 Worker secrets。

合并到 `main` 后，`.github/workflows/deploy.yml` 会串行执行完整生产发布。首次部署必须先按 [部署手册](docs/DEPLOYMENT.md) 创建 Cloudflare zone、D1、Worker、自定义域和 GitHub Environment secrets。

## 数据与素材

同步器只接受通过 schema、来源和哈希校验的数据。角色图片下载到站点构建目录，角色清单生成前端 TypeScript/JSON 和可安全重跑的 D1 UPSERT SQL。发布时三者来自同一次同步；已有历史引用的角色只会被停用，不会硬删除。

若你是权利人并希望移除相关素材，请联系 `takedown@fireflydle.games`，并提供权利和素材信息。

## 许可证

项目原创源代码采用 [MIT License](LICENSE)。MIT 仅覆盖本项目贡献者编写的代码，不覆盖《崩坏：星穹铁道》的名称、角色、图像、图标、商标、官方数据、第三方来源数据或其他游戏相关素材；这些内容不因收录在本仓库或构建产物中而获得 MIT 授权，权利仍归各自权利人所有。
