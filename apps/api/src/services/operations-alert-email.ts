import { renderOperationsAlertEmail } from "./operations-alert-email-template";

function resendApiKey(env: Env): string | null {
  if (!("RESEND_API_KEY" in env)) return null;
  const value = env.RESEND_API_KEY;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function sendOperationsAlertEmail(
  env: Env,
  input: { title: string; message: string; occurredAt: number },
): Promise<void> {
  const apiKey = resendApiKey(env);
  if (!apiKey) return;
  const content = renderOperationsAlertEmail(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: ["zzstarwork@gmail.com"],
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });
  if (!response.ok) throw new Error(`Resend 返回 ${response.status}`);
}
