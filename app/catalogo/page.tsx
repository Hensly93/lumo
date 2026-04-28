"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

const T = {
  bg:          "#070B12",
  bgCard:      "#111827",
  bgSecondary: "#0D1520",
  border:      "#1C2E42",
  borderBright:"#2A4460",
  accent:      "#00D4FF",
  accentDim:   "rgba(0,212,255,0.10)",
  green:       "#00E5A0",
  red:         "#FF4560",
  yellow:      "#FFB800",
  text:        "#EDF2FF",
  textSec:     "#7090AA",
  textMuted:   "#3A5270",
};

type Vista = "catalogo" | "metodos" | "cargando" | "preview" | "manual";

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  precio_venta: number | null;
  precio_costo: number | null;
  unidad: string;
  updated_at: string;
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

function fmt(n: number | null) {
  if (n == null) return "—";
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function inp(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px",
    background: T.bgSecondary, border: `1px solid ${T.border}`,
    borderRadius: 10, color: T.text, fontSize: 14,
    fontFamily: "system-ui,sans-serif", outline: "none", boxSizing: "border-box",
    ...extra,
  };
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: ok ? "rgba(0,229,160,0.15)" : "rgba(255,69,96,0.15)",
      border: `1px solid ${ok ? T.green : T.red}`,
      borderRadius: 12, padding: "10px 20px",
      color: ok ? T.green : T.red, fontSize: 13, fontWeight: 600,
      zIndex: 200, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      {msg}
    </div>
  );
}

