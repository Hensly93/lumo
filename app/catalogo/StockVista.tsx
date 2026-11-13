"use client";
// Stock liviano: ver qué hay, qué falta, qué está parado, y contar. No es un depósito: es saber cuánto tenés y cuándo reponer.
import { useCallback, useEffect, useState, type CSSProperties } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Estado = "sin_control" | "negativo" | "agotado" | "bajo" | "sin_movimiento" | "ok";
type Prod = {
  id: number; nombre: string; marca: string | null; categoria: string | null; precio_costo: number | null;
  stock: number | null; stock_minimo: number | null; vendido30: number; dias_restantes: number | null; dias_sin_venta: number | null; estado: Estado;
};
type Resumen = { controlados: number; sin_control: number; agotados: number; bajos: number; negativos: number; sin_movimiento: number; capital: number; capital_parado: number };
type Filtro = "reponer" | "parados" | "todos" | "sin_control" | "negativos";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const num = (n: number) => (Math.round(n * 100) / 100).toLocaleString("es-AR");
const caja: CSSProperties = { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" };
const campo: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: 14, boxSizing: "border-box" };
const btn = (primario: boolean, off = false): CSSProperties => ({
  padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: off ? "default" : "pointer", opacity: off ? 0.5 : 1,
  border: primario ? "none" : "1px solid var(--border)", background: primario ? "var(--azul, #0A5BD3)" : "transparent", color: primario ? "#fff" : "var(--text)",
});
const ETIQ: Record<Estado, { t: string; c: string }> = {
  sin_control: { t: "Sin controlar", c: "var(--muted)" }, negativo: { t: "Revisar carga", c: "#E5484D" }, agotado: { t: "Sin stock", c: "#E5484D" },
  bajo: { t: "Por terminarse", c: "#F5A623" }, sin_movimiento: { t: "No se vende", c: "#8E8EA0" }, ok: { t: "Bien", c: "#30A46C" },
};

