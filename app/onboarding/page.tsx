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
  const [baselineStatus, setBaselineStatus] = useState<string | null>(null);
  const [baselineListo, setBaselineListo] = useState(false);
  const [uploadData, setUploadData] = useState<any>(null);

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

  function handleUploadSuccess(data: any) {
    setUploadData(data);
    setBaselineStatus(data.baseline_status);
    setBaselineListo(data.baseline_listo ?? false);
    setStep("listo");
  }

  function handleMPClick() {
    setBaselineStatus("🔗 Conectando Mercado Pago...");
    setBaselineListo(true);
    setStep("listo");
  }

  function handleUploadSkip() {
    setBaselineStatus(null);
    setBaselineListo(false);
    setStep("listo");
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
      <div
        style={{ padding: "20px 24px 0", display: "flex", gap: 6 }}
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={`Paso ${stepIndex + 1} de ${STEPS.length}`}
      >
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: stepIndex >= i ? "var(--cyan)" : "var(--border)",
              transition: "background 0.3s",
            }}
            aria-hidden={stepIndex < i ? "true" : undefined}
          />
        ))}
      </div>

      <div style={{ padding: "40px 24px 0", maxWidth: 420, margin: "0 auto" }}>

        {/* PASO 1: Tipo de negocio */}
        {step === "tipo" && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// paso 1 de 4</div>
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
            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// paso 2 de 4</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 10, lineHeight: 1.2 }}>
              ¿Dónde está tu negocio?
            </h1>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.65 }}>
              Lumo usa la ubicación para contextualizar los benchmarks del sector con negocios similares de tu zona.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <input
                id="provincia"
                placeholder="Provincia (ej: Buenos Aires)"
                value={ubicacion.provincia}
                onChange={e => setUbicacion(v => ({ ...v, provincia: e.target.value }))}
                style={inp()}
                autoComplete="off"
                aria-label="Provincia del negocio"
              />
              <input
                id="ciudad"
                placeholder="Ciudad (ej: Mar del Plata)"
                value={ubicacion.ciudad}
                onChange={e => setUbicacion(v => ({ ...v, ciudad: e.target.value }))}
                style={inp()}
                autoComplete="off"
                aria-label="Ciudad del negocio"
              />
              <input
                id="zona"
                placeholder="Zona o barrio (opcional)"
                value={ubicacion.zona}
                onChange={e => setUbicacion(v => ({ ...v, zona: e.target.value }))}
                style={inp()}
                autoComplete="off"
                aria-label="Zona o barrio del negocio (opcional)"
              />
            </div>

            {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <BtnPrimary onClick={guardarUbicacion} disabled={loading}>{loading ? "Guardando..." : "Continuar"}</BtnPrimary>
            <button onClick={saltar} style={skipBtn}>Saltar por ahora</button>
          </>
        )}

        {/* PASO 3: Primer empleado */}
        {step === "empleado" && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// paso 3 de 4</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 10, lineHeight: 1.2 }}>
              Registrá tu primer empleado
            </h1>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 28, lineHeight: 1.65 }}>
              El empleado usa su nombre y PIN para abrir y cerrar el turno. Podés agregar más desde la pantalla Equipo.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <input
                id="empleado-nombre"
                placeholder="Nombre del empleado"
                value={emp.nombre}
                onChange={e => { setEmp(v => ({ ...v, nombre: e.target.value })); setError(""); }}
                style={inp()}
                autoComplete="off"
                aria-label="Nombre del empleado"
              />
              <input
                id="empleado-pin"
                type="tel"
                inputMode="numeric"
                placeholder="PIN — 4 dígitos"
                value={emp.pin}
                onChange={e => { setEmp(v => ({ ...v, pin: e.target.value.slice(0, 4) })); setError(""); }}
                style={inp()}
                autoComplete="off"
                maxLength={4}
                aria-label="PIN de 4 dígitos"
              />
              <input
                id="empleado-pin2"
                type="tel"
                inputMode="numeric"
                placeholder="Repetir PIN"
                value={emp.pin2}
                onChange={e => { setEmp(v => ({ ...v, pin2: e.target.value.slice(0, 4) })); setError(""); }}
                style={inp()}
                autoComplete="off"
                maxLength={4}
                aria-label="Repetir PIN de 4 dígitos"
              />
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
              onMPConnect={handleMPClick}
              onUploadSuccess={handleUploadSuccess}
              onSkip={handleUploadSkip}
            />
          </>
        )}

        {/* LISTO */}
        {step === "listo" && (
          <div style={{ paddingTop: 16 }}>
            {/* Checkmark animado */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: "2px solid var(--emerald)",
                background: "rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 28,
                animation: "scaleIn 0.5s ease-out",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <polyline
                  points="20 6 9 17 4 12"
                  stroke="var(--emerald)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 24,
                    strokeDashoffset: 24,
                    animation: "drawCheck 0.6s ease-out 0.2s forwards",
                  }}
                />
              </svg>
            </div>

            <style>{`
              @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
              @keyframes drawCheck {
                to { stroke-dashoffset: 0; }
              }
            `}</style>

            <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>
              // ✅ configuración completa
            </div>

            <h1
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 32,
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              Lumo está listo
            </h1>

            {/* Mensaje dinámico según baseline status */}
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                marginBottom: 20,
                border: "1px solid var(--border)",
                background: baselineListo
                  ? "rgba(16, 185, 129, 0.08)"
                  : baselineStatus
                    ? "rgba(245, 158, 11, 0.08)"
                    : "rgba(107, 114, 128, 0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: baselineListo
                    ? "var(--emerald)"
                    : baselineStatus
                      ? "#F59E0B"
                      : "var(--muted)",
                  marginBottom: 6,
                }}
              >
                {baselineListo
                  ? "✅ Baseline listo"
                  : baselineStatus && baselineStatus.includes("construcción")
                    ? "⚠️ Baseline en construcción"
                    : "📊 Usando benchmark sectorial"}
              </div>

              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                {baselineListo
                  ? "NICOLE ya está analizando tu negocio desde hoy. Las predicciones serán cada vez más precisas."
                  : baselineStatus && baselineStatus.includes("construcción")
                    ? `${baselineStatus.split("(")[1]?.replace(")", "")
                        ? `En ${baselineStatus.split("(")[1]?.replace(")", "")} tendrás análisis completo.`
                        : "En unos días tendrás análisis completo."
                      }`
                    : "En 30 días tendrás análisis personalizado basado en tus datos reales."}
              </div>
            </div>

            {/* Card de métricas si hay datos */}
            {uploadData && uploadData.transacciones_cargadas > 0 && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 20,
                  background: "var(--card3)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                  }}
                >
                  📊 Datos importados
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      padding: 10,
                      background: "rgba(59, 130, 246, 0.1)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>
                      Transacciones
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#3B82F6",
                        fontFamily: "'Syne',sans-serif",
                      }}
                    >
                      {uploadData.transacciones_cargadas}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      background: "rgba(139, 92, 246, 0.1)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>
                      Días
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#8B5CF6",
                        fontFamily: "'Syne',sans-serif",
                      }}
                    >
                      {uploadData.dias_datos}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      background: "rgba(0, 196, 140, 0.1)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>
                      Ratio efectivo
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#00C48C",
                        fontFamily: "'Syne',sans-serif",
                      }}
                    >
                      {Math.round(uploadData.ratio_efectivo * 100)}%
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      background: "rgba(52, 168, 219, 0.1)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>
                      Ticket promedio
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#34A8DB",
                        fontFamily: "'Syne',sans-serif",
                      }}
                    >
                      ${uploadData.ticket_promedio}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Próximos pasos */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                🎯 Próximos pasos
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PROXIMOS_PASOS.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--card)",
                      borderLeft: `3px solid ${p.color}`,
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      boxShadow: "var(--sh)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--sh)";
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: p.color,
                        flexShrink: 0,
                        paddingTop: 2,
                        minWidth: 24,
                      }}
                    >
                      0{i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text)",
                          marginBottom: 3,
                        }}
                      >
                        {p.titulo}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text2)",
                          lineHeight: 1.5,
                        }}
                      >
                        {p.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <BtnPrimary onClick={terminar}>Ir al dashboard →</BtnPrimary>

            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                textAlign: "center",
                marginTop: 14,
              }}
            >
              Podés completar estos pasos en cualquier momento desde Configuración.
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
