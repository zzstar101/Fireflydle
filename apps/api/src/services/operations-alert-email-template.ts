export interface OperationsAlertEmailInput {
  title: string;
  message: string;
  occurredAt: number;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderOperationsAlertEmail(input: OperationsAlertEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const occurredAt = new Date(input.occurredAt).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
  const subject = `[Fireflydle 运维预警] ${input.title}`;
  const text = `Fireflydle · 萤一把

${input.title}

${input.message}

发生时间：${occurredAt}（北京时间）

请登录管理后台查看指标和脱敏错误事件。`;
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
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#0d1a2a;border:1px solid #23364d;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 30px;border-bottom:1px solid #23364d;background:#0a1523;">
                <div style="font-size:12px;line-height:1.5;color:#79d7e8;">FIREFLYDLE · OPERATIONS</div>
                <div style="margin-top:6px;font-size:21px;font-weight:700;">萤一把运维预警</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px;">
                <div style="font-size:12px;line-height:1.5;color:#ee7d82;">CRITICAL ALERT</div>
                <h1 style="margin:8px 0 14px;font-size:26px;line-height:1.35;">${escapeHtml(input.title)}</h1>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#c7d1dd;">${escapeHtml(input.message)}</p>
                <div style="padding:14px 16px;border-left:3px solid #d8b66b;background:#112033;color:#9aa8b9;font-size:13px;line-height:1.7;">
                  发生时间：${escapeHtml(occurredAt)}（北京时间）<br>
                  请登录管理后台查看指标和脱敏错误事件。
                </div>
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
