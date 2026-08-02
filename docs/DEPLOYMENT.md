# Fireflydle 免费部署手册

本手册部署以下生产拓扑：

| 服务                   | 地址                           | 作用                       |
| ---------------------- | ------------------------------ | -------------------------- |
| GitHub Pages           | `https://fireflydle.games`     | React SPA 与同版本角色素材 |
| Cloudflare Worker      | `https://api.fireflydle.games` | HTTP API、WebSocket、cron  |
| Cloudflare D1          | `fireflydle`                   | 长期关系数据与角色池       |
| SQLite Durable Objects | `GameRoom`、`Matchmaker`       | 房间和匹配强一致状态       |
| Resend                 | `account@fireflydle.games`     | 密码重置邮件发件地址       |

GitHub Pages、Workers、D1、Durable Objects 和 Resend 均可从免费计划起步，但额度和资格会变化；域名注册通常需要付费。不要在未确认计费影响时启用 Workers Paid、额外日志留存或其他付费附加项。

## 1. 准备账号与仓库

需要：

- 一个包含本仓库的 GitHub 仓库，默认分支为 `main`；使用 GitHub Free 时应为公开仓库，私有仓库 Pages 资格以当前计划为准；
- 一个 Cloudflare 账号，以及属于该账号的 `fireflydle.games` zone；
- Bun 版本以根目录 `package.json` 的 `packageManager` 为准；
- 一个 Resend 账号；
- 对域名注册商、GitHub 仓库设置和 Cloudflare zone 的管理权限。

先在本地验证仓库：

```bash
bun install --frozen-lockfile
bun run format:check
bun run typecheck
bun --cwd packages/game-engine test
bun --cwd apps/web test
bun run test:worker
bun run build
```

不要提交 `.dev.vars`、`.env*`、API token、数据库导出或真实用户数据。

## 2. 把 DNS 托管到 Cloudflare

1. 在 Cloudflare Dashboard 选择 **Add a domain / Onboard a domain**，输入 `fireflydle.games` 并选择 Free plan。
2. 审核 Cloudflare 扫描到的现有 DNS，特别是 MX、SPF、DKIM、DMARC 和验证 TXT。快速扫描不保证完整。
3. 如果原 DNS 开启了 DNSSEC，先按原服务商说明安全移除旧 DS 记录。
4. 记下 Cloudflare 分配的两个权威 nameserver。
5. 到域名注册商把原 nameserver 完整替换为这两个 Cloudflare nameserver。不要只新增其中一个。
6. 等待 Cloudflare zone 状态变为 **Active**，再在 Cloudflare 侧重新开启 DNSSEC，并把新 DS 信息提交到注册商。

验证：

```powershell
Resolve-DnsName fireflydle.games -Type NS
```

返回值必须是 Cloudflare 分配的 nameserver。切换 NS 前先保留所有现有邮件记录，否则域名邮件可能中断。

## 3. 配置 GitHub Pages 与 `fireflydle.games`

### 3.1 启用 Actions 发布源

在 GitHub 仓库进入 **Settings → Pages**，将 **Build and deployment / Source** 设为 **GitHub Actions**。不要选择 `gh-pages` 分支；本仓库由 `.github/workflows/deploy.yml` 上传正式 artifact。

### 3.2 先声明并验证域名

GitHub 建议先在 Pages 设置中声明自定义域，再创建指向 GitHub 的 DNS，避免子域被他人占用：

1. 在个人或组织的 Pages 域名验证页面添加 `fireflydle.games`。
2. GitHub 会给出 `_github-pages-challenge-zzstar101` TXT 名称和值；在 Cloudflare DNS 中按原样添加，状态为 **DNS only**。
3. 等待 TXT 可解析后点击 **Verify**。验证成功后永久保留这条 TXT。
4. 在仓库 **Settings → Pages → Custom domain** 填入 `fireflydle.games` 并保存。

Actions 发布源不需要仓库中的 `CNAME` 文件；GitHub 会忽略 artifact 内的 `CNAME`。域名的真实来源是 Pages 设置和 DNS。

