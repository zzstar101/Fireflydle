import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addInstallPromptListener,
  dismissInstallPrompt,
  isInstallCoolingDown,
  isInstallEligible,
  isInstallSupported,
  isStandaloneDisplay,
  markInstallEligible,
  promptInstall,
  registerPwaServiceWorker,
} from "./pwa";
import {
  aeonManifest,
  contentManifest,
  currencyWarsManifest,
  npcManifest,
} from "@fireflydle/game-data";

describe("PWA service worker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const listeners = new Map<string, Set<EventListener>>();
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        clear: () => storage.clear(),
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
      matchMedia: vi.fn(() => ({ matches: false })),
      addEventListener: (type: string, listener: EventListener) => {
        const current = listeners.get(type) ?? new Set<EventListener>();
        current.add(listener);
        listeners.set(type, current);
      },
      removeEventListener: (type: string, listener: EventListener) =>
        listeners.get(type)?.delete(listener),
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((listener) => listener(event));
        return true;
      },
    });
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Linux; Android 14)",
    });
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 5 });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
  });

  it("在生产环境按内容 manifest 版本注册根 scope", () => {
    const registration = { active: { postMessage: vi.fn() } };
    const register = vi.fn().mockResolvedValue(registration);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: Promise.resolve(registration), register },
    });

    registerPwaServiceWorker(false);

    const releaseVersion = [
      contentManifest.manifestVersion,
      npcManifest.manifestVersion,
      currencyWarsManifest.manifestVersion,
      aeonManifest.manifestVersion,
    ].join(".");
    expect(register).toHaveBeenCalledWith(`/sw.js?v=${encodeURIComponent(releaseVersion)}`, {
      scope: "/",
    });
  });

  it("只在完成结算后获得安装资格，并支持 30 天关闭冷却", () => {
    expect(isInstallEligible()).toBe(false);
    markInstallEligible();
    expect(isInstallEligible()).toBe(true);
    dismissInstallPrompt();
    expect(isInstallCoolingDown()).toBe(true);
    expect(isInstallCoolingDown(Date.now() + 30 * 24 * 60 * 60 * 1000 + 1)).toBe(false);
  });

  it("在移动端捕获 beforeinstallprompt 并调用系统安装窗口", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const cleanup = addInstallPromptListener();
    const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(event);
    expect(isInstallSupported()).toBe(true);
    await expect(promptInstall()).resolves.toBe("accepted");
    expect(prompt).toHaveBeenCalledOnce();
    cleanup();
  });

  it("standalone 或桌面端不提供安装能力", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    expect(isStandaloneDisplay()).toBe(true);
    expect(isInstallSupported()).toBe(false);
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    expect(isInstallSupported()).toBe(false);
  });
});
