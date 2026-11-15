"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAutorizacion } from "./Autorizacion";
import AnularVenta from "./AnularVenta";
import { PanelEfectivo, PanelMixto, PanelVarios, PanelDescuento } from "./Cobro";
import BotonesTicket, { imprimirTicket, leerImpresora, ConfigImpresora } from "./Ticket";
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

function haceLabel(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ${min % 60} min`;
  return `${Math.floor(h / 24)} días`;
}

const estiloBtn = (bg: string, extra: CSSProperties = {}): CSSProperties => ({
  padding: '15px 8px', borderRadius: 14, border: 'none', background: bg, color: '#FFFFFF', fontSize: 15, fontWeight: 800,
  fontFamily: 'var(--font-instrument), sans-serif', cursor: 'pointer', ...extra,
});

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
      setMsg({ texto: "No hay internet o se cortó. Probá de nuevo.", ok: false });
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
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [puntoMP, setPuntoMP] = useState<{ id: number; monto: number; tipo: 'debito' | 'credito'; cancelando?: boolean } | null>(null);
  const [puntoCargando, setPuntoCargando] = useState(false);
  const [elegirTerm, setElegirTerm] = useState<{ lista: { id: string; nombre: string }[]; tipo: 'debito' | 'credito' } | null>(null);
  const [mostrarManual, setMostrarManual] = useState(false);
  const [panel, setPanel] = useState<null | "efectivo" | "mixto" | "varios" | "descuento">(null);
  const [ultimaVenta, setUltimaVenta] = useState<number | null>(null);
  const [confImpresora, setConfImpresora] = useState(false);
  const [menuTurno, setMenuTurno] = useState(false);
  // Después de cada venta: si esta caja tiene "imprimir siempre", sale el ticket solo
  function ventaHecha(id: number | null) {
    setUltimaVenta(id);
    if (id && leerImpresora().auto) imprimirTicket(fetchT, API, id);
  }
  const [esperas, setEsperas] = useState<{ id: number; total: number; nota: string | null; hora: string }[]>([]);
  async function cargarEsperas() {
    try { const r = await fetchT(`${API}/api/scanner/espera`); const d = await r.json(); setEsperas(Array.isArray(d.ventas) ? d.ventas : []); } catch { /* sin conexión */ }
  }
  async function dejarEnEspera() {
    const nota = window.prompt("¿De quién es? (opcional, por ejemplo: señora de rojo)") || "";
    try {
      const r = await fetchT(`${API}/api/scanner/espera`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nota }) });
      const d = await r.json();
      if (!r.ok || d.error) { setError(d.error || "No se pudo dejar en espera."); return; }
      setCarrito({ items: [], total: 0 }); await cargarEsperas();
      document.getElementById('scan-input')?.focus();
    } catch { setError("No hay internet o se cortó. Probá de nuevo."); }
  }
  async function retomar(id: number) {
    try {
      const r = await fetchT(`${API}/api/scanner/espera/${id}/retomar`, { method: "POST" });
      const d = await r.json();
      if (!r.ok || d.error) { setError(d.error || "No se pudo retomar."); return; }
      setError(""); await refrescarCarrito(); await cargarEsperas();
    } catch { setError("No hay internet o se cortó. Probá de nuevo."); }
  }

  useEffect(() => {
    if (!turno?.id) return;
    fetchT(`${API}/api/mp-cobro/disponible`).then((r) => r.json()).then((d) => { setMpDisponible(!!d.disponible); setTerminalId(d.terminal_id || null); }).catch(() => {});
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
  // Mientras hay un cobro esperando en el posnet, se pregunta cada 3 segundos si el cliente ya pagó
  useEffect(() => {
    if (!puntoMP) return;
    let vivo = true;
    const iv = setInterval(async () => {
      try {
        const r = await fetchT(`${API}/api/mp-cobro/estado/${puntoMP.id}`);
        const d = await r.json();
        if (!vivo || !d.estado || d.estado === 'esperando') return;
        setPuntoMP(null);
        if (d.estado === 'pagado') {
          setError('');
          setVentaOk(`Venta registrada: ${fmt(puntoMP.monto)} con ${puntoMP.tipo === 'debito' ? 'débito' : 'crédito'} (posnet)`);
          setTimeout(() => setVentaOk(''), 8000);
          setCarrito({ items: [], total: 0 });
          document.getElementById('scan-input')?.focus();
        } else if (d.estado === 'pagado_sin_venta') {
          setError('El pago entró en Mercado Pago pero la venta no se pudo cerrar. Avisale al dueño.');
        } else if (d.estado === 'rechazado') {
          setError('El pago fue rechazado en el posnet. Probá con otra tarjeta u otro medio.');
        } else {
          setError('El cobro en el posnet se canceló o venció. Probá de nuevo o cobrá con otro medio.');
        }
      } catch { /* sigue esperando */ }
    }, 3000);
    return () => { vivo = false; clearInterval(iv); };
  }, [puntoMP]);

  async function elegirTerminal(id: string): Promise<boolean> {
    try {
      const r = await fetchT(`${API}/api/mp-cobro/terminal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terminal_id: id }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'No se pudo elegir el posnet.'); return false; }
      setTerminalId(id);
      return true;
    } catch { setError('No se pudo elegir el posnet. Probá de nuevo.'); return false; }
  }

  async function cobrarConPoint(tipo: 'debito' | 'credito', terminal?: string | null) {
    if (!turno?.id || puntoCargando) return;
    setPuntoCargando(true);
    try {
      if (!(terminal || terminalId)) {
        const r0 = await fetchT(`${API}/api/mp-cobro/terminales`);
        const d0 = await r0.json();
        if (!r0.ok) { setError(d0.error || 'No se pudieron leer los posnets.'); return; }
        const lista = d0.terminales || [];
        if (!lista.length) { setError('No encontramos ningún posnet Point en la cuenta de Mercado Pago.'); return; }
        if (lista.length > 1) { setElegirTerm({ lista, tipo }); return; }
        if (!(await elegirTerminal(lista[0].id))) return;
      }
      const r = await fetchT(`${API}/api/mp-cobro/point`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo }) });
      const d = await r.json();
      if (!r.ok || !d.cobro_id) { setError(d.error || 'No se pudo mandar el cobro al posnet.'); return; }
      setError('');
      setPuntoMP({ id: d.cobro_id, monto: d.monto, tipo });
    } catch { setError('No se pudo mandar el cobro al posnet. Probá de nuevo.'); }
    finally { setPuntoCargando(false); }
  }

  async function cancelarPoint() {
    const actual = puntoMP;
    if (!actual) return;
    try {
      const r = await fetchT(`${API}/api/mp-cobro/cancelar/${actual.id}`, { method: 'POST' });
      const d = await r.json();
      if (d.cancelando) { setPuntoMP({ ...actual, cancelando: true }); return; }   // el posnet ya la tiene: se confirma cuando la cancelen ahí
      if (d.estado === 'pagado') {
        setVentaOk(`Venta registrada: ${fmt(actual.monto)} con tarjeta (posnet)`);
        setTimeout(() => setVentaOk(''), 8000);
        setCarrito({ items: [], total: 0 });
      }
    } catch { /* el cobro vence solo */ }
    setPuntoMP(null);
  }

  // Venta que se carga a mano (efectivo, transferencia, o tarjeta cuando no se usa el posnet)
  async function cobrarManual(metodo: string, etiqueta: string) {
    if (!turno?.id) return;
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
      ventaHecha(d.transaccion_id || null);
      setVentaOk(`Venta registrada: ${fmt(totalVenta)} con ${etiqueta.replace(/^[^A-Za-zÁ-úñÑ]+/, '')}`);
      setTimeout(() => setVentaOk(''), 20000);
      setCarrito({ items: [], total: 0 });
      document.getElementById('scan-input')?.focus();
    } catch { setError('No se pudo registrar la venta. Probá de nuevo.'); }
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

  async function agregarAlCarrito(productoId: number, cantidad: number = 1) {
    if (!turno?.id) return;
    try {
      const r = await fetchT(`${API}/api/scanner/carrito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turno.id, producto_id: productoId, cantidad, agregado_por: 'pistola_compu' }),
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
    if (refBusq.current) clearTimeout(refBusq.current); // que no aparezca la sugerencia vieja después de agregar
    const texto = valor.trim();
    setScanBuffer('');
    setSugerencias([]);
    if (!texto || !turno?.id) return;
    setError('');
    try {
      const r = await fetchT(`${API}/api/scanner/producto?turno_id=${turno.id}&codigo=${encodeURIComponent(texto)}`);
      const d = await r.json();
      if (d.existe) { await agregarAlCarrito(d.producto.id, Number(d.cantidad) > 0 ? Number(d.cantidad) : 1); return; }
      // Etiqueta de balanza con un producto que no está cargado: se avisa qué cargar (no se ofrece dar de alta el código entero)
      if (d.error) { setError(d.error); return; }
      if (/^\d+$/.test(texto)) { setError(`El código ${texto} no está cargado. Cargalo para venderlo.`); setAltaCodigo(texto); return; }
      const r2 = await fetchT(`${API}/api/scanner/buscar?turno_id=${turno.id}&q=${encodeURIComponent(texto)}`);
      const d2 = await r2.json();
      const ps: any[] = Array.isArray(d2.productos) ? d2.productos : [];
      if (ps.length === 1) await agregarAlCarrito(ps[0].id);
      else if (ps.length > 1) setSugerencias(ps);
      else setError(`No encontré "${texto}" en tus productos.`);
    } catch { setError('Sin conexión. Probá de nuevo.'); }
  }
  const [precioModal, setPrecioModal] = useState(false);
  const [anularModal, setAnularModal] = useState(false);
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

  // Ventas en espera del turno: se cargan al entrar a la caja
  useEffect(() => {
    if (paso !== "activo" || !turno?.id) return;
    cargarEsperas();
  }, [paso, turno?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Que este celu o compu se acuerde del código": casilla de la pantalla del codigo (apagada por defecto)
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
      if (!Array.isArray(d)) { setError("Ese código no existe. Revisalo con el dueño."); return; }
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
      setError("No hay internet o se cortó. Probá de nuevo.");
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
      if (!Array.isArray(d)) { setError("Ese código no existe. Revisalo con el dueño."); return; }
      if (d.length === 0) { setError("Todavía no hay nadie cargado para esta caja. El dueño tiene que agregarte en LumoBi, en Equipo."); return; }
      setEmpleados(d);
      setPaso("empleado");
    } catch {
      setError("No hay internet o se cortó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleValidarPin() {
    if (pin.length !== 4) { setError("La clave tiene 4 números"); return; }
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
      setError("No hay internet o se cortó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApertura() {
    if (!aperturaEfectivo) { setError("Escribí cuánta plata hay en la caja (si no hay, poné 0)"); return; }
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
      setError("No hay internet o se cortó. Probá de nuevo.");
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
      setError("No hay internet o se cortó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConteo() {
    if (!conteoMonto) { setError("Escribí cuánta plata contaste"); return; }
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
      setError("No hay internet o se cortó. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCierre() {
    if (!cierreMonto) { setError("Escribí cuánta plata hay en la caja"); return; }
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
      setError("No hay internet o se cortó. Probá de nuevo.");
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
          <div style={{ fontSize: 14, letterSpacing: 3, color: C.muted, marginBottom: 12, fontWeight: 600 }}>LUMOBI</div>
          <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 40, color: C.text, margin: '0 0 12px 0' }}>Caja</h1>
          <p style={{ fontSize: 16, color: C.muted, margin: 0 }}>Escribí el código de tu negocio</p>
          <p style={{ fontSize: 13, color: C.muted, margin: "8px 0 0 0" }}>Te lo da el dueño. Lo encuentra en LumoBi, en Equipo.</p>
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
        <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar name={empleadoSel} size={100} /></div>
        <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 28, color: C.text, margin: '24px 0 8px 0' }}>{empleadoSel}</h1>
        <p style={{ fontSize: 16, color: C.muted, marginBottom: 40 }}>Escribí tu clave de 4 números</p>
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
          <h1 style={{ fontFamily: 'var(--font-instrument), sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>¿Cuánta plata en efectivo hay en la caja?</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>Contá los billetes antes de empezar. Así, al cerrar, se sabe si la caja cerró bien. Si no hay nada, poné 0.</p>
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

    const hay = !!(carrito && carrito.items.length > 0);
    const botonPago = (txt: string, onClick: () => void, extra: React.CSSProperties = {}, disabled = false) => (
      <button disabled={disabled} onClick={onClick} style={{ flex: '1 1 0', minWidth: 0, padding: '14px 6px', borderRadius: 12, border: `2px solid ${C.cardBorder}`, background: '#FFFFFF', color: C.text, fontSize: 15, fontWeight: 800, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: 'var(--font-instrument), sans-serif', ...extra }}>{txt}</button>
    );
    const linkChico = (txt: string, onClick: () => void, color: string = C.primary) => (
      <button onClick={onClick} style={{ padding: '8px 0', border: 'none', background: 'transparent', color, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-instrument), sans-serif' }}>{txt}</button>
    );
    const opcionMenu = (titulo: string, sub: string, onClick: () => void, color: string = C.text) => (
      <button onClick={() => { setMenuTurno(false); onClick(); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 4px', border: 'none', borderTop: `1px solid ${C.cardBorder}`, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-instrument), sans-serif' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color }}>{titulo}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{sub}</div>
      </button>
    );

    return (
      <main style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'var(--font-instrument), sans-serif', paddingBottom: 32 }}>
        <style>{`
          .solo-compu { display: none; }
          @media (pointer: fine) { .solo-compu { display: inline; } }
          .caja-grid { display: grid; grid-template-columns: 1fr; gap: 16px; padding: 16px; max-width: 1280px; margin: 0 auto; }
          @media (min-width: 900px) {
            .caja-grid { grid-template-columns: minmax(0, 1.6fr) minmax(330px, 1fr); gap: 20px; padding: 20px 24px; }
            .caja-cobro { position: sticky; top: 16px; align-self: start; }
          }
        `}</style>
        {aut.modal}

        {/* Barra del turno: quién atiende y el menú con todo lo del turno */}
        <div style={{ background: '#FFFFFF', borderBottom: `1px solid ${C.cardBorder}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={turno?.nombre_empleado || empleadoSel} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{turno?.nombre_empleado}</div>
            <div style={{ fontSize: 12, color: C.muted }}>Turno abierto hace {haceLabel(durMin)} · empezó con {fmt(turno?.caja_apertura || 0)}</div>
          </div>
          <button onClick={() => setMenuTurno(true)} style={{ padding: '10px 14px', borderRadius: 10, border: `2px solid ${C.cardBorder}`, background: '#FFFFFF', color: C.text, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-instrument), sans-serif', whiteSpace: 'nowrap' }}>☰ Menú del turno</button>
        </div>

        {durMin > 14 * 60 && (
          <div style={{ margin: '16px 16px 0', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,59,48,0.08)', border: `2px solid ${C.red}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>Este turno lleva {haceLabel(durMin)} abierto</div>
            <div style={{ fontSize: 13, color: C.text, margin: '4px 0 10px' }}>Si ya terminó, cerralo y abrí uno nuevo. Si queda abierto, la caja y los controles del equipo se mezclan.</div>
            <button onClick={() => { setCierreMonto(""); setError(""); setPaso("cierre"); }} style={estiloBtn(C.red, { width: '100%' })}>Cerrar turno</button>
          </div>
        )}

        <div className="caja-grid">
          {/* ── IZQUIERDA: lector y carrito ── */}
          <div style={{ minWidth: 0 }}>
            {turno && <CajaSinInternet api={API} getToken={() => SESION_TOKEN} turnoId={turno.id} />}

            {conteoPend && (
              <div style={{ background: 'rgba(255,149,0,0.1)', border: `2px solid ${C.amber}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 4 }}>El dueño te pide que cuentes la caja</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>Tenés <span style={{ color: C.amber, fontWeight: 700 }}>{conteoPend.minutos_restantes} min</span> para responder.</div>
                <button onClick={() => setPaso("conteo")} style={estiloBtn(C.amber, { width: '100%' })}>Contar la caja ahora</button>
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: enfocado ? C.green : C.amber, display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{enfocado ? 'Listo para escanear' : 'Tocá acá para escanear'}</span>
              </div>
              <input
                id="scan-input"
                type="text"
                autoComplete="off"
                value={scanBuffer}
                placeholder="Pasá el producto o escribí el nombre"
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
                  // Lector vacío + carrito con productos: Enter abre el cobro en efectivo (y otro Enter cobra)
                  if (!ev.currentTarget.value.trim() && hay) { setPanel('efectivo'); return; }
                  enviarEntrada(ev.currentTarget.value);
                }}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '16px', fontSize: 17, borderRadius: 12, border: `2px solid ${enfocado ? C.primary : C.cardBorder}`, background: '#FFFFFF', color: C.text, outline: 'none', fontFamily: 'var(--font-instrument), sans-serif' }}
              />
              {error && <div style={{ marginTop: 8, fontSize: 14, color: '#D92D20', fontWeight: 600 }}>{error}</div>}
              {sugerencias.length > 0 && scanBuffer.trim().length >= 2 && (
                <div style={{ marginTop: 8, border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
                  {sugerencias.map((p: any) => (
                    <div key={p.id}
                      onClick={async () => { setSugerencias([]); setScanBuffer(''); await agregarAlCarrito(p.id); document.getElementById('scan-input')?.focus(); }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: `1px solid ${C.cardBorder}`, cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>{p.nombre}</div>
                        {p.codigo_barras && <div style={{ fontSize: 11, color: C.muted }}>{p.codigo_barras}</div>}
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{fmt(parseFloat(p.precio_venta))}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 8 }}>{linkChico('+ Algo sin código (precio a mano)', () => setPanel('varios'))}</div>
            </div>

            {esperas.length > 0 && (
              <div style={{ marginBottom: 16, padding: 14, borderRadius: 16, background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.35)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.amber, marginBottom: 6, letterSpacing: 0.5 }}>VENTAS EN ESPERA</div>
                {esperas.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <span style={{ fontSize: 15, color: C.text }}><strong>{fmt(v.total)}</strong> · {v.hora}{v.nota ? ` · ${v.nota}` : ''}</span>
                    <button onClick={() => retomar(v.id)} style={{ padding: '8px 12px', borderRadius: 10, border: `2px solid ${C.primary}`, background: '#FFFFFF', color: C.primary, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Retomar</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '6px 16px' }}>
              {!hay && <div style={{ fontSize: 15, color: C.muted, padding: '18px 0', textAlign: 'center' }}>El carrito está vacío. Pasá el primer producto por el lector.</div>}
              {carrito && carrito.items.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '12px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, color: item.tipo_linea === 'descuento' ? C.green : C.text, fontWeight: 700 }}>{item.producto_nombre}</div>
                    {item.tipo_linea !== 'descuento' && <div style={{ fontSize: 12, color: C.muted }}>{fmt(parseFloat(item.precio_unitario))} {Number.isInteger(Number(item.cantidad)) ? 'c/u' : 'el kilo'}</div>}
                  </div>
                  {item.tipo_linea === 'descuento' ? null : !Number.isInteger(Number(item.cantidad)) ? <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{Number(item.cantidad).toLocaleString('es-AR', { maximumFractionDigits: 3 })} kg</span> : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button aria-label="Uno menos" onClick={() => cambiarCantidad(item, parseFloat(item.cantidad) - 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${C.cardBorder}`, background: 'transparent', color: C.text, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>−</button>
                      <span style={{ minWidth: 26, textAlign: 'center', fontSize: 16, fontWeight: 800, color: C.text }}>{parseFloat(item.cantidad)}</span>
                      <button aria-label="Uno más" onClick={() => cambiarCantidad(item, parseFloat(item.cantidad) + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${C.cardBorder}`, background: 'transparent', color: C.text, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>+</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100, justifyContent: 'flex-end' }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: item.tipo_linea === 'descuento' ? C.green : C.text }}>
                      {item.tipo_linea === 'descuento' ? '−' + fmt(Math.abs(item.cantidad * parseFloat(item.precio_unitario))) : fmt(item.cantidad * parseFloat(item.precio_unitario))}
                    </span>
                    <button aria-label="Sacar del carrito" onClick={() => cambiarCantidad(item, 0)} style={{ border: 'none', background: 'transparent', fontSize: 18, color: C.muted, cursor: 'pointer', padding: 4 }}>✕</button>
                  </div>
                </div>
              ))}
              {hay && <div style={{ fontSize: 13, color: C.muted, padding: '10px 0' }}>{carrito!.items.filter((i: any) => i.tipo_linea !== 'descuento').length} {carrito!.items.filter((i: any) => i.tipo_linea !== 'descuento').length === 1 ? 'producto' : 'productos'} en el carrito</div>}
            </div>
          </div>

          {/* ── DERECHA: total y cobro (siempre a la vista en la compu) ── */}
          <div className="caja-cobro" style={{ minWidth: 0 }}>
            {ventaOk && (
              <div style={{ marginBottom: 12, padding: 14, borderRadius: 16, background: 'rgba(52,199,89,0.1)', border: `2px solid ${C.green}` }}>
                <div style={{ fontSize: 15, color: C.text, fontWeight: 800 }}>✓ {ventaOk}</div>
                {ultimaVenta && <BotonesTicket fetchT={fetchT} API={API} transaccionId={ultimaVenta} />}
              </div>
            )}
            <div style={{ background: '#FFFFFF', border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, letterSpacing: 0.5 }}>TOTAL</div>
              <div style={{ fontWeight: 800, fontSize: 44, color: C.text, lineHeight: 1.1, margin: '2px 0 14px' }}>{fmt(carrito ? carrito.total : 0)}</div>
              {!hay ? (
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>Cuando haya productos en el carrito, acá cobrás.</div>
              ) : (<>
                <button onClick={() => setPanel('efectivo')} style={estiloBtn(C.green, { width: '100%', fontSize: 18, padding: '18px 8px' })}>💵 Cobrar en efectivo <span className="solo-compu" style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>(Enter)</span></button>
                {mpDisponible ? (<>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, margin: '14px 0 8px' }}>Con Mercado Pago (la venta se carga sola)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {botonPago(puntoCargando ? 'Enviando…' : '💳 Débito', () => cobrarConPoint('debito'), {}, puntoCargando)}
                    {botonPago(puntoCargando ? 'Enviando…' : '💳 Crédito', () => cobrarConPoint('credito'), {}, puntoCargando)}
                    {botonPago(qrMPCargando ? 'QR…' : '📲 QR', cobrarConQR, {}, qrMPCargando)}
                  </div>
                  {linkChico(mostrarManual ? 'Ocultar otros medios' : 'Transferencia o posnet sin Mercado Pago', () => setMostrarManual(!mostrarManual), C.muted)}
                  {mostrarManual && <div style={{ display: 'flex', gap: 8 }}>
                    {botonPago('🏦 Transferencia', () => cobrarManual('transferencia', '🏦 Transferencia'))}
                    {botonPago('Débito a mano', () => cobrarManual('debito', '💳 Débito'))}
                    {botonPago('Crédito a mano', () => cobrarManual('credito', '💳 Crédito'))}
                  </div>}
                </>) : (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {botonPago('💳 Débito', () => cobrarManual('debito', '💳 Débito'))}
                    {botonPago('💳 Crédito', () => cobrarManual('credito', '💳 Crédito'))}
                    {botonPago('🏦 Transf.', () => cobrarManual('transferencia', '🏦 Transferencia'))}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 16, marginTop: 8, paddingTop: 6, borderTop: `1px solid ${C.cardBorder}` }}>
                  {linkChico('Descuento', () => setPanel('descuento'))}
                  {linkChico('Pagar con dos medios', () => setPanel('mixto'))}
                  {linkChico('Dejar en espera', dejarEnEspera, C.amber)}
                </div>
              </>)}
            </div>
            {turno?.total_egresos > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13, color: C.muted, padding: '0 4px' }}>
                <span>Plata sacada de la caja en este turno</span>
                <span style={{ fontWeight: 800, color: C.amber }}>{fmt(turno?.total_egresos || 0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menú del turno: todo lo que no es cobrar */}
        {menuTurno && (
          <div onClick={() => setMenuTurno(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.55)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', width: '100%', maxWidth: 520, borderRadius: '18px 18px 0 0', padding: '18px 20px 22px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>Menú del turno</div>
              {opcionMenu('Anular o devolver una venta', 'Elegí la venta y devolvé la plata. Los productos vuelven al stock.', () => setAnularModal(true), C.red)}
              {opcionMenu('Cambiar precios', 'Corregí el precio de un producto pasándolo por el lector.', () => setPrecioModal(true))}
              {opcionMenu('Contar la caja ahora', 'Declará cuánta plata hay en la caja a mitad de turno.', () => { setConteoMonto(""); setError(""); setPaso("conteo"); })}
              {opcionMenu('Impresora de tickets', 'Ancho del papel e imprimir solo después de cada venta.', () => setConfImpresora(true))}
              {opcionMenu('Cerrar turno', 'Contás la plata y entregás la caja.', () => { setCierreMonto(""); setError(""); setPaso("cierre"); }, C.red)}
              <button onClick={() => setMenuTurno(false)} style={{ width: '100%', marginTop: 10, padding: 14, borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: '#FFFFFF', color: C.text, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Volver a la caja</button>
            </div>
          </div>
        )}

        {/* Ventanas (cobro con Mercado Pago, paneles, modales) */}
        {qrMP && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.82)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#5B6472', fontWeight: 600 }}>Que el cliente escanee con Mercado Pago</div>
              <div style={{ fontWeight: 800, fontSize: 30, color: '#0A1628', margin: '6px 0 14px' }}>{fmt(qrMP.monto)}</div>
              <QRCodeSVG value={qrMP.qr} size={240} />
              <div style={{ fontSize: 13, color: '#5B6472', marginTop: 14 }}>Esperando el pago… la venta se cierra sola cuando Mercado Pago la confirma.</div>
              <button onClick={cancelarQR} style={{ marginTop: 16, width: '100%', padding: '12px 8px', borderRadius: 12, border: '2px solid #D5DAE1', background: 'transparent', color: '#0A1628', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}
        {puntoMP && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.82)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#5B6472', fontWeight: 600 }}>Cobro enviado al posnet · {puntoMP.tipo === 'debito' ? 'Débito' : 'Crédito'}</div>
              <div style={{ fontWeight: 800, fontSize: 34, color: '#0A1628', margin: '8px 0 12px' }}>{fmt(puntoMP.monto)}</div>
              <div style={{ fontSize: 15, color: '#0A1628', fontWeight: 700 }}>{puntoMP.cancelando ? 'Cancelá también el cobro en el posnet (botón rojo).' : 'Pedile al cliente que pague en el posnet.'}</div>
              <div style={{ fontSize: 13, color: '#5B6472', marginTop: 10 }}>Si el posnet no muestra el monto, tocá Actualizar en el posnet. La venta se cierra sola cuando Mercado Pago confirma el pago.</div>
              <button onClick={cancelarPoint} style={{ marginTop: 16, width: '100%', padding: '12px 8px', borderRadius: 12, border: '2px solid #D5DAE1', background: 'transparent', color: '#0A1628', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{puntoMP.cancelando ? 'Esperando que cancelen en el posnet…' : 'Cancelar cobro'}</button>
            </div>
          </div>
        )}
        {elegirTerm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.82)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#0A1628', marginBottom: 6 }}>¿Qué posnet usa esta caja?</div>
              <div style={{ fontSize: 13, color: '#5B6472', marginBottom: 14 }}>Se elige una sola vez y queda guardado para este local.</div>
              {elegirTerm.lista.map((t) => (
                <button key={t.id} onClick={async () => { const ok = await elegirTerminal(t.id); if (ok) { const tp = elegirTerm.tipo; setElegirTerm(null); cobrarConPoint(tp, t.id); } }} style={estiloBtn(C.primary, { width: '100%', marginBottom: 8 })}>{t.nombre}</button>
              ))}
              <button onClick={() => setElegirTerm(null)} style={{ width: '100%', padding: '10px 8px', background: 'transparent', border: 'none', color: '#5B6472', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}
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
        {panel === 'efectivo' && carrito && <PanelEfectivo total={carrito.total} onClose={() => setPanel(null)} onCobrar={() => { setPanel(null); cobrarManual('efectivo', '💵 Efectivo'); }} />}
        {panel === 'mixto' && carrito && <PanelMixto total={carrito.total} fetchT={fetchT} API={API} onClose={() => setPanel(null)}
          onListo={(msg, id) => { setPanel(null); ventaHecha(id || null); setVentaOk(msg); setTimeout(() => setVentaOk(''), 20000); setCarrito({ items: [], total: 0 }); document.getElementById('scan-input')?.focus(); }} />}
        {panel === 'varios' && <PanelVarios fetchT={fetchT} API={API} onClose={() => setPanel(null)} onListo={() => { setPanel(null); refrescarCarrito(); document.getElementById('scan-input')?.focus(); }} />}
        {panel === 'descuento' && carrito && <PanelDescuento total={carrito.items.filter((i: any) => i.tipo_linea !== 'descuento').reduce((s: number, i: any) => s + Number(i.cantidad) * Number(i.precio_unitario), 0)} fetchT={fetchT} API={API} aut={aut}
          onClose={() => setPanel(null)} onListo={() => { setPanel(null); refrescarCarrito(); }} />}
        {anularModal && <AnularVenta fetchT={fetchT} API={API} aut={aut} onClose={() => { setAnularModal(false); setTimeout(() => document.getElementById('scan-input')?.focus(), 100); }} />}
        {confImpresora && <ConfigImpresora onClose={() => { setConfImpresora(false); setTimeout(() => document.getElementById('scan-input')?.focus(), 100); }} />}
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
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.5 }}>Contá los billetes que hay en la caja y escribí el total. Contá bien: con esto se ve si la caja cerró bien.</p>
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