### 3.3 创建 Cloudflare CNAME

在 Cloudflare DNS 添加：

| Type  | Name  | Target                | Proxy    | 说明                                           |
| ----- | ----- | --------------------- | -------- | ---------------------------------------------- |
| CNAME | `@`   | `zzstar101.github.io` | DNS only | 主站；Cloudflare 对 apex 执行 CNAME flattening |
| CNAME | `www` | `zzstar101.github.io` | DNS only | 推荐；GitHub 可重定向到 apex                   |

目标中不要附加仓库名或 URL 路径。删除与 `@` 冲突的 A、AAAA、CNAME，以及默认停车页记录；不要创建 `*` 通配记录。

GitHub 的通用文档对 apex 推荐 ALIAS、ANAME 或四条 Pages A 记录；Cloudflare 的 apex CNAME flattening 提供等价解析。如果 GitHub 域名检查无法接受 CNAME，改用 GitHub 文档当时列出的四条 A 记录，不要凭记忆复制可能已变化的地址。

保持 **DNS only**，让 GitHub 直接签发并续期证书。DNS 生效且 Pages 首次发布成功后，在 GitHub Pages 设置中开启 **Enforce HTTPS**。证书选项可能需要一段时间才出现。

验证：

```powershell
Resolve-DnsName fireflydle.games -Type A
Resolve-DnsName www.fireflydle.games -Type CNAME
```

## 4. 首次创建 D1 与 Worker

生产 workflow 假设 D1 和 Worker 已完成一次引导。首次只执行以下步骤一次：

```bash
bun install --frozen-lockfile
bun run sync:data
cd apps/api
bunx wrangler login
bunx wrangler whoami
bunx wrangler d1 create fireflydle
bunx wrangler d1 migrations apply fireflydle --remote
bunx wrangler d1 execute fireflydle --remote --file ../../packages/game-data/generated/characters.sql
bunx wrangler deploy
```

注意：

- 如果 `fireflydle` 已存在，跳过 `d1 create`，先用 `bunx wrangler d1 list` 确认它属于正确账号。
- `database_name` 是稳定标识；把 `d1 create` 返回的 UUID 写入 `database_id`，CI 和 Worker binding 均以该 ID 定位生产数据库。
- `d1 migrations apply` 会创建 schema 并记录 migration；角色 SQL 是幂等 seed，不是 schema migration。
- 第一次 `wrangler deploy` 同时应用 `wrangler.jsonc` 中的 `v1` Durable Object migration，创建 SQLite `GameRoom` 与 `Matchmaker` 命名空间。没有单独的 DO migrate 命令。
- 已经发布后不要改写或删除 `v1`。新增、重命名或删除 DO class 时追加新 migration tag，并先验证旧代码与新存储的兼容性。

### 4.1 绑定 API 自定义域

首次 `wrangler deploy` 完成后，在 Cloudflare 控制台进入 `fireflydle-api` Worker 的 **Settings → Domains & Routes → Add → Custom domain**，添加 `api.fireflydle.games`。这是一次性引导操作；生产 CD 只更新 Worker 代码、bindings、Durable Object migration 和 cron，不重复改写已建立的 route。

`wrangler.jsonc` 有意不包含 `route` 或 `routes`，并保留 `workers_dev=false`。这样 GitHub Actions 的 token 不需要 Zone 权限，已存在的 Custom Domain 由 Cloudflare 控制台管理且不会在代码部署时被删除。Cloudflare 会为 Custom Domain 创建所需 DNS 和证书；不要再手工添加同名 A/CNAME，也不要把 `api` 指向 GitHub Pages。等待域名 Active 后验证：

```bash
curl --fail-with-body https://api.fireflydle.games/api/health
```

应返回 `ok: true` 和 `status: "ok"`。生产流水线会在每次 Worker 发布后重复此检查。

## 5. GitHub Environment 与 Cloudflare token

在 Cloudflare 创建一个自定义 API token，仅授权 Fireflydle 所在账号：

