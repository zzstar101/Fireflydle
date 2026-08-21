export interface FeedbackEmailInput {
  id: string;
  category: "bug" | "suggestion" | "data";
  title: string;
  description: string;
  reproduction: string;
  sourceUrl: string;
  contactEmail: string;
  submitterName: string;
  attachmentCount: number;
  submittedAt: number;
  adminUrl: string;
}

const categoryLabels: Record<FeedbackEmailInput["category"], string> = {
  bug: "Bug",
  suggestion: "功能建议",
  data: "数据纠错",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function htmlLines(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export function renderFeedbackEmail(input: FeedbackEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const category = categoryLabels[input.category];
  const submittedAt = new Date(input.submittedAt).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
  const subject = `[萤一把反馈] ${category} · ${input.title}`;
  const optionalText = [
    input.reproduction ? `复现步骤 / 建议目标：\n${input.reproduction}` : "",
    input.sourceUrl ? `资料来源：${input.sourceUrl}` : "",
    input.contactEmail ? `联系邮箱：${input.contactEmail}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const text = `萤一把收到一条新的站内反馈

${category} · ${input.id}
${input.title}

${input.description}

提交用户：${input.submitterName}
附件：${input.attachmentCount} 张
提交时间：${submittedAt}（北京时间）${optionalText ? `\n\n${optionalText}` : ""}

前往管理台审核：${input.adminUrl}`;
  const optionalRows = [
    input.reproduction
      ? `<tr><td style="padding:8px 0;color:#8392a5;vertical-align:top;">复现 / 目标</td><td style="padding:8px 0 8px 20px;line-height:1.7;">${htmlLines(input.reproduction)}</td></tr>`
      : "",
    input.sourceUrl
      ? `<tr><td style="padding:8px 0;color:#8392a5;vertical-align:top;">资料来源</td><td style="padding:8px 0 8px 20px;"><a href="${escapeHtml(input.sourceUrl)}" style="color:#79d7e8;">${escapeHtml(input.sourceUrl)}</a></td></tr>`
      : "",
    input.contactEmail
      ? `<tr><td style="padding:8px 0;color:#8392a5;vertical-align:top;">联系邮箱</td><td style="padding:8px 0 8px 20px;"><a href="mailto:${escapeHtml(input.contactEmail)}" style="color:#79d7e8;">${escapeHtml(input.contactEmail)}</a></td></tr>`
      : "",
  ].join("");
  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#07101d;color:#f6f0df;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#07101d;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#0d1a2a;border:1px solid #23364d;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 30px;border-bottom:1px solid #23364d;background:#0a1523;">
                <div style="font-size:12px;line-height:1.5;color:#79d7e8;">FIREFLYDLE · PLAYER FEEDBACK</div>
                <div style="margin-top:6px;font-size:21px;font-weight:700;">新的站内反馈</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <div style="font-size:12px;line-height:1.5;color:#d8b66b;">${escapeHtml(category)} · ${escapeHtml(input.id)}</div>
                <h1 style="margin:8px 0 14px;font-size:25px;line-height:1.35;">${escapeHtml(input.title)}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#c7d1dd;">${htmlLines(input.description)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #23364d;border-bottom:1px solid #23364d;font-size:13px;">
                  <tr><td style="padding:14px 0 8px;color:#8392a5;">提交用户</td><td style="padding:14px 0 8px 20px;">${escapeHtml(input.submitterName)}</td></tr>
                  <tr><td style="padding:8px 0;color:#8392a5;">附件</td><td style="padding:8px 0 8px 20px;">${input.attachmentCount} 张</td></tr>
                  <tr><td style="padding:8px 0 14px;color:#8392a5;">提交时间</td><td style="padding:8px 0 14px 20px;">${escapeHtml(submittedAt)}（北京时间）</td></tr>
                  ${optionalRows}
                </table>
                <a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;margin-top:24px;padding:12px 18px;background:#d8b66b;color:#07101d;text-decoration:none;font-weight:700;border-radius:4px;">前往管理台审核</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { subject, text, html };
}
