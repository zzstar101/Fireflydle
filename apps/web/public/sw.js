const requestedVersion = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_NAME = `fireflydle-shell-${requestedVersion}`;
const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.png",
  "/assets/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(SHELL);
      const assetManifest = await fetch("/assets/manifest.json").then((response) =>
        response.json(),
      );
      const characterAssets = assetManifest.files
        .map((file) => file.path)
        .filter((path) => path.startsWith("/assets/characters/"));
      await cache.addAll(characterAssets);
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            if (
              response.ok &&
              (request.destination === "script" ||
                request.destination === "style" ||
                request.destination === "font")
            ) {
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
