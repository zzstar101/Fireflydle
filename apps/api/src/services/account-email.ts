export type AccountEmailKind = "email-verification" | "password-reset";

export interface AccountEmailDelivery {
  kind: AccountEmailKind;
  email: string;
  token: string;
}

interface AccountEmailContent {
  path: string;
  subject: string;
  text: (url: string) => string;
  html: (url: string) => string;
}

const CONTENT: Record<AccountEmailKind, AccountEmailContent> = {
  "email-verification": {
    path: "/verify-email",
    subject: "验证 Fireflydle 邮箱",
    text: (url) =>
      `请在 24 小时内打开以下链接验证邮箱：\n\n${url}\n\n如果不是你发起的请求，可以忽略此邮件。`,
    html: (url) =>
      `<p>请在 24 小时内验证 Fireflydle 邮箱。</p><p><a href="${url}">验证邮箱</a></p><p>如果不是你发起的请求，可以忽略此邮件。</p>`,
  },
  "password-reset": {
    path: "/recover",
    subject: "Fireflydle 密码重置",
    text: (url) =>
      `请在 30 分钟内打开以下链接重置密码：\n\n${url}\n\n如果不是你发起的请求，可以忽略此邮件。`,
    html: (url) =>
      `<p>请在 30 分钟内重置 Fireflydle 密码。</p><p><a href="${url}">重置密码</a></p><p>如果不是你发起的请求，可以忽略此邮件。</p>`,
  },
};

function resendApiKey(env: Env): string | null {
  if (!("RESEND_API_KEY" in env)) return null;
  const value = env.RESEND_API_KEY;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function sendAccountEmail(env: Env, delivery: AccountEmailDelivery): Promise<void> {
  const apiKey = resendApiKey(env);
  if (!apiKey) {
    console.warn(
      JSON.stringify({
        event: "account-email-skipped",
        kind: delivery.kind,
        reason: "missing-secret",
      }),
    );
    return;
  }

  const content = CONTENT[delivery.kind];
  const baseUrl = env.PUBLIC_WEB_URL.replace(/\/$/u, "");
  const actionUrl = `${baseUrl}${content.path}?token=${encodeURIComponent(delivery.token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [delivery.email],
      subject: content.subject,
      text: content.text(actionUrl),
      html: content.html(actionUrl),
    }),
  });
  if (!response.ok) throw new Error(`Resend 返回 ${response.status}`);
}
