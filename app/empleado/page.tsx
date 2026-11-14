"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAutorizacion } from "./Autorizacion";
import CajaSinInternet from "./CajaSinInternet";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

// Sesión del turno: token aleatorio que entrega el servidor al validar el PIN o abrir el turno.
let SESION_TOKEN = "";
const fetchT = (url: string, opts: RequestInit = {}) =>
  fetch(url, { ...opts, headers: { ...((opts.headers as Record<string, string>) || {}), "x-turno-token": SESION_TOKEN } });
const C = {
  bg: "#FFFFFF",
  primary: "#007AFF",
  text: "#0A1628",
  muted: "#6B8099",
  cardBorder: "#E8EDF5",
  red: "#FF3B30",
  yellow: "#FFCC00",
  amber: "#FF9500",
  green: "#34C759",
};

type Paso = "codigo" | "sucursal" | "empleado" | "pin" | "apertura" | "activo" | "egreso" | "conteo" | "cierre" | "resumen";
type Sucursal = { id: number; nombre: string; direccion: string | null };

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function duracionLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const s = 0; // We don't track seconds, just for display
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0].slice(0, 2);
}

// ─── Componentes de UI (fuera de EmpleadoPage para que no se recreen en cada redibujado) ───

const Avatar = ({ name, size = 80 }: { name: string; size?: number }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${C.primary} 0%, #00C2FF 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-instrument), sans-serif',
    fontWeight: 800,
    fontSize: size / 2.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  }}>
    {getInitials(name)}
  </div>
);

const ErrorBox = ({ error }: { error: string }) => error ? (
  <div style={{
    background: 'rgba(255,59,48,0.08)',
    border: `1px solid rgba(255,59,48,0.2)`,
    borderRadius: 14,
    padding: '12px 16px',
    color: C.red,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'var(--font-instrument), sans-serif',
  }}>
    {error}
  </div>
) : null;

const PrimaryButton = ({ label, onPress, color = C.primary, disabled = false, icon, loading = false }: { label: string; onPress: () => void; color?: string; disabled?: boolean; icon?: string; loading?: boolean }) => (
  <button
    onClick={onPress}
    disabled={disabled || loading}
    style={{
      width: '100%',
      padding: '18px 24px',
      borderRadius: 14,
      background: disabled || loading ? C.cardBorder : color,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 700,
      fontFamily: 'var(--font-instrument), sans-serif',
      cursor: disabled || loading ? 'default' : 'pointer',
      marginBottom: 12,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      transition: 'all 0.2s',
    }}
  >
    {loading ? "..." : <>{icon && <span>{icon}</span>}{label}</>}
  </button>
);

const SecondaryButton = ({ label, onPress, color = C.primary }: { label: string; onPress: () => void; color?: string }) => (
  <button
    onClick={onPress}
    style={{
      width: '100%',
      padding: '18px 24px',
      borderRadius: 14,
      background: 'transparent',
      color: color,
      fontSize: 16,
      fontWeight: 700,
      fontFamily: 'var(--font-instrument), sans-serif',
      cursor: 'pointer',
      marginBottom: 12,
      border: `2px solid ${color}`,
      transition: 'all 0.2s',
    }}
  >
    {label}
  </button>
);

const TextButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <button
    onClick={onPress}
    style={{
      background: 'none',
      border: 'none',
      color: C.muted,
      fontSize: 14,
      fontFamily: 'var(--font-instrument), sans-serif',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'center',
      padding: '12px',
    }}
  >
    {label}
  </button>
);

const CurrencyInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div style={{
    position: 'relative',
    marginBottom: 24,
  }}>
    <div style={{
      position: 'absolute',
      left: 24,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 32,
      fontWeight: 800,
      fontFamily: 'var(--font-instrument), sans-serif',
      color: C.muted,
    }}>$</div>
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '20px 24px 20px 56px',
        borderRadius: 20,
        border: `2px solid ${C.cardBorder}`,
        background: C.bg,
        color: C.text,
        fontSize: 32,
        fontWeight: 800,
        fontFamily: 'var(--font-instrument), sans-serif',
        boxSizing: 'border-box' as any,
        outline: 'none',
      }}
    />
  </div>
);

const NumpadKey = ({ value, onPress }: { value: string; onPress: () => void }) => (
  <button
    onClick={onPress}
    style={{
      width: 70,
      height: 70,
      borderRadius: '50%',
      border: `2px solid ${C.cardBorder}`,
      background: C.bg,
      color: C.text,
      fontSize: 24,
      fontWeight: 700,
      fontFamily: 'var(--font-instrument), sans-serif',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s',
    }}
  >
    {value}
  </button>
);

