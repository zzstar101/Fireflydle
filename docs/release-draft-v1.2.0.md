# 萤一把 v1.2.0「排位回归、Elo 匹配与基础设施升级」

> v1.2.0 版本日志草稿，确认内容后再用于 GitHub Release 和站内公告。

<!-- fireflydle:announcement:start -->

## 排位回来了，匹配也更愿意等你

排位模式现在重新开放。注册账号可以进入实时对战中的“排位匹配”，每场固定使用 BO3，并会计入个人 Elo 和排位战绩。

这次也重新调整了匹配规则：前 15 秒优先寻找 ±100 Elo 内的对手，之后依次放宽到 ±200、±350 和 ±600；等待 90 秒后不再受 Elo 分差限制。这样在人少的时段，也不会因为“必须找到非常接近的分数”而一直排不到人。

Elo 变化现在更稳定：任一方排位场次少于 10 场时会使用更高的 K 值，帮助新玩家更快完成定级；临时玩家和老玩家对局时双方使用一致的变动幅度，胜负变化保持零和，不会凭空增加或减少总分。匹配成功后，会优先选择当前可用且 Elo 差距最小的对手。

## 这次更新还包括

- 角色立绘、图鉴和其他运行时素材逐步迁移到独立资源域名，减少主站资源包体，也降低新素材发布对主站的影响。
- 排位入口、Elo 展示和等待规则说明同步更新，中文、日文和英文界面保持一致。

排位人数本身仍然会影响等待时间，但现在匹配会在合理范围内主动放宽条件，不再让单个玩家无限期等待。

<!-- fireflydle:announcement:end -->

## 工程更新

- 启用 `ranked-match` 内容活动，并将其接入普通角色实时对战入口。
- 匹配范围按等待时间从 `±100` 逐步扩展至 `±200`、`±350`、`±600`，等待 90 秒后允许跨越更大的 Elo 分差。
- 匹配候选在满足范围后按 Elo 差距、入队时间和票据 ID 稳定排序，优先撮合最接近的对手。
- Elo 在任一方排位场次不足 10 场时使用较高 K 值帮助新玩家定级，双方使用同一个 K 值并保持零和；失败方 Elo 不会低于 100。
- 增加 Elo、匹配范围和排位入口的回归测试。
- 运行时素材支持通过 Cloudflare R2 独立托管，并补充 CORS、缓存、校验和发布流水线配置。
- 账号验证、密码重置、反馈通知和运维告警迁移至 Cloudflare Email Service；保留 Email Routing 处理收件转发。
- 更新部署文档与 CI 权限说明，发布流程增加 R2 资源同步和 Email Service binding 校验。
- 全部工作区版本同步至 `1.2.0`。

## 发布前验证

- `bun install --frozen-lockfile`
- `bun run format:check`
- `bun run typecheck`
- contracts、game-data、game-engine、Web 与 Worker 测试
- `bun run build`
- `wrangler deploy --dry-run`
- `bun run assets:validate` 与 `bun run assets:upload`
- 检查生产 Worker 的 `EMAIL` `send_email` binding、R2 bucket 和相关域名配置
