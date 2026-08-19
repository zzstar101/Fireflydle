# 生产延迟与普通角色字段核对（2026-08-19）

## 结论

- 目前没有证据证明 Workers Paid 计划本身直接导致 p95/p99 上升。
- 公开探测中，普通角色题库接口是最明显的长尾来源：响应约 195 KB，重复请求仍会回源；币战题库约 35 KB，延迟明显更低。
- 生产 Web 当前使用普通角色 manifest `1.0.3327749650`，请求该版本的 `/api/characters` 返回 200 和一年 immutable 缓存头；不匹配版本会返回 409。这说明版本协商正常，但缓存命中率仍需要在 Cloudflare Analytics 中确认。
- 移动端运行中对局的关键操作已压缩到 360x780 首屏：剩余次数和计时在信息条，输入框与提交按钮紧随其后。
- 普通角色当前仓库题库 90 条，Wiki 角色图鉴当前也返回 90 条。属性、命途、稀有度、版本逐项比对没有发现枚举或数值不一致；“三月七”是仓库合并展示名，对应 Wiki 的“三月七·存护”条目。

## 性能证据

以下是对生产公开接口的 20-30 次串行 HTTP 探测，测量的是客户端到 Cloudflare 的完整请求时间，不等于 Analytics Engine 记录的 Worker CPU 时间：

| Endpoint                                         |      Median |         P95 |      Max | 备注                    |
| ------------------------------------------------ | ----------: | ----------: | -------: | ----------------------- |
| `/api/health`                                    |   约 432 ms |   约 452 ms |   603 ms | 不访问 D1，作为边缘基线 |
| `/api/currency-wars/units?manifestVersion=1.1.1` |   约 537 ms |   约 577 ms |   710 ms | 约 35 KB                |
| `/api/characters?manifestVersion=1.0.3327749650` | 约 1,009 ms | 约 1,323 ms | 1,350 ms | 约 195 KB               |

代码层面，普通角色公开接口当前通过 `getEnabledCharacters()` 读取 D1、解析 90 条 JSON，再序列化整包响应；它位于 `apps/api/src/routes/characters.ts` 和 `apps/api/src/lib/db.ts`。路由设置了 `public, max-age=31536000, immutable`，但当前重复探测仍观察到约 1 秒级回源耗时，因此下一步应从 Cloudflare Cache Analytics/Analytics Engine 核对命中率，再决定是否增加显式 Cache API 或改为发布 manifest 静态响应。

Worker Paid 计划变更只能说明资源上限和计费模式发生变化，不能单独解释这条接口的长尾；当前证据更支持“普通角色包体和 D1/序列化路径是主要候选原因”。

## 普通角色 Wiki 核对

来源：

- [BWIKI 角色图鉴](https://wiki.biligame.com/sr/%E8%A7%92%E8%89%B2%E5%9B%BE%E9%89%B4)：从角色卡片的 `data-param1` 至 `data-param4` 读取稀有度、命途、属性和版本。
- 仓库 `packages/game-data/src/generated/characters.json`：当前发布题库 90 条。
- 仓库 `packages/game-data/src/generated/sync-metadata.json`：记录 90/90 的属性、命途、稀有度、阵营、版本覆盖率，以及 BWiki 阵营字段审核来源。
- [BWIKI 语义接口](https://wiki.biligame.com/sr/api.php?action=ask&format=json)：阵营核对使用“阵营”字段，不使用“初始阵营”或“派系”。

核对结果：

- 90/90 角色都有 Wiki 图鉴对应项或明确的合并展示映射。
- 90/90 的属性、命途、稀有度和版本与图鉴字段一致。
- “三月七”是仓库为基础角色形态保留的合并展示名；Wiki 图鉴按形态展示为“三月七·存护”和“三月七·巡猎”，仓库另有独立的巡猎条目。
- 阵营字段沿用项目既定人工审核口径；“初始阵营”与“派系”不作为普通模式的同一字段替代。
- 绯英的 Wiki 页面和官方分类均指向“二相乐园 / Planarcadia”；项目已移除没有角色级一手证据的“哀丽秘榭”地区文案，地区改为宽泛显示“二相乐园”。

地区字段的完整来源审计见：[普通角色地区来源审计](ordinary-character-region-audit-2026-08-19.md)。

## 移动端复现

在生产页面 `https://fireflydle.games/playable/practice`、360x780 视口复现：

- 修复前：准备页“开始游戏”约在 `y=848`；进入对局后输入框约在 `y=934`。
- 修复后：准备页按钮约在 `y=648-700`；运行中对局输入框约在 `y=664-712`，提交按钮约在 `y=724-772`，并通过压缩间距将其收进首屏底部。

修复位置：`apps/web/src/features/game/game.css` 的移动端规则。移动端运行中对局隐藏重复的左侧规则栏，保留信息条中的剩余次数、计时和在线状态。

## 后续建议

1. 在 Cloudflare Analytics 中按 `/api/characters`、`/api/games`、`/api/session` 分路由查看 Worker CPU p95/p99 与总请求 p95/p99，区分 D1/序列化长尾和网络传输长尾。
2. 核对 `CF-Cache-Status` 或 Cache Analytics；如果普通角色 manifest 请求持续 MISS，优先把发布 manifest 作为静态/显式缓存响应，避免每次从 D1 读取并解析 90 条 JSON。
3. 只有在分路由数据确认后，再决定是否调整 Paid 计划资源或增加 Worker CPU 配额；不要把计划升级当作根因。