function PrecioModal({ turnoId, onClose }: { turnoId: number; onClose: () => void }) {
  const aut = useAutorizacion(fetchT, API);
  const [codigo, setCodigo] = useState("");
  const [prod, setProd] = useState<{ id: number; nombre: string; precio_venta: number | string | null } | null>(null);
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [hechos, setHechos] = useState<string[]>([]);
  const refCodigo = useRef<HTMLInputElement>(null);
  const refPrecio = useRef<HTMLInputElement>(null);

  useEffect(() => { refCodigo.current?.focus(); }, []);

  async function buscar() {
    const c = codigo.trim();
    if (!c) return;
    setCodigo("");
    setMsg(null);
    try {
      const r = await fetchT(`${API}/api/scanner/producto?turno_id=${turnoId}&codigo=${encodeURIComponent(c)}`);
      const d = await r.json();
      if (d.existe) {
        setProd({ id: d.producto.id, nombre: d.producto.nombre, precio_venta: d.producto.precio_venta });
        setPrecio("");
        setCosto("");
        setTimeout(() => refPrecio.current?.focus(), 0);
      } else {
        setMsg({ texto: `El código ${c} no está cargado`, ok: false });
      }
    } catch {
      setMsg({ texto: "Error de conexión", ok: false });
    }
  }

  function guardar() { return guardarCon(); }
  async function guardarCon(autId?: number) {
    if (!prod || guardando) return;
    const p = parseFloat(precio);
    const c = parseFloat(costo);
    if (!(p > 0) && !(c > 0)) { setMsg({ texto: "Escribí el precio nuevo", ok: false }); return; }
    setGuardando(true);
    try {
      const r = await fetchT(`${API}/api/scanner/producto/${prod.id}/precio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(autId ? { 'x-autorizacion': String(autId) } : {}) },
        body: JSON.stringify({ precio_venta: p > 0 ? p : undefined, precio_costo: c > 0 ? c : undefined }),
      });
      const d = await r.json();
      if (r.status === 403 && aut.requiere(d, (id) => guardarCon(id))) return;
      if (!r.ok) throw new Error(d.error || "No se pudo guardar");
      setHechos(h => [`${prod.nombre}: ${p > 0 ? fmt(p) : "costo actualizado"}`, ...h].slice(0, 6));
      setProd(null);
      setPrecio("");
      setCosto("");
      setMsg({ texto: "Guardado", ok: true });
      setTimeout(() => refCodigo.current?.focus(), 0);
    } catch (e: unknown) {
      setMsg({ texto: e instanceof Error ? e.message : "Error", ok: false });
    } finally {
      setGuardando(false);
    }
  }

  const campo: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14, border: `2px solid ${C.cardBorder}`, background: C.bg,
    color: C.text, fontSize: 18, fontFamily: 'var(--font-instrument), sans-serif', boxSizing: 'border-box', outline: 'none',
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', fontFamily: 'var(--font-instrument), sans-serif' }}>
        {aut.modal}
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 4 }}>Cambiar precios</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Escaneá el producto con la pistola, escribí el precio nuevo y apretá Enter. Queda registrado a tu nombre.
        </div>

        <form onSubmit={e => { e.preventDefault(); buscar(); }} style={{ display: 'flex', gap: 8 }}>
          <input
            ref={refCodigo}
            style={{ ...campo, flex: 1, minWidth: 0 }}
            placeholder="Escaneá o escribí el código"
            value={codigo}
            autoComplete="off"
            enterKeyHint="search"
            onChange={e => setCodigo(e.target.value)}
            disabled={prod != null}
          />
          <button type="submit" disabled={prod != null || !codigo.trim()} style={{ padding: '0 18px', borderRadius: 14, border: 'none', background: C.primary, color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: prod != null || !codigo.trim() ? 0.5 : 1, fontFamily: 'var(--font-instrument), sans-serif' }}>Buscar</button>
        </form>

        {prod && (
          <div style={{ marginTop: 16, border: `2px solid ${C.primary}`, borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.text }}>{prod.nombre}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Precio actual {prod.precio_venta != null ? fmt(Number(prod.precio_venta)) : "sin precio"}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Precio nuevo ($)</div>
            <input
              ref={refPrecio}
              style={campo}
              type="number"
              inputMode="decimal"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); guardar(); } if (e.key === 'Escape') { setProd(null); setTimeout(() => refCodigo.current?.focus(), 0); } }}
            />
            <div style={{ fontSize: 12, color: C.muted, margin: '12px 0 4px' }}>Costo de compra nuevo ($), si cambió (opcional)</div>
            <input
              style={campo}
              type="number"
              inputMode="decimal"
              value={costo}
              onChange={e => setCosto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); guardar(); } }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={() => { setProd(null); setTimeout(() => refCodigo.current?.focus(), 0); }} style={{ flex: 1, padding: 14, borderRadius: 14, border: `2px solid ${C.cardBorder}`, background: 'transparent', color: C.muted, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-instrument), sans-serif' }}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', background: C.primary, color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: guardando ? 0.6 : 1, fontFamily: 'var(--font-instrument), sans-serif' }}>{guardando ? '...' : 'Guardar'}</button>
            </div>
          </div>
        )}

        {msg && (
          <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: msg.ok ? C.green : C.red }}>{msg.texto}</div>
        )}

        {hechos.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 13, color: C.text, lineHeight: 1.8 }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 4 }}>CAMBIADOS EN ESTA SESIÓN</div>
            {hechos.map((h, i) => <div key={i}>{h}</div>)}
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 14, border: `2px solid ${C.cardBorder}`, background: 'transparent', color: C.text, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-instrument), sans-serif' }}>Terminar</button>
      </div>
    </div>
  );
}

function AltaModal({ codigo, turnoId, onClose, onAgregado }: { codigo: string; turnoId: number; onClose: () => void; onAgregado: () => Promise<void> }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [msg, setMsg] = useState("");
  const [guardando, setGuardando] = useState(false);
  const refNombre = useRef<HTMLInputElement>(null);
  const refPrecio = useRef<HTMLInputElement>(null);

  const [marca, setMarca] = useState("");
  const [parecidos, setParecidos] = useState<{ id: number; nombre: string; marca: string | null }[]>([]);
  const [fuente, setFuente] = useState("");

  useEffect(() => { refNombre.current?.focus(); }, []);

  // Código que el negocio no conoce: si hay datos en una base abierta, nombre y marca se completan solos
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetchT(`${API}/api/scanner/producto?turno_id=${turnoId}&codigo=${encodeURIComponent(codigo)}`);
        const d = await r.json();
        if (!vivo || !d.sugerencia) return;
        setNombre(n => n || d.sugerencia.nombre || "");
        setMarca(m => m || d.sugerencia.marca || "");
        setFuente("Completé nombre y marca desde una base abierta. Revisalo antes de guardar.");
      } catch { /* sin red: se carga a mano */ }
    })();
    return () => { vivo = false; };
  }, [codigo, turnoId]);

  // Mientras escribe el nombre: ¿ya existe uno parecido? ¿qué marca se reconoce?
  useEffect(() => {
    const n = nombre.trim();
    if (n.length < 3) { setParecidos([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetchT(`${API}/api/identidad/empleado/parecidos?nombre=${encodeURIComponent(n)}`);
        const d = await r.json();
        if (Array.isArray(d.parecidos)) setParecidos(d.parecidos);
        if (d.marca_sugerida) setMarca(m => m || d.marca_sugerida);
      } catch { /* sin sugerencias */ }
    }, 450);
    return () => clearTimeout(t);
  }, [nombre]);

  // "Es este": el código nuevo queda asociado al producto que ya existía y se suma a la venta
  async function esElMismo(p: { id: number }) {
    if (guardando) return;
    setGuardando(true);
    setMsg("");
    try {
      const r = await fetchT(`${API}/api/identidad/empleado/vincular-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, producto_id: p.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo vincular");
      await fetchT(`${API}/api/scanner/carrito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turnoId, producto_id: p.id, cantidad: 1, agregado_por: 'pistola_compu' }),
      });
      await onAgregado();
      onClose();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  async function guardar() {
    if (guardando) return;
    const p = parseFloat(precio);
    if (!nombre.trim()) { setMsg("Escribí el nombre del producto"); return; }
    if (!(p > 0)) { setMsg("Escribí el precio"); return; }
    setGuardando(true);
    setMsg("");
    try {
      const r = await fetchT(`${API}/api/scanner/producto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_barras: codigo, nombre: nombre.trim(), precio_venta: p, marca: marca.trim() || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo guardar");
      await fetchT(`${API}/api/scanner/carrito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turnoId, producto_id: d.producto.id, cantidad: 1, agregado_por: 'pistola_compu' }),
      });
      await onAgregado();
      onClose();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setGuardando(false);
    }
  }

  const campo: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14, border: `2px solid ${C.cardBorder}`, background: C.bg,
    color: C.text, fontSize: 18, fontFamily: 'var(--font-instrument), sans-serif', boxSizing: 'border-box', outline: 'none',
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, fontFamily: 'var(--font-instrument), sans-serif' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 4 }}>Producto nuevo</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>El código {codigo} no está en el catálogo. Cargalo y se suma a la venta.</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Nombre</div>
        <input ref={refNombre} style={campo} value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); refPrecio.current?.focus(); } }} />
        {fuente && <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>{fuente}</div>}
        {parecidos.length > 0 && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: '#FFF8E6', border: '1px solid #F5D78A' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>¿Es alguno de estos? Ya está cargado</div>
            {parecidos.map(p => (
              <button key={p.id} onClick={() => esElMismo(p)} disabled={guardando} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 6, borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: '#FFFFFF', color: C.text, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-instrument), sans-serif' }}>
                <b>{p.nombre}</b>{p.marca ? ` · ${p.marca}` : ''} <span style={{ color: C.primary, fontWeight: 700 }}>— Es este</span>
              </button>
            ))}
            <div style={{ fontSize: 12, color: C.muted }}>Si es otro producto, seguí cargando abajo.</div>
          </div>
        )}
        <div style={{ fontSize: 12, color: C.muted, margin: '12px 0 4px' }}>Marca (opcional)</div>
        <input style={campo} value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Oreo" />
        <div style={{ fontSize: 12, color: C.muted, margin: '12px 0 4px' }}>Precio de venta ($)</div>
        <input ref={refPrecio} style={campo} type="number" inputMode="decimal" value={precio} onChange={e => setPrecio(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); guardar(); } }} />
        {msg && <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: C.red }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 14, border: `2px solid ${C.cardBorder}`, background: 'transparent', color: C.muted, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-instrument), sans-serif' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', background: C.primary, color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: guardando ? 0.6 : 1, fontFamily: 'var(--font-instrument), sans-serif' }}>{guardando ? '...' : 'Guardar y sumar a la venta'}</button>
        </div>
      </div>
    </div>
  );
}

export default function EmpleadoPage() {
  const [paso, setPaso] = useState<Paso>("codigo");
  const [negocioId, setNegocioId] = useState("");
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalSel, setSucursalSel] = useState<Sucursal | null>(null);
  const [empleados, setEmpleados] = useState<{ id: number; nombre: string }[]>([]);
  const [empleadoSel, setEmpleadoSel] = useState("");
  const [pin, setPin] = useState("");
  const [turno, setTurno] = useState<any>(null);
  const [conteoPend, setConteoPend] = useState<any>(null);
  const [aperturaEfectivo, setAperturaEfectivo] = useState("");
  const [egresoMonto, setEgresoMonto] = useState("");
  const [egresoMotivo, setEgresoMotivo] = useState("");
  const [conteoMonto, setConteoMonto] = useState("");
  const [cierreMonto, setCierreMonto] = useState("");
  const [resumen, setResumen] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const aut = useAutorizacion(fetchT, API);
  const [carrito, setCarrito] = useState<{ items: any[]; total: number } | null>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [enfocado, setEnfocado] = useState(false);
  const [ventaOk, setVentaOk] = useState("");
  const [mpDisponible, setMpDisponible] = useState(false);
  const [qrMP, setQrMP] = useState<{ id: number; qr: string; monto: number } | null>(null);
  const [qrMPCargando, setQrMPCargando] = useState(false);

  useEffect(() => {
    if (!turno?.id) return;
    fetchT(`${API}/api/mp-cobro/disponible`).then((r) => r.json()).then((d) => setMpDisponible(!!d.disponible)).catch(() => {});
  }, [turno?.id]);

  // Mientras hay un QR esperando, se pregunta cada 3 segundos si ya pagó
  useEffect(() => {
    if (!qrMP) return;
    let vivo = true;
    const iv = setInterval(async () => {
      try {
        const r = await fetchT(`${API}/api/mp-cobro/estado/${qrMP.id}`);
        const d = await r.json();
        if (!vivo || !d.estado || d.estado === 'esperando') return;
        setQrMP(null);
        if (d.estado === 'pagado') {
          setError('');
          setVentaOk(`Venta registrada: ${fmt(qrMP.monto)} con Mercado Pago`);
          setTimeout(() => setVentaOk(''), 8000);
          setCarrito({ items: [], total: 0 });
          document.getElementById('scan-input')?.focus();
        } else if (d.estado === 'pagado_sin_venta') {
          setError('El pago de Mercado Pago entró pero la venta no se pudo cerrar. Avisale al dueño.');
        } else {
          setError('El cobro con QR se canceló o venció. Probá de nuevo o cobrá con otro medio.');
        }
      } catch { /* sigue esperando */ }
    }, 3000);
    return () => { vivo = false; clearInterval(iv); };
  }, [qrMP]);

  async function cobrarConQR() {
    if (!turno?.id || qrMPCargando) return;
    setQrMPCargando(true);
    try {
      const r = await fetchT(`${API}/api/mp-cobro/qr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      if (!r.ok || !d.qr) { setError(d.error || 'No se pudo generar el QR.'); return; }
      setError('');
      setQrMP({ id: d.cobro_id, qr: d.qr, monto: d.monto });
    } catch { setError('No se pudo generar el QR. Probá de nuevo.'); }
    finally { setQrMPCargando(false); }
  }

  async function cancelarQR() {
    const actual = qrMP;
    if (!actual) return;
    try {
      const r = await fetchT(`${API}/api/mp-cobro/cancelar/${actual.id}`, { method: 'POST' });
      const d = await r.json();
      if (d.estado === 'pagado') {
        setVentaOk(`Venta registrada: ${fmt(actual.monto)} con Mercado Pago`);
        setTimeout(() => setVentaOk(''), 8000);
        setCarrito({ items: [], total: 0 });
      }
    } catch { /* el cobro vence solo */ }
    setQrMP(null);
  }
  const refBusq = useRef<any>(null);

  async function refrescarCarrito() {
    if (!turno?.id) return;
    try {
      const r = await fetchT(`${API}/api/scanner/carrito/${turno.id}`);
      const d = await r.json();
      if (!d.error) setCarrito(d);
    } catch { /* silencioso */ }
  }

  async function agregarAlCarrito(productoId: number) {
    if (!turno?.id) return;
    try {
      const r = await fetchT(`${API}/api/scanner/carrito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turno.id, producto_id: productoId, cantidad: 1, agregado_por: 'pistola_compu' }),
      });
      const d = await r.json();
      if (d.error) setError(d.error); else setError('');
    } catch { setError('No se pudo agregar el producto. Probá de nuevo.'); }
    await refrescarCarrito();
  }

  async function cambiarCantidad(item: any, nueva: number, autId?: number) {
    if (!turno?.id) return;
    const extra: Record<string, string> = autId ? { 'x-autorizacion': String(autId) } : {};
    try {
      let r: Response;
      if (nueva <= 0) {
        r = await fetchT(`${API}/api/scanner/carrito/${turno.id}/${item.id}`, { method: 'DELETE', headers: extra });
      } else {
        r = await fetchT(`${API}/api/scanner/carrito/${turno.id}/${item.id}/cantidad`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...extra },
          body: JSON.stringify({ cantidad: nueva }),
        });
      }
      if (r.status === 403) {
        const d = await r.json().catch(() => null);
        if (aut.requiere(d, (id) => cambiarCantidad(item, nueva, id))) return;
      }
    } catch { setError('No se pudo cambiar la cantidad.'); }
    await refrescarCarrito();
  }

  function buscarSugerencias(q: string) {
    if (refBusq.current) clearTimeout(refBusq.current);
    const t = q.trim();
    // Solo numeros = codigo de barras (no se sugiere); el texto se busca por nombre
    if (t.length < 2 || /^\d+$/.test(t)) { setSugerencias([]); return; }
    refBusq.current = setTimeout(async () => {
      try {
        const r = await fetchT(`${API}/api/scanner/buscar?turno_id=${turno?.id}&q=${encodeURIComponent(t)}`);
        const d = await r.json();
        setSugerencias(Array.isArray(d.productos) ? d.productos : []);
      } catch { setSugerencias([]); }
    }, 250);
  }

  async function enviarEntrada(valor: string) {
    const texto = valor.trim();
    setScanBuffer('');
    setSugerencias([]);
    if (!texto || !turno?.id) return;
    setError('');
    try {
      const r = await fetchT(`${API}/api/scanner/producto?turno_id=${turno.id}&codigo=${encodeURIComponent(texto)}`);
      const d = await r.json();
      if (d.existe) { await agregarAlCarrito(d.producto.id); return; }
      if (/^\d+$/.test(texto)) { setError(`El código ${texto} no está cargado. Cargalo para venderlo.`); setAltaCodigo(texto); return; }
      const r2 = await fetchT(`${API}/api/scanner/buscar?turno_id=${turno.id}&q=${encodeURIComponent(texto)}`);
      const d2 = await r2.json();
      const ps: any[] = Array.isArray(d2.productos) ? d2.productos : [];
      if (ps.length === 1) await agregarAlCarrito(ps[0].id);
      else if (ps.length > 1) setSugerencias(ps);
      else setError(`No encontré "${texto}" en tus productos.`);
    } catch { setError('Sin conexión. Probá de nuevo.'); }
  }
  const [scanQR, setScanQR] = useState<{ url: string; expira_en: string } | null>(null);
  const [scanQRLoading, setScanQRLoading] = useState(false);
  const [precioModal, setPrecioModal] = useState(false);
  const [altaCodigo, setAltaCodigo] = useState<string | null>(null);

  // Tras cerrar el turno: volver al inicio a los 4 segundos
  useEffect(() => {
    if (paso !== "resumen") return;
    const timer = setTimeout(() => {
      resetear();
    }, 4000);
    return () => clearTimeout(timer);
  }, [paso]);

  // Reloj para duración + polling conteo
  useEffect(() => {
    if (paso !== "activo") return;
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [paso]);

  // Polling conteo pendiente
  const checkConteo = useCallback(async () => {
    if (!turno?.id) return;
    try {
      const r = await fetchT(`${API}/api/caja/conteo-pendiente/${turno.id}`);
      const d = await r.json();
      setConteoPend(d.pendiente ? d : null);
    } catch { /* silencioso */ }
  }, [turno?.id]);

  useEffect(() => {
    if (paso === "activo") checkConteo();
  }, [paso, tick, checkConteo]);

  // Refrescar datos del turno cada 60s
  useEffect(() => {
    if (paso !== "activo" || !turno?.id) return;
    const id = setInterval(async () => {
      try {
        const r = await fetchT(`${API}/api/caja/turno/${turno.id}`);
        const d = await r.json();
        if (!d.error) setTurno(d);
      } catch { /* silencioso */ }
    }, 60000);
    return () => clearInterval(id);
  }, [paso, turno?.id]);

  // Polling del carrito de LumoScan cada 2s
  useEffect(() => {
    if (paso !== "activo" || !turno?.id) return;
    const id = setInterval(async () => {
      try {
        const r = await fetchT(`${API}/api/scanner/carrito/${turno.id}`);
        const d = await r.json();
        if (!d.error) setCarrito(d);
      } catch { /* silencioso */ }
    }, 2000);
    return () => clearInterval(id);
  }, [paso, turno?.id]);

  // "Recordar este dispositivo": casilla de la pantalla del codigo (apagada por defecto)
  const [recordar, setRecordar] = useState(false);

  // Cargar el codigo guardado SOLO si el dispositivo fue marcado como "recordado"
  useEffect(() => {
    let saved: string | null = null;
    let recordado = false;
    try {
      recordado = localStorage.getItem("lumo_recordar_dispositivo") === "1";
      saved = localStorage.getItem("lumo_negocio_codigo");
      if (!recordado && saved) localStorage.removeItem("lumo_negocio_codigo"); // limpia codigos guardados antes
    } catch { /* sin acceso al almacenamiento */ }
    let desdeLink: string | null = null;
    try { desdeLink = new URLSearchParams(window.location.search).get("c"); } catch { /* sin url */ }
    if (desdeLink && desdeLink.trim()) {
      // Entra desde el link que le manda el dueño: el codigo ya viene adentro
      const c = desdeLink.trim().toUpperCase();
      setRecordar(true);
      setNegocioId(c);
      cargarSucursales(c, true);
      return;
    }
    if (recordado && saved) {
      setRecordar(true);
      setNegocioId(saved);
      cargarSucursales(saved, true);
    }
  }, []);

  async function cargarSucursales(nid: string, guardar?: boolean) {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/multilocal/sucursales-publicas/${nid}`);
      const d = await r.json();
      if (!Array.isArray(d)) { setError("Código de negocio incorrecto"); return; }
      try {
        if (guardar === true) {
          localStorage.setItem("lumo_negocio_codigo", nid);
          localStorage.setItem("lumo_recordar_dispositivo", "1");
        } else if (guardar === false) {
          localStorage.removeItem("lumo_negocio_codigo");
          localStorage.removeItem("lumo_recordar_dispositivo");
        }
      } catch { /* sin acceso al almacenamiento */ }
      setSucursales(d);
      if (d.length === 1) {
        // Un solo local — lo selecciona automáticamente
        setSucursalSel(d[0]);
        await cargarEmpleados(nid, d[0].id);
      } else if (d.length === 0) {
        // Sin sucursales — carga todos los empleados sin filtro
        setSucursalSel(null);
        await cargarEmpleados(nid, null);
      } else {
        setPaso("sucursal");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function cargarEmpleados(nid: string, sucId: number | null) {
    setLoading(true);
    setError("");
    try {
      const url = sucId
        ? `${API}/api/caja/empleados/${nid}?sucursal_id=${sucId}`
        : `${API}/api/caja/empleados/${nid}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!Array.isArray(d)) { setError("Código de negocio incorrecto"); return; }
      if (d.length === 0) { setError("No hay empleados registrados para este local"); return; }
      setEmpleados(d);
      setPaso("empleado");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleValidarPin() {
    if (pin.length !== 4) { setError("El PIN tiene 4 dígitos"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetchT(`${API}/api/caja/validar-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio_id: negocioId, nombre_empleado: empleadoSel, pin }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      if (d.turno_activo) {
        SESION_TOKEN = d.sesion_token || ""; setTurno(d.turno_activo);
        setPaso("activo");
      } else {
        setPaso("apertura");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleApertura() {
    if (!aperturaEfectivo) { setError("Ingresá el efectivo en caja"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetchT(`${API}/api/caja/apertura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negocio_id: negocioId,
          nombre_empleado: empleadoSel,
          pin,
          caja_apertura: parseFloat(aperturaEfectivo),
          sucursal_id: sucursalSel?.id ?? null,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      SESION_TOKEN = d.sesion_token || ""; setTurno({ ...d.turno, duracion_minutos: 0, total_egresos: 0 });
      setPaso("activo");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleEgreso() {
    if (!egresoMonto || !egresoMotivo) { setError("Completá monto y motivo"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetchT(`${API}/api/caja/egreso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turno_id: turno.id, monto: parseFloat(egresoMonto), motivo: egresoMotivo }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      setEgresoMonto("");
      setEgresoMotivo("");
      setTurno((t: any) => ({ ...t, total_egresos: (t.total_egresos || 0) + parseFloat(egresoMonto) }));
      setPaso("activo");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleConteo() {
    if (!conteoMonto) { setError("Ingresá el efectivo contado"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetchT(`${API}/api/caja/conteo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turno_id: turno.id, monto_declarado: parseFloat(conteoMonto), numero_conteo: conteoPend?.numero_conteo || 1 }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      setConteoMonto("");
      setConteoPend(null);
      setPaso("activo");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleCierre() {
    if (!cierreMonto) { setError("Ingresá el efectivo final"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetchT(`${API}/api/caja/cierre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turno_id: turno.id, caja_cierre: parseFloat(cierreMonto) }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      setResumen(d.resumen);
      setPaso("resumen");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function resetear() {
    setPaso(sucursales.length > 1 ? "sucursal" : "empleado");
    setPin("");
    setEmpleadoSel("");
    SESION_TOKEN = ""; setTurno(null);
    setConteoPend(null);
    setAperturaEfectivo("");
    setCierreMonto("");
    setError("");
    setResumen(null);
  }

  // ─── SCREEN 1: codigo ───────────────────────────────────────────────────────
  if (paso === "codigo") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 14, letterSpacing: 3, color: C.muted, marginBottom: 12, fontWeight: 600 }}>LUMO</div>
          <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 40, color: C.text, margin: '0 0 12px 0' }}>Modo empleado</h1>
          <p style={{ fontSize: 16, color: C.muted, margin: 0 }}>Ingresá el código de tu negocio</p>
        </div>
        <ErrorBox error={error} />
        <input
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          value={negocioId}
          onChange={e => { setNegocioId(e.target.value.toUpperCase()); setError(""); }}
          placeholder="Código de negocio"
          style={{
            width: '100%',
            padding: '20px 24px',
            borderRadius: 20,
            border: `2px solid ${C.cardBorder}`,
            background: C.bg,
            color: C.text,
            fontSize: 18,
            fontFamily: 'var(--font-instrument), sans-serif',
            boxSizing: 'border-box' as any,
            marginBottom: 24,
            outline: 'none',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: 15, color: C.muted, cursor: 'pointer' }}>
          <input type="checkbox" checked={recordar} onChange={e => setRecordar(e.target.checked)} style={{ width: 20, height: 20 }} />
          Recordar este dispositivo
        </label>
        <PrimaryButton loading={loading} label="Continuar →" onPress={() => cargarSucursales(negocioId, recordar)} />
      </div>
    </main>
  );

  // ─── SCREEN 2: sucursal ─────────────────────────────────────────────────────
  if (paso === "sucursal") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif' }}>
      <div style={{ padding: '32px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>
        <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>¿En qué local trabajás hoy?</h1>
      </div>
      <div style={{ padding: 24 }}>
        <ErrorBox error={error} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sucursales.map(s => (
            <button
              key={s.id}
              onClick={async () => { setSucursalSel(s); setError(""); await cargarEmpleados(negocioId, s.id); }}
              style={{
                padding: '24px',
                borderRadius: 20,
                border: `2px solid ${C.cardBorder}`,
                background: C.bg,
                color: C.text,
                fontSize: 18,
                fontWeight: 600,
                fontFamily: 'var(--font-instrument), sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.nombre}</div>
                {s.direccion && <div style={{ fontSize: 14, color: C.muted }}>{s.direccion}</div>}
              </div>
              <div style={{ fontSize: 24, color: C.muted }}>→</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <TextButton label="Cambiar negocio" onPress={() => { setNegocioId(""); localStorage.removeItem("lumo_negocio_codigo"); localStorage.removeItem("lumo_recordar_dispositivo"); setRecordar(false); setPaso("codigo"); }} />
        </div>
      </div>
    </main>
  );

  // ─── SCREEN 3: empleado ─────────────────────────────────────────────────────
  if (paso === "empleado") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif' }}>
      <div style={{ padding: '32px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>
        <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>¿Quién sos?</h1>
      </div>
      <div style={{ padding: 24 }}>
        <ErrorBox error={error} />
        {sucursalSel && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: `rgba(0,122,255,0.08)`, borderRadius: 14, fontSize: 14, color: C.primary, fontWeight: 600 }}>
            📍 {sucursalSel.nombre}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {empleados.map(e => (
            <button
              key={e.id}
              onClick={() => { setEmpleadoSel(e.nombre); setError(""); setPaso("pin"); }}
              style={{
                padding: '20px 24px',
                borderRadius: 20,
                border: `2px solid ${C.cardBorder}`,
                background: C.bg,
                color: C.text,
                fontSize: 18,
                fontWeight: 600,
                fontFamily: 'var(--font-instrument), sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <Avatar name={e.nombre} size={48} />
              <span>{e.nombre}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          {sucursales.length > 1 && <TextButton label="← Cambiar local" onPress={() => { setSucursalSel(null); setPaso("sucursal"); }} />}
          <TextButton label="Cambiar negocio" onPress={() => { setNegocioId(""); localStorage.removeItem("lumo_negocio_codigo"); localStorage.removeItem("lumo_recordar_dispositivo"); setRecordar(false); setPaso("codigo"); }} />
        </div>
      </div>
    </main>
  );

  // ─── SCREEN 4: pin ──────────────────────────────────────────────────────────
  if (paso === "pin") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <Avatar name={empleadoSel} size={100} />
        <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 28, color: C.text, margin: '24px 0 8px 0' }}>{empleadoSel}</h1>
        <p style={{ fontSize: 16, color: C.muted, marginBottom: 40 }}>Ingresá tu PIN de 4 dígitos</p>
        <ErrorBox error={error} />

        {/* PIN Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 48 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: `2px solid ${pin.length > i ? C.primary : C.cardBorder}`,
              background: pin.length > i ? C.primary : 'transparent',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, justifyItems: 'center', marginBottom: 32 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <NumpadKey key={num} value={String(num)} onPress={() => {
              if (pin.length < 4) {
                const newPin = pin + num;
                setPin(newPin);
                setError("");
              }
            }} />
          ))}
          <button
            onClick={() => setPin(pin.slice(0, -1))}
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: C.muted,
              fontSize: 14,
              fontFamily: 'var(--font-instrument), sans-serif',
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <NumpadKey value="0" onPress={() => {
            if (pin.length < 4) {
              setPin(pin + "0");
              setError("");
            }
          }} />
          <button
            onClick={() => { setPaso("empleado"); setPin(""); setError(""); }}
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: C.muted,
              fontSize: 12,
              fontFamily: 'var(--font-instrument), sans-serif',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <PrimaryButton loading={loading} label="Confirmar" onPress={handleValidarPin} disabled={pin.length !== 4} />
      </div>
    </main>
  );

  // ─── SCREEN 5: apertura ─────────────────────────────────────────────────────
  if (paso === "apertura") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 24, color: C.muted, margin: '0 0 12px 0' }}>Bienvenido/a, {empleadoSel}</h2>
          <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>¿Cuánto efectivo hay en caja ahora?</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>Declaración de apertura de turno</p>
        </div>
        <ErrorBox error={error} />
        <CurrencyInput value={aperturaEfectivo} onChange={v => { setAperturaEfectivo(v); setError(""); }} placeholder="15000" />
        <PrimaryButton loading={loading} label="Abrir turno" onPress={handleApertura} color={C.green} />
        <SecondaryButton label="← Volver" onPress={() => { setPaso("pin"); setError(""); }} color={C.muted} />
      </div>
    </main>
  );

  // ─── SCREEN 6: activo ───────────────────────────────────────────────────────
  if (paso === "activo") {
    const durMin = turno ? (Math.floor((Date.now() - new Date(turno.hora_apertura).getTime()) / 60000)) : 0;

    return (
      <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif', paddingBottom: 32 }}>
        {aut.modal}
        {/* Header gradient card */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, #00C2FF 100%)`,
          padding: '32px 24px',
          color: '#FFFFFF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Avatar name={turno?.nombre_empleado || empleadoSel} size={64} />
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Turno en curso</div>
              <div style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 24 }}>{turno?.nombre_empleado}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Duración</div>
              <div style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: 2 }}>{duracionLabel(durMin)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Caja inicial</div>
              <div style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 24 }}>{fmt(turno?.caja_apertura || 0)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {turno && <CajaSinInternet api={API} getToken={() => SESION_TOKEN} turnoId={turno.id} />}
<div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: enfocado ? C.green : C.amber, display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                {enfocado ? 'Listo para escanear' : 'Tocá acá para escanear'}
              </span>
            </div>
            <input
              id="scan-input"
              type="text"
              autoComplete="off"
              value={scanBuffer}
              placeholder="Escaneá con la pistola o escribí el código o el nombre"
              onChange={(ev) => { setScanBuffer(ev.target.value); buscarSugerencias(ev.target.value); }}
              onFocus={() => setEnfocado(true)}
              onBlur={() => {
                setEnfocado(false);
                // En compu se recupera el foco para la pistola, salvo que se esté escribiendo en otro campo. En celu no, para no abrir el teclado solo.
                setTimeout(() => {
                  try { if (!window.matchMedia('(pointer: fine)').matches) return; } catch { return; }
                  const a = document.activeElement as HTMLElement | null;
                  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable)) return;
                  document.getElementById('scan-input')?.focus();
                }, 150);
              }}
              onKeyDown={(ev) => {
                if (ev.key !== 'Enter') return;
                ev.preventDefault();
                enviarEntrada(ev.currentTarget.value);
              }}
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px', fontSize: 16, borderRadius: 14, border: `2px solid ${enfocado ? C.primary : C.cardBorder}`, background: C.bg, color: C.text, outline: 'none', fontFamily: 'var(--font-instrument), sans-serif' }}
            />
            {error && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#D92D20', fontWeight: 600 }}>{error}</div>
            )}
            {ventaOk && (
              <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 12, background: 'rgba(52,199,89,0.12)', border: `2px solid ${C.green}`, fontSize: 15, color: C.text, fontWeight: 700 }}>✓ {ventaOk}</div>
            )}
            {sugerencias.length > 0 && (
              <div style={{ marginTop: 8, border: `2px solid ${C.cardBorder}`, borderRadius: 14, overflow: 'hidden', background: C.bg }}>
                {sugerencias.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={async () => { setSugerencias([]); setScanBuffer(''); await agregarAlCarrito(p.id); document.getElementById('scan-input')?.focus(); }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: `1px solid ${C.cardBorder}`, cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{p.nombre}</div>
                      {p.codigo_barras && <div style={{ fontSize: 11, color: C.muted }}>{p.codigo_barras}</div>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 14, color: C.text }}>{fmt(parseFloat(p.precio_venta))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Conteo pendiente alert */}
          {conteoPend && (
            <div style={{
              background: 'rgba(255,149,0,0.1)',
              border: `2px solid ${C.amber}`,
              borderRadius: 20,
              padding: '24px',
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: C.amber, fontWeight: 700, marginBottom: 8 }}>⚠️ CONTEO SOLICITADO</div>
              <div style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 8 }}>Contá la caja ahora</div>
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>
                Tenés <span style={{ color: C.amber, fontWeight: 700 }}>{conteoPend.minutos_restantes} min</span> para responder
              </div>
              <button
                onClick={() => setPaso("conteo")}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 14,
                  border: `2px solid ${C.amber}`,
                  background: C.amber,
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'var(--font-instrument), sans-serif',
                  cursor: 'pointer',
                }}
              >
                Registrar conteo
              </button>
            </div>
          )}


{/* Carrito: siempre visible */}
          <div style={{
            background: C.bg,
            border: `2px solid ${C.cardBorder}`,
            borderRadius: 20,
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 14, letterSpacing: 0.5 }}>
              {carrito && carrito.items.length > 0
                ? `CARRITO ACTUAL · ${carrito.items.length} ${carrito.items.length === 1 ? 'ITEM' : 'ITEMS'}`
                : 'CARRITO ACTUAL'}
            </div>
            {(!carrito || carrito.items.length === 0) && (
              <div style={{ fontSize: 14, color: C.muted, padding: '8px 0 4px' }}>Todavía no hay productos. Escaneá el primero o buscalo por nombre.</div>
            )}
            {carrito && carrito.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{item.producto_nombre}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{fmt(parseFloat(item.precio_unitario))} c/u</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => cambiarCantidad(item, parseFloat(item.cantidad) - 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${C.cardBorder}`, background: 'transparent', color: C.text, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>−</button>
                  <span style={{ minWidth: 26, textAlign: 'center', fontSize: 15, fontWeight: 800, color: C.text }}>{parseFloat(item.cantidad)}</span>
                  <button onClick={() => cambiarCantidad(item, parseFloat(item.cantidad) + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${C.cardBorder}`, background: 'transparent', color: C.text, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>+</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 96, justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 15, color: C.text }}>
                    {fmt(item.cantidad * parseFloat(item.precio_unitario))}
                  </span>
                  <span onClick={() => cambiarCantidad(item, 0)} style={{ fontSize: 18, color: C.muted, cursor: 'pointer', padding: 4 }}>✕</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
              <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 26, color: C.text }}>{fmt(carrito ? carrito.total : 0)}</span>
            </div>
            {carrito && carrito.items.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                {([
                  ['efectivo', '💵 Efectivo', C.green],
                  ['debito', '💳 Débito', C.primary],
                  ['credito', '💳 Crédito', C.primary],
                  ['transferencia', '🏦 Transferencia', C.primary],
                  ['mp', '📲 QR / MP', C.primary],
                ] as [string, string, string][]).map(([metodo, etiqueta, color]) => (
                  <button
                    key={metodo}
                    onClick={async () => {
                      const totalVenta = carrito ? carrito.total : 0;
                      try {
                        const r = await fetchT(`${API}/api/scanner/finalizar-venta`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ turno_id: turno.id, metodo_pago: metodo }),
                        });
                        const d = await r.json();
                        if (d.error) { setError(d.error); return; }
                        setError('');
                        setVentaOk(`Venta registrada: ${fmt(totalVenta)} con ${etiqueta.replace(/^[^A-Za-zÁ-úñÑ]+/, '')}`);
                        setTimeout(() => setVentaOk(''), 8000);
                        setCarrito({ items: [], total: 0 });
                        document.getElementById('scan-input')?.focus();
                      } catch { setError('No se pudo registrar la venta. Probá de nuevo.'); }
                    }}
                    style={{ flex: '1 1 30%', padding: '14px 8px', borderRadius: 14, border: 'none', background: color, color: '#FFFFFF', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-instrument), sans-serif', cursor: 'pointer' }}
                  >
                    {etiqueta}
                  </button>
                ))}
                {mpDisponible && (
                  <button
                    onClick={cobrarConQR}
                    disabled={qrMPCargando}
                    style={{ flex: '1 1 100%', padding: '14px 8px', borderRadius: 14, border: 'none', background: C.primary, color: '#FFFFFF', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-instrument), sans-serif', cursor: 'pointer', opacity: qrMPCargando ? 0.6 : 1 }}
                  >
                    {qrMPCargando ? 'Generando QR…' : '📲 Cobrar con QR de Mercado Pago (monto exacto)'}
                  </button>
                )}
                {qrMP && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.82)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#5B6472', fontWeight: 600 }}>Que el cliente escanee con Mercado Pago</div>
                      <div style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 30, color: '#0A1628', margin: '6px 0 14px' }}>{fmt(qrMP.monto)}</div>
                      <QRCodeSVG value={qrMP.qr} size={240} />
                      <div style={{ fontSize: 13, color: '#5B6472', marginTop: 14 }}>Esperando el pago… la venta se cierra sola cuando Mercado Pago la confirma.</div>
                      <button onClick={cancelarQR} style={{ marginTop: 16, width: '100%', padding: '12px 8px', borderRadius: 12, border: '2px solid #D5DAE1', background: 'transparent', color: '#0A1628', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats card */}
          <div style={{
            background: C.bg,
            border: `2px solid ${C.cardBorder}`,
            borderRadius: 20,
            padding: '24px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 16 }}>ÚLTIMA DECLARACIÓN</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: C.text }}>Efectivo en apertura</span>
              <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{fmt(turno?.caja_apertura || 0)}</span>
            </div>
            {turno?.total_egresos > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: C.text }}>Egresos registrados</span>
                <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 16, color: C.amber }}>{fmt(turno?.total_egresos || 0)}</span>
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              if (!turno?.id) return;
              setScanQRLoading(true);
              try {
                const r = await fetchT(`${API}/api/scanner/sesion`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ turno_id: turno.id }),
                });
                const d = await r.json();
                if (!d.error) {
                  const url = `${window.location.origin}/scan/${d.token}`;
                  setScanQR({ url, expira_en: d.expira_en });
                }
              } catch { /* silencioso */ }
              setScanQRLoading(false);
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: `2px solid ${C.primary}`,
              background: 'transparent',
              color: C.primary,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-instrument), sans-serif',
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            {scanQRLoading ? 'Generando...' : '📷 Escanear con el celu'}
          </button>

          {precioModal && turno?.id && (
            <PrecioModal turnoId={turno.id} onClose={() => { setPrecioModal(false); setTimeout(() => document.getElementById('scan-input')?.focus(), 100); }} />
          )}
          {altaCodigo && turno?.id && (
            <AltaModal
              codigo={altaCodigo}
              turnoId={turno.id}
              onClose={() => { setAltaCodigo(null); setTimeout(() => document.getElementById('scan-input')?.focus(), 100); }}
              onAgregado={async () => {
                const r2 = await fetchT(`${API}/api/scanner/carrito/${turno.id}`);
                const d2 = await r2.json();
                if (!d2.error) setCarrito(d2);
              }}
            />
          )}
          {scanQR && (
            <div
              onClick={() => setScanQR(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: 24,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: 32,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 16 }}>
                  Escaneá con la cámara del celu
                </div>
                <QRCodeSVG value={scanQR.url} size={220} />
                <div
                  onClick={() => setScanQR(null)}
                  style={{ marginTop: 20, fontSize: 14, color: C.muted, cursor: 'pointer' }}
                >
                  Cerrar
                </div>
              </div>
            </div>
          )}

          <SecondaryButton label="Cambiar precios" onPress={() => setPrecioModal(true)} color={C.primary} />

          {/* Actions */}
          <PrimaryButton loading={loading} label="💰 Declaración mid-turno" onPress={() => { setConteoMonto(""); setError(""); setPaso("conteo"); }} color={C.yellow} icon="" />
          <SecondaryButton label="Cerrar turno" onPress={() => { setCierreMonto(""); setError(""); setPaso("cierre"); }} color={C.red} />
        </div>
      </main>
    );
  }

  // ─── SCREEN 7: egreso (SKIP - goes back to activo) ─────────────────────────
  if (paso === "egreso") {
    // Immediately go back to activo
    setPaso("activo");
    return null;
  }

  // ─── SCREEN 8: conteo ───────────────────────────────────────────────────────
  if (paso === "conteo") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif' }}>
      <div style={{
        background: `rgba(255,149,0,0.1)`,
        borderBottom: `3px solid ${C.amber}`,
        padding: '32px 24px',
      }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: C.amber, fontWeight: 700, marginBottom: 8 }}>⚠️ CONTEO SOLICITADO</div>
        <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>
          {conteoPend ? `Quedan ${conteoPend.minutos_restantes} minutos` : "Conteo de caja"}
        </h1>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div style={{
            background: 'rgba(255,149,0,0.08)',
            border: `1px solid rgba(255,149,0,0.2)`,
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: 32,
          }}>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, margin: 0 }}>
              Contá el efectivo físico en la caja sin mover nada. No cuentes lo que está separado.
            </p>
          </div>
          <h2 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 24, color: C.text, marginBottom: 24 }}>¿Cuánto efectivo hay en caja ahora?</h2>
          <ErrorBox error={error} />
          <CurrencyInput value={conteoMonto} onChange={v => { setConteoMonto(v); setError(""); }} placeholder="18500" />
          <PrimaryButton loading={loading} label="Confirmar conteo" onPress={handleConteo} color={C.primary} />
          <SecondaryButton label="← Volver al turno" onPress={() => { setPaso("activo"); setError(""); }} color={C.muted} />
        </div>
      </div>
    </main>
  );

  // ─── SCREEN 9: cierre ───────────────────────────────────────────────────────
  if (paso === "cierre") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: '0 0 12px 0' }}>Cerrando turno</h1>
          <p style={{ fontSize: 16, color: C.muted }}>¿Cuánto efectivo hay en caja al cerrar?</p>
        </div>
        <ErrorBox error={error} />
        <div style={{
          background: C.bg,
          border: `2px solid ${C.cardBorder}`,
          borderRadius: 20,
          padding: '20px 24px',
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 16 }}>EFECTIVO EN APERTURA</div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, color: C.text }}>{fmt(turno?.caja_apertura || 0)}</span>
          </div>
        </div>
        <CurrencyInput value={cierreMonto} onChange={v => { setCierreMonto(v); setError(""); }} placeholder="24000" />
        <button
          onClick={handleCierre}
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px 24px',
            borderRadius: 14,
            background: 'transparent',
            color: C.red,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'var(--font-instrument), sans-serif',
            cursor: loading ? 'default' : 'pointer',
            marginBottom: 12,
            border: `2px solid ${C.red}`,
          }}
        >
          {loading ? "..." : "Cerrar turno definitivamente"}
        </button>
        <SecondaryButton label="← Volver al turno" onPress={() => { setPaso("activo"); setError(""); }} color={C.muted} />
      </div>
    </main>
  );

  // ─── SCREEN 10: resumen ─────────────────────────────────────────────────────
  if (paso === "resumen" && resumen) {
    const durMin = turno ? (Math.floor((Date.now() - new Date(turno.hora_apertura).getTime()) / 60000)) : 0;

    return (
      <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          {/* Checkmark animation */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: C.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            animation: 'checkmarkPop 0.5s ease-out',
          }}>
            <div style={{ fontSize: 48, color: '#FFFFFF' }}>✓</div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 36, color: C.text, margin: '0 0 40px 0' }}>Turno cerrado</h1>

          {/* Summary card */}
          <div style={{
            background: C.bg,
            border: `2px solid ${C.cardBorder}`,
            borderRadius: 20,
            padding: '24px',
            marginBottom: 32,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: C.muted }}>Efectivo en apertura</span>
              <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{fmt(resumen.caja_apertura || turno?.caja_apertura || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: C.muted }}>Efectivo en cierre</span>
              <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{fmt(resumen.caja_cierre)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
              <span style={{ fontSize: 14, color: C.muted }}>Duración del turno</span>
              <span style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{duracionLabel(durMin)}</span>
            </div>
          </div>

          <p style={{ fontSize: 18, color: C.muted, margin: 0 }}>Hasta la próxima, <span style={{ fontWeight: 700, color: C.text }}>{empleadoSel}</span></p>
        </div>

        <style jsx>{`
          @keyframes checkmarkPop {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </main>
    );
  }

  return null;
}
