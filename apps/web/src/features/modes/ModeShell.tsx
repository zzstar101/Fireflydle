import type { ReactNode } from "react";
import type { Locale } from "@fireflydle/contracts";
import type { RegisteredContentMode } from "./mode-registry";

export function ModeShell({
  children,
}: {
  mode: RegisteredContentMode;
  locale: Locale;
  children: ReactNode;
}) {
  return <>{children}</>;
}
