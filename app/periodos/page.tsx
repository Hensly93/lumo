"use client";
// Períodos y comparativas — LumoBi (29/10/2026)
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { useSucursal } from "../hooks/useSucursal";
import { PageHeader } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Periodo = "hoy" | "semana" | "mes" | "anio";
type Resumen = {
  desde: string; hasta: string; etiqueta: string;
  facturacion: number; facturacion_real: number | null;
  tickets: number; ticket_promedio: number | null; ticket_promedio_real: number | null;
  turnos: number; turnos_con_faltante: number; faltante: number; sobrante: number;
};
type Variacion = {
  facturacion: number | null; facturacion_real: number | null; tickets: number | null;
  ticket_promedio: number | null; ticket_promedio_real: number | null; faltante: number | null;
};
type Comparacion = { etiqueta: string; desde: string; hasta: string; hay_datos: boolean; base: Resumen; variacion: Variacion };
type Item = { clave: string; tickets: number; total: number };
type Punto = { etiqueta: string; actual: number | null; comparacion: number | null };
type Respuesta = {
  periodo: Periodo;
  actual: Resumen;
  vs_anterior: Comparacion | null;
  vs_anio_anterior: Comparacion | null;
  serie: { granularidad: string; comparacion: string; puntos: Punto[] };
  desglose: { por_local: Item[]; por_empleado: Item[]; por_medio: Item[]; por_hora: Item[]; por_dia_semana: Item[] };
  inflacion: { disponible: boolean; ipc_hasta?: string; nota: string };
  error?: string;
};

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoy", label: "Hoy" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }, { id: "anio", label: "Año" },
];
const DESGLOSES: { id: keyof Respuesta["desglose"]; label: string }[] = [
  { id: "por_local", label: "Local" }, { id: "por_empleado", label: "Empleado" }, { id: "por_medio", label: "Medio de pago" },
  { id: "por_hora", label: "Hora" }, { id: "por_dia_semana", label: "Día" },
];

const fmt = (n: number | null | undefined) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("es-AR"));
const fmtN = (n: number | null | undefined) => (n == null ? "—" : Math.round(n).toLocaleString("es-AR"));
const fmtFecha = (ts: string) => { const [f] = ts.split(" "); const [y, m, d] = f.split("-"); return `${d}/${m}/${y.slice(2)}`; };

const tarjeta: CSSProperties = { margin: "8px 12px", background: "var(--card2)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--border)" };
const titulo: CSSProperties = { fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 };
const grande: CSSProperties = { fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text)", lineHeight: 1.1 };
const medio: CSSProperties = { fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "var(--text)" };

// "Más es mejor" para ventas; para faltantes, más es peor
function Variacion({ v, invertir = false, sufijo = "" }: { v: number | null | undefined; invertir?: boolean; sufijo?: string }) {
  if (v == null) return <span style={{ color: "var(--muted)" }}>sin dato{sufijo}</span>;
  const bueno = invertir ? v < 0 : v > 0;
  const color = v === 0 ? "var(--muted)" : bueno ? "var(--emerald)" : "var(--red, #E5484D)";
  return <span style={{ color, fontWeight: 700 }}>{v > 0 ? "▲ +" : v < 0 ? "▼ " : ""}{v.toLocaleString("es-AR")}%{sufijo}</span>;
}

function LineaComparacion({ c, campo, campoReal, invertir }: { c: Comparacion | null; campo: keyof Variacion; campoReal?: keyof Variacion; invertir?: boolean }) {
  if (!c) return null;
  if (!c.hay_datos) return <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>vs {c.etiqueta}: sin datos para comparar</div>;
  return (
    <div style={{ fontSize: 12, color: "var(--text)", marginTop: 4, lineHeight: 1.5 }}>
      vs {c.etiqueta}: <Variacion v={c.variacion[campo]} invertir={invertir} />
      {campoReal && c.variacion[campoReal] != null && <> · <Variacion v={c.variacion[campoReal]} invertir={invertir} sufijo=" real" /></>}
    </div>
  );
}

function Grafico({ puntos, comparacion }: { puntos: Punto[]; comparacion: string }) {
  const W = 340, H = 140, P = 6;
  const max = Math.max(1, ...puntos.flatMap(p => [p.actual ?? 0, p.comparacion ?? 0]));
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, puntos.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const linea = (k: "actual" | "comparacion") =>
    puntos.map((p, i) => (p[k] == null ? null : `${x(i)},${y(p[k] as number)}`)).filter(Boolean).join(" ");
  const cada = Math.ceil(puntos.length / 6);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Ventas del período contra la comparación">
        <polyline points={linea("comparacion")} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
        <polyline points={linea("actual")} fill="none" stroke="var(--cyan, #007AFF)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
        {puntos.filter((_, i) => i % cada === 0).map(p => <span key={p.etiqueta}>{p.etiqueta}</span>)}
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        <span><span style={{ display: "inline-block", width: 14, height: 3, background: "var(--cyan, #007AFF)", verticalAlign: "middle", marginRight: 5 }} />Ahora</span>
        <span><span style={{ display: "inline-block", width: 14, borderTop: "2px dashed var(--muted)", verticalAlign: "middle", marginRight: 5 }} />{comparacion}</span>
      </div>
    </div>
  );
}

