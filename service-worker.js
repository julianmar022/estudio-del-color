/* Service worker de «Estudio del color»: caché primero, para que la app funcione sin conexión.
   Al publicar cambios en cualquier archivo, sube el número de CACHE_VERSION. */
const CACHE_VERSION = "v1";
const CACHE_NAME = `estudio-del-color-${CACHE_VERSION}`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./itten_color_studio.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("estudio-del-color-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Sin conexión y sin copia: las navegaciones caen en la app
          if (request.mode === "navigate") return caches.match("./itten_color_studio.html");
          return Response.error();
        });
    })
  );
});
