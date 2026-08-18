# Fireflydle 题库扩展：官方一手资料来源调研

调研日期：**2026-08-09**。

本文只评估 HoYoverse、HoYoLAB、HoYoWiki 和《崩坏：星穹铁道》官网的一手发布表面。接口当前公开可读，不代表 HoYoverse 对其 schema、可用性或素材再分发作出长期承诺。

## 结论

1. **可玩角色可以继续高度自动化。** 官网 Character 内容频道适合决定正式名单、三语名称和官方图片；HoYoWiki `角色` 菜单适合复核属性、命途、稀有度与宽泛阵营；官网版本更新公告适合确认版本边界。
2. **NPC 有官方候选全集，但没有官方“重要程度”。** HoYoWiki 明确提供 `NPC` 菜单，2026-08-09 中文快照有 436 条；它适合生成候选集，不应直接把全部条目变成每日答案。
3. **NPC 的名称、头像、身份、阵营和首次登场版本并非每条都齐全。** 列表层只有一个粗粒度 `npc_factions`；详情层字段会在 `实装版本`、`首次登场`之间变化，也可能完全缺失。列表阵营与详情阵营还可能不一致。
4. **“地区”没有可直接复用的统一官方字段。** Character/NPC 的“阵营”枚举混合了地点与组织，例如贝洛伯格、仙舟「罗浮」、星核猎手和星际和平公司。不能把该字段直接改名为 `region`。
5. **重要剧情对象分散在多个官方分类。** 星神属于 `星神` 菜单，首领形态属于 `敌人` 菜单；它们与 NPC 的可比较字段不同。产品于 2026-08-15 确认只做星神图片题池，不做敌人或首领题池。

因此，当前采用的扩池方式是：保留可玩角色为核心池；从官方 NPC 候选集中维护一个轻量审核白名单；星神建立独立图片题池；敌人数据只保留调研事实，不进入产品范围。

## 来源与字段覆盖

