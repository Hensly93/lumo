"use client";
// CATALOGO_LUMOBI_V2
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { PageHeader } from "../components/ui";
import { QRCodeSVG } from "qrcode.react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Vista = "catalogo" | "metodos" | "cargando" | "preview" | "manual";
type Orden = "nombre" | "margen" | "sin_costo";

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio_venta: number | null;
  precio_costo: number | null;
  unidad: string;
  updated_at: string;
  codigo_barras?: string | null;
};

type PreviewItem = {
  _key: number;
  nombre: string;
  categoria: string | null;
  precio_venta: number | null;
  precio_costo: number | null;
  unidad: string;
  incluir: boolean;
};

type PrecioStale = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio_actual: number;
  precio_sugerido: number;
  incremento_pct: number;
  dias_sin_actualizar: number;
};

type CruceTicket = {
  disponible: boolean;
  precio_promedio_catalogo?: number;
  ticket_promedio_real?: number;
  desvio_pct?: number;
  señal?: { mensaje: string; accion: string } | null;
};

const ROJO = "var(--red, #E5484D)";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function pctTxt(n: number) {
  return (Math.round(n * 10) / 10).toLocaleString("es-AR") + "%";
}

// Margen sobre el precio de venta: (venta - costo) / venta
function margenPct(venta: number | null, costo: number | null): number | null {
  if (!venta || venta <= 0 || !costo || costo <= 0) return null;
  return ((venta - costo) / venta) * 100;
}

// Punto de equilibrio de un cambio de precio, sobre la ganancia bruta del producto
// (precio - costo) por unidad. No supone cuanto cambian las ventas: dice cuanto
// tendrian que cambiar para ganar lo mismo que hoy.
type Equilibrio = { nuevoPrecio: number; nuevoMargen: number | null; texto: string; tipo: "ok" | "alerta" | "mal" };
function equilibrio(venta: number, costo: number, cambioPct: number): Equilibrio {
  const nuevoPrecio = venta * (1 + cambioPct / 100);
  const gananciaHoy = venta - costo;
  const gananciaNueva = nuevoPrecio - costo;
  const nuevoMargen = nuevoPrecio > 0 ? (gananciaNueva / nuevoPrecio) * 100 : null;
  if (gananciaNueva <= 0) {
    return { nuevoPrecio, nuevoMargen, tipo: "mal", texto: "Con ese precio te cuesta más de lo que cobrás: perdés plata en cada unidad." };
  }
  if (gananciaHoy <= 0) {
    return { nuevoPrecio, nuevoMargen, tipo: "ok", texto: "Hoy este producto no te deja ganancia. Con ese precio, sí." };
  }
  const unidades = gananciaHoy / gananciaNueva; // proporcion de unidades necesarias para ganar lo mismo
  if (unidades <= 1) {
    const baja = (1 - unidades) * 100;
    return { nuevoPrecio, nuevoMargen, tipo: "ok", texto: `Podés vender hasta ${pctTxt(baja)} menos unidades y ganar lo mismo que hoy.` };
  }
  const sube = (unidades - 1) * 100;
  return { nuevoPrecio, nuevoMargen, tipo: "alerta", texto: `Tendrías que vender ${pctTxt(sube)} más unidades para ganar lo mismo que hoy.` };
}

const campo: CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "var(--card2)", border: "1px solid var(--border)",
  borderRadius: 10, color: "var(--text)", fontSize: 14,
  fontFamily: "var(--font-instrument), sans-serif", outline: "none", boxSizing: "border-box",
};
function inp(extra: CSSProperties = {}): CSSProperties { return { ...campo, ...extra }; }

