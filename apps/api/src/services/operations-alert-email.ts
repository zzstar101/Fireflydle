import { renderOperationsAlertEmail } from "./operations-alert-email-template";
import { sendEmail } from "./email";

export async function sendOperationsAlertEmail(
  env: Env,
  input: { title: string; message: string; occurredAt: number },
): Promise<void> {
  const content = renderOperationsAlertEmail(input);
  await sendEmail(env, {
    to: "zzstarwork@gmail.com",
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}
