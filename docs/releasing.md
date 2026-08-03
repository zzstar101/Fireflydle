# 发布版本

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
