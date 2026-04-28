"use client";
import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const T = {
  bg: "#070B12", bgCard: "#111827", bgSecondary: "#0D1520",
  border: "#1C2E42", accent: "#00D4FF", green: "#00E5A0",
  red: "#FF4560", yellow: "#FFB800",
  text: "#EDF2FF", textSec: "#7090AA", textMuted: "#3A5270",
};

type Paso = "codigo" | "sucursal" | "empleado" | "pin" | "apertura" | "activo" | "egreso" | "conteo" | "cierre" | "resumen";
type Sucursal = { id: number; nombre: string; direccion: string | null };

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function duracionLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
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

  // ─── Renders ────────────────────────────────────────────────────────────────

  const renderError = () => error ? (
    <div style={{ background: "rgba(255,69,96,0.1)", border: "1px solid rgba(255,69,96,0.3)", borderRadius: 10, padding: "10px 14px", color: T.red, fontSize: 13, marginBottom: 16 }}>
      {error}
    </div>
  ) : null;

  const Btn = ({ label, onPress, color = T.accent, disabled = false }: { label: string; onPress: () => void; color?: string; disabled?: boolean }) => (
    <button
      onClick={onPress}
      disabled={disabled || loading}
      style={{ width: "100%", padding: "16px", borderRadius: 14, background: disabled || loading ? "#1C2E42" : color === T.red ? "rgba(255,69,96,0.15)" : "rgba(0,212,255,0.12)", color: disabled || loading ? T.textMuted : color, fontSize: 15, fontWeight: 700, cursor: disabled || loading ? "default" : "pointer", marginBottom: 10, border: `1px solid ${disabled || loading ? "#1C2E42" : color + "40"}` }}
    >
      {loading ? "..." : label}
    </button>
  );

  const InputNum = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 18, fontWeight: 600, fontFamily: "monospace", marginBottom: 12, boxSizing: "border-box" as any }}
    />
  );

  const Header = ({ titulo, sub }: { titulo: string; sub?: string }) => (
    <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>LUMO — Control de caja</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{titulo}</div>
      {sub && <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  // ─── PASO: código de negocio ─────────────────────────────────────────────
  if (paso === "codigo") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo="Identificá tu negocio" />
      <div style={{ padding: "24px" }}>
        {renderError()}
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16 }}>
          Ingresá el código que te dio el dueño del negocio.
        </div>
        <InputNum value={negocioId} onChange={v => { setNegocioId(v); setError(""); }} placeholder="Código de negocio" />
        <Btn label="Continuar" onPress={() => cargarSucursales(negocioId)} />
      </div>
    </main>
  );

  // ─── PASO: selección de sucursal ────────────────────────────────────────
  if (paso === "sucursal") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo="¿En qué local trabajás hoy?" />
      <div style={{ padding: "24px" }}>
        {renderError()}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sucursales.map(s => (
            <button
              key={s.id}
              onClick={async () => { setSucursalSel(s); setError(""); await cargarEmpleados(negocioId, s.id); }}
              style={{ padding: "18px 20px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 16, fontWeight: 600, textAlign: "left", cursor: "pointer" }}
            >
              <div>{s.nombre}</div>
              {s.direccion && <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{s.direccion}</div>}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setNegocioId(""); localStorage.removeItem("lumo_negocio_id"); setPaso("codigo"); }}
          style={{ marginTop: 24, background: "none", border: "none", color: T.textMuted, fontSize: 12, cursor: "pointer", width: "100%", textAlign: "center" }}
        >
          Cambiar negocio
        </button>
      </div>
    </main>
  );

  // ─── PASO: selección de empleado ─────────────────────────────────────────
  if (paso === "empleado") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo="¿Quién sos?" />
      <div style={{ padding: "24px" }}>
        {renderError()}
        {sucursalSel && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: `${T.accent}0D`, borderRadius: 8, fontSize: 12, color: T.accent }}>
            Local: {sucursalSel.nombre}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {empleados.map(e => (
            <button
              key={e.id}
              onClick={() => { setEmpleadoSel(e.nombre); setError(""); setPaso("pin"); }}
              style={{ padding: "18px 20px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 16, fontWeight: 600, textAlign: "left", cursor: "pointer" }}
            >
              {e.nombre}
            </button>
          ))}
        </div>
        {sucursales.length > 1 && (
          <button
            onClick={() => { setSucursalSel(null); setPaso("sucursal"); }}
            style={{ marginTop: 12, background: "none", border: "none", color: T.textMuted, fontSize: 12, cursor: "pointer", width: "100%", textAlign: "center" }}
          >
            Cambiar local
          </button>
        )}
        <button
          onClick={() => { setNegocioId(""); localStorage.removeItem("lumo_negocio_id"); setPaso("codigo"); }}
          style={{ marginTop: 8, background: "none", border: "none", color: T.textMuted, fontSize: 12, cursor: "pointer", width: "100%", textAlign: "center" }}
        >
          Cambiar negocio
        </button>
      </div>
    </main>
  );

  // ─── PASO: PIN ───────────────────────────────────────────────────────────
  if (paso === "pin") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo={`Hola, ${empleadoSel}`} sub="Ingresá tu PIN de 4 dígitos" />
      <div style={{ padding: "24px" }}>
        {renderError()}
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
          placeholder="• • • •"
          style={{ width: "100%", padding: "18px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 28, textAlign: "center", letterSpacing: 12, marginBottom: 16, boxSizing: "border-box" as any }}
        />
        <Btn label="Confirmar" onPress={handleValidarPin} />
        <Btn label="← Volver" onPress={() => { setPaso("empleado"); setPin(""); setError(""); }} color={T.textSec} />
      </div>
    </main>
  );

  // ─── PASO: apertura de turno ─────────────────────────────────────────────
  if (paso === "apertura") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo="Apertura de turno" sub={`${empleadoSel} — Contá el efectivo en caja`} />
      <div style={{ padding: "24px" }}>
        {renderError()}
        <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16 }}>
          ¿Cuánto efectivo hay en la caja ahora?
        </div>
        <InputNum value={aperturaEfectivo} onChange={v => { setAperturaEfectivo(v); setError(""); }} placeholder="Ej: 15000" />
        <Btn label="Abrir turno" onPress={handleApertura} color={T.green} />
        <Btn label="← Volver" onPress={() => { setPaso("pin"); setError(""); }} color={T.textSec} />
      </div>
    </main>
  );

  // ─── PASO: turno activo ──────────────────────────────────────────────────
  if (paso === "activo") {
    const durMin = turno ? (Math.floor((Date.now() - new Date(turno.hora_apertura).getTime()) / 60000)) : 0;
    const colorTurno = turno?.tipo_turno === "manana" ? T.green : turno?.tipo_turno === "tarde" ? T.yellow : T.accent;

    return (
      <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif", paddingBottom: 32 }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 4 }}>LUMO — turno activo</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{turno?.nombre_empleado}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: colorTurno, fontWeight: 700 }}>{turno?.tipo_turno?.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{duracionLabel(durMin)}</div>
          </div>
        </div>

        {/* Conteo pendiente — alerta urgente */}
        {conteoPend && (
          <div style={{ margin: "16px 20px 0", background: "rgba(255,184,0,0.08)", border: `2px solid ${T.yellow}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.yellow, textTransform: "uppercase", marginBottom: 8 }}>⚑ CONTEO ALEATORIO</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Contá la caja ahora</div>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 14 }}>
              Tenés <span style={{ color: T.yellow, fontWeight: 700 }}>{conteoPend.minutos_restantes} min</span> para responder.
            </div>
            <button
              onClick={() => setPaso("conteo")}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${T.yellow}`, background: "rgba(255,184,0,0.15)", color: T.yellow, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              Registrar conteo
            </button>
          </div>
        )}

        {/* Info del turno */}
        <div style={{ margin: "16px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Caja apertura", valor: fmt(turno?.caja_apertura || 0), color: T.text },
            { label: "Egresos registrados", valor: fmt(turno?.total_egresos || 0), color: turno?.total_egresos > 0 ? T.yellow : T.textSec },
          ].map(k => (
            <div key={k.label} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 12px" }}>
              <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: k.color }}>{k.valor}</div>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ padding: "20px 20px 0" }}>
          <Btn label="Registrar egreso" onPress={() => { setEgresoMonto(""); setEgresoMotivo(""); setError(""); setPaso("egreso"); }} color={T.yellow} />
          <Btn label="Cerrar turno" onPress={() => { setCierreMonto(""); setError(""); setPaso("cierre"); }} color={T.red} />
        </div>
      </main>
    );
  }

  // ─── PASO: egreso ────────────────────────────────────────────────────────
  if (paso === "egreso") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo="Registrar egreso" sub="Un gasto o retiro de efectivo del turno" />
      <div style={{ padding: "24px" }}>
        {renderError()}
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>Monto</div>
        <InputNum value={egresoMonto} onChange={v => { setEgresoMonto(v); setError(""); }} placeholder="Ej: 3500" />
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>Motivo</div>
        <input
          type="text"
          value={egresoMotivo}
          onChange={e => { setEgresoMotivo(e.target.value); setError(""); }}
          placeholder="Ej: Compra de insumos, cambio de billete..."
          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 14, marginBottom: 16, boxSizing: "border-box" as any }}
        />
        {/* Atajos de motivo */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {["Insumos", "Cambio", "Proveedor", "Propina", "Otro"].map(m => (
            <button
              key={m}
              onClick={() => setEgresoMotivo(m)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${T.border}`, background: egresoMotivo === m ? "rgba(0,212,255,0.15)" : T.bgCard, color: egresoMotivo === m ? T.accent : T.textSec, fontSize: 12, cursor: "pointer" }}
            >
              {m}
            </button>
          ))}
        </div>
        <Btn label="Confirmar egreso" onPress={handleEgreso} color={T.yellow} />
        <Btn label="← Cancelar" onPress={() => { setPaso("activo"); setError(""); }} color={T.textSec} />
      </div>
    </main>
  );

  // ─── PASO: conteo aleatorio ──────────────────────────────────────────────
  if (paso === "conteo") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo="Conteo de caja" sub={conteoPend ? `Quedan ${conteoPend.minutos_restantes} minutos` : "Conteo aleatorio"} />
      <div style={{ padding: "24px" }}>
        {renderError()}
        <div style={{ background: "rgba(255,184,0,0.06)", border: `1px solid rgba(255,184,0,0.2)`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
            Contá el efectivo físico en la caja sin mover nada. No cuentes lo que está separado.
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>Total efectivo contado</div>
        <InputNum value={conteoMonto} onChange={v => { setConteoMonto(v); setError(""); }} placeholder="Ej: 18500" />
        <Btn label="Confirmar conteo" onPress={handleConteo} color={T.accent} />
        <Btn label="← Volver al turno" onPress={() => { setPaso("activo"); setError(""); }} color={T.textSec} />
      </div>
    </main>
  );

  // ─── PASO: cierre de turno ───────────────────────────────────────────────
  if (paso === "cierre") return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Header titulo="Cierre de turno" sub={`${turno?.nombre_empleado} — Contá el efectivo final`} />
      <div style={{ padding: "24px" }}>
        {renderError()}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>Resumen del turno</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: T.textSec }}>Caja apertura</span>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: T.text }}>{fmt(turno?.caja_apertura || 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.textSec }}>Egresos registrados</span>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: T.yellow }}>{fmt(turno?.total_egresos || 0)}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>¿Cuánto efectivo hay en la caja ahora?</div>
        <InputNum value={cierreMonto} onChange={v => { setCierreMonto(v); setError(""); }} placeholder="Ej: 24000" />
        <Btn label="Cerrar turno" onPress={handleCierre} color={T.red} />
        <Btn label="← Volver al turno" onPress={() => { setPaso("activo"); setError(""); }} color={T.textSec} />
      </div>
    </main>
  );

  // ─── PASO: resumen de cierre ─────────────────────────────────────────────
  if (paso === "resumen" && resumen) {
    const colorEstado = resumen.estado === "ok" ? T.green : resumen.estado === "atencion" ? T.yellow : T.red;
    return (
      <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 8 }}>LUMO — Cierre registrado</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: colorEstado }}>{resumen.mensaje}</div>
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px", marginBottom: 16 }}>
            {[
              { label: "Ventas totales", valor: fmt(resumen.total_ventas), color: T.text },
              { label: "Ventas MP / digital", valor: fmt(resumen.total_mp), color: T.accent },
              { label: "Egresos", valor: fmt(resumen.total_egresos), color: T.yellow },
              { label: "Efectivo esperado", valor: fmt(resumen.efectivo_esperado), color: T.text },
              { label: "Efectivo declarado", valor: fmt(resumen.caja_cierre), color: T.text },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: 13, color: T.textSec }}>{r.label}</span>
                <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: r.color }}>{r.valor}</span>
              </div>
            ))}
          </div>

          <div style={{ background: `rgba(${resumen.estado === "ok" ? "0,229,160" : resumen.estado === "atencion" ? "255,184,0" : "255,69,96"},0.08)`, border: `1px solid ${colorEstado}40`, borderRadius: 12, padding: "14px 16px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: colorEstado }}>
              {resumen.brecha === 0 ? "±$0" : (resumen.brecha > 0 ? "-" : "+") + fmt(Math.abs(resumen.brecha))}
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Brecha de caja ({resumen.brecha_porcentaje}%)</div>
          </div>

          <Btn label="Nuevo turno" onPress={resetear} color={T.accent} />
        </div>
      </main>
    );
  }

  return null;
}
