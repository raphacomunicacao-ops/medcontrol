const CACHE_NAME = 'medcontrol-v2';
const APP_SHELL = ['./manifest.json', './icon-192.png', './icon-512.png'];

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
  var req = event.request;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin || req.method !== 'GET') return;

  // Página principal (HTML): SEMPRE tenta a rede primeiro, pra nunca ficar
  // preso numa versão antiga. Só usa a cópia salva se estiver sem internet.
  if(req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1){
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(function(){ return caches.match(req); })
    );
    return;
  }

  // Ícones e manifest (mudam raramente): usa o que estiver salvo na hora,
  // e atualiza a cópia salva em segundo plano pra próxima vez.
  event.respondWith(
    caches.match(req).then(function(cached){
      var fetchPromise = fetch(req).then(function(res){
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, res.clone()); });
        return res;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
