/*
  Service worker di Radar: fa aprire l'app anche senza rete.
  - pagine (navigazione): prima la rete, e se manca (o è lenta) l'ultima copia salvata
  - file dell'app (/_next/static, icone, font): prima la copia salvata, sono immutabili
  - elenchi argomenti e fonti: prima la rete, poi la copia
  Il feed non passa da qui: se ne occupa l'app (ultima pagina salvata sul dispositivo).
  Alzare VERSION quando si cambia questo file: le vecchie copie vengono cancellate.
*/
const VERSION = "radar-v1";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const API = `${VERSION}-api`;
const SHELL = ["/", "/seguiti", "/salvati", "/argomenti", "/profilo"];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// rete con scadenza: se non risponde entro qualche secondo si usa la copia salvata
function fetchWithTimeout(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS);
    fetch(request).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function networkFirst(request, cacheName, key) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetchWithTimeout(request);
    if (res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(key);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // la chiave è solo il percorso: "/?intro-t=3" e "/" sono la stessa pagina
    event.respondWith(
      networkFirst(request, PAGES, url.pathname).catch(async () => {
        const cache = await caches.open(PAGES);
        return (await cache.match("/")) || Response.error();
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname === "/api/topics" || url.pathname === "/api/sources") {
    event.respondWith(networkFirst(request, API, url.pathname));
  }
});
