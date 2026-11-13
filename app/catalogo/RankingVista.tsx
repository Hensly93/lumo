"use client";
// Qué se vende más, qué deja más ganancia y qué casi no se vende. Sale de las ventas de la caja (no hace falta controlar el stock).
import { useEffect, useState, type CSSProperties } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Fila = { id: number; nombre: string; marca: string | null; unidades: number; ingresos: number; ganancia: number | null; parado: number };
type Datos = {
  dias: number; productos: number; con_ventas: number; sin_ventas: number; total_unidades: number; total_ingresos: number;
  mas_vendidos: Fila[]; mas_ganancia: Fila[]; menos_vendidos: Fila[];
};
type Lista = "mas" | "ganancia" | "menos";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const num = (n: number) => (Math.round(n * 100) / 100).toLocaleString("es-AR");
const caja: CSSProperties = { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" };
const chipSt = (on: boolean): CSSProperties => ({
  padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  border: on ? "none" : "1px solid var(--border)", background: on ? "var(--azul, #0A5BD3)" : "transparent", color: on ? "#fff" : "var(--text)",
});

export default function RankingVista({ token, avisar }: { token: string; avisar: (msg: string, ok: boolean) => void }) {
  const [dias, setDias] = useState(30);
  const [lista, setLista] = useState<Lista>("mas");
  const [d, setD] = useState<Datos | null>(null);

  useEffect(() => {
    let vivo = true;
    setD(null);
    fetch(`${API}/api/stock/ranking?dias=${dias}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || "No se pudo cargar"); if (vivo) setD(j); })
      .catch((e) => { avisar(e instanceof Error ? e.message : "No se pudo cargar el ranking", false); if (vivo) setD({ dias, productos: 0, con_ventas: 0, sin_ventas: 0, total_unidades: 0, total_ingresos: 0, mas_vendidos: [], mas_ganancia: [], menos_vendidos: [] }); });
    return () => { vivo = false; };
  }, [dias, token, avisar]);

  if (!d) return <div style={{ padding: 24, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>Cargando ventas por producto…</div>;

  if (d.con_ventas === 0) {
    return (
      <div style={{ padding: "12px 16px 0" }}>
        <div style={caja}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Todavía no hay ventas por producto</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            El ranking se arma con cada producto que se cobra en la caja. Apenas se venda con la pistola o con la búsqueda, empieza a aparecer qué se vende más y qué se vende menos.
          </div>
        </div>
      </div>
    );
  }

  const filas = lista === "mas" ? d.mas_vendidos : lista === "ganancia" ? d.mas_ganancia : d.menos_vendidos;
  const maximo = Math.max(1, ...filas.map((p) => (lista === "ganancia" ? p.ganancia ?? 0 : p.unidades)));

  return (
    <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[7, 30, 90].map((n) => <button key={n} onClick={() => setDias(n)} style={chipSt(dias === n)}>{n} días</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={caja}><div style={{ fontSize: 11, color: "var(--muted)" }}>Vendiste</div><div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(d.total_ingresos)}</div></div>
        <div style={caja}><div style={{ fontSize: 11, color: "var(--muted)" }}>Productos sin una venta</div><div style={{ fontSize: 18, fontWeight: 800, color: d.sin_ventas > 0 ? "#F5A623" : "var(--text)" }}>{d.sin_ventas} de {d.productos}</div></div>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        <button onClick={() => setLista("mas")} style={chipSt(lista === "mas")}>Más vendidos</button>
        <button onClick={() => setLista("ganancia")} style={chipSt(lista === "ganancia")}>Más ganancia</button>
        <button onClick={() => setLista("menos")} style={chipSt(lista === "menos")}>Menos vendidos</button>
      </div>
      {lista === "ganancia" && <div style={{ fontSize: 11, color: "var(--muted)" }}>Solo cuentan los productos con costo cargado.</div>}
      {filas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 13 }}>
          {lista === "ganancia" ? "Cargá el costo de tus productos para ver cuáles dejan más ganancia." : "No hay productos acá."}
        </div>
      ) : filas.map((p, i) => {
        const valor = lista === "ganancia" ? p.ganancia ?? 0 : p.unidades;
        return (
          <div key={p.id} style={caja}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 22, fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {p.unidades > 0 ? `${num(p.unidades)} vendidos · ${fmt(p.ingresos)}` : `Sin ventas en ${d.dias} días`}
                  {lista !== "ganancia" && p.ganancia != null && p.unidades > 0 ? ` · deja ${fmt(p.ganancia)}` : ""}
                  {lista === "menos" && p.parado > 0 ? <span style={{ color: "#F5A623" }}> · {fmt(p.parado)} parados en stock</span> : null}
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{lista === "ganancia" ? fmt(valor) : num(valor)}</div>
            </div>
            {lista !== "menos" && (
              <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "var(--border)" }}>
                <div style={{ width: `${Math.max(3, Math.round((valor / maximo) * 100))}%`, height: 4, borderRadius: 2, background: "var(--azul, #0A5BD3)" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
