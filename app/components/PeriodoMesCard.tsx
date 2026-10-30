"use client";
// Tarjeta del Home: "Cómo te fue este mes" → lleva a /periodos
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Var = { facturacion: number | null; facturacion_real: number | null };
type Cmp = { etiqueta: string; hay_datos: boolean; variacion: Var } | null;
type Resp = { actual?: { facturacion: number; tickets: number }; vs_anterior?: Cmp; vs_anio_anterior?: Cmp };

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
function textoVar(v: number) {
  return v >= 300 ? `×${(1 + v / 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}` : `${v > 0 ? "+" : ""}${v.toLocaleString("es-AR")}%`;
}

function Linea({ c, real }: { c: Cmp | undefined; real?: boolean }) {
  if (!c || !c.hay_datos) return null;
  const v = real && c.variacion.facturacion_real != null ? c.variacion.facturacion_real : c.variacion.facturacion;
  if (v == null) return null;
  const color = v > 0 ? "#00A878" : v < 0 ? "#E5484D" : "#64748B";
  return (
    <div style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>
      <span style={{ color, fontWeight: 700 }}>{v > 0 ? "▲ " : v < 0 ? "▼ " : ""}{textoVar(v)}</span>
      {" "}vs {c.etiqueta}{real && c.variacion.facturacion_real != null ? " (real, descontando inflación)" : ""}
    </div>
  );
}

export default function PeriodoMesCard({ sucursalId }: { sucursalId: number | null }) {
  const router = useRouter();
  const [d, setD] = useState<Resp | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    let vigente = true;
    const ctrl = new AbortController();
    const q = new URLSearchParams({ periodo: "mes" });
    if (sucursalId) q.set("sucursal_id", String(sucursalId));
    fetch(`${API}/api/periodos?${q}`, { headers: { Authorization: `Bearer ${t}` }, signal: ctrl.signal })
      .then(r => r.json())
      .then((x: Resp) => { if (vigente && x?.actual) setD(x); })
      .catch(() => {});
    return () => { vigente = false; ctrl.abort(); };
  }, [sucursalId]);

  if (!d?.actual) return null;
  return (
    <div onClick={() => router.push("/periodos")} role="link"
      style={{ background: "white", borderRadius: 20, padding: 18, margin: "16px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748B", fontWeight: 700 }}>Cómo te fue este mes</span>
        <span style={{ fontSize: 13, color: "#007AFF", fontWeight: 600 }}>Ver períodos →</span>
      </div>
      <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 26, fontWeight: 800, color: "#0A1628" }}>{fmt(d.actual.facturacion)}</div>
      <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 2 }}>{d.actual.tickets.toLocaleString("es-AR")} tickets</div>
      <Linea c={d.vs_anterior} />
      <Linea c={d.vs_anio_anterior} real />
    </div>
  );
}
