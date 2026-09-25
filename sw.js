// Minimal service worker - required for Android's "Add to Home Screen" install prompt to appear
// reliably, and caches the app shell so it opens instantly even on a weak connection. It never
// caches the actual data requests (checkPassword, submit, fetchAllPrevious, etc.) - those must
// always hit the live Apps Script backend, never a stale cached copy.
const CACHE_NAME = 'gst-mpr-shell-v1';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never intercept calls to the Apps Script backend (script.google.com) - those must always be
  // live, real requests, never served from cache.
  if (url.hostname.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
