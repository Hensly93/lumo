"use client";
// CajaSinInternet — la caja sigue vendiendo cuando se corta internet.
// - Guarda en el aparato el catálogo (nombre, código de barras, precio) y lo refresca cada vez que hay conexión.
// - Sin internet: se busca por pistola o por nombre, se arma el pedido y se cobra en efectivo, débito, crédito o transferencia.
//   (El QR de Mercado Pago necesita conexión.)
// - Cada venta queda en una cola del aparato con su propio id y la fecha real. Cuando vuelve la conexión se manda sola;
//   si se manda dos veces, el servidor la cuenta una sola vez.
import { useCallback, useEffect, useRef, useState } from "react";

type Prod = { id: number; nombre: string; marca: string | null; codigo_barras: string | null; precio: number; unidad: string | null };
type Cat = { productos: Prod[]; codigos_extra: { codigo: string; producto_id: number }[]; generado: string };
type Item = { producto_id: number; nombre: string; precio_unitario: number; cantidad: number };
type Venta = { uuid: string; turno_id: number; metodo_pago: string; fecha: string; items: { producto_id: number; cantidad: number; precio_unitario: number }[]; total: number };

const K_CAT = "lumo_caja_catalogo";
const K_COLA = "lumo_caja_cola";
const K_RECH = "lumo_caja_rechazadas";
const COL = { primary: "#007AFF", text: "#0A1628", muted: "#6B8099", border: "#E8EDF5", red: "#FF3B30", amber: "#FF9500", green: "#34C759" };
const METODOS: { id: string; label: string }[] = [
  { id: "efectivo", label: "💵 Efectivo" },
  { id: "debito", label: "💳 Débito" },
  { id: "credito", label: "💳 Crédito" },
  { id: "transferencia", label: "🏦 Transferencia" },
];

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const leer = <T,>(k: string, def: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : def; } catch { return def; } };
const guardar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio: no rompe la caja */ } };
const nuevoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);

