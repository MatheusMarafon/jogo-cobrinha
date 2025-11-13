// Define um nome e a versão do cache
const CACHE_NAME = 'snake-game-v1';

// Lista todos os arquivos que o app precisa para funcionar offline
const cacheFiles = [
  '.',
  'index.html',
  'style.css',
  'script.js',
  'ela.PNG',
  'eu.PNG',
  'logo.PNG',
  'logo.PNG'
];

// 1. Instalação do Service Worker (Salva os arquivos em cache)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Arquivos salvos em cache!');
      return cache.addAll(cacheFiles);
    })
  );
});

// 2. Intercepta as requisições (Carrega do cache primeiro)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Se tiver no cache, retorna do cache
      if (response) {
        return response;
      }
      // Se não, tenta buscar na rede (internet)
      return fetch(e.request);
    })
  );
});