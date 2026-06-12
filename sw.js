const CACHE_NAME = 'izunax-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/gallery.html',
  '/profile.html',
  '/chat.html',
  '/messages.html',
  '/bookmarks.html',
  '/settings.html',
  '/login.html',
  '/register.html',
  '/css/main.css',
  '/css/gallery.css',
  '/js/app.js',
  '/firebase-auth.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});