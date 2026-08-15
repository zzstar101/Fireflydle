import { describe, expect, it } from "vitest";
import { getLegacyActivityRedirect } from "./mode-routing";

describe("模式活动 URL", () => {
  it.each([
    [
      "/daily",
      "?game=1f6f731f-f649-44fd-8243-2038df53d828",
      "/playable/daily?game=1f6f731f-f649-44fd-8243-2038df53d828",
    ],
    ["/random", "", "/playable/practice"],
    ["/duel", "", "/playable/duel"],
  ])("兼容旧入口 %s 并保留查询状态", (pathname, search, expected) => {
    expect(getLegacyActivityRedirect(pathname, search)).toBe(expected);
  });

  it.each(["/account", "/npc/daily", "/currency-wars/practice"])(
    "不接管非活动页面或未注册模式 %s",
    (pathname) => {
      expect(getLegacyActivityRedirect(pathname, "")).toBeUndefined();
    },
  );
});
