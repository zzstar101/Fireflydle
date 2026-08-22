import { playableShell } from "@fireflydle/game-data/playable-shell";
import { assetUrl } from "./lib/asset-url";

const INSTALL_ELIGIBLE_KEY = "fireflydle-install-eligible";
const INSTALL_DISMISSED_KEY = "fireflydle-install-dismissed-at";
const INSTALL_EVENT = "fireflydle:pwa-install-eligible";
const INSTALL_REQUEST_EVENT = "fireflydle:pwa-install-request";
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isMobileDevice(): boolean {
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))
  );
}

export function isIosDevice(): boolean {
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))
  );
}

export function isInstallSupported(): boolean {
  return (
    isMobileDevice() && !isStandaloneDisplay() && (isIosDevice() || deferredInstallPrompt !== null)
  );
}

export function isInstallCoolingDown(now = Date.now()): boolean {
  const dismissedAt = Number(window.localStorage.getItem(INSTALL_DISMISSED_KEY));
  return Number.isFinite(dismissedAt) && dismissedAt > 0 && now - dismissedAt < COOLDOWN_MS;
}

export function isInstallEligible(): boolean {
  return window.localStorage.getItem(INSTALL_ELIGIBLE_KEY) === "1";
}

export function markInstallEligible(): void {
  if (isInstallEligible()) return;
  window.localStorage.setItem(INSTALL_ELIGIBLE_KEY, "1");
  window.dispatchEvent(new Event(INSTALL_EVENT));
}

export function onInstallEligible(listener: () => void): () => void {
  window.addEventListener(INSTALL_EVENT, listener);
  return () => window.removeEventListener(INSTALL_EVENT, listener);
}

export function requestInstallFromMenu(): void {
  window.dispatchEvent(new Event(INSTALL_REQUEST_EVENT));
}

export function onInstallRequested(listener: () => void): () => void {
  window.addEventListener(INSTALL_REQUEST_EVENT, listener);
  return () => window.removeEventListener(INSTALL_REQUEST_EVENT, listener);
}

export function dismissInstallPrompt(): void {
  window.localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
}

export function addInstallPromptListener(): () => void {
  const onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(INSTALL_EVENT));
  };
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unsupported"> {
  if (!deferredInstallPrompt) return "unsupported";
  const event = deferredInstallPrompt;
  deferredInstallPrompt = null;
  await event.prompt();
  const choice = await event.userChoice;
  if (choice.outcome === "dismissed") dismissInstallPrompt();
  return choice.outcome;
}

export function initializePwaInstall(): () => void {
  return addInstallPromptListener();
}

export function registerPwaServiceWorker(isDevelopment = import.meta.env.DEV): void {
  if (isDevelopment || !("serviceWorker" in navigator)) return;
  const version = encodeURIComponent(playableShell.manifestVersion);
  void navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: "/" }).then(async () => {
    const registration = await navigator.serviceWorker.ready;
    const location = (window as Window & { location?: Location }).location;
    if (!location) return;
    const assetOrigin = new URL(assetUrl("/assets/"), location.href).origin;
    const urls = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => {
        const resource = new URL(url, location.href);
        return (
          (resource.origin === location.origin || resource.origin === assetOrigin) &&
          /\.(?:avif|css|js|jpe?g|png|webp|woff2?)(?:\?|$)/i.test(resource.pathname)
        );
      });
    registration.active?.postMessage({ type: "CACHE_CURRENT_PAGE_ASSETS", urls });
  });
}
