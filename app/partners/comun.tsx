"use client";
// Cosas compartidas de LumoBi Partners: API, sesión del partner (separada de la del negocio), colores y piezas chicas.
import { useState } from "react";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
export const TOKEN_KEY = "lumobi_partner_token";

export const C = {
  tinta: "#0A1628", suave: "#45546B", apagada: "#5F6E85", papel: "#EEF1F5", blanco: "#FFFFFF",
  linea: "#D5DCE6", azul: "#0A5BD3", cian: "#00C2FF", ok: "#0B7A53", okFondo: "#E6F4EE",
  critico: "#B3261E", atencion: "#8A5100", atencionFondo: "#FFF4E0",
};
export const FUENTE = "var(--font-instrument),-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

export const pesos = (n: number) => "$" + Math.round(n || 0).toLocaleString("es-AR");
export const pct = (x: number) => Math.round((x || 0) * 100) + "%";
export const fecha = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "");

export function tokenPartner(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function guardarToken(t: string) { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* sin acceso */ } }
export function salirPartner() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* sin acceso */ } }

export async function pedir<T>(ruta: string, opts: { metodo?: string; cuerpo?: unknown; token?: string | null } = {}): Promise<T> {
  const r = await fetch(API + ruta, {
    method: opts.metodo || (opts.cuerpo ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", ...(opts.token ? { Authorization: "Bearer " + opts.token } : {}) },
    body: opts.cuerpo ? JSON.stringify(opts.cuerpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error((j && (j as { error?: string }).error) || "No se pudo completar. Probá de nuevo.") as Error & { status?: number };
    e.status = r.status;
    throw e;
  }
  return j as T;
}

export type Reglas = { alta_pct: number; cartera_pct: number; elite_clientes: number; elite_cartera_pct: number; bono_referido: number; bono_meta: number; retencion_dias: number; precio_base?: number };
export const REGLAS_BASE: Reglas = { alta_pct: 0.5, cartera_pct: 0.15, elite_clientes: 30, elite_cartera_pct: 0.2, bono_referido: 20000, bono_meta: 3, retencion_dias: 15, precio_base: 45000 };

export const tarjeta: React.CSSProperties = { background: C.blanco, border: `1px solid ${C.linea}`, borderRadius: 16, padding: 18, marginBottom: 14 };
export const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "13px 14px", fontSize: 16, borderRadius: 12, border: `1px solid ${C.linea}`,
  color: C.tinta, background: C.blanco, fontFamily: FUENTE, outline: "none",
};
export const boton: React.CSSProperties = {
  width: "100%", padding: "15px 18px", fontSize: 16, fontWeight: 700, borderRadius: 12, border: "none",
  background: C.azul, color: C.blanco, cursor: "pointer", fontFamily: FUENTE,
};
export const botonSec: React.CSSProperties = { ...boton, background: C.blanco, color: C.azul, border: `1px solid ${C.azul}` };

export function Copiar({ texto, etiqueta = "Copiar", chico }: { texto: string; etiqueta?: string; chico?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }).catch(() => {});
      }}
      style={{ ...botonSec, ...(chico ? { padding: "8px 12px", fontSize: 14, width: "auto" } : {}) }}
    >
      {ok ? "¡Copiado!" : etiqueta}
    </button>
  );
}

export function whatsapp(texto: string) { return "https://wa.me/?text=" + encodeURIComponent(texto); }
