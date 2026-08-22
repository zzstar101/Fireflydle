import { renderFeedbackEmail, type FeedbackEmailInput } from "./feedback-email-template";
import { sendEmail } from "./email";

export async function sendFeedbackEmail(
  env: Env,
  input: Omit<FeedbackEmailInput, "adminUrl">,
): Promise<void> {
  const content = renderFeedbackEmail({
    ...input,
    adminUrl: `${env.PUBLIC_WEB_URL.replace(/\/$/u, "")}/admin?tab=feedback`,
  });
  await sendEmail(env, {
    to: "zzstarwork@gmail.com",
    ...(input.contactEmail ? { replyTo: input.contactEmail } : {}),
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}
