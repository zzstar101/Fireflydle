# 萤一把 v1.2.1「4.5 角色数据更新」

> v1.2.1 正式发布日志。

<!-- fireflydle:announcement:start -->

## 4.5 数据已更新

4.5 版本角色资料、版本筛选和搜索别名已经同步到题库。官网新增的「知更鸟·晴歌」与「砂金·戏浪」作为两名独立角色加入图鉴和立绘挑战，分别对应「记忆·风」与「欢愉·量子」。

本次同步同时更新了中文、英文和日文名称、版本信息，以及独立资源域名上的官方素材。

<!-- fireflydle:announcement:end -->

## 工程更新

- 角色数据同步截止到 2026-08-26，并纳入 4.5 版本公告。
- 增加新游戏 ID 的人工元数据覆盖，纳入官网已发布但 StarRailRes 尚未收录的 4.5 角色。
- 新增「知更鸟·晴歌」和「砂金·戏浪」两名 4.5 独立角色及官方素材，加入资源清单校验和发布上传流程。
- 同步元数据记录官网内容摘要、手工属性覆盖和 4.5 版本来源，便于后续审计和重现。
- 全部工作区版本同步至 `1.2.1`。

## 发布前验证

- `bun install --frozen-lockfile`
- `bun run sync:data -- --dry-run`
- `bun run format:check`
- `bun run typecheck`
- contracts、game-data、game-engine、Web 与 Worker 测试
- `bun run build`
- `bun run assets:validate`
