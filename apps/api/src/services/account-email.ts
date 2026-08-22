import {
  accountEmailPath,
  renderAccountEmail,
  type AccountEmailKind,
} from "./account-email-template";
import { sendEmail } from "./email";

export type { AccountEmailKind } from "./account-email-template";

export interface AccountEmailDelivery {
  kind: AccountEmailKind;
  email: string;
  token: string;
}

export async function sendAccountEmail(env: Env, delivery: AccountEmailDelivery): Promise<boolean> {
  const baseUrl = env.PUBLIC_WEB_URL.replace(/\/$/u, "");
  const actionUrl = `${baseUrl}${accountEmailPath(delivery.kind)}?token=${encodeURIComponent(delivery.token)}`;
  const content = renderAccountEmail(delivery.kind, actionUrl);
  await sendEmail(env, {
    to: delivery.email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
  return true;
}
