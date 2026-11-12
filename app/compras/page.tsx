"use client";
// Facturas de proveedores — LumoBi: sacás la foto, LumoBi la lee, vos confirmás.
// La foto no se guarda: se lee y se descarta. Solo queda lo que confirmás.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { PageHeader } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Item = {
  descripcion: string; cantidad: string; unidad: string | null; precio_unitario: string; subtotal: string;
  producto_id: number | null; producto_nombre: string | null; costo_actual: number | null;
  precio_anterior: number | null; variacion_pct: number | null; actualizar_costo: boolean;
};
type Borrador = { proveedor: string; cuit: string | null; fecha: string; numero: string | null; tipo_comprobante: string | null; total: string; iva: number | null; items: Item[]; avisos: string[] };
type Compra = { id: number; proveedor: string; fecha: string; numero: string | null; total: number; items: number };
type Aumento = { descripcion: string; proveedor: string; fecha: string; precio: number; anterior: number; variacion_pct: number };
type Alerta = { descripcion: string; anterior: number; nuevo: number; variacion_pct: number };

const fmt = (n: number | null | undefined) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("es-AR"));
const hoy = () => new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
function num(s: string): number | null {
  let t = String(s ?? "").replace(/[^\d.,-]/g, "");
  if (!t) return null;
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(",")) t = t.replace(",", ".");
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}
const aTexto = (n: number | null | undefined) => (n == null ? "" : String(n));
function headers(json = true): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("lumo_token") : "";
  return json ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { Authorization: `Bearer ${t}` };
}

// Las fotos del celular pesan mucho: se achican antes de subir (más rápido y más barato de leer)
async function comprimir(f: File): Promise<Blob> {
  if (!f.type.startsWith("image/")) return f;
  try {
    const bmp = await createImageBitmap(f);
    const esc = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * esc); c.height = Math.round(bmp.height * esc);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
    return blob ?? f;
  } catch { return f; }
}

