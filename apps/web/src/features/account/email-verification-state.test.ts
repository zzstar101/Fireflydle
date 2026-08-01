import { describe, expect, it } from "vitest";
import { emailVerificationState } from "./email-verification-state";

describe("账号邮箱验证状态", () => {
  it.each([
    [{ hasEmail: false, emailVerified: false }, "missing"],
    [{ hasEmail: true, emailVerified: false }, "pending"],
    [{ hasEmail: true, emailVerified: true }, "verified"],
  ] as const)("将 %o 归类为 %s", (user, expected) => {
    expect(emailVerificationState(user)).toBe(expected);
  });
});
