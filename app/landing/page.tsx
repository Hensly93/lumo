"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InstallButton from "../components/InstallButton";

const T = {
  bg:            "#050D1A",
  bgCard:        "#071428",
  border:        "#0E2340",
  borderBright:  "#1A3A5C",
  accent:        "#38BDF8",
  accentDim:     "rgba(56,189,248,0.10)",
  accentGlow:    "rgba(56,189,248,0.25)",
  green:         "#34D399",
  greenDim:      "rgba(52,211,153,0.10)",
  red:           "#EF4444",
  yellow:        "#FBBF24",
  textPrimary:   "#E8F4FF",
  textSecondary: "#4A7A9B",
  textMuted:     "#1E3A5F",
};

const PASOS = [
  {
    num: "01",
    titulo: "Registrás el turno",
    desc: "El empleado abre el turno con su PIN y declara el efectivo en caja. Sin papel. Sin excusas.",
    color: T.accent,
  },
  {
    num: "02",
    titulo: "Lumo cruza los números",
    desc: "Al cierre, Lumo compara caja apertura + ventas + Mercado Pago + egresos. Detecta la brecha en segundos.",
    color: T.green,
  },
  {
    num: "03",
    titulo: "Ves el patrón, no la persona",
    desc: "Te avisamos qué turno, qué día, qué patrón. Sin acusaciones. Con evidencia estadística real.",
    color: T.yellow,
  },
];

const FEATURES = [
  {
    icon: "⟁",
    titulo: "Cruce de 4 variables simultáneo",
    desc: "Caja apertura, ventas totales, pagos digitales y egresos. Un desvío de $500 deja rastro en todos al mismo tiempo.",
    color: T.accent,
  },
  {
    icon: "◈",
    titulo: "CUSUM — detección de deriva",
    desc: "No solo detecta el spike de hoy. Detecta cuando algo empieza a cambiar lentamente, antes de que se acumule.",
    color: T.green,
  },
  {
    icon: "◉",
    titulo: "Umbrales que aprenden",
    desc: "Cada negocio es distinto. Los umbrales se ajustan automáticamente con el feedback del dueño.",
    color: T.yellow,
  },
  {
    icon: "⊕",
    titulo: "Mercado Pago integrado",
    desc: "Importá 18 meses de historial en un clic. Las ventas digitales se cruzan automáticamente con el efectivo.",
    color: T.accent,
  },
  {
    icon: "⊞",
    titulo: "Multi-local",
    desc: "Varios locales propios, una sola pantalla. Ves el semáforo de cada uno en tiempo real.",
    color: T.green,
  },
  {
    icon: "⊛",
    titulo: "Predicción de facturación",
    desc: "Cuánto vas a vender este mes, con rango realista. Un modelo estadístico sobre tu propio historial.",
    color: T.yellow,
  },
];

const STATS = [
  { valor: "4", unidad: "rastros", label: "Un desvío de $500 deja cuatro rastros simultáneos en el sistema" },
  { valor: "94%", unidad: "", label: "de las inconsistencias detectadas antes del cierre del turno" },
  { valor: "21", unidad: "días", label: "de ventana estadística para detectar goteo acumulado" },
];

const FAQS = [
  {
    q: "¿Cómo sabe Lumo que hay una inconsistencia si no ve las cámaras?",
    a: "No necesita cámaras. Los números mienten diferente de cómo miente una persona. Si el efectivo no cuadra con las ventas, el ratio de pagos digitales y los egresos, eso es evidencia estadística — no intuición.",
  },
  {
    q: "¿Tiene que saber contabilidad el empleado?",
    a: "No. El empleado solo declara el efectivo en pantalla. Todo el análisis lo hace Lumo por atrás.",
  },
  {
    q: "¿Cuánto tarda en funcionar?",
    a: "El control de caja funciona desde el primer turno. La detección estadística mejora con 30 días de historial. Las predicciones se activan con 60 días.",
  },
  {
    q: "¿Es una acusación hacia el empleado?",
    a: "No. Lumo detecta patrones por turno y condición, no por persona. Te dice 'el turno tarde los viernes tiene una brecha sostenida'. Lo que hacés con eso es decisión tuya.",
  },
];