function Barras({ items }: { items: Item[] }) {
  const total = items.reduce((s, i) => s + i.total, 0);
  const max = Math.max(1, ...items.map(i => i.total));
  if (!items.length) return <div style={{ fontSize: 12, color: "var(--muted)" }}>Sin ventas en este período.</div>;
  return (
    <div>
      {items.map(i => (
        <div key={i.clave} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text)", marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{i.clave}</span>
            <span>{fmt(i.total)} <span style={{ color: "var(--muted)" }}>· {total ? Math.round((i.total / total) * 100) : 0}% · {fmtN(i.tickets)} tickets</span></span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--border)" }}>
            <div style={{ width: `${(i.total / max) * 100}%`, height: "100%", borderRadius: 3, background: "var(--cyan, #007AFF)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PeriodosPage() {
  const router = useRouter();
  const { sucursalId } = useSucursal();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [desglose, setDesglose] = useState<keyof Respuesta["desglose"]>("por_local");
  const [data, setData] = useState<Respuesta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setLoading(true); setError("");
    const q = new URLSearchParams({ periodo });
    if (sucursalId) q.set("sucursal_id", String(sucursalId));
    fetch(`${API}/api/periodos?${q}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then((d: Respuesta) => { if (d?.actual) setData(d); else setError(d?.error || "No se pudo cargar el período"); })
      .catch(() => setError("Sin conexión"))
      .finally(() => setLoading(false));
  }, [periodo, sucursalId, router]);

  const a = data?.actual;
  const items = data?.desglose?.[desglose] ?? [];

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Períodos" sub="Cómo te fue · comparado de forma justa" />

      {/* Selector de período */}
      <div style={{ display: "flex", gap: 6, margin: "4px 12px 8px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 14, padding: 4 }}>
        {PERIODOS.map(p => (
          <button key={p.id} onClick={() => setPeriodo(p.id)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
              background: periodo === p.id ? "var(--cyan, #007AFF)" : "transparent", color: periodo === p.id ? "white" : "var(--muted)" }}>
            {p.label}
          </button>
        ))}
      </div>

      {loading && !data && <div style={{ textAlign: "center", padding: 40, fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Calculando...</div>}
      {error && <div style={{ ...tarjeta, color: "var(--red, #E5484D)", fontSize: 13 }}>{error}</div>}

      {a && data && (
        <div style={{ opacity: loading ? 0.5 : 1, transition: "opacity .2s" }}>
          {/* Facturación */}
          <div style={tarjeta}>
            <div style={titulo}>Facturación · {a.etiqueta} <span style={{ textTransform: "none", letterSpacing: 0 }}>({fmtFecha(a.desde)} al {fmtFecha(a.hasta)})</span></div>
            <div style={grande}>{fmt(a.facturacion)}</div>
            <LineaComparacion c={data.vs_anterior} campo="facturacion" campoReal="facturacion_real" />
            <LineaComparacion c={data.vs_anio_anterior} campo="facturacion" campoReal="facturacion_real" />
          </div>

          {/* Tickets y ticket promedio */}
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ ...tarjeta, flex: 1, marginRight: 4 }}>
              <div style={titulo}>Tickets</div>
              <div style={medio}>{fmtN(a.tickets)}</div>
              <LineaComparacion c={data.vs_anterior} campo="tickets" />
              <LineaComparacion c={data.vs_anio_anterior} campo="tickets" />
            </div>
            <div style={{ ...tarjeta, flex: 1, marginLeft: 4 }}>
              <div style={titulo}>Ticket promedio</div>
              <div style={medio}>{fmt(a.ticket_promedio)}</div>
              <LineaComparacion c={data.vs_anterior} campo="ticket_promedio" campoReal="ticket_promedio_real" />
              <LineaComparacion c={data.vs_anio_anterior} campo="ticket_promedio" campoReal="ticket_promedio_real" />
            </div>
          </div>

          {/* Caja */}
          <div style={tarjeta}>
            <div style={titulo}>Faltantes de caja</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={medio}>{fmt(a.faltante)}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {a.turnos ? `${a.turnos_con_faltante} de ${a.turnos} turnos cerrados con faltante` : "sin turnos cerrados"}
                {a.sobrante > 0 && ` · sobrante ${fmt(a.sobrante)}`}
              </div>
            </div>
            <LineaComparacion c={data.vs_anterior} campo="faltante" invertir />
            <LineaComparacion c={data.vs_anio_anterior} campo="faltante" invertir />
          </div>

          {/* Gráfico */}
          <div style={tarjeta}>
            <div style={titulo}>Ventas {data.serie.granularidad === "hora" ? "por hora" : data.serie.granularidad === "mes" ? "por mes" : "por día"}</div>
            <Grafico puntos={data.serie.puntos} comparacion={data.serie.comparacion} />
          </div>

          {/* Desglose */}
          <div style={tarjeta}>
            <div style={titulo}>¿De dónde salió? · {a.etiqueta}</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
              {DESGLOSES.map(d => (
                <button key={d.id} onClick={() => setDesglose(d.id)}
                  style={{ whiteSpace: "nowrap", padding: "7px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    border: `1px solid ${desglose === d.id ? "var(--cyan, #007AFF)" : "var(--border)"}`,
                    background: desglose === d.id ? "var(--cyan, #007AFF)" : "transparent", color: desglose === d.id ? "white" : "var(--text)" }}>
                  {d.label}
                </button>
              ))}
            </div>
            <Barras items={items} />
          </div>

          <div style={{ margin: "4px 16px 8px", fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            {data.inflacion.nota} Las comparaciones usan el mismo tramo: por ejemplo, del 1 al {a.hasta.slice(8, 10)} contra del 1 al {a.hasta.slice(8, 10)}, hasta la misma hora.
          </div>
        </div>
      )}
      <Nav />
    </main>
  );
}
