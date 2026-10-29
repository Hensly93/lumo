// LumoBi Service Worker — v2 (29/10/2026)
//
// Reglas:
//   · Páginas (navegación)      → SIEMPRE de internet. Nunca se guardan: así cada deploy
//                                  se ve al instante y no hay "Application error" por versión vieja.
//                                  Sin conexión → pantalla "Sin conexión" con botón Reintentar.
//   · /_next/static/ e /icons/  → se guardan (cada versión tiene su propio nombre, no se pisan).
//   · API / backend / otros     → el service worker NO los toca: los datos del negocio
//                                  nunca quedan guardados en el dispositivo.
//   · Al activarse una versión nueva se borran todas las cachés viejas.
const CACHE = "lumo-static-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── Push ────────────────────────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(
    self.registration.showNotification(data.title || "LumoBi", {
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
  const url = (e.notification.data && e.notification.data.url) || "/predicciones";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
const SIN_CONEXION = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>LumoBi · Sin conexión</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#F4F7FB;color:#0A1628">
<div style="text-align:center;padding:24px;max-width:340px">
<div style="font-size:13px;letter-spacing:3px;color:#64748B;font-weight:700;margin-bottom:12px">LUMOBI</div>
<h1 style="font-size:24px;margin:0 0 10px">Sin conexión</h1>
<p style="color:#64748B;line-height:1.5;margin:0 0 24px">Revisá el wifi o los datos y volvé a intentar.</p>
<button onclick="location.reload()" style="padding:14px 28px;border:none;border-radius:12px;background:#007AFF;color:#fff;font-size:15px;font-weight:600">Reintentar</button>
</div></body></html>`;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // backend y terceros: no se tocan
  if (url.pathname.startsWith("/api/")) return;             // API: no se toca

  // Páginas: siempre de internet
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => new Response(SIN_CONEXION, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }))
    );
    return;
  }

  // Archivos con nombre por versión: guardados
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((guardado) => {
          if (guardado) return guardado;
          return fetch(req).then((resp) => {
            if (resp.ok) cache.put(req, resp.clone()); // clone ANTES de devolver (arregla "body already used")
            return resp;
          });
        })
      )
    );
  }
  // Todo lo demás: lo maneja el navegador normalmente
});