function Logo({ center = false, size = 130 }: { center?: boolean; size?: number }) {
  const h = Math.round(size * (40 / 130));
  return (
    <svg width={size} height={h} viewBox="0 0 130 40" fill="none"
      style={{ display: center ? "block" : undefined, margin: center ? "0 auto" : undefined, flexShrink: 0 }}>
      <defs>
        <linearGradient id="lumo-beam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={T.accent} stopOpacity="0" />
          <stop offset="30%" stopColor={T.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="7" y1="6" x2="16" y2="1" stroke={T.accent} strokeWidth="1.3" strokeOpacity="0.8" strokeLinecap="round" />
      <circle cx="7" cy="6" r="2" fill={T.accent} />
      <text x="2" y="32" fontFamily="sans-serif" fontWeight="700" fontSize="30" fill={T.textPrimary} letterSpacing="-1">LUMO</text>
      <rect x="0" y="36" width="125" height="1.5" fill="url(#lumo-beam)" />
    </svg>
  );
}

export default function Landing() {
  const router = useRouter();
  const [hora, setHora] = useState("");
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () =>
      setHora(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ background: T.bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif", color: T.textPrimary, overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, background: "rgba(5,13,26,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ flexShrink: 0, lineHeight: 0 }}>
          <Logo size={130} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => router.push("/login")}
            style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 10, color: T.textSecondary, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            Entrar
          </button>
          <button onClick={() => router.push("/login")}
            style={{ padding: "8px 14px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 10, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* InstallButton fuera del nav — no afecta el layout del logo */}
      <InstallButton />

      {/* ── Hero ── */}
      <section style={{ position: "relative", padding: "80px 24px 72px", textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
        {/* Glow de fondo */}
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)", width: 560, height: 320, background: "radial-gradient(ellipse, rgba(56,189,248,0.11) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 100, fontSize: 11, color: T.textSecondary, marginBottom: 28, fontFamily: "monospace", letterSpacing: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", boxShadow: `0 0 6px ${T.green}` }} />
            LUMO · DETECCIÓN OPERATIVA · {mounted ? hora : "—"}
          </div>

          <h1 style={{ fontSize: "clamp(30px, 7vw, 48px)", fontWeight: 900, lineHeight: 1.12, letterSpacing: -1.5, marginBottom: 22, color: T.textPrimary }}>
            Tu caja dice una cosa.
            <br />
            <span style={{ color: T.accent }}>Tus ventas dicen otra.</span>
          </h1>

          <p style={{ fontSize: 16, color: T.textSecondary, lineHeight: 1.8, maxWidth: 500, margin: "0 auto 36px" }}>
            Lumo cruza caja, ventas, Mercado Pago y egresos en cada turno.
            Detecta la brecha exacta — y el patrón detrás — antes de que se acumule.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/login")}
              style={{ padding: "14px 36px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 14, color: T.accent, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 28px ${T.accentGlow}` }}>
              Empezar gratis
            </button>
            <button onClick={() => router.push("/empleado")}
              style={{ padding: "14px 28px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 14, color: T.textSecondary, fontSize: 15, cursor: "pointer" }}>
              Ver demo empleado →
            </button>
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <InstallButton />
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: T.textMuted, letterSpacing: 1 }}>
            Sin tarjeta de crédito · Sin contrato · Cancelás cuando querés
          </div>
        </div>
      </section>

      {/* ── Problema ── */}
      <section style={{ padding: "0 24px 72px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: "32px 28px" }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 18 }}>
            // el problema
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary, lineHeight: 1.35, marginBottom: 16 }}>
            El 60% de las pérdidas en negocios físicos no aparecen en ningún reporte.
          </h2>
          <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.8, marginBottom: 24 }}>
            No son robos groseros. Son brechas de $300, $700, $1200 por turno.
            Errores de vuelto, egresos no declarados, ventas cobradas en efectivo que no se registran.
            <br /><br />
            Acumuladas en 30 días, esas brechas pueden superar los{" "}
            <strong style={{ color: T.red }}>$40.000</strong> sin que ningún sistema lo haya detectado.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Detectan el problema con Excel", val: "8%", ok: false },
              { label: "Lo detectan con Lumo", val: "94%", ok: true },
              { label: "Cierran el turno sin cruzar datos", val: "73%", ok: false },
              { label: "Tienen 4 rastros por cada desvío", val: "100%", ok: true },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.ok ? T.greenDim : "rgba(239,68,68,0.06)",
                border: `1px solid ${item.ok ? T.green : T.red}35`,
                borderRadius: 12, padding: "14px", textAlign: "center"
              }}>
                <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, color: item.ok ? T.green : T.red, marginBottom: 6 }}>{item.val}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section style={{ padding: "0 24px 72px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 28, textAlign: "center" }}>
          // cómo funciona
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {PASOS.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${p.color}`, background: `${p.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: p.color }}>
                  {p.num}
                </div>
                {i < PASOS.length - 1 && (
                  <div style={{ width: 1, height: 36, background: `linear-gradient(${p.color}40, transparent)`, marginTop: 4 }} />
                )}
              </div>
              <div style={{ paddingTop: 10, paddingBottom: i < PASOS.length - 1 ? 20 : 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 6 }}>{p.titulo}</div>
                <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: "0 24px 72px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "22px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontWeight: 800, color: T.accent, lineHeight: 1, marginBottom: 4 }}>
                <span style={{ fontSize: 30 }}>{s.valor}</span>
                {s.unidad && <span style={{ fontSize: 12, marginLeft: 2, opacity: 0.7 }}>{s.unidad}</span>}
              </div>
              <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "0 24px 72px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>
          // qué detecta lumo
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: T.bgCard, borderLeft: `3px solid ${f.color}`, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "monospace", fontSize: 18, color: f.color, flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 5 }}>{f.titulo}</div>
                <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Piloto ── */}
      <section style={{ padding: "0 24px 72px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderBright}`, borderRadius: 24, padding: "40px 28px", textAlign: "center", boxShadow: `0 0 60px rgba(56,189,248,0.05)` }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 16 }}>
            // programa piloto
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary, lineHeight: 1.3, marginBottom: 14 }}>
            Primeros 10 negocios.
            <br />
            <span style={{ color: T.accent }}>90 días gratis.</span>
          </h2>
          <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.75, marginBottom: 28 }}>
            Lumo está en fase piloto. Buscamos negocios físicos en Argentina que quieran validar el sistema con datos reales — a cambio de feedback real.
          </p>
          <button onClick={() => router.push("/login")}
            style={{ width: "100%", padding: "15px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 14, color: T.accent, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 24px ${T.accentGlow}` }}>
            Quiero ser piloto →
          </button>
          <div style={{ marginTop: 14, fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
            Sin compromiso · Sin tarjeta · Feedback bienvenido
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "0 24px 80px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>
          // preguntas frecuentes
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((f, i) => (
            <div key={i}
              onClick={() => setFaqAbierta(faqAbierta === i ? null : i)}
              style={{ background: T.bgCard, border: `1px solid ${faqAbierta === i ? T.borderBright : T.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, lineHeight: 1.4 }}>{f.q}</div>
                <div style={{ color: T.accent, fontFamily: "monospace", fontSize: 18, flexShrink: 0, transform: faqAbierta === i ? "rotate(45deg)" : "none", transition: "transform 0.15s" }}>+</div>
              </div>
              {faqAbierta === i && (
                <div style={{ padding: "0 20px 18px", paddingTop: 14, fontSize: 13, color: T.textSecondary, lineHeight: 1.75, borderTop: `1px solid ${T.border}` }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "32px 24px", textAlign: "center" }}>
        <Logo center />
        <div style={{ marginTop: 16, fontSize: 12, color: T.textMuted, letterSpacing: 1 }}>
          LUMO · BETA · Argentina · {new Date().getFullYear()}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: T.textSecondary }}>
          castellyholy@gmail.com
        </div>
      </footer>

    </main>
  );
}