export default function CajaSinInternet({ api, getToken, turnoId }: { api: string; getToken: () => string; turnoId: number }) {
  const [online, setOnline] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [cola, setCola] = useState<Venta[]>([]);
  const [rech, setRech] = useState(0);
  const [cat, setCat] = useState<Cat | null>(null);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [busca, setBusca] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const yaEnvia = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // estado inicial desde el aparato
  useEffect(() => {
    setCola(leer<Venta[]>(K_COLA, []));
    setRech(leer<Venta[]>(K_RECH, []).length);
    setCat(leer<Cat | null>(K_CAT, null));
  }, []);

  const bajarCatalogo = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/caja-offline/catalogo`, { headers: { "x-turno-token": getToken() } });
      if (!r.ok) return;
      const d = (await r.json()) as Cat;
      if (!Array.isArray(d.productos)) return;
      guardar(K_CAT, d);
      setCat(d);
    } catch { /* sin conexión: queda el catálogo que ya estaba */ }
  }, [api, getToken]);

  const enviarCola = useCallback(async () => {
    if (yaEnvia.current) return;
    const pendientes = leer<Venta[]>(K_COLA, []);
    if (!pendientes.some((v) => v.turno_id === turnoId)) return;
    yaEnvia.current = true; setEnviando(true);
    try {
      for (const v of pendientes) {
        if (v.turno_id !== turnoId) continue;
        let r: Response;
        try {
          r = await fetch(`${api}/api/caja-offline/venta`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-turno-token": getToken() },
            body: JSON.stringify({ uuid: v.uuid, metodo_pago: v.metodo_pago, fecha: v.fecha, items: v.items }),
          });
        } catch { break; } // sin conexión: se reintenta después
        if (r.ok) {
          guardar(K_COLA, leer<Venta[]>(K_COLA, []).filter((x) => x.uuid !== v.uuid));
        } else if (r.status === 400 || r.status === 409) {
          // el servidor la rechazó (producto que ya no es del negocio, datos inválidos): no se reintenta, queda anotada aparte
          guardar(K_COLA, leer<Venta[]>(K_COLA, []).filter((x) => x.uuid !== v.uuid));
          const rr = leer<Venta[]>(K_RECH, []); rr.push(v); guardar(K_RECH, rr.slice(-50));
          setRech(rr.length);
        } else { break; } // 401 / 5xx: se reintenta después
      }
    } finally {
      setCola(leer<Venta[]>(K_COLA, []));
      yaEnvia.current = false; setEnviando(false);
    }
  }, [api, getToken, turnoId]);

  // ¿hay internet de verdad? (navigator.onLine miente con wifi sin salida)
  useEffect(() => {
    let vivo = true; let anterior = true; let vez = 0;
    const probar = async () => {
      let ok = false;
      try {
        const c = new AbortController(); const t = setTimeout(() => c.abort(), 5000);
        const r = await fetch(`${api}/api/health`, { cache: "no-store", signal: c.signal }); clearTimeout(t); ok = r.ok;
      } catch { ok = false; }
      if (!vivo) return;
      setOnline(ok);
      if (ok && (!anterior || vez === 0)) { bajarCatalogo(); }
      if (ok) enviarCola();
      if (ok && vez > 0 && vez % 90 === 0) bajarCatalogo(); // ~cada 15 min
      anterior = ok; vez++;
    };
    probar();
    const id = setInterval(probar, 10000);
    const on = () => probar(); const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { vivo = false; clearInterval(id); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [api, bajarCatalogo, enviarCola]);

  useEffect(() => { if (abierto) setTimeout(() => inputRef.current?.focus(), 100); }, [abierto]);

  const agregar = (p: Prod) => {
    setCarrito((c) => {
      const i = c.findIndex((x) => x.producto_id === p.id);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], cantidad: n[i].cantidad + 1 }; return n; }
      return [...c, { producto_id: p.id, nombre: p.marca ? `${p.nombre} · ${p.marca}` : p.nombre, precio_unitario: p.precio, cantidad: 1 }];
    });
  };
  const cambiar = (id: number, d: number) =>
    setCarrito((c) => c.map((x) => (x.producto_id === id ? { ...x, cantidad: Math.max(0, x.cantidad + d) } : x)).filter((x) => x.cantidad > 0));

  const porCodigo = (cod: string): Prod | null => {
    if (!cat) return null;
    const a = cat.productos.find((p) => p.codigo_barras === cod);
    if (a) return a;
    const e = (cat.codigos_extra || []).find((x) => x.codigo === cod);
    return e ? cat.productos.find((p) => p.id === e.producto_id) || null : null;
  };
  const sugeridos: Prod[] = (() => {
    const q = busca.trim().toLowerCase();
    if (!cat || q.length < 2) return [];
    return cat.productos.filter((p) => `${p.nombre} ${p.marca || ""}`.toLowerCase().includes(q) || (p.codigo_barras || "").includes(q)).slice(0, 8);
  })();

  const enter = () => {
    const q = busca.trim();
    if (!q) return;
    const p = porCodigo(q);
    if (p) { agregar(p); setBusca(""); setAviso(""); return; }
    if (sugeridos.length === 1) { agregar(sugeridos[0]); setBusca(""); setAviso(""); return; }
    setAviso(sugeridos.length ? "Elegí el producto de la lista" : "No encontré ese producto en el catálogo guardado");
  };

  const total = carrito.reduce((s, x) => s + x.cantidad * x.precio_unitario, 0);
  const cobrar = (metodo: string) => {
    if (!carrito.length) return;
    const v: Venta = {
      uuid: nuevoId(), turno_id: turnoId, metodo_pago: metodo, fecha: new Date().toISOString(), total,
      items: carrito.map((x) => ({ producto_id: x.producto_id, cantidad: x.cantidad, precio_unitario: x.precio_unitario })),
    };
    const nueva = [...leer<Venta[]>(K_COLA, []), v];
    guardar(K_COLA, nueva); setCola(nueva);
    setCarrito([]); setBusca(""); setAviso(`✓ Venta de ${fmt(total)} guardada`);
    setTimeout(() => inputRef.current?.focus(), 100);
    if (online) enviarCola();
  };

  const propias = cola.filter((v) => v.turno_id === turnoId).length;
  const ajenas = cola.length - propias;
  const sinCat = !cat || !cat.productos.length;

  // Si hay internet y no hay nada pendiente ni abierto, no se muestra nada
  if (online && !abierto && cola.length === 0 && rech === 0) return null;

  return (
    <>
      <div style={{ margin: "0 0 16px", padding: "12px 14px", borderRadius: 14, border: `1px solid ${online ? COL.border : COL.amber}`, background: online ? "#F4F8FF" : "#FFF7EB" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: COL.text }}>
          {online ? (enviando ? "Enviando ventas guardadas…" : "Ventas guardadas sin internet") : "📡 Sin internet"}
        </div>
        <div style={{ fontSize: 13, color: COL.muted, marginTop: 2 }}>
          {online
            ? `${propias} venta${propias === 1 ? "" : "s"} esperando enviarse${propias ? " — se mandan solas" : ""}.`
            : "Podés seguir vendiendo: las ventas quedan guardadas y se mandan solas cuando vuelva la conexión. No cierres esta pantalla."}
          {ajenas > 0 && ` (${ajenas} de otro turno quedan en este aparato.)`}
          {rech > 0 && ` ${rech} venta${rech === 1 ? "" : "s"} no se pudo${rech === 1 ? "" : "n"} registrar: avisale al dueño.`}
        </div>
        {(!online || propias > 0) && (
          <button onClick={() => setAbierto(true)} style={{ marginTop: 10, width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: COL.primary, color: "#fff", fontWeight: 800, fontSize: 15 }}>
            {online ? "Seguir vendiendo desde el aparato" : "Vender sin internet"}
          </button>
        )}
      </div>

      {abierto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "#fff", overflowY: "auto", fontFamily: "var(--font-instrument), sans-serif" }}>
          <div style={{ padding: 16, maxWidth: 560, margin: "0 auto", paddingBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: COL.text }}>Venta sin internet</div>
                <div style={{ fontSize: 12, color: online ? COL.green : COL.amber, fontWeight: 700 }}>{online ? "Volvió la conexión" : "Sin conexión"} · {propias} guardada{propias === 1 ? "" : "s"}</div>
              </div>
              <button onClick={() => setAbierto(false)} style={{ padding: "10px 14px", borderRadius: 12, border: `1px solid ${COL.border}`, background: "#fff", fontWeight: 700, color: COL.text }}>Cerrar</button>
            </div>

            {sinCat ? (
              <div style={{ padding: 16, borderRadius: 12, background: "#FFF1F0", color: COL.red, fontSize: 14, fontWeight: 600 }}>
                Este aparato todavía no guardó los productos. Se guardan solos cuando entrás con internet; hacelo una vez con conexión y después ya podés vender sin internet.
              </div>
            ) : (
              <>
                <input
                  ref={inputRef} value={busca} autoComplete="off" inputMode="search"
                  onChange={(e) => { setBusca(e.target.value); setAviso(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") enter(); }}
                  placeholder="Pistola, código o nombre del producto"
                  style={{ width: "100%", boxSizing: "border-box", padding: "14px 14px", fontSize: 16, borderRadius: 12, border: `2px solid ${COL.primary}`, outline: "none" }}
                />
                {aviso && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: aviso.startsWith("✓") ? COL.green : COL.amber }}>{aviso}</div>}
                {sugeridos.length > 0 && (
                  <div style={{ marginTop: 8, border: `1px solid ${COL.border}`, borderRadius: 12, overflow: "hidden" }}>
                    {sugeridos.map((p) => (
                      <button key={p.id} onClick={() => { agregar(p); setBusca(""); setAviso(""); inputRef.current?.focus(); }}
                        style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "12px 14px", background: "#fff", border: "none", borderBottom: `1px solid ${COL.border}`, textAlign: "left", fontSize: 14, color: COL.text }}>
                        <span>{p.nombre}{p.marca ? <span style={{ color: COL.muted }}> · {p.marca}</span> : null}</span>
                        <b>{fmt(p.precio)}</b>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  {carrito.length === 0 ? (
                    <div style={{ color: COL.muted, fontSize: 14, padding: "12px 0" }}>Escaneá o buscá un producto para empezar la venta.</div>
                  ) : carrito.map((x) => (
                    <div key={x.producto_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${COL.border}` }}>
                      <div style={{ flex: 1, fontSize: 14, color: COL.text }}>{x.nombre}<div style={{ fontSize: 12, color: COL.muted }}>{fmt(x.precio_unitario)} c/u</div></div>
                      <button onClick={() => cambiar(x.producto_id, -1)} style={{ width: 36, height: 36, borderRadius: 18, border: `1px solid ${COL.border}`, background: "#fff", fontSize: 20 }}>−</button>
                      <b style={{ minWidth: 22, textAlign: "center" }}>{x.cantidad}</b>
                      <button onClick={() => cambiar(x.producto_id, 1)} style={{ width: 36, height: 36, borderRadius: 18, border: `1px solid ${COL.border}`, background: "#fff", fontSize: 20 }}>+</button>
                      <b style={{ minWidth: 72, textAlign: "right" }}>{fmt(x.cantidad * x.precio_unitario)}</b>
                    </div>
                  ))}
                </div>

                {carrito.length > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 800, color: COL.text, margin: "16px 0 10px" }}><span>Total</span><span>{fmt(total)}</span></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {METODOS.map((m) => (
                        <button key={m.id} onClick={() => cobrar(m.id)} style={{ padding: "16px 0", borderRadius: 14, border: "none", background: COL.primary, color: "#fff", fontWeight: 800, fontSize: 15 }}>{m.label}</button>
                      ))}
                    </div>
                    <button onClick={() => setCarrito([])} style={{ marginTop: 12, width: "100%", padding: "10px 0", background: "none", border: "none", color: COL.red, fontWeight: 700 }}>Vaciar</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