| 官方来源                                                                                                                                                                | 官方分类      | 可稳定支持                                                               | 不能直接支持                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| [游戏官网 Character 页](https://hsr.hoyoverse.com/zh-cn/character)及其内容频道                                                                                          | 可玩角色      | 正式展示名单、三语展示名、官网图片、官网展示分组、内容 ID、生效时间      | 游戏内部 ID、命途、稀有度、严格首发版本、组织级派系       |
| [HoYoWiki 角色菜单](https://wiki.hoyolab.com/pc/hsr/home) `menu_id=104`                                                                                                 | 可玩角色      | 名称、图片、属性、命途、稀有度、可多选的宽泛阵营                         | 游戏内部 ID、严格首发版本、稳定的地区/组织拆分            |
| [游戏官网版本公告频道](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=250&iPage=1&iPageSize=500&sLangKey=zh-cn) | 正式版本      | 版本号、公告 ID、正式更新时间、公告原文                                  | 自动给每个 NPC 标注首次登场；只按日期推断角色首发也不充分 |
| [HoYoWiki NPC 菜单](https://wiki.hoyolab.com/pc/hsr/home) `menu_id=105`                                                                                                 | NPC           | 官方收录身份、名称、图标、粗粒度阵营；部分详情含身份、派系和首次登场版本 | 官方重要度、完整地区、每条一致的版本字段、完整三语覆盖    |
| HoYoWiki `星神` 菜单 `menu_id=119`                                                                                                                                      | 星神          | 名称、官方词条、图片、详情文本                                           | NPC 属性、可玩角色战斗属性、官方难度分级                  |
| HoYoWiki `敌人` 菜单 `menu_id=112`                                                                                                                                      | 敌人/剧情首领 | 名称、图片、弱点、强度类型、敌人阵营                                     | NPC 身份、可玩命途、角色稀有度                            |
| HoYoWiki `派系` 菜单 `menu_id=120`                                                                                                                                      | 派系          | 派系名称、相关命途、详情说明                                             | 规范化的角色成员关系、角色唯一地区                        |
| HoYoWiki `地图数据` 菜单 `menu_id=138`                                                                                                                                  | 地图          | 部分世界的地图词条                                                       | 完整世界清单、角色到地区的结构化关系                      |

## 1. 可玩角色：继续使用双官方来源

### 官网 Character 内容频道

官网 Character 页实际使用 HoYoverse `content_v2_user` 读取角色内容：

- [中文角色列表](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=242&iPage=1&iPageSize=500&sLangKey=zh-cn)
- [英文角色列表](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=242&iPage=1&iPageSize=500&sLangKey=en-us)
- [日文角色列表](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=242&iPage=1&iPageSize=500&sLangKey=ja-jp)
- [中文 Character 页签](https://sg-public-api-static.hoyoverse.com/content_v2_user/app/113fe6d3b4514cdd/getContentList?iChanId=241&iPage=1&iPageSize=500&sLangKey=zh-cn)

频道 242 的条目提供 `iInfoId`、`sTitle`、`sExt.name`、`sExt.cha-id`、官方头像/海报 URL、`sCategoryName`、`dtStartTime` 和 `dtEndTime`。这组字段适合回答“官网目前正式展示哪些可玩角色形态”，也适合跨语言对齐。

但 `dtStartTime` 是官网内容生效时间，不天然等于游戏内首次可获得版本。项目已有银狼、卡芙卡等预览时间与实装时间不同的案例，因此首发版本必须再对照正式版本公告，不能只按角色条目的发布时间推断。

### HoYoWiki 角色菜单

[HoYoWiki HSR](https://wiki.hoyolab.com/pc/hsr/home)的 `get_menus` 返回 `角色` 菜单 `menu_id=104`。对应筛选器在 2026-08-09 提供：

- `character_combat_type`：量子、物理、风、火、虚数、雷、冰；
- `character_paths`：毁灭、巡猎、智识、同谐、虚无、存护、丰饶、记忆、欢愉；
- `character_rarity`：四星、五星；
- `character_factions`：可多选宽泛阵营。

可复现接口：

- [菜单定义 `get_menus`](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/get_menus)
- [角色筛选器 `get_menu_filters?menu_id=104`](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/get_menu_filters?menu_id=104)
- `POST https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/get_entry_page_list`

角色列表请求体：

```json
{ "filters": [], "menu_id": "104", "page_num": 1, "page_size": 50, "use_es": true }
```

请求需使用 HoYoWiki 网页客户端相同的 `x-rpc-wiki_app: hsr`、`x-rpc-language` 和 `x-rpc-client_type: 4` 等请求头。该接口是第一方网页的数据源，但未发现公开开发者 SLA 或固定 schema 契约。

## 2. NPC：官方候选集可用，但必须审核准入

### 官方候选全集

HoYoWiki `get_menus` 明确把 `NPC` 放在“人物图鉴”下，菜单 ID 为 `105`。对应接口为：

- [NPC 筛选器](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/get_menu_filters?menu_id=105)
- `POST https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/get_entry_page_list`

NPC 列表请求体：

```json
{ "filters": [], "menu_id": "105", "page_num": 1, "page_size": 50, "use_es": true }
```

2026-08-09 快照结果：

| 语言    | 列表条目数 |
| ------- | ---------: |
| `zh-cn` |        436 |
| `en-us` |        433 |
| `ja-jp` |        432 |

中文 436 条中，429 条在列表层具有 `npc_factions`，7 条为空；名称去重后为 434，说明还存在同名/重复展示问题。三语数量也不同，所以不能假设所有 NPC 都能直接进入三语猜测候选。

NPC 筛选器只有一个单选字段 `npc_factions`。2026-08-09 的官方枚举为：星穹列车、太空站「黑塔」、贝洛伯格、仙舟「罗浮」、星核猎手、星际和平公司、匹诺康尼、仙舟「朱明」、仙舟「曜青」、翁法罗斯、二相乐园。

这些值同时包含地点与组织，字段本身也叫“阵营”，因此只能原样保存为 `officialFactionLabel`，不能无损转换成统一 `regionId`。

### 详情字段的真实情况

NPC 详情通过 `GET entry_page?entry_page_id=...` 取得。以下是可直接核验的官方样本：

| 条目                                                                                                                                        | 官方详情支持的事实                                                            | 发现的问题                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| [帕姆](https://wiki.hoyolab.com/pc/hsr/entry/581) / [API](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id=581)       | 阵营“星穹列车”、身份“星穹列车列车长”、派系“无名客 - 开拓”、`实装版本=1.0版本` | 版本键叫“实装版本”                               |
| [奥列格](https://wiki.hoyolab.com/pc/hsr/entry/1039) / [API](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id=1039)   | 阵营“贝洛伯格”、身份“地火领袖”、`实装版本=1.0版本`                            | 只有宽泛阵营，没有独立地区字段                   |
| [史瓦罗](https://wiki.hoyolab.com/pc/hsr/entry/803) / [API](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id=803)     | 阵营“贝洛伯格”、身份“贴身机器卫士”、`实装版本=1.0版本`                        | 名称键使用“姓名”，其他样本使用“名称”             |
| [螺丝咕姆](https://wiki.hoyolab.com/pc/hsr/entry/1120) / [API](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id=1120) | 阵营“天才俱乐部”、身份“天才俱乐部 #76号会员”、`首次登场=1.1版本`              | 列表层 `npc_factions` 为空；版本键改为“首次登场” |
| [路易斯](https://wiki.hoyolab.com/pc/hsr/entry/2011) / [API](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id=2011)   | 阵营“匹诺康尼”、身份“艺术批评家”                                              | 没有首次登场/实装版本                            |
| [斯科特](https://wiki.hoyolab.com/pc/hsr/entry/3058) / [API](https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/entry_page?entry_page_id=3058)   | 阵营“星际和平公司”                                                            | 身份为占位符，且没有版本                         |

这些样本证明：

- `名称`/`姓名`、`实装版本`/`首次登场`需要显式别名归一化；
- 列表层筛选值不能覆盖详情层阵营；
- 缺失值必须保持 `null`，不能从剧情印象自动补齐；
- 官方收录为 NPC 只证明它属于官方 NPC 图鉴，不证明它适合成为大众题目。

### “重要 NPC”没有官方标签

HoYoWiki 没有 `importance`、`main_story` 或相近的结构化筛选器。部分详情的富文本会列出开拓任务、同行任务和“相关角色”，但覆盖与写法不统一，不能当作稳定 API 契约。

因此“重要 NPC”必须是 Fireflydle 的编辑判断。建议只有同时满足以下条件的 NPC 才进入第一批白名单：

1. 必须存在官方 HoYoWiki NPC 条目和稳定 `entry_page_id`；
2. 中/英/日至少能按同一 `entry_page_id` 对齐，缺失语言时不进入三语正式池；
3. 有可区分的官方头像，不使用通用路人占位图；
4. 至少有两个可用于公平判题的官方事实字段；
5. 有官方的首次登场版本字段，或逐条引用对应的官网版本公告/任务页面；
6. “重要”理由由版本控制白名单记录，例如主线关键人物、反复参与开拓任务或有独立官方介绍；机器同步不能自行提升重要度。

`importanceTier`、`quizEligible` 和 `regionId` 都应标记为 Fireflydle 编辑字段，而不是伪装成 HoYoWiki 原始字段。

## 3. 剧情角色不等于 NPC

### 星神

HoYoWiki 的 `星神` 菜单为 `menu_id=119`。2026-08-09 列表返回 19 条，包括阿基维利、博识尊、希佩、伊德莉拉等；该菜单没有列表筛选器。它能给出官方名称、图片和详情，但不能提供可玩角色的属性、命途、稀有度，也不能提供 NPC 身份字段。

星神适合独立的“星神题池”或图片猜谜，不适合直接参与现有角色五字段比较。

### 剧情首领与敌对形态（调研保留，产品不采用）

HoYoWiki `敌人` 菜单为 `menu_id=112`。2026-08-09 列表返回 184 条，筛选器提供弱点属性、强度类型（普通敌方/强敌/首领）和敌人阵营。

这是一手、结构化的首领候选源，但敌人条目表示战斗形态，不一定等于人物身份；同一剧情人物还可能有多个首领形态。Fireflydle v1.0 不做敌人或首领题池，因此不建立 `enemyFormId` 或相关游戏规则。

### 派系和地图页的边界

HoYoWiki `派系` 菜单 `menu_id=120` 在快照中有 36 条并带相关命途筛选，但没有可直接导入的规范化“成员列表”。`地图数据` 菜单 `menu_id=138` 只有空间站「黑塔」、雅利洛-Ⅵ、仙舟「罗浮」三个列表条目，不能作为当前全部世界/地区的权威全集。

因此：

- 派系页可以作为人工核对某个组织定义的引用；
- 地图页可以证明某个地点名称，但不能自动决定角色所属地区；
- `regionId` 仍需审核型映射，并保留逐条官方证据链接。

## 4. 首次登场版本的证据规则

### 可玩角色

官网版本公告频道 250 给出正式版本标题、`iInfoId` 和更新时间，例如 [2.7 版本更新说明](https://hsr.hoyoverse.com/zh-cn/news/127247)。可玩角色首发版本应优先由公告正文或同期官方跃迁公告明确证明。

仅当角色内容生效时间与公告证据一致时，才能自动接受版本映射；若官网预览早于实装，必须人工 override 并保存公告 ID。

### NPC

优先读取 HoYoWiki 详情基本信息中的原始字段：

1. `首次登场`；
2. `实装版本`；
3. 若两者都缺失，保持 `null`，再由审核人员引用对应版本公告、官方任务页或官方角色介绍补证。

不要使用 HoYoWiki 条目的上传时间、`version` 值或 `entry_page_id` 顺序推断游戏首次登场。这些值只描述 Wiki 内容记录，不描述游戏版本语义。

## 5. 推荐的数据来源模型

题库实体应把官方事实、归一化值和编辑判断分开：

```ts
type QuestionEntity = {
  id: string;
  entityKind: "playable" | "npc" | "aeon";
  sourceMenuId: "104" | "105" | "119" | "112";
  sourceEntryPageId: string;
  names: { zhCN: string; en?: string; ja?: string };
  officialFactionLabels: string[];
  officialIdentity?: string;
  officialDebutLabel?: string;

  // 以下是 Fireflydle 归一化或编辑字段，不是官方原始字段。
  factionId?: string;
  regionId?: string;
  debutVersionId?: string;
  importanceTier?: "core" | "recognizable" | "expert";
  quizEligible: boolean;

  provenance: Array<{
    field: string;
    sourceUrl: string;
    sourceField?: string;
    fetchedAt: string;
    responseSha256: string;
  }>;
};
```

同步时应保留原始 `officialFactionLabels` 和 `officialDebutLabel`，再生成归一化字段。这样官方页面更改标签、出现多重阵营或补全版本时，可以审计差异，而不会静默改变历史对局语义。

## 6. 对 v1.0 扩池的实际建议

1. **核心池**：全部已正式实装、字段完整的可玩角色形态；名单闸门仍由官网 Character 频道控制。
2. **NPC 入门池**：只收录通过上述六项准入规则的审核白名单。不要以 436 条官方 NPC 列表作为上线目标。
3. **NPC 专家池**：允许身份或版本字段较少的官方 NPC，但不得进入默认每日题和新手局。
4. **星神池**：使用 `menu_id=119` 建立独立图片玩法；`menu_id=112` 的敌人数据不进入产品题池。
5. **版本快照**：题目生成时保存题池修订和规则快照；官方来源更新不应追溯修改已完成对局。

第一阶段最值得实现的不是“抓取更多名字”，而是 NPC 候选同步器、字段覆盖率报告和版本控制白名单。只有这三项存在，题库扩展才可持续且可审计。

## 7. 抓取与权利边界

- HoYoWiki API 请求需要分页、限速、缓存和响应哈希；不同语言短期不同步时应报警，不自动删除已审核条目。
- 页面公开可读不等于获得开放数据或图片再分发许可。应继续遵守 [HoYoverse Terms of Service](https://www.hoyoverse.com/zh-cn/company/terms)，保存素材来源 URL 与内容哈希，并维持下架流程。
- 不复制长篇剧情文本。题库只保存最小必要事实、缩略图及其来源元数据。
