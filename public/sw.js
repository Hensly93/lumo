// Lumo Service Worker — PWA S11 + Push Notifications S9
const CACHE = "lumo-v2";
const SHELL = [
  "/",
  "/landing",
  "/login",
  "/dashboard",
  "/manifest.json",
];

// Instalar: pre-cachear el app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activar: limpiar cachés viejas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Push: mostrar notificación y navegar a /predicciones al tocarla
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Lumo", {
      body: data.body || "Tenés predicciones nuevas.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      data: { url: data.url || "/predicciones" },
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/predicciones";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Fetch:
//   - API calls → network-first (si falla → 503)
//   - Todo lo demás → cache-first con fallback a network
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Solo manejar mismo origen y HTTPS
  if (url.origin !== location.origin && !url.hostname.includes("lumo-backend")) {
    return;
  }

  // API calls → network-first
  if (url.pathname.startsWith("/api/") || url.hostname.includes("lumo-backend")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: "Sin conexión" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // App shell → cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (response.ok) {
          caches.open(CACHE).then((c) => c.put(e.request, response.clone()));
        }
        return response;
      });
    })
  );
});
