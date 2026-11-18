"use client";
// Qué tan completos están los datos en los que se apoya LumoBi: de dónde salen sus números y qué falta cargar.
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Resp = {
  score: number; total_transacciones: number; daysCount: number; status: "good" | "warning" | "critical";
  costo?: { ventas_con_costo_pct: number | null; productos: number; productos_sin_costo: number } | null;
  faltan?: string[];
};

export default function CalidadDatos() {
  const [d, setD] = useState<Resp | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let vivo = true;
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/negocio/data-quality-score`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(x => { if (vivo && x && typeof x.score === "number") setD(x); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!d || d.total_transacciones === 0) return null;
  const color = d.status === "good" ? "var(--ok)" : d.status === "warning" ? "#D97706" : "var(--critico)";
  const faltan = d.faltan ?? [];

  return (
    <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 14, margin: "0 0 12px" }}>
      <button onClick={() => setAbierto(a => !a)} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.4 }}>
            <strong>Base de estos números:</strong> {d.total_transacciones.toLocaleString("es-AR")} ventas en {d.daysCount} día{d.daysCount === 1 ? "" : "s"}
            {d.costo?.ventas_con_costo_pct != null ? ` · costo cargado en el ${d.costo.ventas_con_costo_pct}% de lo que vendiste` : ""}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color, flexShrink: 0 }}>{d.score}/100</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 4 }}>
          {faltan.length ? (abierto ? "Ocultar" : `Qué falta para que sean más precisos (${faltan.length})`) : "Datos completos"}
        </div>
      </button>
      {abierto && faltan.length > 0 && (
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--tinta)", lineHeight: 1.6 }}>
          {faltan.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}
