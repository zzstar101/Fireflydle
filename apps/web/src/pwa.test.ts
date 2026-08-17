import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerPwaServiceWorker } from "./pwa";

describe("PWA service worker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("在生产环境按内容 manifest 版本注册根 scope", () => {
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });

    registerPwaServiceWorker(false);

    expect(register).toHaveBeenCalledWith(expect.stringMatching(/^\/sw\.js\?v=.+/), { scope: "/" });
  });
});
