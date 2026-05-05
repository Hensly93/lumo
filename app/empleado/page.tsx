"use client";
import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
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
      const r = await fetch(`${API}/api/caja/conteo-pendiente/${turno.id}`);
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
        const r = await fetch(`${API}/api/caja/turno/${turno.id}`);
        const d = await r.json();
        if (!d.error) setTurno(d);
      } catch { /* silencioso */ }
    }, 60000);
    return () => clearInterval(id);
  }, [paso, turno?.id]);

  // Cargar negocio_id desde localStorage al inicio
  useEffect(() => {
    const saved = localStorage.getItem("lumo_negocio_id");
    if (saved) {
      setNegocioId(saved);
      cargarSucursales(saved);
    }
  }, []);

  async function cargarSucursales(nid: string) {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/multilocal/sucursales-publicas/${nid}`);
      const d = await r.json();
      if (!Array.isArray(d)) { setError("Código de negocio incorrecto"); return; }
      localStorage.setItem("lumo_negocio_id", nid);
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
      const r = await fetch(`${API}/api/caja/validar-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: negocioId, nombre_empleado: empleadoSel, pin }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      if (d.turno_activo) {
        setTurno(d.turno_activo);
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
      const r = await fetch(`${API}/api/caja/apertura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: negocioId,
          nombre_empleado: empleadoSel,
          pin,
          caja_apertura: parseFloat(aperturaEfectivo),
          sucursal_id: sucursalSel?.id ?? null,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      setTurno({ ...d.turno, duracion_minutos: 0, total_egresos: 0 });
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
      const r = await fetch(`${API}/api/caja/egreso`, {
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
      const r = await fetch(`${API}/api/caja/conteo`, {
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
      const r = await fetch(`${API}/api/caja/cierre`, {
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
    setTurno(null);
    setConteoPend(null);
    setAperturaEfectivo("");
    setCierreMonto("");
    setError("");
    setResumen(null);
  }

  // ─── UI Components ──────────────────────────────────────────────────────────

  const Avatar = ({ name, size = 80 }: { name: string; size?: number }) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${C.primary} 0%, #00C2FF 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Syne, sans-serif',
      fontWeight: 800,
      fontSize: size / 2.5,
      color: '#FFFFFF',
      textTransform: 'uppercase',
    }}>
      {getInitials(name)}
    </div>
  );

  const ErrorBox = () => error ? (
    <div style={{
      background: 'rgba(255,59,48,0.08)',
      border: `1px solid rgba(255,59,48,0.2)`,
      borderRadius: 14,
      padding: '12px 16px',
      color: C.red,
      fontSize: 14,
      marginBottom: 20,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {error}
    </div>
  ) : null;

  const PrimaryButton = ({ label, onPress, color = C.primary, disabled = false, icon }: { label: string; onPress: () => void; color?: string; disabled?: boolean; icon?: string }) => (
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
        fontFamily: 'Syne, sans-serif',
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
        fontFamily: 'Syne, sans-serif',
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
        fontFamily: 'DM Sans, sans-serif',
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
        fontFamily: 'Syne, sans-serif',
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
          fontFamily: 'Syne, sans-serif',
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
        fontFamily: 'Syne, sans-serif',
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

  // ─── SCREEN 1: codigo ───────────────────────────────────────────────────────
  if (paso === "codigo") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 14, letterSpacing: 3, color: C.muted, marginBottom: 12, fontWeight: 600 }}>LUMO</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 40, color: C.text, margin: '0 0 12px 0' }}>Modo empleado</h1>
          <p style={{ fontSize: 16, color: C.muted, margin: 0 }}>Ingresá el código de tu negocio</p>
        </div>
        <ErrorBox />
        <input
          type="number"
          inputMode="numeric"
          value={negocioId}
          onChange={e => { setNegocioId(e.target.value); setError(""); }}
          placeholder="Código de negocio"
          style={{
            width: '100%',
            padding: '20px 24px',
            borderRadius: 20,
            border: `2px solid ${C.cardBorder}`,
            background: C.bg,
            color: C.text,
            fontSize: 18,
            fontFamily: 'DM Sans, sans-serif',
            boxSizing: 'border-box' as any,
            marginBottom: 24,
            outline: 'none',
          }}
        />
        <PrimaryButton label="Continuar →" onPress={() => cargarSucursales(negocioId)} />
      </div>
    </main>
  );

  // ─── SCREEN 2: sucursal ─────────────────────────────────────────────────────
  if (paso === "sucursal") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ padding: '32px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>¿En qué local trabajás hoy?</h1>
      </div>
      <div style={{ padding: 24 }}>
        <ErrorBox />
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
                fontFamily: 'DM Sans, sans-serif',
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
          <TextButton label="Cambiar negocio" onPress={() => { setNegocioId(""); localStorage.removeItem("lumo_negocio_id"); setPaso("codigo"); }} />
        </div>
      </div>
    </main>
  );

  // ─── SCREEN 3: empleado ─────────────────────────────────────────────────────
  if (paso === "empleado") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ padding: '32px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>¿Quién sos?</h1>
      </div>
      <div style={{ padding: 24 }}>
        <ErrorBox />
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
                fontFamily: 'DM Sans, sans-serif',
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
          <TextButton label="Cambiar negocio" onPress={() => { setNegocioId(""); localStorage.removeItem("lumo_negocio_id"); setPaso("codigo"); }} />
        </div>
      </div>
    </main>
  );

  // ─── SCREEN 4: pin ──────────────────────────────────────────────────────────
  if (paso === "pin") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <Avatar name={empleadoSel} size={100} />
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: C.text, margin: '24px 0 8px 0' }}>{empleadoSel}</h1>
        <p style={{ fontSize: 16, color: C.muted, marginBottom: 40 }}>Ingresá tu PIN de 4 dígitos</p>
        <ErrorBox />

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
              fontFamily: 'DM Sans, sans-serif',
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
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <PrimaryButton label="Confirmar" onPress={handleValidarPin} disabled={pin.length !== 4} />
      </div>
    </main>
  );

  // ─── SCREEN 5: apertura ─────────────────────────────────────────────────────
  if (paso === "apertura") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: C.muted, margin: '0 0 12px 0' }}>Bienvenido/a, {empleadoSel}</h2>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>¿Cuánto efectivo hay en caja ahora?</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>Declaración de apertura de turno</p>
        </div>
        <ErrorBox />
        <CurrencyInput value={aperturaEfectivo} onChange={v => { setAperturaEfectivo(v); setError(""); }} placeholder="15000" />
        <PrimaryButton label="Abrir turno" onPress={handleApertura} color={C.green} />
        <SecondaryButton label="← Volver" onPress={() => { setPaso("pin"); setError(""); }} color={C.muted} />
      </div>
    </main>
  );

  // ─── SCREEN 6: activo ───────────────────────────────────────────────────────
  if (paso === "activo") {
    const durMin = turno ? (Math.floor((Date.now() - new Date(turno.hora_apertura).getTime()) / 60000)) : 0;

    return (
      <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', paddingBottom: 32 }}>
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
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{turno?.nombre_empleado}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Duración</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: 2 }}>{duracionLabel(durMin)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Caja inicial</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{fmt(turno?.caja_apertura || 0)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
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
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 8 }}>Contá la caja ahora</div>
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
                  fontFamily: 'Syne, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Registrar conteo
              </button>
            </div>
          )}

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
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{fmt(turno?.caja_apertura || 0)}</span>
            </div>
            {turno?.total_egresos > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: C.text }}>Egresos registrados</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: C.amber }}>{fmt(turno?.total_egresos || 0)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <PrimaryButton label="💰 Declaración mid-turno" onPress={() => { setConteoMonto(""); setError(""); setPaso("conteo"); }} color={C.yellow} icon="" />
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
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{
        background: `rgba(255,149,0,0.1)`,
        borderBottom: `3px solid ${C.amber}`,
        padding: '32px 24px',
      }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: C.amber, fontWeight: 700, marginBottom: 8 }}>⚠️ CONTEO SOLICITADO</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: 0 }}>
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
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: C.text, marginBottom: 24 }}>¿Cuánto efectivo hay en caja ahora?</h2>
          <ErrorBox />
          <CurrencyInput value={conteoMonto} onChange={v => { setConteoMonto(v); setError(""); }} placeholder="18500" />
          <PrimaryButton label="Confirmar conteo" onPress={handleConteo} color={C.primary} />
          <SecondaryButton label="← Volver al turno" onPress={() => { setPaso("activo"); setError(""); }} color={C.muted} />
        </div>
      </div>
    </main>
  );

  // ─── SCREEN 9: cierre ───────────────────────────────────────────────────────
  if (paso === "cierre") return (
    <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: C.text, margin: '0 0 12px 0' }}>Cerrando turno</h1>
          <p style={{ fontSize: 16, color: C.muted }}>¿Cuánto efectivo hay en caja al cerrar?</p>
        </div>
        <ErrorBox />
        <div style={{
          background: C.bg,
          border: `2px solid ${C.cardBorder}`,
          borderRadius: 20,
          padding: '20px 24px',
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 16 }}>EFECTIVO EN APERTURA</div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: C.text }}>{fmt(turno?.caja_apertura || 0)}</span>
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
            fontFamily: 'Syne, sans-serif',
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
    // Auto-redirect after 4 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        resetear();
      }, 4000);
      return () => clearTimeout(timer);
    }, []);

    const durMin = turno ? (Math.floor((Date.now() - new Date(turno.hora_apertura).getTime()) / 60000)) : 0;

    return (
      <main style={{ background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
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

          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color: C.text, margin: '0 0 40px 0' }}>Turno cerrado</h1>

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
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{fmt(resumen.caja_apertura || turno?.caja_apertura || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: C.muted }}>Efectivo en cierre</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{fmt(resumen.caja_cierre)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
              <span style={{ fontSize: 14, color: C.muted }}>Duración del turno</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: C.text }}>{duracionLabel(durMin)}</span>
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
