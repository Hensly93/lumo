"use client";
// Merma y anulaciones por motivo y por persona. Lo declarado se separa de lo que nadie explica.
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

type Merma = { total: number; sin_explicar: number; declarada: number; motivos: { motivo: string; nombre: string; veces: number; plata: number }[]; personas: { empleado: string; declarada: number; sin_explicar: number }[]; sin_costo: number; aviso: string };
type Anul = { total_veces: number; total_plata: number; motivos: { motivo: string; nombre: string; veces: number; plata: number }[]; personas: { empleado: string; veces: number; plata: number; motivos: Record<string, number> }[] };

export default function MotivosFugas() {
  const [m, setM] = useState<Merma | null>(null);
  const [a, setA] = useState<Anul | null>(null);
  useEffect(() => {
    const h = { Authorization: `Bearer ${localStorage.getItem("lumo_token")}` };
    fetch(`${API}/api/stock/mermas?dias=30`, { headers: h }).then(r => (r.ok ? r.json() : null)).then(d => d && Array.isArray(d.motivos) && setM(d)).catch(() => {});
    fetch(`${API}/api/fugas/anulaciones?dias=30`, { headers: h }).then(r => (r.ok ? r.json() : null)).then(d => d && Array.isArray(d.motivos) && setA(d)).catch(() => {});
  }, []);
  const caja = { margin: "12px 12px 0", padding: 16, borderRadius: 14, border: "1px solid var(--linea)", background: "var(--blanco)" } as const;
  const titulo = { fontSize: 15, fontWeight: 700, color: "var(--tinta)" } as const;
  const fila = { display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", fontSize: 14, color: "var(--tinta)", borderTop: "1px solid var(--linea)" } as const;
  return (
    <>
      {m && m.total > 0 && (
        <div style={caja}>
          <div style={titulo}>Merma de los últimos 30 días: {fmt(m.total)}</div>
          <div style={{ fontSize: 13, color: "var(--tinta-apagada)", margin: "2px 0 8px", lineHeight: 1.45 }}>
            {fmt(m.declarada)} explicados por quien contó y <strong style={{ color: m.sin_explicar > 0 ? "#D97706" : "var(--tinta)" }}>{fmt(m.sin_explicar)} sin explicar</strong>.
          </div>
          {m.motivos.map(x => <div key={x.motivo} style={fila}><span>{x.nombre} <span style={{ color: "var(--tinta-apagada)" }}>({x.veces})</span></span><strong>{fmt(x.plata)}</strong></div>)}
          {m.personas.length > 1 && (<>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase", margin: "12px 0 2px" }}>Quién lo declara</div>
            {m.personas.map(p => <div key={p.empleado} style={fila}><span>{p.empleado}</span><span>{fmt(p.declarada)} declarado · {fmt(p.sin_explicar)} sin explicar</span></div>)}
          </>)}
          <div style={{ fontSize: 11, color: "var(--tinta-apagada)", marginTop: 8, lineHeight: 1.5 }}>{m.aviso}{m.sin_costo > 0 ? ` En ${m.sin_costo} faltantes el producto no tiene costo cargado, así que no suman plata.` : ""}</div>
        </div>
      )}
      {a && a.total_veces > 0 && (
        <div style={caja}>
          <div style={titulo}>Anulaciones de los últimos 30 días: {a.total_veces} por {fmt(a.total_plata)}</div>
          {a.motivos.map(x => <div key={x.motivo} style={fila}><span>{x.nombre} <span style={{ color: "var(--tinta-apagada)" }}>({x.veces})</span></span><strong>{fmt(x.plata)}</strong></div>)}
          {a.personas.length > 1 && (<>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase", margin: "12px 0 2px" }}>Por persona</div>
            {a.personas.map(p => <div key={p.empleado} style={fila}><span>{p.empleado}</span><span>{p.veces} {p.veces === 1 ? "anulación" : "anulaciones"} · {fmt(p.plata)}</span></div>)}
          </>)}
        </div>
      )}
    </>
  );
}
