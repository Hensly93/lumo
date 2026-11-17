"use client";
// RapidoFetch — acelera TODAS las pantallas sin tocar cada una.
// Problema: en cada pantalla que abrís, el menú de arriba, el plan, la guía y los pasos piden lo mismo al servidor
// (perfil, plan, guía, sucursales, pasos, productos) y varias pantallas lo piden a la vez. Cada pedido cuesta un viaje a Render.
// Solución: esos pedidos de LECTURA se comparten 30 segundos (y si dos piden lo mismo a la vez, viaja uno solo).
// Cualquier cambio (guardar, borrar, cobrar) vacía todo, así nunca se ve algo viejo después de tocar algo.
// También avisa al servidor apenas se abre la app, para que se despierte mientras la pantalla termina de cargar.
import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const VIDA_MS = 30000;
// Solo lecturas del "armazón" de la app. Nada de la caja, ventas en vivo ni análisis.
const COMPARTIBLES = [
  "/api/usuario/perfil", "/api/plan/estado", "/api/plan/resumen", "/api/plan/cobro",
  "/api/guia/estado", "/api/multilocal/red", "/api/pasos/estado", "/api/productos", "/api/mp/estado",
];

type Entrada = { hasta: number; promesa: Promise<Response> };

function instalar() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __lumoRapido?: boolean };
  if (w.__lumoRapido) return;
  w.__lumoRapido = true;
  const original = window.fetch.bind(window);
  const cache = new Map<string, Entrada>();

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      if (typeof input !== "string" && !(input instanceof URL)) return original(input, init);
      const url = String(input);
      if (!url.startsWith(API)) return original(input, init);
      const metodo = (init?.method || "GET").toUpperCase();

      // Un cambio al servidor: se descarta todo lo guardado, antes y después
      if (metodo !== "GET") {
        cache.clear();
        return original(input, init).finally(() => cache.clear());
      }

      const ruta = url.slice(API.length).split("?")[0];
      if (!COMPARTIBLES.includes(ruta) || init?.body || init?.cache === "no-store") return original(input, init);

      const clave = url + "|" + (new Headers(init?.headers).get("authorization") || "");
      const hit = cache.get(clave);
      if (hit && hit.hasta > Date.now()) return hit.promesa.then((r) => r.clone());

      const promesa = original(input, init).then((r) => {
        if (!r.ok) cache.delete(clave); // los errores no se guardan
        return r;
      }, (e) => { cache.delete(clave); throw e; });
      cache.set(clave, { hasta: Date.now() + VIDA_MS, promesa });
      if (cache.size > 60) cache.clear();
      return promesa.then((r) => r.clone());
    } catch {
      return original(input, init);
    }
  };
}

instalar();

export default function RapidoFetch() {
  useEffect(() => {
    // Despierta al servidor si estaba dormido; no lleva datos ni sesión
    fetch(`${API}/api/health`, { method: "GET", cache: "no-store", mode: "cors" }).catch(() => {});
  }, []);
  return null;
}