// ─── Chip de categoría ────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? T.accentDim : "transparent",
      color: active ? T.accent : T.textSec, fontSize: 12, fontWeight: active ? 700 : 400,
      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </button>
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
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${stale ? "rgba(255,184,0,0.35)" : T.border}`,
      borderRadius: 14, padding: "14px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.nombre}
          </div>
          {stale && (
            <span title={`Sin actualizar hace ${stale.dias_sin_actualizar} días`}
              style={{ fontSize: 9, padding: "2px 6px", background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.3)", borderRadius: 6, color: T.yellow, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
              {stale.dias_sin_actualizar}d
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {p.categoria && (
            <span style={{ fontSize: 10, color: T.accent, background: T.accentDim, padding: "2px 8px", borderRadius: 10 }}>
              {p.categoria}
            </span>
          )}
          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: stale ? T.yellow : T.green }}>
            {fmt(p.precio_venta)}
          </span>
          {stale && (
            <span style={{ fontSize: 11, color: T.yellow }}>
              → {fmt(stale.precio_sugerido)} sugerido
            </span>
          )}
          {p.precio_costo && !stale && (
            <span style={{ fontSize: 11, color: T.textMuted }}>
              costo {fmt(p.precio_costo)}
            </span>
          )}
          {p.unidad !== "unidad" && (
            <span style={{ fontSize: 11, color: T.textMuted }}>{p.unidad}</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(p)}
          style={{ padding: "6px 10px", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSec, fontSize: 11, cursor: "pointer" }}>
          Editar
        </button>
        <button onClick={() => onDelete(p.id)}
          style={{ padding: "6px 8px", background: "none", border: `1px solid rgba(255,69,96,0.2)`, borderRadius: 8, color: T.red, fontSize: 13, cursor: "pointer" }}>
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Modal edición de producto ────────────────────────────────────────────────
function EditModal({
  producto, token, onSave, onClose,
}: {
  producto: Producto; token: string;
  onSave: (p: Producto) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    nombre:       producto.nombre,
    categoria:    producto.categoria ?? "",
    precio_venta: producto.precio_venta?.toString() ?? "",
    precio_costo: producto.precio_costo?.toString() ?? "",
    unidad:       producto.unidad,
  });
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setSaving(true);
    const r = await fetch(`${API}/api/productos/${producto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre:       form.nombre.trim() || undefined,
        categoria:    form.categoria.trim() || null,
        precio_venta: parseFloat(form.precio_venta) || null,
        precio_costo: parseFloat(form.precio_costo) || null,
        unidad:       form.unidad.trim() || "unidad",
      }),
    });
    const data = await r.json();
    setSaving(false);
    onSave(data);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
      display: "flex", alignItems: "flex-end", padding: "0 0 0 0",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", background: T.bgCard, borderRadius: "20px 20px 0 0",
        border: `1px solid ${T.border}`, padding: "24px 20px 40px",
      }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.textMuted, textTransform: "uppercase", marginBottom: 16 }}>
          // Editar producto
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inp()} placeholder="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <input style={inp()} placeholder="Categoría (opcional)" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
          <input style={inp()} type="number" placeholder="Precio de venta ($)" value={form.precio_venta} onChange={e => setForm(f => ({ ...f, precio_venta: e.target.value }))} />
          <input style={inp()} type="number" placeholder="Precio de costo (opcional)" value={form.precio_costo} onChange={e => setForm(f => ({ ...f, precio_costo: e.target.value }))} />
          <input style={inp()} placeholder="Unidad (unidad, kg, litro...)" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 12, color: T.textSec, fontSize: 14, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={saving} style={{ flex: 2, padding: "13px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 12, color: T.accent, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
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
  const [busqueda, setBusqueda] = useState("");
  const [loadingLista, setLoadingLista] = useState(true);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [previewMeta, setPreviewMeta] = useState<{ metodo: string; total: number } | null>(null);
  const [cargandoMsg, setCargandoMsg] = useState("");
  const [editando, setEditando] = useState<Producto | null>(null);
  const [manualForm, setManualForm] = useState({ nombre: "", categoria: "", precio_venta: "", precio_costo: "", unidad: "unidad" });
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [stalePrecios, setStalePrecios] = useState<PrecioStale[]>([]);
  const [cruceTicket, setCruceTicket] = useState<CruceTicket | null>(null);
  const [showStalePanel, setShowStalePanel] = useState(false);
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
  }, []);

  async function cargarProductos(t: string) {
    setLoadingLista(true);
    try {
      const [prods, cats, alertas] = await Promise.all([
        fetch(`${API}/api/productos`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
        fetch(`${API}/api/productos/categorias`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
        fetch(`${API}/api/productos/precios-alertas`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).catch(() => null),
      ]);
      setProductos(Array.isArray(prods) ? prods : []);
      setCategorias(Array.isArray(cats) ? cats : []);
      if (alertas) {
        setStalePrecios(Array.isArray(alertas.stale) ? alertas.stale : []);
        setCruceTicket(alertas.cruce ?? null);
      }
    } catch { /* silencioso */ }
    setLoadingLista(false);
  }

  async function subirArchivo(file: File, tipo: "archivo" | "foto") {
    setCargandoMsg(tipo === "foto" ? "NICOLE está leyendo la foto..." : "Lumo está leyendo el archivo...");
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
      const items: PreviewItem[] = data.productos.map((p: any, i: number) => ({ ...p, _key: i, incluir: true }));
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
      showToast(`${data.insertados} nuevos · ${data.actualizados} actualizados ✓`, true);
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
          nombre:       manualForm.nombre.trim(),
          categoria:    manualForm.categoria.trim() || null,
          precio_venta: parseFloat(manualForm.precio_venta) || null,
          precio_costo: parseFloat(manualForm.precio_costo) || null,
          unidad:       manualForm.unidad.trim() || "unidad",
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setManualForm({ nombre: "", categoria: "", precio_venta: "", precio_costo: "", unidad: "unidad" });
      showToast("Producto agregado ✓", true);
      await cargarProductos(token!);
      setVista("catalogo");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setGuardandoManual(false);
    }
  }

  async function eliminarProducto(id: number) {
    if (!confirm("¿Eliminar este producto del catálogo?")) return;
    await fetch(`${API}/api/productos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token!}` } });
    setProductos(ps => ps.filter(p => p.id !== id));
    showToast("Eliminado", true);
  }

  const productosFiltrados = productos.filter(p => {
    const matchCat = !catFiltro || p.categoria === catFiltro;
    const matchQ   = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchQ;
  });

  // ─── Vista: cargando ────────────────────────────────────────────────────────
  if (vista === "cargando") return (
    <main style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${T.accentDim}`, borderTop: `3px solid ${T.accent}`, margin: "0 auto", animation: "spin 1s linear infinite" }} />
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 2, color: T.textSec }}>
          {cargandoMsg}
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>Puede tardar unos segundos</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  // ─── Vista: métodos de carga ────────────────────────────────────────────────
  if (vista === "metodos") return (
    <main style={{ background: T.bg, minHeight: "100vh", paddingBottom: 100, fontFamily: "sans-serif" }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setVista("catalogo")} style={{ background: "none", border: "none", color: T.textSec, fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>←</button>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase" }}>// Importar</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>¿Cómo querés cargar?</div>
        </div>
      </div>

      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Método 1: Archivo */}
        <button
          onClick={() => fileRef.current?.click()}
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 20px", textAlign: "left", cursor: "pointer", transition: "border-color 0.15s" }}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Subir archivo</div>
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
            Excel, CSV o PDF con tu lista de precios. Lumo detecta los productos automáticamente.
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
            {[".xlsx", ".csv", ".pdf"].map(ext => (
              <span key={ext} style={{ fontSize: 10, padding: "3px 8px", background: T.bgSecondary, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, fontFamily: "monospace" }}>{ext}</span>
            ))}
          </div>
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) subirArchivo(f, "archivo"); e.target.value = ""; }} />

        {/* Método 2: Foto */}
        <button
          onClick={() => fotoRef.current?.click()}
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 20px", textAlign: "left", cursor: "pointer" }}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Sacar una foto</div>
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
            Fotografiá tu lista de precios en papel, pizarra o pantalla. NICOLE lee la imagen y extrae los productos.
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.accent }}>Funciona con listas manuscritas también</div>
        </button>
        <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) subirArchivo(f, "foto"); e.target.value = ""; }} />

        {/* Método 3: Manual */}
        <button
          onClick={() => setVista("manual")}
          style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 20px", textAlign: "left", cursor: "pointer" }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textSec }}>+ Agregar producto uno por uno</div>
        </button>
      </div>
      <Nav />
    </main>
  );

  // ─── Vista: preview ─────────────────────────────────────────────────────────
  if (vista === "preview") {
    const incluidos = preview.filter(p => p.incluir).length;
    return (
      <main style={{ background: T.bg, minHeight: "100vh", paddingBottom: 120, fontFamily: "sans-serif" }}>
        {toast && <Toast msg={toast.msg} ok={toast.ok} />}

        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
            // Preview — {previewMeta?.metodo}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>
            Encontramos {previewMeta?.total} productos
          </div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 3 }}>
            Revisá, editá y confirmá los que querés guardar.
          </div>
        </div>

        {/* Barra de acciones bulk */}
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
          <button
            onClick={() => setPreview(ps => ps.map(p => ({ ...p, incluir: true })))}
            style={{ padding: "6px 12px", background: T.accentDim, border: `1px solid ${T.accent}30`, borderRadius: 8, color: T.accent, fontSize: 11, cursor: "pointer" }}>
            Todos
          </button>
          <button
            onClick={() => setPreview(ps => ps.map(p => ({ ...p, incluir: false })))}
            style={{ padding: "6px 12px", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSec, fontSize: 11, cursor: "pointer" }}>
            Ninguno
          </button>
          <div style={{ marginLeft: "auto", fontSize: 12, color: T.textSec, alignSelf: "center" }}>
            {incluidos} seleccionados
          </div>
        </div>

        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {preview.map((p, idx) => (
            <div key={p._key} style={{
              background: T.bgCard,
              border: `1px solid ${p.incluir ? T.border : T.border + "40"}`,
              borderRadius: 12, padding: "12px 14px",
              opacity: p.incluir ? 1 : 0.4,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              {/* Toggle */}
              <button
                onClick={() => setPreview(ps => ps.map((x, i) => i === idx ? { ...x, incluir: !x.incluir } : x))}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: p.incluir ? T.accent : "transparent",
                  border: `1.5px solid ${p.incluir ? T.accent : T.border}`,
                  cursor: "pointer", marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {p.incluir && <span style={{ color: T.bg, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
              </button>

              {/* Datos editables */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={p.nombre}
                  onChange={e => setPreview(ps => ps.map((x, i) => i === idx ? { ...x, nombre: e.target.value } : x))}
                  style={{ ...inp({ padding: "6px 10px", fontSize: 13, marginBottom: 6, borderColor: "transparent", background: "transparent" }), fontWeight: 600 }}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.categoria && (
                    <span style={{ fontSize: 10, color: T.accent, background: T.accentDim, padding: "2px 8px", borderRadius: 8 }}>
                      {p.categoria}
                    </span>
                  )}
                  <input
                    type="number"
                    value={p.precio_venta ?? ""}
                    placeholder="$ precio"
                    onChange={e => setPreview(ps => ps.map((x, i) => i === idx ? { ...x, precio_venta: parseFloat(e.target.value) || null } : x))}
                    style={{ ...inp({ padding: "4px 8px", fontSize: 12, width: 110, borderColor: T.border + "80" }), fontFamily: "monospace", color: T.green }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer fijo */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: T.bgCard, borderTop: `1px solid ${T.border}`,
          padding: "14px 20px 28px", display: "flex", gap: 10,
        }}>
          <button onClick={() => setVista("metodos")}
            style={{ flex: 1, padding: "13px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 12, color: T.textSec, fontSize: 14, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={confirmarPreview} disabled={confirmando || incluidos === 0}
            style={{ flex: 2, padding: "13px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 12, color: T.accent, fontSize: 14, fontWeight: 700, cursor: confirmando ? "not-allowed" : "pointer", opacity: incluidos === 0 ? 0.5 : 1 }}>
            {confirmando ? "Guardando..." : `Confirmar ${incluidos} productos →`}
          </button>
        </div>
      </main>
    );
  }

  // ─── Vista: manual ──────────────────────────────────────────────────────────
  if (vista === "manual") return (
    <main style={{ background: T.bg, minHeight: "100vh", paddingBottom: 100, fontFamily: "sans-serif" }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setVista("metodos")} style={{ background: "none", border: "none", color: T.textSec, fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase" }}>// Manual</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>Agregar producto</div>
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inp()} placeholder="Nombre del producto *" value={manualForm.nombre} onChange={e => setManualForm(f => ({ ...f, nombre: e.target.value }))} />
          <input style={inp()} placeholder="Categoría (opcional)" value={manualForm.categoria} onChange={e => setManualForm(f => ({ ...f, categoria: e.target.value }))} />
          <input style={inp()} type="number" placeholder="Precio de venta ($)" value={manualForm.precio_venta} onChange={e => setManualForm(f => ({ ...f, precio_venta: e.target.value }))} />
          <input style={inp()} type="number" placeholder="Precio de costo (opcional)" value={manualForm.precio_costo} onChange={e => setManualForm(f => ({ ...f, precio_costo: e.target.value }))} />
          <input style={inp()} placeholder="Unidad (unidad, kg, litro...)" value={manualForm.unidad} onChange={e => setManualForm(f => ({ ...f, unidad: e.target.value }))} />
        </div>
        <button onClick={guardarManual} disabled={guardandoManual}
          style={{ width: "100%", marginTop: 16, padding: "14px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 12, color: T.accent, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {guardandoManual ? "Guardando..." : "Agregar producto"}
        </button>
      </div>
      <Nav />
    </main>
  );

  // ─── Vista: catálogo (principal) ────────────────────────────────────────────
  return (
    <main style={{ background: T.bg, minHeight: "100vh", paddingBottom: 100, fontFamily: "sans-serif" }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      {editando && token && (
        <EditModal
          producto={editando}
          token={token}
          onSave={p => { setProductos(ps => ps.map(x => x.id === p.id ? p : x)); setEditando(null); showToast("Actualizado ✓", true); }}
          onClose={() => setEditando(null)}
        />
      )}

      {/* Header de página */}
      <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
          // Pilar 2 — Inteligencia
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>Catálogo</div>
          <button onClick={() => setVista("metodos")}
            style={{ padding: "8px 14px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 10, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + Importar
          </button>
        </div>
        {!loadingLista && (
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
            {productos.length} producto{productos.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {loadingLista ? (
        <div style={{ padding: "48px 0", textAlign: "center", fontFamily: "monospace", fontSize: 12, color: T.textMuted, letterSpacing: 2 }}>CARGANDO...</div>
      ) : productos.length === 0 ? (

        /* Estado vacío */
        <div style={{ padding: "40px 24px" }}>
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              Aún no tenés productos cargados
            </div>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginBottom: 28, maxWidth: 300, margin: "0 auto 28px" }}>
              Subí tu lista de precios y NICOLE los usa para detectar inconsistencias específicas por producto.
            </div>
            <button onClick={() => setVista("metodos")}
              style={{ padding: "14px 28px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 12, color: T.accent, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Cargar catálogo →
            </button>
          </div>
        </div>

      ) : (

        /* Lista con búsqueda y filtros */
        <div>
          {/* Búsqueda */}
          <div style={{ padding: "12px 16px 0" }}>
            <input
              style={inp({ borderRadius: 12 })}
              placeholder="🔍  Buscar producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Chips de categorías */}
          {categorias.length > 0 && (
            <div style={{ padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
              <Chip label="Todos" active={catFiltro === null} onClick={() => setCatFiltro(null)} />
              {categorias.map(c => (
                <Chip key={c} label={c} active={catFiltro === c} onClick={() => setCatFiltro(f => f === c ? null : c)} />
              ))}
            </div>
          )}

          {/* Card de precios desactualizados — punto 6 */}
          {stalePrecios.length > 0 && (
            <div style={{ padding: "0 16px 4px" }}>
              <button
                onClick={() => setShowStalePanel(s => !s)}
                style={{
                  width: "100%", textAlign: "left",
                  background: "rgba(255,184,0,0.07)", border: "1px solid rgba(255,184,0,0.25)",
                  borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.yellow, marginBottom: 3 }}>
                      {stalePrecios.length} precio{stalePrecios.length !== 1 ? "s" : ""} posiblemente desactualizado{stalePrecios.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>
                      Con inflación del 4% mensual, algunos precios pueden estar desfasados. Tap para ver.
                    </div>
                  </div>
                  <span style={{ color: T.yellow, fontSize: 16 }}>{showStalePanel ? "▲" : "▼"}</span>
                </div>

                {showStalePanel && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }} onClick={e => e.stopPropagation()}>
                    {stalePrecios.map(s => (
                      <div key={s.id} style={{ background: T.bgSecondary, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.nombre}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{s.dias_sin_actualizar} días sin cambio</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, color: T.textMuted, textDecoration: "line-through" }}>${s.precio_actual.toLocaleString("es-AR")}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.yellow }}>
                            ${s.precio_sugerido.toLocaleString("es-AR")}
                            <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 4 }}>+{s.incremento_pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: T.textMuted, textAlign: "center", marginTop: 4 }}>
                      Editá cada producto para confirmar el nuevo precio
                    </div>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Alerta cruce ticket vs catálogo */}
          {cruceTicket?.señal && (
            <div style={{ padding: "0 16px 4px" }}>
              <div style={{ background: "rgba(0,212,255,0.05)", border: `1px solid rgba(0,212,255,0.2)`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 4 }}>NICOLE detectó algo</div>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{cruceTicket.señal.mensaje}</div>
                <div style={{ fontSize: 11, color: T.accent, marginTop: 6 }}>{cruceTicket.señal.accion}</div>
              </div>
            </div>
          )}

          {/* Lista */}
          <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {productosFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: T.textMuted, fontSize: 13 }}>
                Sin resultados para "{busqueda}"
              </div>
            ) : (
              productosFiltrados.map(p => (
                <ProductCard
                  key={p.id} p={p}
                  onEdit={setEditando}
                  onDelete={eliminarProducto}
                  stale={stalePrecios.find(s => s.id === p.id)}
                />
              ))
            )}
          </div>

          {/* Botón agregar individual */}
          <div style={{ padding: "8px 16px 0" }}>
            <button onClick={() => setVista("manual")}
              style={{ width: "100%", padding: "12px", background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 12, color: T.textMuted, fontSize: 13, cursor: "pointer" }}>
              + Agregar producto manualmente
            </button>
          </div>
        </div>
      )}

      <Nav />
    </main>
  );
}
