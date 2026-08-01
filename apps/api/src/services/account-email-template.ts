import { EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_TTL_MS } from "./account-token-policy";

export type AccountEmailKind = "email-verification" | "password-reset";

export interface RenderedAccountEmail {
  subject: string;
  text: string;
  html: string;
}

interface AccountEmailDefinition {
  path: string;
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  introduction: string;
  expiryMs: number;
  actionLabel: string;
  securityNote: string;
}

const DEFINITIONS: Record<AccountEmailKind, AccountEmailDefinition> = {
  "email-verification": {
    path: "/verify-email",
    subject: "[Fireflydle] 验证你的邮箱",
    preheader: "完成邮箱验证，让账号可以安全找回。",
    eyebrow: "账号安全 · EMAIL VERIFICATION",
    title: "确认你的邮箱",
    introduction: "你正在为 Fireflydle 账号绑定这个邮箱。完成验证后，它可以用于找回密码。",
    expiryMs: EMAIL_VERIFICATION_TTL_MS,
    actionLabel: "验证邮箱",
    securityNote: "如果你没有注册或绑定 Fireflydle 账号，可以忽略这封邮件；邮箱不会因此被验证。",
  },
  "password-reset": {
    path: "/recover",
    subject: "[Fireflydle] 重置你的密码",
    preheader: "使用限时链接为 Fireflydle 账号设置新密码。",
    eyebrow: "账号安全 · PASSWORD RESET",
    title: "设置新密码",
    introduction: "我们收到了 Fireflydle 账号的密码重置请求。请使用下面的限时链接继续。",
    expiryMs: PASSWORD_RESET_TTL_MS,
    actionLabel: "重置密码",
    securityNote: "如果这不是你的操作，可以忽略这封邮件；原密码不会改变。",
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function durationLabel(durationMs: number): string {
  const hours = durationMs / (60 * 60 * 1_000);
  if (Number.isInteger(hours) && hours >= 1) return `${hours} 小时`;
  return `${durationMs / (60 * 1_000)} 分钟`;
}

export function accountEmailPath(kind: AccountEmailKind): string {
  return DEFINITIONS[kind].path;
}

export function renderAccountEmail(
  kind: AccountEmailKind,
  actionUrl: string,
): RenderedAccountEmail {
  const definition = DEFINITIONS[kind];
  const expiry = durationLabel(definition.expiryMs);
  const safeActionUrl = escapeHtml(actionUrl);
  const text = `Fireflydle · 萤一把

${definition.title}

${definition.introduction}

请在 ${expiry}内完成操作。

${definition.actionLabel}：
${actionUrl}

${definition.securityNote}

需要帮助？请联系 account@fireflydle.games

Fireflydle 是非官方、非商业粉丝项目，与 HoYoverse / 米哈游没有隶属或合作关系。`;

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>${escapeHtml(definition.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#07101d;color:#f6f0df;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(definition.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#07101d;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#0d1a2a;border:1px solid #23364d;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:26px 32px;border-bottom:1px solid #23364d;background:#0a1523;">
                <div style="font-size:12px;line-height:1.5;letter-spacing:0.18em;color:#79d7e8;">FIREFLYDLE</div>
                <div style="margin-top:6px;font-size:22px;line-height:1.3;font-weight:700;color:#f6f0df;">萤一把</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 32px 32px;">
                <div style="font-size:12px;line-height:1.6;letter-spacing:0.1em;color:#d8b66b;">${escapeHtml(definition.eyebrow)}</div>
                <h1 style="margin:10px 0 16px;font-size:30px;line-height:1.3;color:#f6f0df;">${escapeHtml(definition.title)}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.8;color:#c7d1dd;">${escapeHtml(definition.introduction)}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="border-radius:999px;background:#d8b66b;">
                      <a href="${safeActionUrl}" target="_blank" style="display:inline-block;padding:13px 24px;font-size:16px;line-height:1.2;font-weight:700;color:#07101d;text-decoration:none;">${escapeHtml(definition.actionLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#9aa8b9;">链接将在 ${escapeHtml(expiry)}后失效。按钮无法打开时，请复制以下地址到浏览器：</p>
                <p style="margin:0 0 26px;font-size:13px;line-height:1.7;word-break:break-all;"><a href="${safeActionUrl}" style="color:#79d7e8;text-decoration:underline;">${safeActionUrl}</a></p>
                <div style="padding:16px 18px;background:#112033;border-left:3px solid #79d7e8;border-radius:8px;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#c7d1dd;">${escapeHtml(definition.securityNote)}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #23364d;background:#0a1523;">
                <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#9aa8b9;">需要帮助？可回复此邮件，或写信至 <a href="mailto:account@fireflydle.games" style="color:#79d7e8;">account@fireflydle.games</a>。</p>
                <p style="margin:0;font-size:12px;line-height:1.7;color:#6f7e91;">Fireflydle 是非官方、非商业粉丝项目，与 HoYoverse / 米哈游没有隶属或合作关系。</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: definition.subject, text, html };
}
