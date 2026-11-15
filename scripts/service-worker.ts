export function serviceWorker(build: string, assets: string[]) {
  return `const BUILD = ${JSON.stringify(build)};
const BASE = new URL('./', self.location.href).pathname;
const PREFIX = 'castaway-angler:' + BASE + ':';
const CACHE = PREFIX + BUILD;
const ASSETS = ${JSON.stringify(assets)}.map(path => BASE + path);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(new URL(url, self.location.origin), { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => {
    const older = keys.filter(key => key.startsWith(PREFIX) && key !== CACHE);
    return Promise.all(older.slice(0, Math.max(0, older.length - 2)).map(key => caches.delete(key)));
  }).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok) { await cache.put(BASE + 'index.html', response.clone()); return response; }
      } catch {}
      return (await cache.match(BASE + 'index.html')) || Response.error();
    }
    const cached = (await cache.match(request, { ignoreSearch: true })) || (await caches.match(request, { ignoreSearch: true }));
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && !response.headers.get('content-type')?.includes('text/html')) await cache.put(request, response.clone());
    return response;
  }));
});\n`;
}

