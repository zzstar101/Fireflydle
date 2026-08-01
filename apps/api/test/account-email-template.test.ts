import { describe, expect, it } from "vitest";
import {
  accountEmailPath,
  renderAccountEmail,
  type AccountEmailKind,
} from "../src/services/account-email-template";

const cases: Array<{
  kind: AccountEmailKind;
  path: string;
  subject: string;
  actionLabel: string;
  expiry: string;
}> = [
  {
    kind: "email-verification",
    path: "/verify-email",
    subject: "[Fireflydle] 验证你的邮箱",
    actionLabel: "验证邮箱",
    expiry: "24 小时",
  },
  {
    kind: "password-reset",
    path: "/recover",
    subject: "[Fireflydle] 重置你的密码",
    actionLabel: "重置密码",
    expiry: "30 分钟",
  },
];

describe("账号邮件模板", () => {
  for (const testCase of cases) {
    it(`渲染 ${testCase.kind} 的 HTML 与纯文本版本`, () => {
      const actionUrl = `https://fireflydle.games${testCase.path}?token=test-token`;
      const rendered = renderAccountEmail(testCase.kind, actionUrl);

      expect(accountEmailPath(testCase.kind)).toBe(testCase.path);
      expect(rendered.subject).toBe(testCase.subject);
      expect(rendered.text).toContain(testCase.actionLabel);
      expect(rendered.text).toContain(testCase.expiry);
      expect(rendered.text).toContain(actionUrl);
      expect(rendered.text).toContain("account@fireflydle.games");

      expect(rendered.html).toMatch(/^<!doctype html>/u);
      expect(rendered.html).toContain('lang="zh-CN"');
      expect(rendered.html).toContain('role="presentation"');
      expect(rendered.html).toContain(`href="${actionUrl}"`);
      expect(rendered.html).toContain(testCase.actionLabel);
      expect(rendered.html).toContain(testCase.expiry);
      expect(rendered.html).toContain('href="mailto:account@fireflydle.games"');
      expect(rendered.html.length).toBeLessThan(100_000);
    });
  }

  it("转义 HTML 中的动态链接", () => {
    const actionUrl = 'https://fireflydle.games/recover?token=a&next="><script>alert(1)</script>';
    const rendered = renderAccountEmail("password-reset", actionUrl);

    expect(rendered.text).toContain(actionUrl);
    expect(rendered.html).toContain(
      "token=a&amp;next=&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
  });
});
