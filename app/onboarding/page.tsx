"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UploadHistorialCard from "../components/UploadHistorialCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

const TIPOS = [
  { value: "kiosko",      label: "Kiosko",      icon: "🏪" },
  { value: "almacen",     label: "Almacén",     icon: "🛒" },
  { value: "cafeteria",   label: "Cafetería",   icon: "☕" },
  { value: "restaurante", label: "Restaurante", icon: "🍽️" },
  { value: "parrilla",    label: "Parrilla",    icon: "🔥" },
  { value: "panaderia",   label: "Panadería",   icon: "🥐" },
  { value: "farmacia",    label: "Farmacia",    icon: "💊" },
  { value: "retail",      label: "Retail",      icon: "👔" },
];

const PROXIMOS_PASOS = [
  { color: "var(--cyan)",    titulo: "Conectá Mercado Pago", desc: "Importá hasta 18 meses de historial de cobros. Desde Configuración." },
  { color: "var(--emerald)", titulo: "Abrí el primer turno",  desc: "Entrá a Caja → el empleado registra el efectivo con su PIN." },
  { color: "var(--yellow)",  titulo: "Revisá el dashboard",   desc: "En 30 días Lumo ya tiene suficientes datos para predicciones." },
];

type Step = "tipo" | "ubicacion" | "empleado" | "historial" | "listo";
const STEPS: Step[] = ["tipo", "ubicacion", "empleado", "historial", "listo"];

function inp(): React.CSSProperties {
  return {
    width: "100%", padding: "13px 16px",
    background: "var(--card2)", border: "1px solid var(--border)",
    borderRadius: 12, color: "var(--text)", fontSize: 14,
    fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box",
  };
}