const caja: CSSProperties = { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 14 };
const etiqueta: CSSProperties = { fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 };
const btnPrimario: CSSProperties = { background: "var(--azul, #0A5BD3)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-instrument), sans-serif" };
const btnSecundario: CSSProperties = { background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-instrument), sans-serif" };

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: "var(--card2)", border: `1px solid ${ok ? "var(--emerald)" : ROJO}`,
      borderRadius: 12, padding: "10px 20px",
      color: ok ? "var(--emerald)" : ROJO, fontSize: 13, fontWeight: 600,
      zIndex: 200, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      {msg}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? "var(--azul, #0A5BD3)" : "var(--border)"}`,
      background: active ? "var(--azul, #0A5BD3)" : "transparent",
      color: active ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: active ? 700 : 400,
      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "var(--font-instrument), sans-serif",
    }}>
      {label}
    </button>
  );
}

function Encabezado({ titulo, sub, atras }: { titulo: string; sub?: string; atras?: () => void }) {
  return (
    <>
      <PageHeader title={titulo} sub={sub ?? ""} />
      {atras && (
        <div style={{ padding: "0 16px 8px" }}>
          <button onClick={atras} style={{ ...btnSecundario, padding: "6px 12px", fontSize: 12 }}>Volver</button>
        </div>
      )}
    </>
  );
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────────
function ProductCard({
  p, onEdit, onDelete, stale,
}: {
  p: Producto;
  onEdit: (p: Producto) => void;
  onDelete: (id: number) => void;
  stale?: PrecioStale;
}) {
  const margen = margenPct(p.precio_venta, p.precio_costo);
  const negativo = p.precio_venta != null && p.precio_costo != null && p.precio_costo >= p.precio_venta;
  return (
    <div style={{
      ...caja,
      border: `1px solid ${stale ? "var(--yellow)" : "var(--border)"}`,
      padding: "14px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.nombre}
          </div>
          {stale && (
            <span title={`Sin actualizar hace ${stale.dias_sin_actualizar} días`}
              style={{ fontSize: 9, padding: "2px 6px", border: "1px solid var(--yellow)", borderRadius: 6, color: "var(--yellow)", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
              {stale.dias_sin_actualizar}d
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {p.categoria && (
            <span style={{ fontSize: 10, color: "var(--muted)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 10 }}>
              {p.categoria}
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 800, color: stale ? "var(--yellow)" : "var(--text)" }}>
            {fmt(p.precio_venta)}
          </span>
          {stale && (
            <span style={{ fontSize: 11, color: "var(--yellow)" }}>sugerido {fmt(stale.precio_sugerido)}</span>
          )}
          {p.unidad !== "unidad" && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.unidad}</span>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 12 }}>
          {p.precio_costo ? (
            <span style={{ color: negativo ? ROJO : "var(--text)" }}>
              <span style={{ color: "var(--muted)" }}>Costo {fmt(p.precio_costo)} · </span>
              {margen != null && <strong style={{ color: negativo ? ROJO : "var(--emerald)" }}>Margen {pctTxt(margen)}</strong>}
              {negativo && <strong> · te cuesta más de lo que cobrás</strong>}
            </span>
          ) : (
            <button onClick={() => onEdit(p)} style={{ background: "none", border: "none", padding: 0, color: "var(--yellow)", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font-instrument), sans-serif" }}>
              Sin costo cargado: cargalo para ver tu margen
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(p)} style={{ ...btnSecundario, padding: "6px 10px", fontSize: 11 }}>Editar</button>
        <button onClick={() => onDelete(p.id)} aria-label="Eliminar" style={{ ...btnSecundario, padding: "6px 9px", fontSize: 13, color: ROJO, borderColor: ROJO }}>×</button>
      </div>
    </div>
  );
}

// ─── Modal de edición + simulador de precio ───────────────────────────────────
const CAMBIOS = [-10, -5, 5, 10, 15, 20];

function EditModal({
  producto, token, onSave, onClose,
}: {
  producto: Producto; token: string;
  onSave: (p: Producto) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    nombre:        producto.nombre,
    categoria:     producto.categoria ?? "",
    precio_venta:  producto.precio_venta?.toString() ?? "",
    precio_costo:  producto.precio_costo?.toString() ?? "",
    unidad:        producto.unidad,
    codigo_barras: producto.codigo_barras ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cambio, setCambio] = useState<number | null>(null);

  const venta = parseFloat(form.precio_venta) || 0;
  const costo = parseFloat(form.precio_costo) || 0;
  const margen = margenPct(venta, costo);
  const sim = cambio != null && venta > 0 && costo > 0 ? equilibrio(venta, costo, cambio) : null;

  async function guardar() {
    setSaving(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/productos/${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre:        form.nombre.trim() || undefined,
          categoria:     form.categoria.trim() || null,
          precio_venta:  parseFloat(form.precio_venta) || null,
          precio_costo:  parseFloat(form.precio_costo) || null,
          unidad:        form.unidad.trim() || "unidad",
          codigo_barras: form.codigo_barras.trim() || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "No se pudo guardar");
      onSave(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  const rotulo: CSSProperties = { ...etiqueta, marginBottom: 4, marginTop: 2 };
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,22,40,0.7)", zIndex: 100,
      display: "flex", alignItems: "flex-end",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxHeight: "92vh", overflowY: "auto", background: "var(--card2)", borderRadius: "20px 20px 0 0",
        border: "1px solid var(--border)", padding: "22px 18px 36px", boxSizing: "border-box",
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Editar producto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div><div style={rotulo}>Nombre</div><input style={inp()} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
          <div><div style={rotulo}>Categoría (opcional)</div><input style={inp()} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><div style={rotulo}>Precio de venta ($)</div><input style={inp()} type="number" inputMode="decimal" value={form.precio_venta} onChange={e => setForm(f => ({ ...f, precio_venta: e.target.value }))} /></div>
            <div style={{ flex: 1 }}><div style={rotulo}>Costo ($)</div><input style={inp()} type="number" inputMode="decimal" placeholder="Lo que te cuesta" value={form.precio_costo} onChange={e => setForm(f => ({ ...f, precio_costo: e.target.value }))} /></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><div style={rotulo}>Unidad</div><input style={inp()} placeholder="unidad, kg, litro" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} /></div>
            <div style={{ flex: 1 }}><div style={rotulo}>Código de barras</div><input style={inp()} value={form.codigo_barras} onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))} /></div>
          </div>
        </div>

        {/* Margen y simulador */}
        <div style={{ ...caja, marginTop: 16, padding: "14px 14px", background: "transparent" }}>
          <div style={etiqueta}>Tu margen</div>
          {margen != null ? (
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
              Ganás <strong>{fmt(venta - costo)}</strong> por unidad, un <strong style={{ color: margen >= 0 ? "var(--emerald)" : ROJO }}>{pctTxt(margen)}</strong> del precio.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              Cargá el precio de venta y el costo para ver cuánto ganás con este producto.
            </div>
          )}
          {venta > 0 && costo > 0 && (
            <>
              <div style={{ ...etiqueta, marginTop: 14 }}>¿Y si cambio el precio?</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {CAMBIOS.map(c => (
                  <Chip key={c} label={(c > 0 ? "+" : "") + c + "%"} active={cambio === c} onClick={() => setCambio(x => x === c ? null : c)} />
                ))}
              </div>
              {sim && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.7 }}>
                  <div>Pasaría a <strong>{fmt(sim.nuevoPrecio)}</strong>{sim.nuevoMargen != null && <> con un margen de <strong>{pctTxt(sim.nuevoMargen)}</strong></>}.</div>
                  <div style={{ color: sim.tipo === "mal" ? ROJO : sim.tipo === "alerta" ? "var(--yellow)" : "var(--emerald)", fontWeight: 600, marginTop: 2 }}>{sim.texto}</div>
                  <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 6 }}>
                    Es un cálculo de equilibrio sobre la ganancia de este producto. No predice cuánto van a cambiar tus ventas: eso lo decidís vos conociendo a tus clientes.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {error && <div style={{ color: ROJO, fontSize: 12, marginTop: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ ...btnSecundario, flex: 1, padding: "13px" }}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{ ...btnPrimario, flex: 2, padding: "13px", fontSize: 14, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Opcion de carga ──────────────────────────────────────────────────────────
function OpcionCarga({ titulo, texto, extra, onClick }: { titulo: string; texto: string; extra?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ ...caja, padding: "20px 18px", textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "var(--font-instrument), sans-serif" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{texto}</div>
      {extra && <div style={{ marginTop: 8, fontSize: 11, color: "var(--cyan)" }}>{extra}</div>}
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Catalogo() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("catalogo");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [catFiltro, setCatFiltro] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>("nombre");
  const [busqueda, setBusqueda] = useState("");
  const [loadingLista, setLoadingLista] = useState(true);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [previewMeta, setPreviewMeta] = useState<{ metodo: string; total: number } | null>(null);
  const [cargandoMsg, setCargandoMsg] = useState("");
  const [editando, setEditando] = useState<Producto | null>(null);
  const [manualForm, setManualForm] = useState({ nombre: "", categoria: "", precio_venta: "", precio_costo: "", unidad: "unidad", codigo_barras: "" });
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [scanQR, setScanQR] = useState<{ url: string; expira_en: string } | null>(null);
  const [scanQRLoading, setScanQRLoading] = useState(false);
  const [stalePrecios, setStalePrecios] = useState<PrecioStale[]>([]);
  const [cruceTicket, setCruceTicket] = useState<CruceTicket | null>(null);
  const [showStalePanel, setShowStalePanel] = useState(false);
  const [pendientes, setPendientes] = useState<{ id: number; codigo_barras: string; creado_en: string }[]>([]);
  const [showPendientesPanel, setShowPendientesPanel] = useState(false);
  const [pendienteForms, setPendienteForms] = useState<Record<number, { nombre: string; precio_venta: string }>>({});
  const [completandoId, setCompletandoId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
    cargarProductos(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarProductos(t: string) {
    setLoadingLista(true);
    try {
      const [prods, cats, alertas, pend] = await Promise.all([
        fetch(`${API}/api/productos`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
        fetch(`${API}/api/productos/categorias`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
        fetch(`${API}/api/productos/precios-alertas`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/scanner-dueno/pendientes`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).catch(() => []),
      ]);
      setProductos(Array.isArray(prods) ? prods : []);
      setCategorias(Array.isArray(cats) ? cats : []);
      if (alertas) {
        setStalePrecios(Array.isArray(alertas.stale) ? alertas.stale : []);
        setCruceTicket(alertas.cruce ?? null);
      }
      setPendientes(Array.isArray(pend) ? pend : []);
    } catch { /* silencioso */ }
    setLoadingLista(false);
  }

  async function subirArchivo(file: File, tipo: "archivo" | "foto") {
    setCargandoMsg(tipo === "foto" ? "NICOLE está leyendo la foto..." : "LumoBi está leyendo el archivo...");
    setVista("cargando");
    try {
      const fd = new FormData();
      fd.append("archivo", file);
      const r = await fetch(`${API}/api/productos/upload-archivo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token!}` },
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error procesando el archivo");
      const items: PreviewItem[] = data.productos.map((p: PreviewItem, i: number) => ({ ...p, _key: i, incluir: true }));
      setPreview(items);
      setPreviewMeta({ metodo: data.metodo, total: data.total });
      setVista("preview");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
      setVista("metodos");
    }
  }

  async function confirmarPreview() {
    const seleccionados = preview.filter(p => p.incluir);
    if (seleccionados.length === 0) { showToast("Seleccioná al menos un producto", false); return; }
    setConfirmando(true);
    try {
      const r = await fetch(`${API}/api/productos/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
        body: JSON.stringify({ productos: seleccionados }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      showToast(`${data.insertados} nuevos · ${data.actualizados} actualizados`, true);
      await cargarProductos(token!);
      setVista("catalogo");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setConfirmando(false);
    }
  }

  async function guardarManual() {
    if (!manualForm.nombre.trim()) { showToast("El nombre es obligatorio", false); return; }
    setGuardandoManual(true);
    try {
      const r = await fetch(`${API}/api/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
        body: JSON.stringify({
          nombre:        manualForm.nombre.trim(),
          categoria:     manualForm.categoria.trim() || null,
          precio_venta:  parseFloat(manualForm.precio_venta) || null,
          precio_costo:  parseFloat(manualForm.precio_costo) || null,
          unidad:        manualForm.unidad.trim() || "unidad",
          codigo_barras: manualForm.codigo_barras.trim() || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setManualForm({ nombre: "", categoria: "", precio_venta: "", precio_costo: "", unidad: "unidad", codigo_barras: "" });
      showToast("Producto agregado", true);
      await cargarProductos(token!);
      setVista("catalogo");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setGuardandoManual(false);
    }
  }

  async function completarPendiente(pendienteId: number, codigo_barras: string) {
    const form = pendienteForms[pendienteId];
    if (!form?.nombre?.trim()) { showToast("El nombre es obligatorio", false); return; }
    setCompletandoId(pendienteId);
    try {
      const r = await fetch(`${API}/api/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          precio_venta: parseFloat(form.precio_venta) || null,
          codigo_barras,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      await fetch(`${API}/api/scanner-dueno/pendientes/${pendienteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token!}` },
      });
      setPendientes(p => p.filter(x => x.id !== pendienteId));
      showToast("Producto agregado", true);
      await cargarProductos(token!);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setCompletandoId(null);
    }
  }

  async function eliminarProducto(id: number) {
    if (!confirm("¿Eliminar este producto del catálogo?")) return;
    await fetch(`${API}/api/productos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token!}` } });
    setProductos(ps => ps.filter(p => p.id !== id));
    showToast("Eliminado", true);
  }

  const productosFiltrados = productos
    .filter(p => {
      const matchCat = !catFiltro || p.categoria === catFiltro;
      const matchQ   = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchQ;
    })
    .sort((a, b) => {
      if (orden === "margen") {
        const ma = margenPct(a.precio_venta, a.precio_costo), mb = margenPct(b.precio_venta, b.precio_costo);
        if (ma == null && mb == null) return a.nombre.localeCompare(b.nombre);
        if (ma == null) return 1;
        if (mb == null) return -1;
        return ma - mb; // menor margen primero: es donde mas hay para mirar
      }
      if (orden === "sin_costo") {
        const sa = a.precio_costo ? 1 : 0, sb = b.precio_costo ? 1 : 0;
        if (sa !== sb) return sa - sb;
      }
      return a.nombre.localeCompare(b.nombre);
    });

  const conCosto = productos.filter(p => p.precio_costo && p.precio_costo > 0).length;

  // ─── Vista: cargando ────────────────────────────────────────────────────────
  if (vista === "cargando") return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--border)", borderTop: "3px solid var(--azul, #0A5BD3)", margin: "0 auto", animation: "spin 1s linear infinite" }} />
        </div>
        <div style={{ fontSize: 13, color: "var(--text)" }}>{cargandoMsg}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Puede tardar unos segundos</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  // ─── Vista: métodos de carga ────────────────────────────────────────────────
  if (vista === "metodos") return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      <Encabezado titulo="Cargar productos" sub="Elegí cómo querés cargarlos" atras={() => setVista("catalogo")} />
      <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <OpcionCarga
          titulo="Subir archivo"
          texto="Excel, CSV o PDF con tu lista de precios. LumoBi detecta los productos automáticamente."
          extra=".xlsx · .csv · .pdf"
          onClick={() => fileRef.current?.click()}
        />
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) subirArchivo(f, "archivo"); e.target.value = ""; }} />

        <OpcionCarga
          titulo="Sacar una foto"
          texto="Fotografiá tu lista de precios en papel, pizarra o pantalla. NICOLE lee la imagen y extrae los productos."
          extra="Funciona con listas manuscritas también"
          onClick={() => fotoRef.current?.click()}
        />
        <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) subirArchivo(f, "foto"); e.target.value = ""; }} />

        <OpcionCarga
          titulo={scanQRLoading ? "Generando..." : "Escanear con el celu"}
          texto="Escaneá los códigos de barras de tu mercadería con la cámara del celu. Después completás nombre y precio."
          onClick={async () => {
            setScanQRLoading(true);
            try {
              const r = await fetch(`${API}/api/scanner-dueno/sesion`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token!}` },
              });
              const d = await r.json();
              if (!d.error) {
                const url = `${window.location.origin}/scan-dueno/${d.token}`;
                setScanQR({ url, expira_en: d.expira_en });
              }
            } catch { /* silencioso */ }
            setScanQRLoading(false);
          }}
        />

        <button onClick={() => setVista("manual")} style={{ ...btnSecundario, padding: "14px 18px", textAlign: "left", borderRadius: 14 }}>
          Agregar producto uno por uno
        </button>

        {scanQR && (
          <div onClick={() => setScanQR(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ ...caja, borderRadius: 20, padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Escaneá con la cámara del celu</div>
              <div style={{ background: "#fff", padding: 16, borderRadius: 12, display: "inline-block" }}>
                <QRCodeSVG value={scanQR.url} size={220} />
              </div>
              <div onClick={() => setScanQR(null)} style={{ marginTop: 20, fontSize: 14, color: "var(--muted)", cursor: "pointer" }}>Cerrar</div>
            </div>
          </div>
        )}
      </div>
      <Nav />
    </main>
  );

  // ─── Vista: preview ─────────────────────────────────────────────────────────
  if (vista === "preview") {
    const incluidos = preview.filter(p => p.incluir).length;
    return (
      <main style={{ minHeight: "100vh", paddingBottom: 130 }}>
        {toast && <Toast msg={toast.msg} ok={toast.ok} />}
        <Encabezado titulo={`Encontramos ${previewMeta?.total ?? 0} productos`} sub="Revisá, editá y confirmá los que querés guardar" />

        <div style={{ padding: "4px 16px 8px", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPreview(ps => ps.map(p => ({ ...p, incluir: true })))} style={{ ...btnSecundario, padding: "6px 12px", fontSize: 12 }}>Todos</button>
          <button onClick={() => setPreview(ps => ps.map(p => ({ ...p, incluir: false })))} style={{ ...btnSecundario, padding: "6px 12px", fontSize: 12 }}>Ninguno</button>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>{incluidos} seleccionados</div>
        </div>

        <div style={{ padding: "4px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {preview.map((p, idx) => (
            <div key={p._key} style={{ ...caja, padding: "12px 14px", opacity: p.incluir ? 1 : 0.45, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <button
                onClick={() => setPreview(ps => ps.map((x, i) => i === idx ? { ...x, incluir: !x.incluir } : x))}
                aria-label={p.incluir ? "Quitar" : "Incluir"}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 4,
                  background: p.incluir ? "var(--azul, #0A5BD3)" : "transparent",
                  border: `1.5px solid ${p.incluir ? "var(--azul, #0A5BD3)" : "var(--border)"}`,
                  cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1,
                }}>
                {p.incluir ? "✓" : ""}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={p.nombre}
                  onChange={e => setPreview(ps => ps.map((x, i) => i === idx ? { ...x, nombre: e.target.value } : x))}
                  style={inp({ padding: "6px 10px", fontSize: 13, marginBottom: 6, fontWeight: 600 })}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {p.categoria && (
                    <span style={{ fontSize: 10, color: "var(--muted)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 8 }}>{p.categoria}</span>
                  )}
                  <input
                    type="number" inputMode="decimal" value={p.precio_venta ?? ""} placeholder="Precio"
                    onChange={e => setPreview(ps => ps.map((x, i) => i === idx ? { ...x, precio_venta: parseFloat(e.target.value) || null } : x))}
                    style={inp({ padding: "5px 8px", fontSize: 12, width: 100 })}
                  />
                  <input
                    type="number" inputMode="decimal" value={p.precio_costo ?? ""} placeholder="Costo"
                    onChange={e => setPreview(ps => ps.map((x, i) => i === idx ? { ...x, precio_costo: parseFloat(e.target.value) || null } : x))}
                    style={inp({ padding: "5px 8px", fontSize: 12, width: 100 })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "var(--card2)", borderTop: "1px solid var(--border)", padding: "14px 20px 28px", display: "flex", gap: 10 }}>
          <button onClick={() => setVista("metodos")} style={{ ...btnSecundario, flex: 1, padding: "13px" }}>Cancelar</button>
          <button onClick={confirmarPreview} disabled={confirmando || incluidos === 0}
            style={{ ...btnPrimario, flex: 2, padding: "13px", fontSize: 14, cursor: confirmando ? "not-allowed" : "pointer", opacity: incluidos === 0 ? 0.5 : 1 }}>
            {confirmando ? "Guardando..." : `Confirmar ${incluidos} productos`}
          </button>
        </div>
      </main>
    );
  }

  // ─── Vista: manual ──────────────────────────────────────────────────────────
  if (vista === "manual") return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      <Encabezado titulo="Agregar producto" sub="Cargalo a mano" atras={() => setVista("metodos")} />
      <div style={{ padding: "8px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inp()} placeholder="Nombre del producto *" value={manualForm.nombre} onChange={e => setManualForm(f => ({ ...f, nombre: e.target.value }))} />
          <input style={inp()} placeholder="Categoría (opcional)" value={manualForm.categoria} onChange={e => setManualForm(f => ({ ...f, categoria: e.target.value }))} />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={inp()} type="number" inputMode="decimal" placeholder="Precio de venta ($)" value={manualForm.precio_venta} onChange={e => setManualForm(f => ({ ...f, precio_venta: e.target.value }))} />
            <input style={inp()} type="number" inputMode="decimal" placeholder="Costo ($)" value={manualForm.precio_costo} onChange={e => setManualForm(f => ({ ...f, precio_costo: e.target.value }))} />
          </div>
          <input style={inp()} placeholder="Unidad (unidad, kg, litro...)" value={manualForm.unidad} onChange={e => setManualForm(f => ({ ...f, unidad: e.target.value }))} />
          <input style={inp()} placeholder="Código de barras (opcional)" value={manualForm.codigo_barras} onChange={e => setManualForm(f => ({ ...f, codigo_barras: e.target.value }))} />
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>
          Con el costo cargado, LumoBi te muestra cuánto ganás con cada producto.
        </div>
        <button onClick={guardarManual} disabled={guardandoManual}
          style={{ ...btnPrimario, width: "100%", marginTop: 16, padding: "14px", fontSize: 14, opacity: guardandoManual ? 0.6 : 1 }}>
          {guardandoManual ? "Guardando..." : "Agregar producto"}
        </button>
      </div>
      <Nav />
    </main>
  );

  // ─── Vista: catálogo (principal) ────────────────────────────────────────────
  const subTitulo = loadingLista ? "" : `${productos.length} producto${productos.length !== 1 ? "s" : ""}`;
  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      {editando && token && (
        <EditModal
          producto={editando}
          token={token}
          onSave={p => { setProductos(ps => ps.map(x => x.id === p.id ? { ...x, ...p } : x)); setEditando(null); showToast("Actualizado", true); }}
          onClose={() => setEditando(null)}
        />
      )}

      <PageHeader title="Catálogo" sub={subTitulo} />
      <div style={{ padding: "0 16px 8px" }}>
        <button onClick={() => setVista("metodos")} style={btnPrimario}>Cargar productos</button>
      </div>

      {loadingLista ? (
        <div style={{ padding: "48px 0", textAlign: "center", fontSize: 12, color: "var(--muted)", letterSpacing: 2 }}>CARGANDO...</div>
      ) : productos.length === 0 ? (
        <div style={{ padding: "24px 16px" }}>
          <div style={{ ...caja, borderRadius: 20, padding: "32px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Todavía no tenés productos cargados</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: "0 auto 22px", maxWidth: 300 }}>
              Cargá tu lista de precios y el costo de cada producto. Así LumoBi te muestra cuánto ganás con cada uno y detecta qué precios se te quedaron atrás.
            </div>
            <button onClick={() => setVista("metodos")} style={{ ...btnPrimario, padding: "13px 26px", fontSize: 14 }}>Cargar catálogo</button>
          </div>
        </div>
      ) : (
        <div>
          {/* Cuántos tienen costo */}
          <div style={{ padding: "0 16px 8px" }}>
            <div style={{ ...caja, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={etiqueta}>Costos cargados</div>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 700 }}>{conCosto} de {productos.length}</div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((conCosto / productos.length) * 100)}%`, background: "var(--emerald)" }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>
                {conCosto === productos.length
                  ? "Tenés el costo de todos tus productos: LumoBi puede calcular cuánto ganás con cada uno."
                  : "Sin el costo de un producto no se puede saber cuánto ganás con él. Tocá \"Sin costo cargado\" en cada uno para completarlo."}
              </div>
            </div>
          </div>

          <div style={{ padding: "4px 16px 0" }}>
            <input style={inp({ borderRadius: 12 })} placeholder="Buscar producto" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>

          <div style={{ padding: "10px 16px 0", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
            <Chip label="Por nombre" active={orden === "nombre"} onClick={() => setOrden("nombre")} />
            <Chip label="Menor margen" active={orden === "margen"} onClick={() => setOrden("margen")} />
            <Chip label="Sin costo primero" active={orden === "sin_costo"} onClick={() => setOrden("sin_costo")} />
          </div>

          {categorias.length > 0 && (
            <div style={{ padding: "8px 16px 0", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
              <Chip label="Todas" active={catFiltro === null} onClick={() => setCatFiltro(null)} />
              {categorias.map(c => (
                <Chip key={c} label={c} active={catFiltro === c} onClick={() => setCatFiltro(f => f === c ? null : c)} />
              ))}
            </div>
          )}

          {/* Códigos escaneados pendientes de completar */}
          {pendientes.length > 0 && (
            <div style={{ padding: "12px 16px 0" }}>
              <div style={{ ...caja, padding: "14px 16px" }}>
                <div onClick={() => setShowPendientesPanel(s => !s)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cyan)", marginBottom: 3 }}>
                      {pendientes.length} código{pendientes.length !== 1 ? "s" : ""} escaneado{pendientes.length !== 1 ? "s" : ""} sin completar
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Completá nombre y precio para sumarlos al catálogo.</div>
                  </div>
                  <span style={{ color: "var(--cyan)", fontSize: 12 }}>{showPendientesPanel ? "Ocultar" : "Ver"}</span>
                </div>
                {showPendientesPanel && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {pendientes.map(p => (
                      <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{p.codigo_barras}</div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <input
                            placeholder="Nombre del producto"
                            value={pendienteForms[p.id]?.nombre ?? ""}
                            onChange={e => setPendienteForms(f => ({ ...f, [p.id]: { nombre: e.target.value, precio_venta: f[p.id]?.precio_venta ?? "" } }))}
                            style={inp({ flex: 2, padding: "8px 10px", fontSize: 13 })}
                          />
                          <input
                            type="number" inputMode="decimal" placeholder="Precio"
                            value={pendienteForms[p.id]?.precio_venta ?? ""}
                            onChange={e => setPendienteForms(f => ({ ...f, [p.id]: { nombre: f[p.id]?.nombre ?? "", precio_venta: e.target.value } }))}
                            style={inp({ flex: 1, padding: "8px 10px", fontSize: 13 })}
                          />
                        </div>
                        <button onClick={() => completarPendiente(p.id, p.codigo_barras)} disabled={completandoId === p.id}
                          style={{ ...btnPrimario, width: "100%", padding: 9, fontSize: 12 }}>
                          {completandoId === p.id ? "Guardando..." : "Agregar al catálogo"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Precios desactualizados */}
          {stalePrecios.length > 0 && (
            <div style={{ padding: "12px 16px 0" }}>
              <div style={{ ...caja, border: "1px solid var(--yellow)", padding: "14px 16px" }}>
                <div onClick={() => setShowStalePanel(s => !s)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--yellow)", marginBottom: 3 }}>
                      {stalePrecios.length} precio{stalePrecios.length !== 1 ? "s" : ""} posiblemente desactualizado{stalePrecios.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Con la inflación, algunos precios pueden haberse quedado atrás.</div>
                  </div>
                  <span style={{ color: "var(--yellow)", fontSize: 12 }}>{showStalePanel ? "Ocultar" : "Ver"}</span>
                </div>
                {showStalePanel && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {stalePrecios.map(s => (
                      <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.nombre}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.dias_sin_actualizar} días sin cambio</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, color: "var(--muted)", textDecoration: "line-through" }}>{fmt(s.precio_actual)}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--yellow)" }}>
                            {fmt(s.precio_sugerido)}
                            <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 4 }}>+{s.incremento_pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", marginTop: 2 }}>Editá cada producto para confirmar el nuevo precio</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cruce ticket vs catálogo */}
          {cruceTicket?.señal && (
            <div style={{ padding: "12px 16px 0" }}>
              <div style={{ ...caja, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cyan)", marginBottom: 4 }}>NICOLE detectó algo</div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{cruceTicket.señal.mensaje}</div>
                <div style={{ fontSize: 11, color: "var(--cyan)", marginTop: 6 }}>{cruceTicket.señal.accion}</div>
              </div>
            </div>
          )}

          {/* Lista */}
          <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {productosFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
                Sin resultados{busqueda ? ` para "${busqueda}"` : ""}
              </div>
            ) : (
              productosFiltrados.map(p => (
                <ProductCard key={p.id} p={p} onEdit={setEditando} onDelete={eliminarProducto} stale={stalePrecios.find(s => s.id === p.id)} />
              ))
            )}
          </div>

          <div style={{ padding: "12px 16px 0" }}>
            <button onClick={() => setVista("manual")} style={{ ...btnSecundario, width: "100%", padding: "12px", borderStyle: "dashed", color: "var(--muted)" }}>
              Agregar producto manualmente
            </button>
          </div>
        </div>
      )}

      <Nav />
    </main>
  );
}
