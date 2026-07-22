const CACHE_NAME = 'medcontrol-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Só cuida de pedidos do próprio site (mesma origem).
// Firebase/Google (login e banco de dados) sempre vão direto pra rede, sem interferência.
self.addEventListener('fetch', function(event){
  var url = new URL(event.request.url);
  if(url.origin !== self.location.origin || event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request).catch(function(){ return cached; });
    })
  );
});