function BtnPrimary({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "14px",
        background: disabled ? "var(--card2)" : "linear-gradient(135deg,#007AFF,#00C2FF)",
        border: disabled ? "1px solid var(--border)" : "none",
        borderRadius: 12, color: disabled ? "var(--muted)" : "#fff",
        fontSize: 14, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans',sans-serif",
        boxShadow: disabled ? "none" : "0 4px 16px #007AFF20",
        marginBottom: 10,
      }}>
      {children}
    </button>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tipo");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [tipo, setTipo] = useState("");
  const [ubicacion, setUbicacion] = useState({ provincia: "", ciudad: "", zona: "" });
  const [emp, setEmp] = useState({ nombre: "", pin: "", pin2: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
    const u = localStorage.getItem("lumo_usuario");
    if (u) {
      const parsed = JSON.parse(u);
      setUserId(parsed.id ?? null);
      if (parsed.onboarding_done) router.replace("/");
    }
  }, []);

  const stepIndex = STEPS.indexOf(step);

  async function guardarTipo() {
    if (!tipo) return;
    setLoading(true); setError("");
    try {
      const resp = await fetch(`${API}/api/perfil`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo_negocio: tipo }),
      });
      if (!resp.ok) throw new Error("Error al guardar el tipo de negocio");
      setStep("ubicacion");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  }

  async function guardarUbicacion() {
    setLoading(true); setError("");
    try {
      await fetch(`${API}/api/perfil`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          provincia: ubicacion.provincia || undefined,
          ciudad: ubicacion.ciudad || undefined,
          zona: ubicacion.zona || undefined,
        }),
      });
    } catch { /* no bloqueamos si falla */ } finally { setLoading(false); }
    setStep("empleado");
  }

  async function crearEmpleado() {
    setError("");
    if (!emp.nombre.trim()) { setError("Ingresá el nombre del empleado"); return; }
    if (emp.pin.length < 4 || isNaN(Number(emp.pin))) { setError("El PIN debe ser de 4 dígitos numéricos"); return; }
    if (emp.pin !== emp.pin2) { setError("Los PINs no coinciden"); return; }
    if (!userId) { setStep("historial"); return; }
    setLoading(true);
    try {
      await fetch(`${API}/api/caja/empleados`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ usuario_id: userId, nombre: emp.nombre.trim(), pin: emp.pin }),
      });
    } catch { /* pueden agregar desde Equipo */ } finally { setLoading(false); }
    setStep("historial");
  }

  function saltar() {
    if (step === "tipo") setStep("ubicacion");
    else if (step === "ubicacion") setStep("empleado");
    else if (step === "empleado") setStep("historial");
    else setStep("listo");
  }

  async function terminar() {
    if (token) {
      fetch(`${API}/api/perfil`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ onboarding_done: true }),
      }).catch(() => {});
    }
    const u = localStorage.getItem("lumo_usuario");
    if (u) localStorage.setItem("lumo_usuario", JSON.stringify({ ...JSON.parse(u), onboarding_done: true }));
    router.replace("/");
  }

  const skipBtn: React.CSSProperties = {
    width: "100%", padding: "12px", background: "transparent", border: "none",
    color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", paddingBottom: 48 }}>

      {/* Barra de progreso */}
      <div style={{ padding: "20px 24px 0", display: "flex", gap: 6 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: stepIndex >= i ? "var(--cyan)" : "var(--border)", transition: "background 0.3s" }} />
        ))}
      </div>

      <div style={{ padding: "40px 24px 0", maxWidth: 420, margin: "0 auto" }}>

        {/* PASO 1: Tipo de negocio */}
        {step === "tipo" && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// paso 1 de 3</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 10, lineHeight: 1.2 }}>
              ¿Qué tipo de negocio tenés?
            </h1>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.65 }}>
              Lumo usa esto para compararte con negocios similares y calibrar los umbrales de detección.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {TIPOS.map(t => (
                <button key={t.value} onClick={() => { setTipo(t.value); setError(""); }}
                  style={{ padding: "16px 12px", background: tipo === t.value ? "#007AFF10" : "var(--card)", border: `1px solid ${tipo === t.value ? "#007AFF40" : "var(--border)"}`, borderRadius: 14, cursor: "pointer", textAlign: "center", transition: "all 0.15s", boxShadow: "var(--sh)" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tipo === t.value ? "var(--cyan)" : "var(--text)" }}>{t.label}</div>
                </button>
              ))}
            </div>

            {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <BtnPrimary onClick={guardarTipo} disabled={!tipo || loading}>{loading ? "Guardando..." : "Continuar"}</BtnPrimary>
            <button onClick={saltar} style={skipBtn}>Saltar por ahora</button>
          </>
        )}

        {/* PASO 2: Ubicación */}
        {step === "ubicacion" && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// paso 2 de 3</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 10, lineHeight: 1.2 }}>
              ¿Dónde está tu negocio?
            </h1>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.65 }}>
              Lumo usa la ubicación para contextualizar los benchmarks del sector con negocios similares de tu zona.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <input placeholder="Provincia (ej: Buenos Aires)" value={ubicacion.provincia}
                onChange={e => setUbicacion(v => ({ ...v, provincia: e.target.value }))}
                style={inp()} autoComplete="off" />
              <input placeholder="Ciudad (ej: Mar del Plata)" value={ubicacion.ciudad}
                onChange={e => setUbicacion(v => ({ ...v, ciudad: e.target.value }))}
                style={inp()} autoComplete="off" />
              <input placeholder="Zona o barrio (opcional)" value={ubicacion.zona}
                onChange={e => setUbicacion(v => ({ ...v, zona: e.target.value }))}
                style={inp()} autoComplete="off" />
            </div>

            {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <BtnPrimary onClick={guardarUbicacion} disabled={loading}>{loading ? "Guardando..." : "Continuar"}</BtnPrimary>
            <button onClick={saltar} style={skipBtn}>Saltar por ahora</button>
          </>
        )}

        {/* PASO 3: Primer empleado */}
        {step === "empleado" && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// paso 3 de 3</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 10, lineHeight: 1.2 }}>
              Registrá tu primer empleado
            </h1>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.65 }}>
              El empleado usa su nombre y PIN para abrir y cerrar el turno. Podés agregar más desde la pantalla Equipo.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <input placeholder="Nombre del empleado" value={emp.nombre}
                onChange={e => { setEmp(v => ({ ...v, nombre: e.target.value })); setError(""); }}
                style={inp()} autoComplete="off" />
              <input type="tel" inputMode="numeric" placeholder="PIN — 4 dígitos" value={emp.pin}
                onChange={e => { setEmp(v => ({ ...v, pin: e.target.value.slice(0, 4) })); setError(""); }}
                style={inp()} autoComplete="off" maxLength={4} />
              <input type="tel" inputMode="numeric" placeholder="Repetir PIN" value={emp.pin2}
                onChange={e => { setEmp(v => ({ ...v, pin2: e.target.value.slice(0, 4) })); setError(""); }}
                style={inp()} autoComplete="off" maxLength={4} />
            </div>

            {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <BtnPrimary onClick={crearEmpleado} disabled={loading}>{loading ? "Guardando..." : "Registrar empleado"}</BtnPrimary>
            <button onClick={saltar} style={skipBtn}>Saltar — lo hago después</button>
          </>
        )}

        {/* PASO 4: Cargar historial */}
        {step === "historial" && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// paso 4 de 4</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 10, lineHeight: 1.2 }}>
              Cargá tu historial
            </h1>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.65 }}>
              Importá tus últimas transacciones para que NICOLE aprenda rápidamente cómo funciona tu negocio.
            </p>

            <UploadHistorialCard
              onMPConnect={() => setStep("listo")}
              onUploadSuccess={() => setStep("listo")}
              onSkip={() => setStep("listo")}
            />
          </>
        )}

        {/* LISTO */}
        {step === "listo" && (
          <div style={{ paddingTop: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid var(--emerald)", background: "rgba(16,185,129,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <polyline points="20 6 9 17 4 12" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// configuración completa</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 12, lineHeight: 1.2 }}>
              Lumo está listo.
            </h1>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.75, marginBottom: 32 }}>
              Tu negocio está configurado. Estos son los primeros pasos para que el motor empiece a aprender.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {PROXIMOS_PASOS.map((p, i) => (
                <div key={i} style={{ background: "var(--card)", borderLeft: `3px solid ${p.color}`, border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", boxShadow: "var(--sh)" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: p.color, flexShrink: 0, paddingTop: 2 }}>0{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{p.titulo}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <BtnPrimary onClick={terminar}>Ir al dashboard →</BtnPrimary>
          </div>
        )}

      </div>
    </main>
  );
}
