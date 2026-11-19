"use client";
// La meta del mes: una barra simple, "vas X días adelantado/atrasado", y se edita ahí mismo.
// Si no hay meta, pregunta una sola vez. Con un local elegido entre varios no se muestra la barra
// (la meta es del negocio entero), solo se dice cuánto vendió ese local en el mes.
import { useCallback, useEffect, useState } from "react";
import { useSucursal } from "../hooks/useSucursal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

type Meta = {
  definida: boolean; mes: number; dia: number; dias_mes: number; vendido: number;
  monto?: number; esperado_a_hoy?: number; pct?: number; dias_adelanto?: number; proyeccion?: number | null;
  cumplida?: boolean; solo_total?: boolean;
};

export default function MetaCard() {
  const { sucursalId } = useSucursal();
  const [m, setM] = useState<Meta | null>(null);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/meta${sucursalId ? `?sucursal_id=${sucursalId}` : ""}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null)).then(d => d && typeof d.vendido === "number" && setM(d)).catch(() => {});
  }, [sucursalId]);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardar(borrar = false) {
    const n = borrar ? 0 : Number(valor.replace(/\./g, "").replace(/,/g, "."));
    if (!borrar && (!Number.isFinite(n) || n <= 0)) { setError("Poné un monto, por ejemplo 5000000."); return; }
    setGuardando(true); setError("");
    try {
      const r = await fetch(`${API}/api/meta`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("lumo_token")}` },
        body: JSON.stringify({ monto: n }),
      });
      if (!r.ok) throw new Error();
      setEditando(false); setValor(""); cargar();
    } catch { setError("No pude guardar. Probá de nuevo."); }
    setGuardando(false);
  }

  if (!m) return null;
  const caja = { margin: "0 0 16px", padding: 16, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)" } as const;
  const mes = MESES[m.mes - 1];

  const formulario = (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>¿Cuánto querés vender en {mes}?</div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input inputMode="numeric" value={valor} onChange={e => setValor(e.target.value)} placeholder="Ej: 5000000" aria-label="Meta de ventas del mes"
          style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--linea)", fontSize: 15 }} />
        <button onClick={() => guardar()} disabled={guardando}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "var(--tinta)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {guardando ? "…" : "Guardar"}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: "var(--critico, #DC2626)", marginTop: 6 }}>{error}</div>}
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        {m.definida && <button onClick={() => setEditando(false)} style={{ padding: 0, border: "none", background: "none", color: "var(--tinta-apagada)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>}
        {m.definida && <button onClick={() => guardar(true)} style={{ padding: 0, border: "none", background: "none", color: "var(--critico, #DC2626)", fontSize: 13, cursor: "pointer" }}>Borrar meta</button>}
      </div>
    </div>
  );

  if (!m.definida) {
    return (
      <div style={caja}>
        {editando ? formulario : (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>Poné una meta para {mes}</div>
            <div style={{ fontSize: 13, color: "var(--tinta-apagada)", marginTop: 2, lineHeight: 1.45 }}>Con una meta, acá ves todos los días si vas adelantado o atrasado.</div>
            <button onClick={() => setEditando(true)} style={{ marginTop: 10, padding: "9px 14px", borderRadius: 8, border: "1px solid var(--linea)", background: "var(--papel)", color: "var(--tinta)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Definir meta</button>
          </>
        )}
      </div>
    );
  }
  if (m.solo_total) {
    return (
      <div style={caja}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase" }}>Este local en {mes}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--tinta)" }}>{fmt(m.vendido)}</div>
        <div style={{ fontSize: 13, color: "var(--tinta-apagada)", marginTop: 2 }}>La meta es de todo el negocio. Elegí "Todas las sucursales" para ver cómo vas.</div>
      </div>
    );
  }
  const adel = m.dias_adelanto ?? 0;
  const dias = Math.abs(Math.round(adel));
  const frase = m.cumplida ? "¡Cumpliste la meta del mes!"
    : dias === 0 ? "Vas justo al ritmo de la meta."
    : adel > 0 ? `Vas ${dias} ${dias === 1 ? "día adelantado" : "días adelantado"}.`
    : `Vas ${dias} ${dias === 1 ? "día atrasado" : "días atrasado"}.`;
  const color = m.cumplida || adel >= 0 ? "var(--ok, #16A34A)" : adel > -3 ? "#D97706" : "var(--critico, #DC2626)";
  const pct = Math.min(100, m.pct ?? 0);
  const marca = Math.min(100, Math.round(((m.esperado_a_hoy ?? 0) / (m.monto || 1)) * 100));
  return (
    <div style={caja}>
      {editando ? formulario : (<>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase" }}>Meta de {mes}</div>
          <button onClick={() => { setValor(String(m.monto ?? "")); setEditando(true); }} style={{ padding: 0, border: "none", background: "none", color: "#007AFF", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cambiar</button>
        </div>
        <div style={{ fontSize: 15, color: "var(--tinta)", marginTop: 4 }}><strong style={{ fontSize: 22 }}>{fmt(m.vendido)}</strong> de {fmt(m.monto ?? 0)} <span style={{ color: "var(--tinta-apagada)" }}>({m.pct}%)</span></div>
        <div style={{ position: "relative", height: 10, borderRadius: 5, background: "var(--linea)", margin: "10px 0 6px" }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: color }} />
          {!m.cumplida && <div title="Dónde deberías estar hoy" style={{ position: "absolute", left: `${marca}%`, top: -3, width: 2, height: 16, background: "var(--tinta)" }} />}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color }}>{frase}</div>
        <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 3, lineHeight: 1.45 }}>
          La rayita es dónde estarías hoy con un ritmo parejo ({fmt(m.esperado_a_hoy ?? 0)}).
          {m.proyeccion != null && !m.cumplida ? ` Si seguís así, cerrás el mes en ${fmt(m.proyeccion)}.` : ""}
        </div>
      </>)}
    </div>
  );
}