- **Account / Workers Scripts / Edit**；
- **Account / D1 / Edit**；
- 仅选择实际生产账号；
- workflow 不管理 DNS 或 Worker routes，因此不要授予 Zone DNS Edit 或 Workers Routes Edit。

若 Cloudflare 控制台当时使用了新的权限名称，以 Wrangler 部署 Worker、D1 migration 所需的最小权限为准。不要使用 Global API Key。

在 GitHub 仓库创建名为 `production-api` 的 Environment，建议只允许 tag、配置 required reviewer，并依靠流水线校验 tag 对应的 commit 属于 `main`。加入两个 Environment secrets：

| Secret                  | 值                    |
| ----------------------- | --------------------- |
| `CLOUDFLARE_API_TOKEN`  | 上述最小权限 token    |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

不要把 token 放进 repository variable、workflow YAML、README、命令输出或 artifact。Account ID 本身不是凭据，但作为 Environment secret 管理可以减少配置散落。

管理概览还需要一个与部署凭据分离的只读 token。在 Cloudflare 创建自定义 token，仅授予实际生产账号的 **Account / Account Analytics / Read**，然后在 `apps/api` 下交互式写入 Worker secret：

```bash
bunx wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN
```

该 token 只用于管理员手动刷新或每小时定时检查时查询 Analytics Engine、Workers 与 D1 用量。不要复用拥有写权限的部署 token。Account ID 与 D1 database ID 是非秘密配置，保存在 `apps/api/wrangler.jsonc`；token 值只能存在于 Cloudflare Worker Secret。

GitHub Pages 使用 `github-pages` Environment。`.github/workflows/deploy.yml` 仅给 Pages job `pages: write` 与 `id-token: write`，其他 job 保持只读仓库权限。

## 6. Resend 与 `account@fireflydle.games`

邮箱验证与密码重置依赖 Resend。未配置 `RESEND_API_KEY` 时，核心游戏和无邮箱账号仍可使用，但不会发送账号邮件，workflow 会给出警告。注册时填写的邮箱必须先通过验证链接确认，只有 `email_verified = 1` 的邮箱才能创建密码重置 token。

1. 在 Resend 添加发送域 `fireflydle.games`。
2. 把 Resend 控制台给出的 SPF、DKIM 和 return-path 记录逐条加入 Cloudflare DNS。内容和名称必须以 Resend 当前页面为准，邮件记录均使用 **DNS only**。
3. 添加 DMARC，例如先使用监控策略并配置报告邮箱；确认合法邮件通过后再逐步收紧策略。不要创建第二条互相冲突的 SPF 记录。
4. 等待 Resend 将域名标记为 Verified。
5. 创建仅用于 Fireflydle 发送的 Resend API key。
6. 在 `apps/api` 下交互式写入 Worker secret：

```bash
bunx wrangler secret put RESEND_API_KEY
```

仓库中的 `apps/api/wrangler.jsonc` 保存两个非秘密 production vars：

```text
RESEND_FROM=Fireflydle <account@fireflydle.games>
PUBLIC_WEB_URL=https://fireflydle.games
```

不要用 `echo` 把 API key 写进 shell history，也不要把 Resend key 加到 GitHub Actions；Worker secret 会在后续 `wrangler deploy` 时保留。发布流程仅通过 `wrangler secret list` 校验 secret 名称，无法读取或输出 secret 值。

部署后依次验证邮箱验证与密码重置流程：

```text
POST /api/auth/email-verification/request
POST /api/auth/email-verification/confirm
POST /api/auth/password-reset/request
POST /api/auth/password-reset/confirm
```

验证页只应在用户点击确认按钮后提交 token，避免邮件安全扫描器预取链接时自动验证。密码重置 request 接口应对不存在、未验证和已验证邮箱返回不可枚举的统一响应，并受限流保护。不要在生产日志中记录邮箱、验证 token 或重置 token。

