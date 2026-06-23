"use client";
import { useState, useEffect } from "react";

const KEY = "lumo_sucursal_id";

export function useSucursal() {
  const [sucursalId, setSucursalId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setSucursalId(parseInt(saved));
  }, []);

  function setSucursal(id: number | null) {
    if (id === null) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, String(id));
    }
    setSucursalId(id);
  }

  return { sucursalId, setSucursal };
}
