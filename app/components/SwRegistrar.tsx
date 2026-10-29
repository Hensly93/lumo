"use client";
import { useEffect } from "react";

// Sesión vencida: cualquier 401 del backend en un pedido con sesión de dueño → login (nunca pantalla blanca).
// Se instala al cargar la app, antes del primer pedido de cualquier pantalla.
if (typeof window !== "undefined" && !(window as any).lumo_fetch_401) {
  (window as any).lumo_fetch_401 = true;
  const fetchOriginal = window.fetch.bind(window);
  const tieneSesion = (input: RequestInfo | URL, init?: RequestInit) => {
    const h = init?.headers ?? (input instanceof Request ? input.headers : undefined);
    if (!h) return false;
    if (h instanceof Headers) return h.has("Authorization");
    if (Array.isArray(h)) return h.some(([k]) => k.toLowerCase() === "authorization");
    return Object.keys(h).some(k => k.toLowerCase() === "authorization");
  };
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const resp = await fetchOriginal(input, init);
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (resp.status === 401 && url.includes("lumo-backend") && !url.includes("/api/auth/") && tieneSesion(input, init)) {
        localStorage.removeItem("lumo_token");
        if (!location.pathname.startsWith("/login")) location.replace("/login?sesion=vencida");
        return new Promise<Response>(() => {}); // la pantalla espera mientras se va al login
      }
    } catch { /* ante cualquier duda, devolver la respuesta tal cual */ }
    return resp;
  };
}

export default function SwRegistrar() {
  useEffect(() => {
    // Si después de un deploy falta un archivo de la versión vieja, recargar UNA vez (no más de 1 cada 30 s)
    const recargarSiFaltaArchivo = (msg: string) => {
      if (!/ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module/i.test(msg)) return;
      try {
        const ult = Number(sessionStorage.getItem("lumo_recarga") || 0);
        if (Date.now() - ult < 30000) return;
        sessionStorage.setItem("lumo_recarga", String(Date.now()));
      } catch { /* sin sessionStorage: igual recargamos */ }
      window.location.reload();
    };
    window.addEventListener("error", (ev) => recargarSiFaltaArchivo(`${ev?.error?.name ?? ""} ${ev?.message ?? ""}`));
    window.addEventListener("unhandledrejection", (ev) => recargarSiFaltaArchivo(`${ev?.reason?.name ?? ""} ${ev?.reason?.message ?? ""}`));

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
  }, []);
  return null;
}