Resend 的发送域不会自动创建 `account@fireflydle.games` 收件箱。若该地址需要接收回复，另行配置 Cloudflare Email Routing 或邮箱服务商，并保留其 MX/TXT 记录。

### 邮件模板维护

账号邮件的 HTML 与纯文本模板以 `apps/api/src/services/account-email-template.ts` 为唯一事实来源，当前包含邮箱验证和密码重置两类；运维预警模板位于 `apps/api/src/services/operations-alert-email-template.ts`。修改模板后必须运行 Worker 测试，并与 Worker 同版本发布；这样模板内容、链接路径、过期提示和安全文案可以在 Pull Request 中审查，也能随 Worker 版本一起回滚。

Resend 支持创建、更新和发布托管模板，并可在发送时通过 template ID 或 alias 传入变量；但是使用托管模板时，请求不能同时提交 `html`、`text` 或 `react`。本项目暂不把 Resend 控制台中的模板作为生产来源，以免网站、Worker 与单独发布的模板发生版本漂移。若未来切换，应先在 CI 中加入从仓库模板到 Resend alias 的幂等同步与发布步骤，再把 Worker 发送载荷切换为 `template` 对象，不要手工维护第二份生产内容。

Cloudflare Email Routing 负责收件，与 Resend 的发信域配置互不替代。生产环境目前显式转发：

```text
account@fireflydle.games  -> 已验证的维护者邮箱
takedown@fireflydle.games -> 已验证的维护者邮箱
```

catch-all 保持关闭，避免接收未声明地址的垃圾邮件。修改路由后应确认 Email Routing 状态仍为 `ready`、目标地址已验证、规则已启用且没有重复 matcher。

## 7. 自动发布流程

`.github/workflows/deploy.yml` 只在维护者手动发布 GitHub Release 时运行；草稿 Release 不会触发。发布时应让 tag 指向 `main` 上已经通过 CI 的 commit，流水线也会再次验证这一点。整个生产环境只有一个并发发布：

1. 按 `package.json` 设置 Bun，并使用 `bun.lock` 冻结安装依赖；
2. 执行一次 `bun run sync:data`，同步并校验角色数据、图片、来源与 SHA-256；
3. 检查格式、类型、Worker bindings，运行 engine、Web 和 Worker 测试；
4. 构建 Pages 与 Worker；
5. 校验并保存 Pages artifact，以及同次生成的素材 manifest、SHA-256 和 `characters.sql`；
6. 检查生产 Worker 是否存在可选的 `RESEND_API_KEY` secret，缺失时给出警告；
7. 应用尚未执行的 D1 migrations；
8. 执行同版本、幂等的角色 seed；
9. 发布 Worker，部署时自动处理新的 DO migration；
10. 检查 `/api/health`；
11. 只有 API 成功后才把预先构建好的 artifact 发布到 GitHub Pages。

没有独立的素材 workflow 或定时素材发布。`github-pages` 与 `release-data-*` artifact 均保留 30 天，便于失败 job 重试、页面回退和事故审计。若只重跑失败的 API/Pages job，它会继续使用原 build job 的 artifact，而不会再次抓取上游数据。

生产同步需要访问角色内容 API/CDN 和 GitHub 补充源。任何来源不可用、schema 不符、哈希异常、格式错误、测试失败或构建失败都会在部署前停止发布。

CI workflow 在 pull request 和 `main` push 上执行同一套格式、类型、测试和构建检查，但不会同步或发布素材。

### 发布一个版本

1. 确认目标 commit 已合并到 `main`，且 CI 通过；
2. 在 GitHub 仓库的 **Releases → Draft a new release** 创建新 tag（建议使用 `vX.Y.Z`），Target 选择 `main`；
3. 填写版本说明并点击 **Publish release**；首次 Release 的 notes 应汇总初始提交之后的新增功能与修复，后续版本则汇总上一个 Release 之后的变化；
4. 在 Actions 的 **Deploy production** 中观察 D1、Worker 和 Pages 三段部署；
5. 流水线完成后检查 `https://api.fireflydle.games/api/health` 与 `https://fireflydle.games`。

