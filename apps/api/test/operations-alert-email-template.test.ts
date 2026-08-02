import { describe, expect, it } from "vitest";
import { renderOperationsAlertEmail } from "../src/services/operations-alert-email-template";

describe("运维预警邮件模板", () => {
  it("输出文本与 HTML，并转义动态内容", () => {
    const rendered = renderOperationsAlertEmail({
      title: "D1 <80%>",
      message: "写入量 & 请求量接近额度",
      occurredAt: Date.parse("2026-08-02T12:00:00.000Z"),
    });
    expect(rendered.subject).toContain("D1 <80%>");
    expect(rendered.text).toContain("北京时间");
    expect(rendered.html).toContain("D1 &lt;80%&gt;");
    expect(rendered.html).toContain("写入量 &amp; 请求量接近额度");
    expect(rendered.html).not.toContain("<80%>");
  });
});
