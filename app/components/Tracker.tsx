"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, vaciar, normApi, normRuta } from "../lib/track";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const IGNORAR_API = ["/api/analitica", "/api/push", "/api/plan"];

declare global { interface Window { __lbFetch?: boolean } }

// Observa las llamadas al servidor sin cambiar su resultado.
function observarFetch() {
  if (typeof window === "undefined" || window.__lbFetch) return;
  window.__lbFetch = true;
  const original = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const entrada = args[0];
    const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : (entrada as Request).url;
    const metodo = String((args[1]?.method ?? (typeof entrada === "object" && "method" in entrada ? (entrada as Request).method : "GET"))).toUpperCase();
    const propia = url.startsWith(API) || url.startsWith("/api/");
    if (!propia) return original(...args);
    const ep = normApi(url);
    if (IGNORAR_API.some((x) => ep.startsWith(x))) return original(...args);
    const esReg = ep === "/api/auth/register";
    const esLogin = ep === "/api/auth/login";
    if (esReg) track("registro_envio");
    try {
      const r = await original(...args);
      if (esReg || esLogin) {
        if (r.ok) track(esReg ? "registro_ok" : "login_ok");
        else {
          let m = "";
          try { const j = await r.clone().json(); m = String(j?.error ?? "").slice(0, 60); } catch { /* sin cuerpo */ }
          track(esReg ? "registro_error" : "login_error", undefined, { st: r.status, m });
        }
      } else if (r.status >= 500) {
        track("api_error", undefined, { p: `${metodo} ${ep}`.slice(0, 80), st: r.status });
      } else if (metodo !== "GET" && r.ok) {
        track("accion_api", undefined, { p: `${metodo} ${ep}`.slice(0, 80) });
      }
      return r;
    } catch (e) {
      if (!esReg && !esLogin) track("api_error", undefined, { p: `${metodo} ${ep}`.slice(0, 80), st: 0 });
      throw e;
    }
  };
}

export default function Tracker() {
  const path = usePathname();
  const visibleDesde = useRef<number>(0);
  const acumulado = useRef<number>(0);
  const rutaAnterior = useRef<string | null>(null);

  const cerrarPantalla = () => {
    if (visibleDesde.current) { acumulado.current += Date.now() - visibleDesde.current; visibleDesde.current = 0; }
    const seg = Math.round(acumulado.current / 1000);
    if (rutaAnterior.current && seg >= 1) track("tiempo", rutaAnterior.current, { seg: Math.min(seg, 1800) });
    acumulado.current = 0;
  };

  // Cambio de pantalla
  useEffect(() => {
    observarFetch();
    cerrarPantalla();
    rutaAnterior.current = normRuta(path);
    visibleDesde.current = document.visibilityState === "visible" ? Date.now() : 0;
    track("pantalla", path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Visibilidad, salida, clicks, errores y scroll de la landing
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        if (visibleDesde.current) { acumulado.current += Date.now() - visibleDesde.current; visibleDesde.current = 0; }
        const seg = Math.round(acumulado.current / 1000);
        if (rutaAnterior.current && seg >= 1) { track("tiempo", rutaAnterior.current, { seg: Math.min(seg, 1800) }); acumulado.current = 0; }
        vaciar();
      } else {
        visibleDesde.current = Date.now();
      }
    };
    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as Element | null)?.closest?.("a,button,[role=button],[data-track]") as HTMLElement | null;
      if (!el) return;
      const marca = el.getAttribute("data-track");
      const a = el.closest("a") as HTMLAnchorElement | null;
      let etiqueta = marca || el.getAttribute("aria-label") || (el.textContent || "").replace(/\s+/g, " ").trim();
      // Sin marca explicita, solo textos cortos y sin numeros (para no guardar montos ni nombres propios)
      if (!marca && (etiqueta.length === 0 || etiqueta.length > 30 || /\d/.test(etiqueta))) etiqueta = "";
      let h = "";
      if (a && a.getAttribute("href")) {
        try { const u = new URL(a.href); if (u.origin === window.location.origin) h = u.pathname + (u.search.includes("registro=1") ? "?registro=1" : ""); } catch { /* href raro */ }
      }
      if (!etiqueta && !h) return;
      const enLanding = normRuta(window.location.pathname) === "/landing";
      if (enLanding && h.startsWith("/login")) track("cta_landing", undefined, { t: etiqueta || "Entrar", h });
      else track("click", undefined, { t: (etiqueta || h).slice(0, 40), ...(h ? { h } : {}) });
    };
    const onError = (ev: ErrorEvent) => track("error", undefined, { m: String(ev.message || "error").slice(0, 80) });
    const onRej = (ev: PromiseRejectionEvent) => track("error", undefined, { m: String((ev.reason && ev.reason.message) || "promesa rechazada").slice(0, 80) });
    const hitos = new Set<number>();
    const onScroll = () => {
      if (normRuta(window.location.pathname) !== "/landing") return;
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      if (alto <= 0) return;
      const pct = Math.round((window.scrollY / alto) * 100);
      for (const h of [25, 50, 75, 100]) if (pct >= h - (h === 100 ? 3 : 0) && !hitos.has(h)) { hitos.add(h); track("scroll", "/landing", { pct: h }); }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", vaciar);
    document.addEventListener("click", onClick, true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRej);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", vaciar);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRej);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
