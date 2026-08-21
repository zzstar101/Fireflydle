import { renderFeedbackEmail, type FeedbackEmailInput } from "./feedback-email-template";

function resendApiKey(env: Env): string | null {
  if (!("RESEND_API_KEY" in env)) return null;
  const value = env.RESEND_API_KEY;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function sendFeedbackEmail(
  env: Env,
  input: Omit<FeedbackEmailInput, "adminUrl">,
): Promise<void> {
  const apiKey = resendApiKey(env);
  if (!apiKey) return;
  const content = renderFeedbackEmail({
    ...input,
    adminUrl: `${env.PUBLIC_WEB_URL.replace(/\/$/u, "")}/admin?tab=feedback`,
  });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: ["zzstarwork@gmail.com"],
      ...(input.contactEmail ? { reply_to: input.contactEmail } : {}),
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });
  if (!response.ok) throw new Error(`Resend 返回 ${response.status}`);
}
