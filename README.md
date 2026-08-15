<div align="center">

<img src="apps/web/public/favicon.png" alt="萤一把图标" width="128" height="128" />

# 萤一把 · Fireflydle

**《崩坏：星穹铁道》角色猜谜：每日挑战、无限随机与实时 1v1**

[在线游玩](https://fireflydle.games) · [玩法](#玩法) · [快速开始](#快速开始) · [部署](#部署) · [贡献](#贡献)

[![CI](https://github.com/zzstar101/fireflydle/actions/workflows/ci.yml/badge.svg)](https://github.com/zzstar101/fireflydle/actions/workflows/ci.yml)
[![Deploy](https://github.com/zzstar101/fireflydle/actions/workflows/deploy.yml/badge.svg)](https://github.com/zzstar101/fireflydle/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-4a78d0.svg)](LICENSE)
[![Bun 1.3.14](https://img.shields.io/badge/Bun-1.3.14-14151a?logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=111827)
![Vite 8](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-222?logo=github&logoColor=white)

</div>

> [!IMPORTANT]
> **非官方、非商业粉丝项目。** Fireflydle 与 HoYoverse / 米哈游没有隶属、授权、背书或合作关系，不提供广告、付费功能、赞助或捐赠。《崩坏：星穹铁道》的名称、角色、图像、图标、商标及相关素材权利归各自权利人所有。

## 玩法

输入一名角色后，系统会比较目标与本次猜测的五项信息：**属性、命途、稀有度、阵营和实装版本**。根据每一格反馈继续缩小范围，在次数用尽前找出答案。

| 反馈      | 含义                                   |
| --------- | -------------------------------------- |
| 🟩 命中   | 该项与目标完全一致                     |
| 🟨 接近   | 阵营属于同一分组，或实装版本与目标接近 |
| 灰色      | 该项与目标不匹配                       |
| `↑` / `↓` | 目标的实装版本比本次猜测更晚或更早     |

单人模式提供三档难度：休闲 **8 次**、标准 **6 次**、硬核 **4 次**。难度和次数会在正式开始时锁定。

### 三种模式

| 模式         | 规则                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| **每日题**   | 根据北京时间日期与玩家身份稳定分配个性化目标，每天 `00:00` 更新                      |
| **无限随机** | 每局抽取一个新目标，不影响每日题记录；同一时间只保留一局进行中的随机题               |
| **实时对战** | 支持 BO1 / BO3 / BO5 / BO7、随机匹配和私人房间；注册账号可参加排位，访客可加入好友房 |

每日题和无限随机都会先进入准备页；只有确认难度并开始后才创建或恢复对局并计时。离开页面不会暂停服务器对局，重新打开时可以继续。

## 功能亮点

- 总站大厅平级展示每日题、无限随机和实时对战，并明确标记未开始、进行中和已完成状态；
- 支持刷新续局、历史回放、个人统计、排行榜，以及带角色头像与网站二维码的结果图片分享；
- 访客无需注册即可开始游戏，创建账号或登录后会合并同一浏览器中的访客进度；
- 注册邮箱需完成验证后才能找回密码；验证与重置链接限时、一次性使用；
- 简体中文、English、日本語三种语言，以及深色、浅色和跟随系统三种主题；
- API 不可用时可由用户明确进入离线练习；离线结果不会保存，也不会计入统计或排行；
- 角色数据、素材、来源、更新时间和 SHA-256 清单随同一网站版本发布。

### 公平性

公开站点不提供角色图鉴，猜测候选只显示角色名称和头像，不会在提交前展示判题属性。服务器对局的答案只会在本局结束后返回；每日题不能通过主动认输提前查看答案。

这些限制用于避免界面本身成为免费查询工具。离线练习与服务器记录完全隔离，不参与每日成绩、排行榜或排位。

## 技术栈

| 层             | 技术                                                           |
| -------------- | -------------------------------------------------------------- |
| 前端           | React 19、Vite 8、React Router、TanStack Query、Zustand        |
| API            | Hono、Cloudflare Workers、WebSocket                            |
| 数据与实时状态 | Cloudflare D1、SQLite Durable Objects                          |
| 契约与规则     | TypeScript、Zod、独立的 `game-engine`                          |
| 工具与测试     | Bun workspaces、Vitest、Cloudflare Workers test pool、Prettier |
| 发布           | GitHub Actions、GitHub Pages、Cloudflare                       |

完整设计见 [架构说明](docs/ARCHITECTURE.md)，生产账号、DNS、迁移和回滚见 [部署手册](docs/DEPLOYMENT.md)。

## 快速开始

环境要求：项目以根目录 `package.json` 中固定的 **Bun 1.3.14** 为准。本地 Worker 和 D1 由 Wrangler 启动，不需要预先创建生产 Cloudflare 资源。

安装依赖、同步角色数据并初始化本地数据库：

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

## 常用脚本

| 命令                             | 作用                                      |
| -------------------------------- | ----------------------------------------- |
| `bun run dev`                    | 同时启动 Web 与本地 Worker                |
| `bun run sync:data`              | 同步并校验角色数据、素材和 D1 seed        |
| `bun run sync:content`           | 从旧角色导出生成版本化内容 manifest       |
| `bun run sync:data -- --dry-run` | 只验证上游数据，不改写发布文件            |
| `bun run format:check`           | 检查全仓格式                              |
| `bun run typecheck`              | 检查所有 workspace 类型和 Worker bindings |
| `bun run test`                   | 运行数据、规则、Web 与 Worker 测试        |
| `bun run build`                  | 构建 Web，并对 Worker 执行发布前 dry run  |

Pull request 和 `main` push 都会运行格式、类型、测试和构建检查。

## 部署

生产拓扑以免费方案为起点：

| 组件                   | 地址或名称                     | 用途                           |
| ---------------------- | ------------------------------ | ------------------------------ |
| GitHub Pages           | `https://fireflydle.games`     | React SPA 与同版本角色素材     |
| Cloudflare Worker      | `https://api.fireflydle.games` | HTTP API、WebSocket 与定时维护 |
| Cloudflare D1          | `fireflydle`                   | 账号、对局、排行和角色池       |
| SQLite Durable Objects | `GameRoom`、`Matchmaker`       | 房间与匹配的强一致实时状态     |
| Resend                 | `account@fireflydle.games`     | 邮箱验证与密码重置发信         |
| Cloudflare Email       | `account@fireflydle.games`     | 将站点来信转发到维护者收件箱   |

手动发布 GitHub Release 后，`.github/workflows/deploy.yml` 会自动从该 Release 的 tag 构建同一批 Pages artifact 与 D1 seed，依次迁移 D1、发布并验证 Worker，最后发布对应的 Pages 版本。任一步失败都会阻止后续部署；配置与发布步骤见 [部署手册](docs/DEPLOYMENT.md)。

## 数据与素材

角色资料由 `scripts/sync-characters.ts` 从已记录的来源同步，并经过 schema、来源和哈希校验。一次同步会同时生成：

- `packages/game-data/src/generated/` 中的前端数据；
- `packages/game-data/generated/characters.sql` 中可安全重跑的 D1 seed；
- `apps/web/public/assets/` 中随站点发布的本地缩略图、manifest 和 SHA-256。

不要手工修改生成文件。权威来源、覆盖规则、可追踪元数据和素材策略见 [数据来源说明](docs/DATA_SOURCES.md)。已有历史记录引用的角色只会被停用，不会被硬删除。

`takedown@fireflydle.games` 用于权利人的素材下架请求，并已通过 Cloudflare Email Routing 转发给维护者。一般缺陷、功能建议和数据纠正请使用仓库提供的 [Issue 表单](https://github.com/zzstar101/fireflydle/issues/new/choose)；不要在公开 Issue 中提交权利证明、账号信息、token 或未公开答案。

## 项目结构

```text
apps/web              React SPA
apps/api              Cloudflare Worker、D1 migrations、Durable Objects
packages/contracts    前后端共享 schema 与类型
packages/game-engine  可测试的纯游戏规则
packages/game-data    角色数据、来源元数据与 D1 seed
scripts               数据与素材同步
docs                  架构、数据来源和生产部署文档
.github/workflows     CI 与生产发布流程
```

## 贡献

欢迎通过 [GitHub Issue 表单](https://github.com/zzstar101/fireflydle/issues/new/choose) 报告缺陷、提出建议或纠正数据；账号、安全与素材下架渠道见 [支持说明](SUPPORT.md)。表单会分别收集复现步骤、验收标准和一手来源，并引导安全漏洞与素材下架请求使用私密渠道。提交 Pull Request 时，仓库模板会提示测试、迁移、素材来源、多语言和防泄题检查。提交前请：

1. 运行 `bun run format:check`、`bun run typecheck`、`bun run test` 和 `bun run build`；
2. 用户可见文案变更同步维护简体中文、English 和日本語；
3. 通过同步脚本更新角色数据和素材，不直接编辑生成文件；
4. 不提交 `.dev.vars`、`.env*`、API token、数据库导出或真实用户数据；
5. 确认新增代码、数据和素材有清晰且兼容的来源与使用依据。

## 许可证与权利声明

本项目贡献者原创的源代码采用 [MIT License](LICENSE)。MIT 只授予本项目原创代码的使用许可，不覆盖《崩坏：星穹铁道》的名称、角色、剧情、图像、图标、音乐、商标、官方数据，亦不覆盖其他第三方提供的数据或素材。

Fireflydle 是独立制作的免费、非商业粉丝项目，与 HoYoverse / 米哈游没有隶属、授权、背书、赞助或合作关系。仓库或构建产物中收录第三方名称、事实数据或素材，不代表相关权利人以 MIT 或任何其他方式重新授权这些内容；其权利、许可条件与移除请求仍由对应权利人决定。
