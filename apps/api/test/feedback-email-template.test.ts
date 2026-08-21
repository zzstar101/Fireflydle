import { describe, expect, it } from "vitest";
import { renderFeedbackEmail } from "../src/services/feedback-email-template";

describe("反馈通知邮件模板", () => {
  it("展示审核所需信息并转义用户内容", () => {
    const rendered = renderFeedbackEmail({
      id: "FB-TEST-001",
      category: "bug",
      title: "图鉴 <无法解锁>",
      description: "无尽猜中后 & 没有变化",
      reproduction: "进入无尽\n猜中角色",
      sourceUrl: "https://fireflydle.games/collection?a=1&b=2",
      contactEmail: "player@example.com",
      submitterName: "测试玩家",
      attachmentCount: 2,
      submittedAt: Date.parse("2026-08-21T04:00:00.000Z"),
      adminUrl: "https://fireflydle.games/admin?tab=feedback",
    });
    expect(rendered.subject).toContain("图鉴 <无法解锁>");
    expect(rendered.text).toContain("FB-TEST-001");
    expect(rendered.text).toContain("2 张");
    expect(rendered.html).toContain("图鉴 &lt;无法解锁&gt;");
    expect(rendered.html).toContain("无尽猜中后 &amp; 没有变化");
    expect(rendered.html).toContain("前往管理台审核");
    expect(rendered.html).not.toContain("<无法解锁>");
  });
});
