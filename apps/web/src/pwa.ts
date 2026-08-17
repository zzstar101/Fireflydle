import { contentManifest } from "@fireflydle/game-data";

export function registerPwaServiceWorker(isDevelopment = import.meta.env.DEV): void {
  if (isDevelopment || !("serviceWorker" in navigator)) return;
  const version = encodeURIComponent(contentManifest.manifestVersion);
  void navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: "/" });
}
