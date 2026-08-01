import {
  accountEmailPath,
  renderAccountEmail,
  type AccountEmailKind,
} from "./account-email-template";

export type { AccountEmailKind } from "./account-email-template";

export interface AccountEmailDelivery {
  kind: AccountEmailKind;
  email: string;
  token: string;
}

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

  const baseUrl = env.PUBLIC_WEB_URL.replace(/\/$/u, "");
  const actionUrl = `${baseUrl}${accountEmailPath(delivery.kind)}?token=${encodeURIComponent(delivery.token)}`;
  const content = renderAccountEmail(delivery.kind, actionUrl);
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
      text: content.text,
      html: content.html,
    }),
  });
  if (!response.ok) throw new Error(`Resend 返回 ${response.status}`);
}
