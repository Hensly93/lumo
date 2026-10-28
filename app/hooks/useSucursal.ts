"use client";
import { useState, useEffect } from "react";

const KEY = "lumo_sucursal_id";
const EVENTO = "lumo:sucursal";

function leer(): number | null {
  try {
    const saved = localStorage.getItem(KEY);
    const n = saved ? parseInt(saved) : NaN;
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

// El local elegido es UNO para toda la app. Cada componente que usa este hook tiene su
// propia copia del estado, así que cuando el selector cambia avisa con un evento y
// todas las copias (Home, Alertas, Predicciones, En Vivo…) se actualizan al instante.
export function useSucursal() {
  const [sucursalId, setSucursalId] = useState<number | null>(null);

  useEffect(() => {
    setSucursalId(leer());
    const alCambiar = () => setSucursalId(leer());
    window.addEventListener(EVENTO, alCambiar);
    window.addEventListener("storage", alCambiar); // otra pestaña
    return () => {
      window.removeEventListener(EVENTO, alCambiar);
      window.removeEventListener("storage", alCambiar);
    };
  }, []);

  function setSucursal(id: number | null) {
    try {
      if (id === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(id));
    } catch {
      // localStorage bloqueado: igual se actualiza esta copia
    }
    setSucursalId(id);
    window.dispatchEvent(new Event(EVENTO));
  }

  return { sucursalId, setSucursal };
}
