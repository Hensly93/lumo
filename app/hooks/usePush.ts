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

// Función exportable para suscribirse a push (se llama desde un click handler)
export async function subscribePush(token: string): Promise<boolean> {
  if (!token || !VAPID_PUBLIC_KEY) return false;
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Verificar si ya existe suscripción
    const existing = await reg.pushManager.getSubscription();
    if (existing) return true; // Ya está suscrito

    // Pedir permiso (se llama desde un click, Chrome no bloquea)
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;

    // Suscribir
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    // Enviar al backend
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await fetch(`${API}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });

    return true;
  } catch (e) {
    console.error("Error en subscribePush:", e);
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

    // Solo verificar si ya existe suscripción, NO crear nueva
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Ya suscrito, nada que hacer
        return;
      }
      // NO hacer nada si no existe - esperamos que el usuario toque el botón manual
    }).catch(() => {});
  }, [token]);
}
