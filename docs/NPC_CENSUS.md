# NPC census 与人工审核清单

快照日期：**2026-08-16**。对应 [T10 / Issue #11](https://github.com/zzstar101/Fireflydle/issues/11) 与[父规格 #1](https://github.com/zzstar101/Fireflydle/issues/1)。

机器可读快照位于
[`packages/game-data/src/data/npc-census.json`](../packages/game-data/src/data/npc-census.json)，生成与校验入口分别为 `bun run sync:npc-census` 和 `bun run validate:npc-census`。本工作只提供 census、建议和审核依据，**不实现 NPC 运行时、不创建正式题池 manifest，也不表示 v1.0 NPC 白名单已经最终批准**。

## 结论

官方 HoYoWiki 的 HSR `NPCs` 菜单（`menu_id=105`）当前三语联合共有 **436** 个稳定 `entry_page_id`。这个规模适合作为上游 census，不适合作为小型娱乐站的正式答案池：绝大多数条目缺少主叙事地区和首次剧情登场版本，官方托管图标也未必足够公平可辨识。

本轮按“证据闭合才升为 target、身份和三项字段可用才进入 candidate-only、其余默认 pending”得到：

| 状态           | 数量 | 含义                                                         |
| -------------- | ---: | ------------------------------------------------------------ |
| target 建议    |    3 | 来源、名称回退、素材、三项字段和具名登场证据完成逐项人工检查 |
| candidate-only |    0 | 本快照没有足够稳定的一手来源可批准为搜索候选                 |
| pending        |  431 | 仍有身份、字段、素材或来源争议，不属于可搜索候选池           |
| excluded       |    2 | 已确认是可玩角色重复项或同人格重复项                         |

规模由实际证据决定，不设置最低凑池数量。3 个 target 是可继续进入可玩验收的**建议起点**；本次没有批准 candidate-only。target 建议不是自动发布授权，父规格要求的正式白名单仍需在后续 manifest/运行时工作中整体批准和验收。

## 数据来源与可追溯性

### 官方托管 HoYoWiki

- [HoYoWiki HSR 首页](https://wiki.hoyolab.com/pc/hsr/home)的 `get_menus` 返回 `NPCs` 菜单 `menu_id=105`。
- [`get_menu_filters?menu_id=105`](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/get_menu_filters?menu_id=105)提供 NPC 宽泛阵营枚举。
- `POST get_entry_page_list` 提供稳定 `entry_page_id`、本地化名称、图标 URL 和宽泛阵营；快照逐页抓取 `zh-cn/en-us/ja-jp`。
- 每条记录都保存实体详情 API URL、`menu_id`、`entry_page_id` 和抓取时名称。整体响应规范化后保存 SHA-256，防止后续刷新无法解释差异。

HoYoWiki 是 HoYoLAB 官方托管、由编辑者与玩家共同维护的页面，不是有 SLA 的开放数据 API。它是当前最高可重复性的 NPC 名单、名称、宽泛阵营和素材索引，但不能单独证明首次剧情登场，也没有开放素材许可证。

### 官方版本公告

[HoYoverse `content_v2_user` 版本公告频道](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=250&iPage=1&iPageSize=500&sLangKey=en-us)用于把已人工确认的首次登场映射到正式版本。每个已填写版本的记录保存公告 `iInfoId`。

版本公告只能证明该版本的正式发布日期，不能独自证明某 NPC 在哪项任务首次出现。target 另存具名 HoYoWiki 任务/活动条目；只有同时具备稳定在线条目的记录才可提升为 target。

## 字段覆盖

| 项目                         | 覆盖      | 解释                                               |
| ---------------------------- | --------- | -------------------------------------------------- |
| 至少一个可用名称             | 436 / 436 | 缺少当前语言时按记录内 `fallbackLocale` 回退       |
| 简中/英/日三语名称           | 431 / 436 | 中文 436、英文 433、日文 432，语言发布存在短暂差异 |
| 可定位的官方托管图标         | 436 / 436 | 3 个 target 已人工抽查，其余只证明素材 URL 存在    |
| 实体级来源 URL 与 locator    | 436 / 436 | 每条都绑定 `entry_page_id`                         |
| 地区、派系、首次登场三项完整 | 13 / 436  | 完整不等于已批准；其中 3 个通过 target 全清单      |
| target 人工批准清单          | 3 / 3     | 仅指本次策展建议，不替代未来运行时可玩验收         |

官方 NPC 菜单只直接覆盖名称、宽泛阵营和图标。主叙事地区、具体主派系、首次剧情登场版本、身份合并边界和素材可辨识性都必须人工策展，不能根据 436 的总数自动填满。

## Target 建议

| 项目永久 ID | NPC    | 主叙事地区     | 主派系                  | 首次登场与证据                  |
| ----------- | ------ | -------------- | ----------------------- | ------------------------------- |
| npc-pom-pom | 帕姆   | Astral Express | Astral Express          | 1.0 / `A Moment of Peace`       |
| npc-siobhan | 舒翁   | Penacony       | Penacony                | 2.1 / `Vignettes in a Cup`      |
| npc-skott   | 斯科特 | Xianzhou Luofu | Interastral Peace Corp. | 1.3 / `Aurum Alley's Hustle...` |

这些建议刻意保守：三者都有项目自有永久 ID、三语名称、可辨识素材、身份边界、完整判题字段、官方版本公告、具名 HoYoWiki 任务/活动条目，以及能从该条目解释主叙事地区的来源定位。没有为了扩大题池而把只有游戏内任务定位、缺稳定在线任务条目的 NPC 直接升为 target。

## Candidate-only 结论

本快照没有批准 candidate-only。奥列格、史瓦罗、柯柯娜、查德威克和浮烟虽然有可用名称、图标和初步字段建议，但首次登场只能通过游戏内任务名称定位，缺少稳定的一手在线任务条目；它们保持 pending，不能被误认为“可搜索但不可作为答案”。

## Pending 与争议待定

其余 431 条保持 pending，不能误当成可搜索 candidate-only。下列条目已做过初步判断，适合优先补证：

| HoYoWiki ID | NPC        | 当前缺口                                               |
| ----------: | ---------- | ------------------------------------------------------ |
|         841 | 邓恩       | 图标为遮面通用铁卫模型，不足以公平辨识                 |
|        2529 | 米凯       | 首次剧情登场版本未闭合                                 |
|        2016 | 钟表小子   | 需确认独立存在与投影/吉祥物表现边界                    |
|        3297 | 「闭嘴」   | 有名称与素材，缺首次剧情登场证据                       |
|        1616 | 乔瓦尼     | 多语言阵营值不一致，跨活动导致主叙事地区含义不稳定     |
|        2253 | 蒂索克二世 | 与蒂索克三世合并方向已定，仍需确认面向玩家的唯一主名称 |

Mikhail、Gopher Wood、Tiernan 等高知名度 NPC 没有在本次官方 NPC 菜单快照中形成可稳定对齐的条目。按来源优先原则，本轮不使用社区页面补齐后直接进入 target；它们是明确的未决证据缺口，而不是被永久排除。

## 合并与排除边界

规则严格沿用父规格：

1. 换装、年龄阶段、投影和普通剧情形象默认合并到同一永久实体。
2. 官方明确具有独立人格或独立存在时才拆分，例如史瓦罗可与克拉拉拆分。
3. 战斗首领形态不入池；普通剧情 NPC 可以保留，但不能因首领形态再创建一个答案。
4. NPC 模式不收录可玩角色重复项；HoYoWiki `entry_page_id=903` 的黑塔因此排除。
5. 蒂索克三世（`2490`）合并到蒂索克二世（`2253`），不制造两个同人格候选。
6. 敌人、种族/群体名称、无稳定个体身份和纯战斗单位不因出现在其它官方菜单而补入 NPC census。

这两条 excluded 只是已经在本次 436 条官方 NPC 菜单中完成的明确决策。未审核条目保持 pending，而不是用名称启发式批量排除；这避免把独立人格、投影或后续剧情变化误判掉。

## 逐项人工审核清单

每条记录都有以下独立策展布尔项，不能由状态反推。除 `humanApproved` 外全部为 `true` 才允许进入 candidate-only；全部为 `true` 才允许成为 target：

- `sourceChecked`：实体级来源 URL、`entry_page_id` 和定位名称可复核。
- `namesChecked`：现有语言名称与展示标点已人工检查。
- `fallbackChecked`：缺当前语言时的回退名称可用且不会造成同名静默合并。
- `assetChecked`：素材能稳定定位，主体清晰、不是首领形态或过度相似的通用模型。
- `identityBoundaryChecked`：换装、年龄、投影、独立人格和首领形态边界已记录。
- `regionChecked`：唯一主叙事地区有证据且语义适合判题。
- `factionChecked`：唯一主派系已确认；不把来源的宽泛阵营误当更细组织。
- `debutChecked`：首次**剧情**登场版本有具名任务或等价一手证据，不以素材上传时间代替。
- `humanApproved`：维护者明确批准进入 target 建议。

校验脚本使用运行时 schema，阻止非法枚举、清单缺项、重复项目永久 ID、重复 `entry_page_id`、无来源、无有效回退名称、target/candidate-only 缺三项字段或具名登场证据、合并目标不存在、target 未批准和统计数字漂移。pending 的 census key 与项目永久 ID 分离，避免把上游 ID 当作项目身份。

## 未决证据缺口

- **首次登场证据是主要瓶颈。** HoYoWiki NPC 条目没有任务/版本字段；官方版本公告只能作为版本锚点。pending 需要逐项关联稳定的一手 Trailblaze/Companion/Adventure Mission 条目，不能只在自由文本中写任务名称。
- **地区与派系不是同一个字段。** HoYoWiki 的 `npc_factions` 是宽泛单值且三语偶有差异；跨地区活动 NPC 不能直接把活动发生地写成永久派系。
- **素材存在不等于公平。** 436 条都有官方托管图标，但只有 3 个 target 做过辨识度检查；通用模型、遮挡、首领形态和低信息头像仍需淘汰。
- **三语上游不同步。** 本次中文/英文/日文分别为 436/433/432；5 条缺少完整三语名称，只能按已记录回退显示，不应静默伪造译名。
- **官方菜单不是完整剧情角色全集。** 知名 NPC 缺稳定条目时保持待补证，不以 Fandom、BWiki 或搜索结果直接越过 target 审核门槛。

## 小型站复杂度边界

`npc-census.json` 是一次版本化快照，不是新的运行时事实来源。同步脚本按需手动运行并保存响应摘要；不增加定时抓取、数据后台、复杂审批流、跨源自动实体解析或图片下载。未来 NPC 运行时应消费经确认的更小白名单，而不是在请求时直连 HoYoWiki 或把 436 条 census 整体发布给玩家。
