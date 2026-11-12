"use client";
// Actualizar precios en bloque: se elige qué productos, cómo cambiar, se ve cómo quedaría y recién ahí se aplica.
import { useEffect, useState, type CSSProperties } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Item = {
  id: number; nombre: string; marca: string | null; categoria: string | null;
  precio_actual: number; precio_nuevo: number; subida_pct: number;
  margen_actual: number | null; margen_nuevo: number | null; alto: boolean;
};
type Resumen = { revisados: number; con_cambio: number; sin_costo: number; ya_cumplen: number; tope: boolean };
type Opciones = { categorias: string[]; marcas: string[]; proveedores: string[] };

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const caja: CSSProperties = { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" };
const campo: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: 14, boxSizing: "border-box" };
const rotulo: CSSProperties = { fontSize: 11, color: "var(--muted)", marginBottom: 4 };
const btn = (primario: boolean, off = false): CSSProperties => ({
  padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: off ? "default" : "pointer", opacity: off ? 0.5 : 1,
  border: primario ? "none" : "1px solid var(--border)", background: primario ? "var(--azul, #0A5BD3)" : "transparent", color: primario ? "#fff" : "var(--text)",
});

export default function PreciosMasivo({ token, avisar, onListo }: { token: string; avisar: (msg: string, ok: boolean) => void; onListo: () => void }) {
  const [op, setOp] = useState<Opciones>({ categorias: [], marcas: [], proveedores: [] });
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [margenBajo, setMargenBajo] = useState(false);
  const [sinTocar, setSinTocar] = useState(false);
  const [modo, setModo] = useState<"porcentaje" | "margen">("porcentaje");
  const [valor, setValor] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/api/precios-masivo/opciones`, { headers: h }).then(r => r.json()).then(d => {
      if (d && Array.isArray(d.categorias)) setOp(d);
    }).catch(() => { /* sin opciones: se puede usar igual con todo el catálogo */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ver() {
    const v = parseFloat(valor.replace(",", "."));
    if (!Number.isFinite(v)) { avisar("Escribí un número", false); return; }
    setCargando(true); setConfirmar(false);
    try {
      const r = await fetch(`${API}/api/precios-masivo/simular`, {
        method: "POST", headers: h,
        body: JSON.stringify({ modo, valor: v, filtro: { categoria, marca, proveedor, margen_bajo: margenBajo, sin_tocar_dias: sinTocar ? 60 : null } }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo calcular");
      setItems(d.items); setResumen(d.resumen); setElegidos(d.items.map((x: Item) => x.id));
    } catch (e: unknown) {
      avisar(e instanceof Error ? e.message : "Error", false);
    } finally { setCargando(false); }
  }

  async function aplicar() {
    if (!items) return;
    setAplicando(true);
    try {
      const sel = items.filter(x => elegidos.includes(x.id)).map(x => ({ id: x.id, precio_nuevo: x.precio_nuevo }));
      const r = await fetch(`${API}/api/precios-masivo/aplicar`, { method: "POST", headers: h, body: JSON.stringify({ items: sel }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo aplicar");
      avisar(`${d.actualizados} precio${d.actualizados !== 1 ? "s" : ""} actualizado${d.actualizados !== 1 ? "s" : ""}`, true);
      onListo();
    } catch (e: unknown) {
      avisar(e instanceof Error ? e.message : "Error", false);
    } finally { setAplicando(false); setConfirmar(false); }
  }

  const sel = items ? items.filter(x => elegidos.includes(x.id)) : [];
  const select = (valorSel: string, set: (v: string) => void, lista: string[], vacio: string) => (
    <select style={campo} value={valorSel} onChange={e => { set(e.target.value); setItems(null); }}>
      <option value="">{vacio}</option>
      {lista.map(x => <option key={x} value={x}>{x}</option>)}
    </select>
  );
  const chip = (activo: boolean, texto: string, onClick: () => void) => (
    <button onClick={() => { onClick(); setItems(null); }} style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: `1px solid ${activo ? "var(--azul, #0A5BD3)" : "var(--border)"}`, background: activo ? "var(--azul, #0A5BD3)" : "transparent", color: activo ? "#fff" : "var(--text)" }}>{texto}</button>
  );

  return (
    <div style={{ padding: "8px 16px 140px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={caja}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>1. ¿Qué precios querés cambiar?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div><div style={rotulo}>Categoría</div>{select(categoria, setCategoria, op.categorias, "Todas")}</div>
          <div><div style={rotulo}>Marca</div>{select(marca, setMarca, op.marcas, "Todas")}</div>
          {op.proveedores.length > 0 && <div><div style={rotulo}>Proveedor (por tus facturas)</div>{select(proveedor, setProveedor, op.proveedores, "Todos")}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
            {chip(margenBajo, "Solo margen bajo (menos de 25%)", () => setMargenBajo(v => !v))}
            {chip(sinTocar, "Sin cambios hace 60 días o más", () => setSinTocar(v => !v))}
          </div>
        </div>
      </div>

      <div style={caja}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>2. ¿Cómo los cambiamos?</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {chip(modo === "porcentaje", "Subir un porcentaje", () => setModo("porcentaje"))}
          {chip(modo === "margen", "Llevar a un margen", () => setModo("margen"))}
        </div>
        <div style={rotulo}>{modo === "porcentaje" ? "Porcentaje (ej: 10 sube 10%)" : "Margen que querés ganar (ej: 30 = 30% del precio)"}</div>
        <input style={campo} inputMode="decimal" placeholder={modo === "porcentaje" ? "10" : "30"} value={valor} onChange={e => { setValor(e.target.value); setItems(null); }} />
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>
          {modo === "margen" ? "Solo sube los que hoy están por debajo de ese margen y tienen el costo cargado. Nunca baja un precio." : "Los precios se redondean para cobrar fácil ($10, $50 o $100 según el valor)."}
        </div>
        <button onClick={ver} disabled={cargando || !valor.trim()} style={{ ...btn(true, cargando || !valor.trim()), width: "100%", marginTop: 12 }}>{cargando ? "Calculando..." : "Ver cómo quedaría"}</button>
      </div>

      {items && resumen && (
        <div style={caja}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>3. Revisá y confirmá</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.6 }}>
            {items.length === 0
              ? `No hay cambios para hacer. Revisé ${resumen.revisados} producto${resumen.revisados !== 1 ? "s" : ""}${resumen.ya_cumplen ? `, ${resumen.ya_cumplen} ya cumplen ese margen` : ""}${resumen.sin_costo ? `, ${resumen.sin_costo} no tienen costo cargado` : ""}.`
              : `${items.length} precio${items.length !== 1 ? "s" : ""} para cambiar de ${resumen.revisados} revisados.${resumen.sin_costo ? ` ${resumen.sin_costo} sin costo cargado no se tocan.` : ""}${resumen.ya_cumplen ? ` ${resumen.ya_cumplen} ya cumplen.` : ""}${resumen.tope ? " Mostrando los primeros 1000." : ""}`}
          </div>
          {items.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={() => setElegidos(items.map(x => x.id))} style={{ ...btn(false), padding: "6px 12px", fontSize: 12 }}>Todos</button>
                <button onClick={() => setElegidos([])} style={{ ...btn(false), padding: "6px 12px", fontSize: 12 }}>Ninguno</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map(x => {
                  const on = elegidos.includes(x.id);
                  return (
                    <div key={x.id} onClick={() => setElegidos(e => on ? e.filter(i => i !== x.id) : [...e, x.id])}
                      style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, cursor: "pointer", opacity: on ? 1 : 0.45, border: `1px solid ${x.alto && on ? "var(--yellow)" : "var(--border)"}` }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: "1.5px solid var(--azul, #0A5BD3)", background: on ? "var(--azul, #0A5BD3)" : "transparent", color: "#fff", fontSize: 11, textAlign: "center", lineHeight: "16px" }}>{on ? "✓" : ""}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{x.nombre}{x.marca ? ` · ${x.marca}` : ""}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {x.margen_actual != null && x.margen_nuevo != null ? `Margen ${x.margen_actual}% → ${x.margen_nuevo}%` : "Sin costo cargado"}
                          {x.alto ? " · suba grande, mirá si el cliente la aguanta" : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", textDecoration: "line-through" }}>{fmt(x.precio_actual)}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{fmt(x.precio_nuevo)} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>{x.subida_pct > 0 ? "+" : ""}{x.subida_pct}%</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {items && items.length > 0 && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 70, padding: "10px 16px", background: "var(--bg, #fff)", borderTop: "1px solid var(--border)", zIndex: 50 }}>
          {!confirmar ? (
            <button onClick={() => setConfirmar(true)} disabled={sel.length === 0} style={{ ...btn(true, sel.length === 0), width: "100%" }}>Aplicar {sel.length} cambio{sel.length !== 1 ? "s" : ""}</button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmar(false)} style={{ ...btn(false), flex: 1 }}>Volver</button>
              <button onClick={aplicar} disabled={aplicando} style={{ ...btn(true, aplicando), flex: 2 }}>{aplicando ? "Aplicando..." : `Sí, cambiar ${sel.length} precio${sel.length !== 1 ? "s" : ""}`}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
