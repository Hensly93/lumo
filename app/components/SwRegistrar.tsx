"use client";
import { useEffect } from "react";

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
