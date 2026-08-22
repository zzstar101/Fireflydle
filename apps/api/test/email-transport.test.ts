import { describe, expect, it, vi } from "vitest";
import { sendEmail } from "../src/services/email";
import { sendFeedbackEmail } from "../src/services/feedback-email";
import { sendOperationsAlertEmail } from "../src/services/operations-alert-email";

type EmailSendMock = (
  message: EmailMessage | EmailMessageBuilder,
) => Promise<EmailSendResult>;

function makeEnv(send: EmailSendMock): Env {
  return {
    EMAIL: { send },
    PUBLIC_WEB_URL: "https://fireflydle.games",
  } as unknown as Env;
}

describe("Cloudflare Email Service transport", () => {
  it("includes Reply-To for feedback with a contact address", async () => {
    const send = vi.fn<EmailSendMock>(async () => ({ messageId: "feedback-message" }));
    await sendFeedbackEmail(makeEnv(send), {
      id: "feedback-1",
      category: "bug",
      title: "反馈标题",
      description: "反馈内容",
      reproduction: "重现步骤",
      sourceUrl: "https://example.com/source",
      contactEmail: "player@example.com",
      submitterName: "测试玩家",
      attachmentCount: 1,
      submittedAt: Date.parse("2026-08-22T00:00:00.000Z"),
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { email: "account@fireflydle.games", name: "Fireflydle" },
        to: "zzstarwork@gmail.com",
        replyTo: "player@example.com",
        subject: expect.stringContaining("反馈标题"),
        text: expect.stringContaining("反馈内容"),
        html: expect.stringContaining("反馈标题"),
      }),
    );
  });

  it("omits Reply-To when feedback has no contact address", async () => {
    const send = vi.fn<EmailSendMock>(async () => ({ messageId: "feedback-message" }));
    await sendFeedbackEmail(makeEnv(send), {
      id: "feedback-2",
      category: "suggestion",
      title: "匿名建议",
      description: "建议内容",
      reproduction: "",
      sourceUrl: "",
      contactEmail: "",
      submitterName: "匿名玩家",
      attachmentCount: 0,
      submittedAt: Date.now(),
    });

    expect(send.mock.calls[0]?.[0]).not.toHaveProperty("replyTo");
  });

  it("sends operations alerts with the configured sender and admin recipient", async () => {
    const send = vi.fn<EmailSendMock>(async () => ({ messageId: "alert-message" }));
    await sendOperationsAlertEmail(makeEnv(send), {
      title: "D1 延迟升高",
      message: "监控检测到异常",
      occurredAt: Date.parse("2026-08-22T00:00:00.000Z"),
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { email: "account@fireflydle.games", name: "Fireflydle" },
        to: "zzstarwork@gmail.com",
        subject: expect.stringContaining("D1 延迟升高"),
        text: expect.stringContaining("监控检测到异常"),
        html: expect.stringContaining("D1 延迟升高"),
      }),
    );
  });

  it("sanitizes provider errors while preserving an actionable error code", async () => {
    const send = vi.fn<EmailSendMock>(async () => {
      throw Object.assign(new Error("recipient secret-token@example.com rejected"), {
        code: "E_RATE_LIMIT_EXCEEDED",
      });
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      sendEmail(makeEnv(send), {
        to: "secret-token@example.com",
        subject: "测试",
        text: "测试",
        html: "<p>测试</p>",
      }),
    ).rejects.toMatchObject({
      name: "EmailDeliveryError",
      code: "E_RATE_LIMIT_EXCEEDED",
      message: "Cloudflare Email Service failed to send the message",
    });
    expect(log).toHaveBeenCalledWith(
      JSON.stringify({ event: "email-send-failed", code: "E_RATE_LIMIT_EXCEEDED" }),
    );
    expect(log.mock.calls.flat().join(" ")).not.toContain("secret-token@example.com");
    log.mockRestore();
  });
});