export default function StockVista({ token, avisar }: { token: string; avisar: (msg: string, ok: boolean) => void }) {
  const [prods, setProds] = useState<Prod[] | null>(null);
  const [res, setRes] = useState<Resumen | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("reponer");
  const [q, setQ] = useState("");
  const [contando, setContando] = useState(false);
  const [vals, setVals] = useState<Record<number, string>>({});
  const [abierto, setAbierto] = useState<number | null>(null);
  const [minimo, setMinimo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/stock`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo cargar");
      setProds(d.productos); setRes(d.resumen);
      if (d.resumen.controlados === 0) setFiltro("sin_control");
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo cargar el stock", false); setProds([]); }
  }, [token, avisar]);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardarConteo() {
    const items = Object.entries(vals).filter(([, v]) => v.trim() !== "").map(([id, v]) => ({ producto_id: Number(id), contado: Number(v.replace(",", ".")) }))
      .filter(x => Number.isFinite(x.contado) && x.contado >= 0);
    if (!items.length) { avisar("Escribí al menos una cantidad", false); return; }
    setGuardando(true);
    try {
      const r = await fetch(`${API}/api/stock/contar`, { method: "POST", headers: h, body: JSON.stringify({ items }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo guardar");
      const faltan = (d.diferencias || []).filter((x: { diferencia: number }) => x.diferencia < 0).length;
      avisar(`Guardado: ${d.iniciales} nuevos, ${d.ajustes} corregidos${faltan ? `, ${faltan} con faltante` : ""}`, true);
      setVals({}); setContando(false); await cargar();
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo guardar", false); }
    finally { setGuardando(false); }
  }

  async function guardarMinimo(p: Prod) {
    try {
      const r = await fetch(`${API}/api/stock/minimo`, { method: "POST", headers: h, body: JSON.stringify({ producto_id: p.id, minimo: minimo.trim() === "" ? null : Number(minimo.replace(",", ".")) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo guardar");
      avisar("Mínimo guardado", true); setAbierto(null); await cargar();
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo guardar", false); }
  }

  async function dejar(p: Prod) {
    try {
      await fetch(`${API}/api/stock/dejar-de-controlar`, { method: "POST", headers: h, body: JSON.stringify({ producto_id: p.id }) });
      avisar("Listo, ya no se controla", true); setAbierto(null); await cargar();
    } catch { avisar("No se pudo guardar", false); }
  }

  if (!prods || !res) return <div style={{ padding: 24, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>Cargando stock…</div>;

  const lista = prods.filter(p => {
    if (q && !p.nombre.toLowerCase().includes(q.toLowerCase())) return false;
    if (contando) return true;
    if (filtro === "reponer") return p.estado === "agotado" || p.estado === "bajo";
    if (filtro === "parados") return p.estado === "sin_movimiento";
    if (filtro === "sin_control") return p.estado === "sin_control";
    if (filtro === "negativos") return p.estado === "negativo";
    return true;
  }).sort((a, b) => (contando ? 0 : b.vendido30 - a.vendido30));
  const cargados = Object.values(vals).filter(v => v.trim() !== "").length;

  const chip = (f: Filtro, t: string, n: number) => (
    <button key={f} onClick={() => { setFiltro(f); setContando(false); }} style={{ ...btn(filtro === f && !contando), padding: "8px 12px", fontSize: 12, whiteSpace: "nowrap" }}>{t}{n ? ` · ${n}` : ""}</button>
  );

  return (
    <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
      {res.controlados === 0 ? (
        <div style={caja}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Empezá a controlar tu stock</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            Contá lo que tenés hoy, de los productos que más te importan (no hace falta todos). Desde ahí baja solo con cada venta y sube con cada factura que cargues. Si en un conteo falta algo, LumoBi te dice cuánta plata es.
          </div>
          <button onClick={() => setContando(true)} style={{ ...btn(true), width: "100%", marginTop: 10 }}>Contar ahora</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={caja}><div style={{ fontSize: 11, color: "var(--muted)" }}>Plata en mercadería</div><div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(res.capital)}</div></div>
          <div style={caja}><div style={{ fontSize: 11, color: "var(--muted)" }}>Parada (no se vende)</div><div style={{ fontSize: 18, fontWeight: 800, color: res.capital_parado > 0 ? "#F5A623" : "var(--text)" }}>{fmt(res.capital_parado)}</div></div>
        </div>
      )}

      {res.controlados > 0 && !contando && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {chip("reponer", "Por reponer", res.agotados + res.bajos)}
          {chip("parados", "Parados", res.sin_movimiento)}
          {res.negativos > 0 && chip("negativos", "Revisar", res.negativos)}
          {chip("sin_control", "Sin controlar", res.sin_control)}
          {chip("todos", "Todos", 0)}
        </div>
      )}

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto" style={campo} />

      {contando && (
        <div style={{ ...caja, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          Escribí cuántas unidades hay hoy. Los que dejes vacíos no se tocan. Si un producto ya tenía stock y la cantidad es menor, queda registrada la diferencia.
        </div>
      )}

      {lista.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 13 }}>
          {filtro === "reponer" && !contando ? "Nada para reponer por ahora." : "No hay productos acá."}
        </div>
      ) : lista.slice(0, 200).map(p => {
        const e = ETIQ[p.estado];
        return (
          <div key={p.id} style={caja}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => { if (!contando && p.estado !== "sin_control") { setAbierto(abierto === p.id ? null : p.id); setMinimo(p.stock_minimo != null ? String(p.stock_minimo) : ""); } }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: e.c, marginTop: 2 }}>
                  {e.t}
                  {p.estado === "bajo" && p.dias_restantes != null ? ` · alcanza para ${num(p.dias_restantes)} días` : ""}
                  {p.estado === "sin_movimiento" && p.dias_sin_venta != null ? ` · hace ${p.dias_sin_venta} días sin venta` : ""}
                  {p.estado !== "sin_control" && p.vendido30 > 0 ? <span style={{ color: "var(--muted)" }}> · {num(p.vendido30)} vendidos en 30 días</span> : null}
                </div>
              </div>
              {contando ? (
                <input inputMode="decimal" value={vals[p.id] ?? ""} onChange={ev => setVals(v => ({ ...v, [p.id]: ev.target.value }))}
                  placeholder={p.stock != null ? num(p.stock) : "¿Cuántos?"} style={{ ...campo, width: 96, textAlign: "right" }} />
              ) : p.stock != null ? (
                <div style={{ fontSize: 20, fontWeight: 800, color: p.estado === "agotado" || p.estado === "negativo" ? "#E5484D" : "var(--text)" }}>{num(p.stock)}</div>
              ) : null}
            </div>
            {abierto === p.id && !contando && (
              <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Avisame cuando queden…</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input inputMode="decimal" value={minimo} onChange={ev => setMinimo(ev.target.value)} placeholder="unidades" style={{ ...campo, flex: 1 }} />
                  <button onClick={() => guardarMinimo(p)} style={{ ...btn(true), padding: "10px 16px" }}>Guardar</button>
                </div>
                <button onClick={() => dejar(p)} style={{ ...btn(false), width: "100%", marginTop: 8, fontSize: 12, padding: "9px", color: "var(--muted)" }}>Dejar de controlar este producto</button>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ position: "sticky", bottom: 84, display: "flex", gap: 8, paddingTop: 4 }}>
        {contando ? (
          <>
            <button onClick={() => { setContando(false); setVals({}); }} style={{ ...btn(false), flex: 1, background: "var(--bg, #0b0b12)" }}>Cancelar</button>
            <button onClick={guardarConteo} disabled={guardando || !cargados} style={{ ...btn(true, guardando || !cargados), flex: 2 }}>{guardando ? "Guardando…" : `Guardar${cargados ? ` (${cargados})` : ""}`}</button>
          </>
        ) : res.controlados > 0 ? (
          <button onClick={() => setContando(true)} style={{ ...btn(true), width: "100%" }}>Contar / cargar stock</button>
        ) : null}
      </div>
    </div>
  );
}