export default function ComprasPage() {
  const router = useRouter();
  const [fase, setFase] = useState<"inicio" | "leyendo" | "borrador" | "listo">("inicio");
  const [error, setError] = useState("");
  const [b, setB] = useState<Borrador | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [duplicada, setDuplicada] = useState(false);
  const [res, setRes] = useState<{ alertas: Alerta[]; costos: number } | null>(null);
  const [lista, setLista] = useState<{ compras: Compra[]; mes: { total: number; n: number } } | null>(null);
  const [aumentos, setAumentos] = useState<Aumento[]>([]);
  const refFoto = useRef<HTMLInputElement>(null);
  const refArchivo = useRef<HTMLInputElement>(null);

  const cargar = useCallback(() => {
    fetch(`${API}/api/compras`, { headers: headers() }).then(r => r.json()).then(d => { if (d?.compras) setLista(d); }).catch(() => {});
    fetch(`${API}/api/compras/aumentos`, { headers: headers() }).then(r => r.json()).then(d => { if (d?.aumentos) setAumentos(d.aumentos); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!localStorage.getItem("lumo_token")) { router.replace("/login"); return; }
    cargar();
  }, [router, cargar]);

  async function leer(file: File | undefined) {
    if (!file) return;
    setError(""); setDuplicada(false); setFase("leyendo");
    try {
      const blob = await comprimir(file);
      const fd = new FormData();
      fd.append("factura", blob, file.type === "application/pdf" ? "factura.pdf" : "factura.jpg");
      const r = await fetch(`${API}/api/compras/leer`, { method: "POST", headers: headers(false), body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.error || "No pude leer la factura."); setFase("inicio"); return; }
      setB({
        proveedor: d.proveedor ?? "", cuit: d.cuit ?? null, fecha: d.fecha ?? hoy(), numero: d.numero ?? null, tipo_comprobante: d.tipo_comprobante ?? null,
        total: aTexto(d.total), iva: d.iva ?? null, avisos: d.avisos ?? [],
        items: (d.items ?? []).map((i: Record<string, unknown>) => ({
          descripcion: String(i.descripcion ?? ""), cantidad: aTexto(i.cantidad as number), unidad: (i.unidad as string) ?? null,
          precio_unitario: aTexto(i.precio_unitario as number), subtotal: aTexto(i.subtotal as number),
          producto_id: (i.producto_id as number) ?? null, producto_nombre: (i.producto_nombre as string) ?? null, costo_actual: (i.costo_actual as number) ?? null,
          precio_anterior: (i.precio_anterior as number) ?? null, variacion_pct: (i.variacion_pct as number) ?? null,
          actualizar_costo: !!i.producto_id,
        })),
      });
      setFase("borrador");
    } catch { setError("Sin conexión. Probá de nuevo."); setFase("inicio"); }
  }

  function cambiarItem(k: number, campo: keyof Item, valor: string | boolean) {
    setB(prev => {
      if (!prev) return prev;
      const items = prev.items.map((it, j) => {
        if (j !== k) return it;
        const n = { ...it, [campo]: valor } as Item;
        if (campo === "cantidad" || campo === "precio_unitario") {
          const c = num(n.cantidad), p = num(n.precio_unitario);
          if (c != null && p != null) n.subtotal = String(Math.round(c * p * 100) / 100);
        }
        return n;
      });
      return { ...prev, items };
    });
  }

  async function confirmar(forzar = false) {
    if (!b) return;
    setError("");
    if (!b.proveedor.trim()) { setError("Falta el proveedor."); return; }
    const total = num(b.total);
    if (!total || total <= 0) { setError("Falta el total de la factura."); return; }
    setGuardando(true);
    try {
      const r = await fetch(`${API}/api/compras`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({
          proveedor: b.proveedor, cuit: b.cuit, fecha: b.fecha, numero: b.numero, tipo_comprobante: b.tipo_comprobante, total, iva: b.iva, forzar,
          items: b.items.filter(i => i.descripcion.trim()).map(i => ({
            descripcion: i.descripcion, cantidad: num(i.cantidad), unidad: i.unidad, precio_unitario: num(i.precio_unitario), subtotal: num(i.subtotal),
            producto_id: i.producto_id, actualizar_costo: i.actualizar_costo,
          })),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 409 && d?.duplicada) { setDuplicada(true); return; }
      if (!r.ok) { setError(d?.error || "No pude guardar la factura."); return; }
      setRes({ alertas: d.alertas ?? [], costos: d.costos_actualizados ?? 0 });
      setFase("listo"); setB(null); setDuplicada(false); cargar();
    } catch { setError("Sin conexión. Probá de nuevo."); }
    finally { setGuardando(false); }
  }

  const descartar = () => { setB(null); setFase("inicio"); setError(""); setDuplicada(false); };

  const totalNum = b ? num(b.total) : null;
  const suma = b ? b.items.reduce((s, i) => s + (num(i.subtotal) ?? 0), 0) : 0;
  const noCierra = !!b && totalNum != null && suma > 0
    && Math.abs(suma - totalNum) / totalNum > 0.03 && Math.abs(suma * 1.21 - totalNum) / totalNum > 0.03 && Math.abs(suma + (b.iva ?? 0) - totalNum) / totalNum > 0.03;

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Facturas de proveedores" sub="Sacá la foto y LumoBi hace el resto" />
      <input ref={refFoto} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { leer(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={refArchivo} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => { leer(e.target.files?.[0]); e.target.value = ""; }} />

      {error && <div style={{ ...tarjeta, color: "var(--red, #E5484D)", fontSize: 13 }}>{error}</div>}

      {fase === "inicio" && (
        <>
          <div style={tarjeta}>
            <div style={titulo}>Cargar una factura</div>
            <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>
              Sacale una foto a la factura o al remito. LumoBi lee el proveedor, el total y cada producto, y te avisa si algo subió de precio. Antes de guardar, vos revisás.
            </div>
            <button style={{ ...boton(true), width: "100%", marginBottom: 8 }} onClick={() => refFoto.current?.click()}>Sacar foto</button>
            <button style={{ ...boton(false), width: "100%" }} onClick={() => refArchivo.current?.click()}>Elegir una foto o PDF</button>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>La imagen no se guarda: se lee y se descarta. Solo queda lo que confirmás.</div>
          </div>

          {aumentos.length > 0 && (
            <div style={tarjeta}>
              <div style={titulo}>Proveedores que te subieron precios</div>
              {aumentos.slice(0, 6).map((a, k) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: k ? "1px solid var(--border)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.descripcion}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.proveedor} · de {fmt(a.anterior)} a {fmt(a.precio)}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red, #E5484D)", whiteSpace: "nowrap" }}>▲ +{a.variacion_pct.toLocaleString("es-AR")}%</div>
                </div>
              ))}
            </div>
          )}

          <div style={tarjeta}>
            <div style={titulo}>Últimas facturas</div>
            {lista && lista.mes.n > 0 && <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 6 }}>Este mes cargaste <strong>{fmt(lista.mes.total)}</strong> en {lista.mes.n} {lista.mes.n === 1 ? "factura" : "facturas"}.</div>}
            {lista && lista.compras.length === 0 && <div style={{ fontSize: 13, color: "var(--muted)" }}>Todavía no cargaste ninguna.</div>}
            {lista?.compras.slice(0, 15).map((c, k) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: k ? "1px solid var(--border)" : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.proveedor}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.fecha.split("-").reverse().join("/")} · {c.items} {c.items === 1 ? "ítem" : "ítems"}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmt(c.total)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {fase === "leyendo" && (
        <div style={{ ...tarjeta, textAlign: "center", padding: "36px 16px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Leyendo tu factura…</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Tarda unos segundos.</div>
        </div>
      )}

      {fase === "borrador" && b && (
        <>
          <div style={tarjeta}>
            <div style={titulo}>Esto fue lo que leí: revisalo</div>
            {b.avisos.map((a, k) => <div key={k} style={{ fontSize: 12, color: "#9A6700", background: "#FFF8E1", borderRadius: 8, padding: "6px 10px", marginBottom: 6, lineHeight: 1.5 }}>{a}</div>)}
            <label style={etiqueta}>Proveedor</label>
            <input style={campo} value={b.proveedor} onChange={e => setB({ ...b, proveedor: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={etiqueta}>Fecha</label>
                <input style={campo} type="date" value={b.fecha} onChange={e => setB({ ...b, fecha: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={etiqueta}>Total</label>
                <input style={campo} inputMode="decimal" value={b.total} onChange={e => setB({ ...b, total: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={tarjeta}>
            <div style={titulo}>Productos ({b.items.length})</div>
            {b.items.length === 0 && <div style={{ fontSize: 13, color: "var(--muted)" }}>No pude leer los productos. Podés guardar solo el total.</div>}
            {b.items.map((it, k) => (
              <div key={k} style={{ borderTop: k ? "1px solid var(--border)" : "none", padding: "10px 0" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...campo, flex: 1 }} value={it.descripcion} onChange={e => cambiarItem(k, "descripcion", e.target.value)} />
                  <button aria-label="Quitar" style={{ ...boton(false), padding: "0 12px" }} onClick={() => setB({ ...b, items: b.items.filter((_, j) => j !== k) })}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <div style={{ flex: 1 }}><label style={etiqueta}>Cantidad</label><input style={campo} inputMode="decimal" value={it.cantidad} onChange={e => cambiarItem(k, "cantidad", e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={etiqueta}>Precio unit.</label><input style={campo} inputMode="decimal" value={it.precio_unitario} onChange={e => cambiarItem(k, "precio_unitario", e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={etiqueta}>Subtotal</label><input style={campo} inputMode="decimal" value={it.subtotal} onChange={e => cambiarItem(k, "subtotal", e.target.value)} /></div>
                </div>
                {it.variacion_pct != null && Math.abs(it.variacion_pct) >= 5 && it.precio_anterior != null && (
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: it.variacion_pct > 0 ? "var(--red, #E5484D)" : "var(--emerald)" }}>
                    {it.variacion_pct > 0 ? "▲ Subió" : "▼ Bajó"} {Math.abs(it.variacion_pct).toLocaleString("es-AR")}% contra la compra anterior ({fmt(it.precio_anterior)})
                  </div>
                )}
                {it.producto_id && (
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--text)", marginTop: 8, lineHeight: 1.4 }}>
                    <input type="checkbox" checked={it.actualizar_costo} onChange={e => cambiarItem(k, "actualizar_costo", e.target.checked)} style={{ marginTop: 2 }} />
                    <span>Actualizar el costo de <strong>{it.producto_nombre}</strong> ({fmt(it.costo_actual)} → {fmt(num(it.precio_unitario))})</span>
                  </label>
                )}
              </div>
            ))}
            {noCierra && <div style={{ fontSize: 12, color: "#9A6700", background: "#FFF8E1", borderRadius: 8, padding: "6px 10px", marginTop: 6, lineHeight: 1.5 }}>La suma de los productos ({fmt(suma)}) no coincide con el total ({fmt(totalNum)}). Revisá los precios y cantidades.</div>}
          </div>

          {duplicada && (
            <div style={{ ...tarjeta, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
              Esta factura ya está cargada. ¿La cargás igual?
              <button style={{ ...boton(false), width: "100%", marginTop: 8 }} onClick={() => confirmar(true)} disabled={guardando}>Cargar igual</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, margin: "8px 12px" }}>
            <button style={{ ...boton(false), flex: 1 }} onClick={descartar} disabled={guardando}>Descartar</button>
            <button style={{ ...boton(true), flex: 2 }} onClick={() => confirmar(false)} disabled={guardando}>{guardando ? "Guardando…" : "Confirmar y guardar"}</button>
          </div>
        </>
      )}

      {fase === "listo" && res && (
        <>
          <div style={tarjeta}>
            <div style={titulo}>Listo</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Factura guardada</div>
            {res.costos > 0 && <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 6 }}>Actualicé el costo de {res.costos} {res.costos === 1 ? "producto" : "productos"}.</div>}
            {res.alertas.length === 0 && <div style={{ fontSize: 13, color: "var(--muted)" }}>No encontré aumentos contra tus compras anteriores.</div>}
            {res.alertas.map((a, k) => (
              <div key={k} style={{ fontSize: 13, color: "var(--red, #E5484D)", fontWeight: 600, marginTop: 6 }}>▲ {a.descripcion}: +{a.variacion_pct.toLocaleString("es-AR")}% ({fmt(a.anterior)} → {fmt(a.nuevo)})</div>
            ))}
          </div>
          <div style={{ margin: "8px 12px" }}><button style={{ ...boton(true), width: "100%" }} onClick={() => { setFase("inicio"); setRes(null); }}>Cargar otra factura</button></div>
        </>
      )}
      <Nav />
    </main>
  );
}

const tarjeta: CSSProperties = { margin: "8px 12px", background: "var(--card2)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--border)" };
const titulo: CSSProperties = { fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 };
const etiqueta: CSSProperties = { display: "block", fontSize: 11, color: "var(--muted)", margin: "8px 0 3px" };
const campo: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "white", fontSize: 14, color: "#0A1628" };
const boton = (primario: boolean): CSSProperties => ({
  padding: "12px 14px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
  border: primario ? "none" : "1px solid var(--border)", background: primario ? "var(--azul)" : "white", color: primario ? "white" : "var(--text)",
});
