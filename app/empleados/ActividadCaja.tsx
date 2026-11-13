"use client";
// Actividad de la caja: todo lo que el equipo hizo y quedó registrado (productos sacados del carrito, precios, egresos, altas).
import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Hecho = {
  id: number; empleado: string | null; tipo: string; producto_nombre: string | null;
  cantidad: number | null; valor: number; detalle: Record<string, unknown> | null; creado: string;
};

const FILTROS: { id: string; label: string; tipos: string[] | null }[] = [
  { id: "todo", label: "Todo", tipos: null },
  { id: "sacados", label: "Sacados del carrito", tipos: ["item_borrado", "cantidad_reducida"] },
  { id: "precios", label: "Precios", tipos: ["precio_cambiado"] },
  { id: "egresos", label: "Egresos", tipos: ["egreso"] },
];
const pesos = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("es-AR");
const fecha = (iso: string) => new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

function que(h: Hecho): string {
  const prod = h.producto_nombre || "un producto";
  const d = h.detalle || {};
  switch (h.tipo) {
    case "item_borrado": return `Sacó del carrito ${prod}${num(h.cantidad) > 1 ? ` (x${num(h.cantidad)})` : ""}`;
    case "cantidad_reducida": return `Bajó ${num(h.cantidad)} u. de ${prod} en el carrito`;
    case "precio_cambiado": return `Cambió el ${d.campo === "precio_costo" ? "costo" : "precio"} de ${prod}: ${pesos(num(d.antes))} → ${pesos(num(d.despues))}`;
    case "producto_creado": return `Dio de alta ${prod}`;
    case "egreso": return `Sacó ${pesos(h.valor)} de la caja${d.motivo ? `: ${String(d.motivo)}` : ""}`;
    default: return h.tipo;
  }
}

export default function ActividadCaja({ token }: { token: string | null }) {
  const [hechos, setHechos] = useState<Hecho[] | null>(null);
  const [filtro, setFiltro] = useState("todo");
  const [todos, setTodos] = useState(false);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/caja/hechos?dias=30&limite=300`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return;
      const d = await r.json();
      setHechos(Array.isArray(d.hechos) ? d.hechos : []);
    } catch { /* sin señal */ }
  }, [token]);
  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const t = FILTROS.find(f => f.id === filtro)?.tipos;
    return (hechos || []).filter(h => !t || t.includes(h.tipo));
  }, [hechos, filtro]);

  // Resumen por persona: productos sacados del carrito en los últimos 30 días
  const porPersona = useMemo(() => {
    const m = new Map<string, { n: number; valor: number }>();
    for (const h of hechos || []) {
      if (h.tipo !== "item_borrado" && h.tipo !== "cantidad_reducida") continue;
      const k = h.empleado || "Sin nombre";
      const x = m.get(k) || { n: 0, valor: 0 };
      x.n += 1; x.valor += h.valor;
      m.set(k, x);
    }
    return [...m.entries()].sort((a, b) => b[1].valor - a[1].valor);
  }, [hechos]);

  if (hechos === null) return null;
  const lista = todos ? visibles : visibles.slice(0, 15);
  const card: React.CSSProperties = { margin: "0 12px 10px", background: "var(--card2)", borderRadius: 14, padding: 14, border: "1px solid var(--border)", boxShadow: "var(--sh)" };

  return (
    <>
      <SectionTitle>Actividad de la caja</SectionTitle>
      {hechos.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)", padding: "0 14px 12px", lineHeight: 1.5 }}>
          Todavía no hay movimientos. Cada vez que alguien saque un producto del carrito, cambie un precio o saque plata de la caja, queda anotado acá con quién, cuándo y cuánto.
        </div>
      ) : (
        <>
          {porPersona.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Productos sacados del carrito (30 días)</div>
              {porPersona.map(([nombre, x]) => (
                <div key={nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "var(--text)" }}>
                  <span>{nombre}</span>
                  <span style={{ color: "var(--muted)" }}>{x.n} {x.n === 1 ? "vez" : "veces"} · {pesos(x.valor)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 14px 8px" }}>
            {FILTROS.map(f => (
              <button key={f.id} onClick={() => { setFiltro(f.id); setTodos(false); }}
                style={{ padding: "6px 11px", borderRadius: 20, border: "1px solid var(--border)", background: filtro === f.id ? "#007AFF" : "transparent", color: filtro === f.id ? "#fff" : "var(--text)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={card}>
            {lista.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>No hay movimientos de este tipo.</div>}
            {lista.map(h => (
              <div key={h.id} style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{que(h)}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                  {h.empleado || "Sin nombre"} · {fecha(h.creado)}{h.valor > 0 && h.tipo !== "egreso" ? ` · ${pesos(h.valor)}` : ""}
                </div>
              </div>
            ))}
            {visibles.length > 15 && (
              <button onClick={() => setTodos(!todos)} style={{ marginTop: 10, background: "none", border: "none", color: "#007AFF", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                {todos ? "Ver menos" : `Ver los ${visibles.length} movimientos`}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
