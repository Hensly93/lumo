"use client";
import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// Motivo del ultimo intento fallido, para mostrarselo al usuario.
let motivoPush = "";
export function getMotivoPush(): string { return motivoPush; }

// Espera al service worker, pero no se queda colgado para siempre.
async function swListo(): Promise<ServiceWorkerRegistration | null> {
  const espera = new Promise<null>((res) => setTimeout(() => res(null), 8000));
  const reg = await Promise.race([navigator.serviceWorker.ready, espera]);
  if (reg) return reg;
  // Nadie lo registro todavia: lo registramos ahora.
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    return await Promise.race([navigator.serviceWorker.ready, espera]);
  } catch {
    return null;
  }
}

// Guarda (o vuelve a atar a este usuario) la suscripción del celu en el servidor
async function guardarEnServidor(sub: PushSubscription, token: string): Promise<boolean> {
  try {
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    const resp = await fetch(`${API}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// Función exportable para suscribirse a push (se llama desde un click handler)
export async function subscribePush(token: string): Promise<boolean> {
  motivoPush = "";
  if (!token) { motivoPush = "Volvé a iniciar sesión e intentá de nuevo."; return false; }
  if (typeof window === "undefined") return false;
  if (!VAPID_PUBLIC_KEY) {
    motivoPush = "Falta la clave de avisos en la configuración de la app (NEXT_PUBLIC_VAPID_PUBLIC_KEY).";
    return false;
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    motivoPush = "Este navegador no permite avisos. Abrí LumoBi en Chrome.";
    return false;
  }

  try {
    const reg = await swListo();
    if (!reg) {
      motivoPush = "El servicio de avisos no arrancó. Recargá la página e intentá de nuevo.";
      return false;
    }

    // Si este celu ya tiene suscripción, igual se le vuelve a mandar al servidor: el servidor pudo
    // haberla borrado, o este celu ahora está con otra cuenta. Antes se devolvía "ok" y el aviso nunca llegaba.
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      const ok = await guardarEnServidor(existing, token);
      if (!ok) motivoPush = "No se pudo guardar el aviso en el servidor. Probá de nuevo.";
      return ok;
    }

    // Pedir permiso (se llama desde un click, Chrome no bloquea)
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      motivoPush = perm === "denied"
        ? "Los avisos están bloqueados para LumoBi. Tocá el candado de la barra de direcciones, Permisos, Notificaciones: Permitir."
        : "No diste permiso para los avisos. Tocá de nuevo y elegí Permitir.";
      return false;
    }

    // Suscribir
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    // Enviar al backend
    if (!(await guardarEnServidor(sub, token))) {
      motivoPush = "No se pudo guardar el aviso en el servidor. Probá de nuevo.";
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error en subscribePush:", e);
    motivoPush = "Error al activar los avisos: " + (e instanceof Error ? e.message : "desconocido");
    return false;
  }
}

// Hook para verificar suscripción existente (NO pide permiso automáticamente)
export function usePush(token: string | null) {
  useEffect(() => {
    if (!token) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;

    // Cada vez que se abre la app: si el celu ya tiene suscripción, se la reenvía al servidor.
    // Así se arregla sola si el servidor la había borrado o si en este celu se entró con otra cuenta.
    // Si no hay suscripción NO se crea: eso lo hace el botón (Chrome pide un toque del usuario).
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing && Notification.permission === "granted") await guardarEnServidor(existing, token);
    }).catch(() => {});
  }, [token]);
}
