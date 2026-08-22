const SENDER = {
  email: "account@fireflydle.games",
  name: "Fireflydle",
} as const;

export interface EmailDeliveryInput {
  to: string | EmailAddress | Array<string | EmailAddress>;
  subject: string;
  text: string;
  html: string;
  replyTo?: string | EmailAddress;
}

export class EmailDeliveryError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("Cloudflare Email Service failed to send the message");
    this.name = "EmailDeliveryError";
    this.code = code;
  }
}

function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "EMAIL_SEND_FAILED";
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[A-Z0-9_]+$/u.test(code) ? code : "EMAIL_SEND_FAILED";
}

export async function sendEmail(env: Env, input: EmailDeliveryInput): Promise<EmailSendResult> {
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
    throw new EmailDeliveryError("EMAIL_BINDING_MISSING");
  }

  try {
    return await env.EMAIL.send({
      from: SENDER,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
  } catch (error) {
    const code = errorCode(error);
    console.error(JSON.stringify({ event: "email-send-failed", code }));
    throw new EmailDeliveryError(code);
  }
}
