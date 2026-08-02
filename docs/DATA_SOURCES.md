# Fireflydle 角色数据来源与发布规则

候选来源的字段覆盖、稳定性、许可风险和取舍记录见[角色数据源调研](./CHARACTER_DATA_SOURCE_RESEARCH.md)。

## 结论与覆盖率

当前发布快照截止 **2026-08-02 UTC**，收录国服已正式实装的 **90** 个可玩形态：

- HoYoverse 官网角色频道中已生效的 85 个形态，包含正式联动角色。
- 官网角色页未单列的 5 个开拓者命途形态。每个命途仅保留一行，男/女游戏 ID 成对合并；不同命途仍是独立猜测对象。
- 中/英/日名称 270/270，拼音输入和日文罗马字降级均为 90/90；element/path/rarity、阵营层级、首发版本和本地素材也均为 90/90。
- 共有 11 个官网阵营大组、12 个 BWiki 阵营细分、29 个正式版本公告、90 个经 SHA-256 校验的本地缩略图。

机器可读的实际来源修订、API URL、版本公告 ID、合并 ID 和覆盖率见
[`packages/game-data/src/generated/sync-metadata.json`](../packages/game-data/src/generated/sync-metadata.json)。

## 一手主来源：HoYoverse

同步脚本使用官方《崩坏：星穹铁道》[Character 页](https://hsr.hoyoverse.com/en-us/character)实际调用的 HoYoverse `content_v2_user` 公开内容端点。该端点没有对外稳定性承诺，所以它被当作可审计的官方发布表面，而不是有 SLA 的开发者 API。

| 频道 | 用途               | 使用字段                                                                                                 |
| ---- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| 242  | 三语角色名单与素材 | `sTitle`、`sExt.name`、`sExt.cha-id`、`sExt.avatarActivePC`、`sCategoryName`、`dtStartTime`、`dtEndTime` |
| 241  | 三语阵营分组       | `sTitle`、`sCategoryName`                                                                                |
| 250  | 正式版本上线日     | 标题中的 `Version x.y`、`iInfoId`、`dtStartTime`                                                         |

对每个频道分别请求 `zh-cn`、`en-us`、`ja-jp`。脚本以 `cha-id` 对齐三语，移除日文显示用 `<ruby>/<rt>` 标记，并且仅保留 `dtStartTime <= asOf < dtEndTime` 的条目。三语 ID 集不一致、返回数量低于审核阈值、未知阵营页签或未能与正式版本日对齐时，同步会失败且不覆盖上次有效数据。

可复现的 API 完整查询保存在同步元数据中。例如英文角色列表：

```text
https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=242&iPage=1&iPageSize=500&sLangKey=en-us
```

## 补充来源：StarRailRes

HoYoverse 角色页不公开游戏内部 ID、稀有度和命途枚举，也不单列男/女开拓者。这些缺口由 [Mar-7th/StarRailRes](https://github.com/Mar-7th/StarRailRes) 的定位 commit 补齐：

- 只读取 `index_min/{cn,en,jp}/characters.json` 中的 ID、element、path、rarity 事实。
- 名单纳入权始终来自 HoYoverse 频道；不会因为社区索引出现了一个 ID 就收录未实装角色。
- 开拓者使用成对游戏 ID 的枚举一致性检查，发布缩略图使用其中一个代表 ID。
- 每次同步先通过 GitHub commits API 解析 branch，然后用 40 位 commit SHA 抓取 raw 文件；不在一次发布中混用浮动 branch 的多个时点。

该仓库标记 [AGPL-3.0](https://github.com/Mar-7th/StarRailRes/blob/master/LICENSE)。这一标记不可解读为对 HoYoverse 图像、角色、商标或其他游戏内容的授权。本项目仅提取少量枚举事实，不复制该仓库的工具代码；实际 commit 和许可证链接保存在同步元数据中。

## 阵营来源：BWiki 角色图鉴

角色公开显示的阵营严格采用 [BWiki 角色图鉴](https://wiki.biligame.com/sr/%E8%A7%92%E8%89%B2%E5%9B%BE%E9%89%B4)的 `阵营` 字段。`初始阵营`与`派系`只用于人工核对，不会替换公开阵营。例如星期日为银河、桑博为贝洛伯格、知更鸟为匹诺康尼；不会分别改成家族、假面愚者或其他组织。

同步时通过 Semantic MediaWiki API 生成差异报告，再把已审核映射写入版本控制的 override，避免 BWiki 临时不可用或页面误改直接污染生产数据。BWiki 尚未填写阵营的正式角色继续使用 HoYoverse 角色页分类，待图鉴补全后人工复核。

## 权利边界

- Fireflydle 的 MIT 许可证只覆盖项目原创代码和文档。
- HoYoverse 端点可被公开访问不等于它向本项目授予了开放数据或素材许可。角色名、图像、商标及联动素材仍归各自权利人。参考 HoYoverse [Terms of Service](https://www.hoyoverse.com/en-us/company/terms)。
- 网站是免费、无广告、无赞助/捐款的非官方粉丝项目，不声称联系、认可或合作关系。
- 为降低再分发范围和站点体积，每个形态只保存一张经审核缩略图，同时服务 `avatarPath` 与 `portraitPath`。不保存官网全尺寸立绘。
- 素材随网站同一版本发布，不在浏览器中热链官方/CDN/GitHub。`sourceUrl`、来源时间、文件大小和 SHA-256 都保存在本地 manifest，支持追溯与下架。
- 收到权利人要求时应按项目 Legal 页的 takedown 流程处理，而不把本文档视为法律意见或授权证明。

## 审核型 override

[`sync-overrides.json`](../packages/game-data/src/data/sync-overrides.json) 只保留无法安全自动推导的事项：

- 官网两个同名“三月七”条目的游戏 ID 匹配。
- 为不同命途形态提供可区分的显示名、稳定 slug 和常用简称。它们仅进入 `aliases`，不会被显示或宣称为官方名。
- 银狼与卡芙卡在公测时已有官网预览条目，但实际可玩首发分别是 1.1 和 1.2；明确 override 避免把预览时间误当成 1.0。
- 5 个开拓者命途的男/女 ID 对、三语展示名和首发版本。

### 搜索别名

- [`pinyin-pro`](https://github.com/zh-lx/pinyin-pro) 为每个中文展示名生成无声调、有空格/无空格拼音；常用多音字、形态名与简称可在 override 中明确修正。
- 日文名优先读取 HoYoverse `<ruby><rt>` 注音，再用 [`WanaKana`](https://github.com/WaniKani/WanaKana) 转成可输入罗马字；长音同时保存完整与键盘简化形。官方日文只有汉字且未给 ruby 时，至少使用官方英文名作降级，不猜测读音。
- 两个工具库均为 MIT 许可，它们只用于生成搜索键，不提供任何游戏数据或素材权利。

### 阵营层级

每个角色只发布一个 `factionId`，界面也只显示这一项。`factionGroupId` 仅用于黄色“接近”判定，不作为第二阵营展示。BWiki 阵营属于更大的官网分类时使用父级，例如：

- 仙舟同盟 → 罗浮/曜青/朱明/玉阙；
- 银河 → 自灭者/纯美骑士团/博识学会/流光忆庭/假面愚者/巡海游侠/焚化工；
- 异界 → 异界(Fate系列)。

`factionId` 不从人物介绍推测，也不采用 BWiki 的`派系`数组。override 中每个细分阵营都列出使用它的游戏 ID，生成元数据再记录对应 HoYoverse `iInfoId`，可回溯审核。

新的同名角色、未知命途/阵营或无法对齐的版本会让同步失败；不允许用模糊猜测默默继续。

## 同步、缓存与发布

```powershell
# 只读抓取/验证，不覆盖已发布数据
bun run sync:data -- --dry-run --as-of 2026-08-02

# 使用已验证缓存做无网络回归检查
bun run sync:data -- --dry-run --offline --as-of 2026-08-02

# 发布同步：下载素材并原子更新小型清单
bun run sync:data -- --as-of 2026-08-02

# 可选：独立缓存位置或强制刷新素材
bun run sync:data -- --cache-dir tmp/fireflydle-data-cache --refresh-cache
```

默认为网络优先、有效缓存降级。同步先在内存/缓存中抓取、校验和生成全部数据；任意网络、结构、覆盖率、图片魔数或 schema 检查失败都不会覆盖上次有效清单。素材文件名包含内容哈希，先写入再切换 JSON；不自动删除旧素材。

生成物：

| 路径                                                  | 内容                                           |
| ----------------------------------------------------- | ---------------------------------------------- |
| `packages/game-data/src/generated/characters.json`    | 完整 `CharacterSchema` 数组                    |
| `packages/game-data/src/generated/factions.json`      | 官网三语阵营页签                               |
| `packages/game-data/src/generated/versions.json`      | 官方版本上线日和比较顺序                       |
| `packages/game-data/src/generated/sync-metadata.json` | 来源修订、公告 ID、覆盖率和合并决策            |
| `packages/game-data/generated/characters.sql`         | 三张表的可幂等 D1 发布 seed 与 soft-disable    |
| `apps/web/public/assets/characters/*`                 | 随站点发布的内容寻址缩略图                     |
| `apps/web/public/assets/manifest.json`                | 每个素材的本地路径、来源 URL、字节数与 SHA-256 |
| `apps/web/public/assets/manifest.sha256`              | `manifest.json` 本身的 SHA-256                 |

D1 SQL 按 `versions` → `factions` → `characters` 的顺序发布，三张表都以 `id` UPSERT，且不改写已有行的 `created_at`。每张表完成全量 UPSERT 后才把清单外历史行 soft-disable；角色还会同时清除 `target_eligible`，不会 `DELETE` 任何可能被历史数据引用的记录。这样 fresh D1 与已运行实例使用同一份 seed，都能得到 29 个版本、23 个阵营和 90 个可选角色。

Cloudflare `d1 execute --file` 要求 import 文件不含显式 `BEGIN/COMMIT`，因此每个 UPSERT 和 soft-disable 都是足够小、可重试的独立语句。只有完整同步通过来源、覆盖率、schema 与素材安全阈门后，才会生成并原子替换这份 seed。
