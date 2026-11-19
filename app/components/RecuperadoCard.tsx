"use client";
// Plata que LumoBi te ayudó a recuperar: mide cuánto bajó cada problema DESPUÉS de que lo marcaste como resuelto.
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Medido = { id: number; titulo: string; accion_titulo?: string | null; antes: number; ahora: number; recuperado: number };
type Seguimiento = { id: number; titulo: string; accion_titulo?: string | null; antes: number; dias_faltan: number };
type Resp = { total_mensual: number; medidos: Medido[]; en_seguimiento: Seguimiento[] };

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function RecuperadoCard() {
  const [d, setD] = useState<Resp | null>(null);

  useEffect(() => {
    let vivo = true;
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/hallazgos/recuperado`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(x => { if (vivo && x && Array.isArray(x.medidos)) setD(x); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!d || (d.medidos.length === 0 && d.en_seguimiento.length === 0)) return null;

  return (
    <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 18, margin: "16px 0" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif" }}>
        Plata que recuperaste con LumoBi
      </div>
      {d.total_mensual > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 28, fontWeight: 800, color: "var(--ok)" }}>{fmt(d.total_mensual)} <span style={{ fontSize: 14, fontWeight: 600 }}>por mes</span></div>
        </div>
      )}
      {d.medidos.map(m => (
        <div key={m.id} style={{ padding: "10px 0", borderTop: "1px solid var(--linea)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.4 }}>{m.titulo}</div>
          {m.accion_titulo && <div style={{ fontSize: 12, color: "var(--tinta)", marginTop: 2 }}>Probaste: {m.accion_titulo}</div>}
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 2 }}>Pasó de {fmt(m.antes)} a {fmt(m.ahora)} por mes desde que lo marcaste como resuelto.</div>
        </div>
      ))}
      {d.en_seguimiento.map(s => (
        <div key={s.id} style={{ padding: "10px 0", borderTop: "1px solid var(--linea)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.4 }}>{s.titulo}</div>
          {s.accion_titulo && <div style={{ fontSize: 12, color: "var(--tinta)", marginTop: 2 }}>Probaste: {s.accion_titulo}</div>}
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 2 }}>
            Lo estamos midiendo. {s.dias_faltan > 0 ? `En ${s.dias_faltan} ${s.dias_faltan === 1 ? "día" : "días"} vemos si mejoró.` : "En la próxima revisión vemos si mejoró."}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: "var(--tinta-apagada)", marginTop: 8, lineHeight: 1.5 }}>
        Mide cuánto bajó cada problema después de que lo marcaste como resuelto. No siempre se debe a lo que hiciste: puede haber otras causas.
      </div>
    </div>
  );
}

// Versión de una línea para el Inicio: lo que LumoBi ya te ayudó a recuperar (o lo que está midiendo)
export function RecuperadoLinea({ siempre = false }: { siempre?: boolean }) {
  const [d, setD] = useState<Resp | null>(null);
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/hallazgos/recuperado`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => (r.ok ? r.json() : null)).then((x) => { if (x && Array.isArray(x.medidos)) setD(x); }).catch(() => {});
  }, []);
  if (!d && !siempre) return null;
  if (d && d.total_mensual <= 0 && d.en_seguimiento.length === 0) {
    if (!siempre) return null;
    // Honesto: sin plata medida, no inventamos un número
    return (
      <div style={{ margin: "0 0 16px", padding: 14, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", fontSize: 14, color: "var(--tinta)", lineHeight: 1.5 }}>
        Todavía no medimos plata recuperada. Cuando resuelvas algo de la lista de Qué hacer, LumoBi mide a los 28 días si mejoró y lo ves acá.
      </div>
    );
  }
  if (!d) return null;
  const dias = d.en_seguimiento.length ? Math.min(...d.en_seguimiento.map((s) => s.dias_faltan)) : 0;
  return (
    <a href="/oportunidades" style={{ display: "block", margin: "0 0 16px", padding: 14, borderRadius: 12, textDecoration: "none",
      border: `1px solid ${d.total_mensual > 0 ? "rgba(22,163,74,0.35)" : "var(--linea)"}`, background: d.total_mensual > 0 ? "rgba(22,163,74,0.06)" : "var(--blanco)" }}>
      {d.total_mensual > 0 ? (
        <>
          <div style={{ fontSize: 13, color: "var(--tinta-apagada)" }}>Con lo que resolviste, LumoBi te ayudó a recuperar</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#16A34A" }}>{fmt(d.total_mensual)} <span style={{ fontSize: 14, fontWeight: 600 }}>por mes</span></div>
          <div style={{ fontSize: 13, color: "#007AFF", fontWeight: 700, marginTop: 2 }}>Ver qué funcionó →</div>
        </>
      ) : (
        <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.5 }}>
          LumoBi está midiendo {d.en_seguimiento.length === 1 ? "el cambio que hiciste" : `los ${d.en_seguimiento.length} cambios que hiciste`}: en {dias} {dias === 1 ? "día" : "días"} te cuenta si funcionó.
        </div>
      )}
    </a>
  );
}
