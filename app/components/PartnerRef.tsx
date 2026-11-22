"use client";
// LumoBi Partners: si alguien entra con ?p=CODIGO (el link de un partner), se guarda el código 60 días en este navegador.
// Al registrarse, el código viaja con el registro y el negocio queda en la cartera de ese partner.
import { useEffect } from "react";

const CLAVE = "lumobi_ref";
const DIAS = 60;

export function leerRefPartner(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) || "null") as { c?: string; t?: number } | null;
    if (!v || !v.c || !v.t || Date.now() - v.t > DIAS * 86400000) return null;
    return v.c;
  } catch { return null; }
}

export default function PartnerRef() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("p");
      const c = (p || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
      // El primero que trajo a la persona es el que cuenta: un link nuevo no pisa a uno vigente
      if (c.length >= 5 && !leerRefPartner()) localStorage.setItem(CLAVE, JSON.stringify({ c, t: Date.now() }));
    } catch { /* sin acceso al almacenamiento */ }
  }, []);
  return null;
}
