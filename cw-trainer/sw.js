/* DS2YTO 모르스 부호(CW) 연습기 — 오프라인 캐시 */
const CACHE = 'cw-trainer-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

/* 같은 경로면 ?v= 같은 쿼리가 달라도 캐시에서 꺼내 쓴다 */
function fromCache(req) {
  return caches.match(req).then(hit => hit || caches.match(req, { ignoreSearch: true }));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 네트워크 우선: 배포 직후엔 새 파일을 먼저 받고, 끊겼을 때만 캐시 */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          const idxCopy = req.mode === 'navigate' ? res.clone() : null;
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          if (idxCopy) {
            caches.open(CACHE).then(c => c.put('./index.html', idxCopy)).catch(() => {});
          }
        }
        return res;
      })
      .catch(() =>
        fromCache(req).then(hit => {
          if (hit) return hit;
          if (req.mode === 'navigate') return fromCache('./index.html');
          return Response.error();
        })
      )
  );
});