不再需要 `PRODUCTION_ENABLED` 或 `CLOUDFLARE_DEPLOY_ENABLED` repository variables。删除、取消发布或修改 Release 不会触发生产部署；失败时直接重跑失败 job，不要为同一版本重复创建 tag。

## 8. Migration 规则

### D1

每个 schema 变更使用一个新的 `apps/api/migrations/NNNN_description.sql`：

```bash
cd apps/api
bunx wrangler d1 migrations create fireflydle add_example
bunx wrangler d1 migrations apply fireflydle --local
bunx wrangler d1 migrations list fireflydle --remote
```

先在本地 migration 和 Worker 测试中验证，再合并到 `main`。不要修改已在生产应用的 migration；用新的向前 migration 修复。生产 CI 非交互执行 apply，Wrangler 仍会在 migration 后保留 D1 恢复点。

生产顺序是 migration 后 deploy，因此 schema 必须采用 expand/backfill/contract：第一版只增加兼容字段/表并回填，Worker 和前端全部切换后，另一个发布才删除旧结构。禁止在同一次发布中先删除当前线上 Worker 仍读取的列。新 Worker API 也必须至少兼容上一版 Pages，直到 Pages job 成功。

`0004_single_active_solo_game.sql` 与 `0005_guest_progress_merges.sql` 属于首次生产上线前的基线 migration。若某个已有流量的环境只部署过 `0001`–`0003`，不要直接让自动 workflow 跨版本应用：先把唯一约束拆成 expand 与 contract 两次发布并演练旧 Worker 写入窗口，再恢复自动发布。首次上线一次性创建完整 schema 时不存在旧 Worker 兼容窗口。

角色变更不创建每日 schema migration。同步脚本生成可安全重跑的 UPSERT SQL，并 soft-disable 权威清单外的旧角色，从而保留历史外键。D1 import 文件不得包含显式 `BEGIN`/`COMMIT`；若执行中断，修复原因后重跑幂等 seed。

### Durable Objects

当前配置使用 legacy `migrations` 数组，初始 tag 是 `v1`，两类均在 `new_sqlite_classes`。后续 class 生命周期变更必须追加唯一 tag。不要把配置机械改为新的 `exports` 流程；两种流程不能同时使用，迁移配置前要按 Cloudflare 当时的官方迁移说明执行一次专门发布。

DO migration 随 Worker deploy 生效，通常不能通过 Worker 版本回滚撤销。删除 class 或转移命名空间属于潜在破坏性操作，必须单独评审、备份和演练。

## 9. 发布验证

每次发布后至少检查：

```bash
curl --fail-with-body https://api.fireflydle.games/api/health
curl --fail-with-body https://fireflydle.games/
```

再用浏览器验证登录 Cookie、角色图片、房间 WebSocket 和刷新深层路由，并覆盖以下总站流程：

- `/` 正常显示三条平级线路，完成后的每日卡片不显示答案；
- `/daily` 与 `/random` 在准备页不会提前创建对局，点击开始后刷新可以恢复；
- API 故障时只能由用户明确进入离线练习，离线结果不进入记录；
- 游客不能进入排位，但仍可创建或加入私人房间。

GitHub Pages 的 `404.html` SPA fallback 可能对深层路由保留 HTTP 404，因此不要把 `curl --fail /random` 当作唯一判断。检查 Cloudflare Worker logs、D1 error、GitHub Pages deployment URL 与 Actions artifact 的 commit 是否一致。

DNS 检查：

```powershell
Resolve-DnsName fireflydle.games -Type A
Resolve-DnsName api.fireflydle.games -Type A
Resolve-DnsName _github-pages-challenge-OWNER.fireflydle.games -Type TXT
```

## 10. 回滚与恢复

### 10.1 Worker 代码

先记录事故时间和当前版本，再回滚到已知正常的 Worker version：

```bash
cd apps/api
bunx wrangler versions list
bunx wrangler versions view <VERSION_ID>
bunx wrangler rollback <VERSION_ID> --message "incident rollback" --yes
```

