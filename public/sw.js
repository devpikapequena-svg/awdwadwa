// public/sw.js

// Install: já ativa esse SW
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate: assume controle das abas abertas
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Fetch: por enquanto só passa as requisições pra rede normalmente.
// Depois se quiser, a gente coloca cache offline aqui.
self.addEventListener('fetch', () => {
  // noop
})
