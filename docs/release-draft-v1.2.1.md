# 萤一把 v1.2.1「4.5 角色与时装数据更新」

> v1.2.1 正式发布日志。

<!-- fireflydle:announcement:start -->

## 4.5 数据已更新

4.5 版本角色资料、版本筛选和搜索别名已经同步到题库。官网新增的「知更鸟·晴歌」与「砂金·戏浪」作为对应角色的官方时装加入图鉴和立绘挑战，外观不会作为重复角色进入题池。

本次同步同时更新了中文、英文和日文名称、版本信息，以及独立资源域名上的官方素材。已解锁对应角色的玩家可以在图鉴中查看新的外观。

<!-- fireflydle:announcement:end -->

## 工程更新

- 角色数据同步截止到 2026-08-26，并纳入 4.5 版本公告。
- 增加 HoYoverse 视觉变体排除配置，避免官网外观条目重复计入独立角色。
- 新增「知更鸟·晴歌」和「砂金·戏浪」两套 4.5 官方时装素材，加入资源清单校验和发布上传流程。
- 同步元数据记录官网内容摘要、排除规则和 4.5 版本来源，便于后续审计和重现。
- 全部工作区版本同步至 `1.2.1`。

## 发布前验证

- `bun install --frozen-lockfile`
- `bun run sync:data -- --dry-run`
- `bun run format:check`
- `bun run typecheck`
- contracts、game-data、game-engine、Web 与 Worker 测试
- `bun run build`
- `bun run assets:validate`
