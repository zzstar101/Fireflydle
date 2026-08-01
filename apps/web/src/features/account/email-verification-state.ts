import type { PublicUser } from "@fireflydle/contracts";

export type EmailVerificationState = "missing" | "pending" | "verified";

export function emailVerificationState(
  user: Pick<PublicUser, "hasEmail" | "emailVerified">,
): EmailVerificationState {
  if (!user.hasEmail) return "missing";
  return user.emailVerified ? "verified" : "pending";
}
