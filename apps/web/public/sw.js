const requestedVersion = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_NAME = `fireflydle-shell-${requestedVersion}`;
const ASSET_BASE_URL = "__FIREFLYDLE_ASSET_BASE_URL__";
const LOGICAL_ASSET_PREFIX = "/assets/";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.png",
  "/assets/manifest.json",
];

function isAssetOrigin(url) {
  return url.origin === ASSET_BASE_URL;
}

function assetUrl(path) {
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const relative = normalized.startsWith(LOGICAL_ASSET_PREFIX)
    ? normalized.slice(LOGICAL_ASSET_PREFIX.length)
    : normalized.slice(1);
  return `${ASSET_BASE_URL}/${relative}`;
}

async function cacheUrls(cache, urls) {
  for (const url of urls) {
    const resolved = new URL(url, self.location.origin);
    const request = new Request(resolved, {
      mode: resolved.origin === self.location.origin ? "same-origin" : "cors",
    });
    const response = await fetch(request);
    if (!response.ok && response.type !== "opaque") throw new Error(`Unable to cache ${url}`);
    await cache.put(request, response.clone());
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cacheUrls(cache, SHELL);
      const assetManifest = await fetch("/assets/manifest.json").then((response) =>
        response.json(),
      );
      const characterAssets = assetManifest.files
        .map((file) => file.path)
        .filter((path) => path.startsWith("/assets/characters/"))
        .map(assetUrl);
      await cacheUrls(cache, characterAssets);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("fireflydle-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_CURRENT_PAGE_ASSETS" || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((url) => typeof url === "string");
  if (urls.length === 0) return;
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cacheUrls(cache, urls)));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isAssetRequest = isAssetOrigin(url);
  const isShellRequest = url.origin === self.location.origin;
  if (!isAssetRequest && !isShellRequest) return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            if (response.ok || response.type === "opaque") {
              const copy = response.clone();
              void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() =>
            request.mode === "navigate" ? caches.match("/index.html") : Response.error(),
          ),
    ),
  );
});