回滚后立即检查 `/api/health` 和真实读写路径。只有旧代码与当前 D1 schema、DO class/存储仍兼容时才做代码回滚；否则提交向前修复。

### 10.2 GitHub Pages

首选回退产生问题的 commit，再让完整生产 workflow 发布。若 API 已成功而 Pages job 失败，只重跑失败的 `deploy_pages` job，使其复用原 run 的 Pages artifact。

需要调查旧页面时，从对应 Actions run 下载 `github-pages` 和 `release-data-*` artifact。不要通过手工修改线上 Pages 文件绕过 workflow；那会破坏素材、清单与 D1 seed 的版本关系。

### 10.3 D1

D1 恢复可能丢弃恢复点之后的注册、对局和评分，只在 schema/数据损坏且向前修复不可行时使用。先导出事故现场到安全位置：

```bash
cd apps/api
bunx wrangler d1 export fireflydle --remote --output incident-before-restore.sql
bunx wrangler d1 time-travel info fireflydle --timestamp "<RFC3339>" --json
bunx wrangler d1 time-travel restore fireflydle --timestamp "<RFC3339>"
```

数据库导出含个人数据，不得提交仓库；按最小权限保存并在事故处理后安全删除。恢复前先把 Worker 回退或修复到与目标 schema 兼容的版本，恢复后重新运行必要的向前 migration 与精确版本 seed。

### 10.4 Durable Objects

已应用的 DO class migration 不随 `wrangler rollback` 逆转。旧 Worker 若仍理解当前 namespace，可以只回滚代码；否则应发布兼容的向前修复。SQLite DO 支持按对象的 Point-in-Time Recovery API，但恢复会针对具体对象并可能覆盖新状态，必须按 Cloudflare 最新 API 文档执行，不能用 D1 restore 命令代替。

## 11. 免费额度运维清单

- 在 Cloudflare 和 GitHub 开启用量/账单提醒，每月检查 Workers 请求、CPU、D1 rows read/write、D1 存储、DO 请求/存储与日志量。
- 保持角色素材在 GitHub Pages，不因为方便而临时引入 R2 或付费图片转换。
- 不设置独立数据 schedule；新数据只能随经过测试的站点发布。
- 为账号、猜测、匹配和邮件端点保留应用级限流，避免免费额度被滥用。
- 将 production environment 设置 reviewer 和 branch protection，禁止未通过 CI 的直接发布。
- 定期轮换 Cloudflare 与 Resend token；轮换后测试一封密码重置邮件，再删除旧 token。

## 12. 常见问题

**Pages 显示默认 `github.io` 地址**：确认 Pages Source 是 GitHub Actions、Custom domain 已保存、DNS 指向 `<owner>.github.io`，并等待证书签发。

**apex CNAME 无法保存**：确认 zone 已由 Cloudflare 托管并启用 apex flattening；否则使用 GitHub 官方当前列出的 A 记录。

**API 发布成功但域名 404**：确认 `api.fireflydle.games` 是 Worker Custom Domain，不是普通 route 或指向 Pages 的 CNAME；检查证书状态和 Worker 名称。

**D1 migration 找错库**：workflow 使用稳定的 database name `fireflydle`。在执行任何恢复前用 `wrangler whoami` 和 `wrangler d1 info fireflydle` 核对账号与数据库。

**DO deploy 报 migration tag 错误**：不要改写已经发布的 tag；恢复原 migration 历史并追加新 tag。

**Resend 已验证但收不到回复**：域验证只解决发送认证，不提供收件箱；配置 Email Routing 或邮箱服务商。

## 官方参考

- [GitHub Pages 自定义 workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages 自定义域](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages 域名验证](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [Cloudflare full DNS setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Cloudflare Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Cloudflare Durable Object migrations](https://developers.cloudflare.com/durable-objects/reference/durable-object-class-migrations-legacy/)
- [Cloudflare SQLite DO recovery](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)
