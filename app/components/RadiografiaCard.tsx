"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Hallazgo = {
  id: string;
  tipo: "medido" | "calculado" | "estimado";
  titulo: string;
  detalle: string;
  evidencia: string[];
  monto: number;
  url: string;
  positivo?: boolean;
};
type Resp = {
  suficiente: boolean;
  dias_con_ventas: number;
  dias_necesarios: number;
  faltan_dias: number;
  hallazgos: Hallazgo[];
};

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function etiqueta(h: Hallazgo) {
  if (h.positivo) return "Buena noticia";
  if (h.tipo === "estimado") return `Hasta ~${fmt(h.monto)} más por mes (estimación)`;
  if (h.tipo === "medido") return `${fmt(h.monto)} medidos`;
  return `${fmt(h.monto)} en juego`;
}

// Radiografía: lo más importante que LumoBi encontró en el negocio, con plata y evidencia.
export default function RadiografiaCard() {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    let vivo = true;
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/radiografia`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (vivo && d && Array.isArray(d.hallazgos)) setData(d); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!data) return null;
  const sinHallazgos = data.hallazgos.length === 0;
  if (sinHallazgos && data.dias_con_ventas === 0) return null;

  const avance = Math.min(100, Math.round((data.dias_con_ventas / data.dias_necesarios) * 100));

  return (
    <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 18, margin: "16px 0" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif" }}>
        Radiografía de tu negocio
      </div>
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 2, marginBottom: 12 }}>
        Lo más importante que encontró LumoBi en tus últimas 8 semanas.
      </div>

      {!data.suficiente && (
        <div style={{ background: "var(--papel)", borderRadius: 8, padding: "10px 12px", marginBottom: sinHallazgos ? 0 : 12 }}>
          <div style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.5 }}>
            {sinHallazgos
              ? <>Para armar tu radiografía necesito ver al menos {data.dias_necesarios} días de ventas. Llevás <strong>{data.dias_con_ventas}</strong>.</>
              : <>Con {data.dias_necesarios} días de ventas la radiografía es completa. Llevás <strong>{data.dias_con_ventas}</strong>.</>}
          </div>
          <div style={{ height: 6, background: "var(--linea)", borderRadius: 3, marginTop: 8 }}>
            <div style={{ width: `${avance}%`, height: 6, background: "var(--cian)", borderRadius: 3 }} />
          </div>
        </div>
      )}

      {data.hallazgos.map((h, i) => (
        <div key={h.id} style={{ padding: "12px 0", borderTop: i || !data.suficiente ? "1px solid var(--linea)" : "none" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: h.positivo ? "var(--ok-fondo)" : "var(--critico-fondo)", color: h.positivo ? "var(--ok)" : "var(--critico)", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {i + 1}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.4 }}>{h.titulo}</div>
              {h.detalle && <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 3, lineHeight: 1.5 }}>{h.detalle}</div>}
              <div style={{ fontSize: 12, fontWeight: 700, color: h.positivo ? "var(--ok)" : "var(--critico)", marginTop: 4 }}>{etiqueta(h)}</div>
              {h.evidencia.length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary style={{ fontSize: 12, color: "var(--tinta-apagada)", cursor: "pointer" }}>Cómo lo calculé</summary>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.6 }}>
                    {h.evidencia.map((e, k) => <li key={k}>{e}</li>)}
                  </ul>
                </details>
              )}
              <a href={h.url} style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "var(--azul)", textDecoration: "none" }}>Ver detalle →</a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
