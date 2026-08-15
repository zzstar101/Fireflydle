# NPC 正式题池与验收工件

快照日期：**2026-08-16**。本工件对应 T12 / Issue #13，并以 T10 / Issue #11 的 census 为唯一上游名单。

## 发布内容

- 机器可读正式 manifest：[`packages/game-data/src/data/npc-manifest.json`](../packages/game-data/src/data/npc-manifest.json)
- 逐项来源与人工审核审计：[`packages/game-data/src/data/npc-manifest-audit.json`](../packages/game-data/src/data/npc-manifest-audit.json)
- 发布 seam 校验：`bun run validate:npc-manifest`

正式 NPC target 为 **3** 个：`npc-pom-pom`、`npc-siobhan`、`npc-skott`。候选池同样只有这 3 个实体，因此 candidate-only 实际规模为 **0**。这不是缺省值：T10 census 中其余 431 条仍为 pending，2 条为 excluded；任何 pending 条目都不能通过本 manifest 进入搜索或答案池。

## 证据闭合

每个正式实体都同时具备：

1. HoYoWiki NPC 菜单的稳定 `entry_page_id`、三语名称和回退语言；
2. 本地可发布素材、来源 URL、人工辨识确认和 SHA-256；
3. 主叙事地区、主派系、首次剧情登场版本三项判题事实；
4. 官方版本公告作为版本锚点，以及具名 HoYoWiki 任务/活动条目作为首次登场和地区证据；
5. `sourceChecked`、`namesChecked`、`fallbackChecked`、`assetChecked`、`identityBoundaryChecked`、`regionChecked`、`factionChecked`、`debutChecked`、`humanApproved` 全部为 `true`。

素材保留在 `apps/web/public/assets/npcs/`，运行时不热链 HoYoWiki。素材权利声明仅允许非商业粉丝项目展示；权利人要求时必须下架。

## 正式白名单阻塞条件

`bun run validate:npc-manifest` 通过只表示数据 gate 通过，不等于 v1.0 已发布。以下任一条件未满足，都必须继续阻塞正式发布并沿用上一可用版本：

- 任一 target 的来源、名称回退、素材、地区、派系或首次登场证据不闭合；
- candidate-only 或 pending 条目越过审核进入 target 或候选池；
- 本地素材哈希、manifest 成员、审核快照或 census 统计漂移；
- NPC 运行时未完成独立题池/搜索隔离、4 次猜测和三语核心流程；
- Worker 与真实浏览器验收未证明提交不泄露未提交实体属性，或桌面/移动视口不可玩。

当前状态：**数据 gate passed；v1.0 release blocked**。本 ticket 不伪造运行时可玩验收，也不关闭父 Issue #1。
