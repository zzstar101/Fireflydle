# 发布版本

## 1.2.2 起的统一公告流程

- GitHub Release：使用 Release 正文中的公告区块。
- 手动部署：使用 `docs/release-announcement.md`，发布前同时更新该文档及 package 版本。
- 定时同步：每天北京时间 12:23 检查官网和 BWiki，比较线上 `/api/characters`。无变化就跳过发布；有变化则自动生成公告，并经过全部测试、R2、D1、Worker、Pages 发布后再发布公告。
- 角色减少、Wiki 字段缺失/歧义、未知枚举、官网与 Wiki 的版本或元素不一致时停止同步。失败由 GitHub Actions 报告，需处理后重跑。
- 自动同步按角色资料摘要去重；Release 和手动部署按版本标签去重。公告失败会使整个工作流失败，可重跑失败 job 补发，无需重新发布版本。

2026-09-28 修复的历史原因：旧工作流曾在 push 时部署，却仅在 release 事件发布公告；v1.2.0、v1.2.1 的 release 流程失败后，后续 push 修复部署没有执行公告步骤。v1.2.2 站内公告统一补充这些版本的玩家说明。

GitHub Release 正文必须包含一个面向玩家的公告区块：

```markdown
<!-- fireflydle:announcement:start -->

这里填写面向玩家的版本更新日志。支持标题、列表、加粗和链接，不支持图片。

<!-- fireflydle:announcement:end -->
```

区块之外可以继续填写迁移说明、内部实现或其他技术信息。部署工作流会在任何线上变更前校验该区块；缺失、内容为空或包含图片时，部署不会开始。

Worker、D1 和 GitHub Pages 全部部署成功后，工作流会以 Release 名称为标题、以上述区块为正文，自动向全部玩家发布“版本更新”公告。同一 Release 标签重复执行工作流不会重复创建公告。

发布前需要将同一份随机值分别配置为：

- GitHub Actions Secret：`RELEASE_ANNOUNCEMENT_TOKEN`
- Cloudflare Worker Secret：`RELEASE_ANNOUNCEMENT_TOKEN`
