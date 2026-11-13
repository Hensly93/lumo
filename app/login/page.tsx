"use client";
// Login, registro y recupero de contraseña — diseño claro de LumoBi (login-claro).
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

// Marca LumoBi (esta pantalla es siempre clara, igual que los mails)
const TINTA = "#0A1628";
const AZUL = "#0A5BD3";
const TEXTO = "#334155";
const SUAVE = "#64748B";
const LINEA = "#E2E8F0";
const BORDE_INPUT = "#CBD5E1";
const FONDO = "#F1F5F9";
const FUENTE = "var(--font-instrument),-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

function inp(): React.CSSProperties {
  return {
    width: "100%", padding: "14px 16px",
    background: "#FFFFFF", border: `1px solid ${BORDE_INPUT}`,
    borderRadius: 10, color: TINTA, fontSize: 16,
    fontFamily: FUENTE, outline: "none", boxSizing: "border-box",
  };
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke={SUAVE} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke={SUAVE} strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke={SUAVE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PasswordField({ placeholder, value, onChange, autoComplete }: {
  placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{ ...inp(), padding: "14px 48px 14px 16px" }}
      />
      <button
        type="button"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={() => setShow(s => !s)}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

type Vista = "login" | "registro" | "recupero" | "recupero-enviado";

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lumobi-logo-light.svg" alt="LumoBi" width={170} height={44} style={{ display: "inline-block", height: 44, width: "auto" }} />
      <div style={{ fontSize: 14, color: SUAVE, marginTop: 10 }}>Detectá las fugas de plata de tu negocio</div>
    </div>
  );
}

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: "100%", padding: "15px",
  background: loading ? "#E2E8F0" : AZUL,
  border: "none",
  borderRadius: 10, color: loading ? SUAVE : "#FFFFFF",
  fontSize: 16, fontWeight: 700,
  cursor: loading ? "not-allowed" : "pointer",
  fontFamily: FUENTE,
});

function Pantalla({ children, volver }: { children: React.ReactNode; volver?: () => void }) {
  return (
    <main style={{ background: FONDO, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: FUENTE, position: "relative" }}>
      {volver && (
        <button onClick={volver}
          style={{ position: "absolute", top: 18, left: 18, background: "transparent", border: "none", color: SUAVE, fontSize: 14, cursor: "pointer", fontFamily: FUENTE }}>
          ← Volver
        </button>
      )}
      <div style={{ width: "100%", maxWidth: 400, background: "#FFFFFF", border: `1px solid ${LINEA}`, borderRadius: 16, padding: "32px 26px" }}>
        {children}
      </div>
      <div style={{ marginTop: 18, fontSize: 12, color: SUAVE }}>
        LumoBi · {new Date().getFullYear()}
      </div>
    </main>
  );
}

export default function Login() {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", nombre: "", negocio: "", celular: "", cuit: "" });
  const [emailRecupero, setEmailRecupero] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Desde la landing se entra con /login?registro=1 y abre directo la pestaña Registrarse
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("registro") === "1") setVista("registro");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("lumo_token")) {
      const u = JSON.parse(localStorage.getItem("lumo_usuario") || "{}");
      router.replace(u.onboarding_done ? "/" : "/onboarding");
    }
  }, []);

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      setError("");
    };
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const resp = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error al conectar");
      localStorage.setItem("lumo_token", data.token);
      localStorage.setItem("lumo_usuario", JSON.stringify(data.usuario));
      router.replace(data.usuario.onboarding_done ? "/" : "/onboarding");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally { setLoading(false); }
  }

  async function submitRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (form.celular.replace(/\D/g, "").length < 8) { setError("Ingresá tu celular con código de área"); return; }
    if (form.cuit.trim() && form.cuit.replace(/\D/g, "").length !== 11) { setError("El CUIT tiene 11 números"); return; }
    setLoading(true); setError("");
    try {
      const resp = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, nombre: form.nombre, negocio: form.negocio, celular: form.celular, cuit: form.cuit }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error al conectar");
      localStorage.setItem("lumo_token", data.token);
      localStorage.setItem("lumo_usuario", JSON.stringify(data.usuario));
      try { sessionStorage.setItem("lumo_ya_uso_prueba", data.plan && data.plan.ya_uso_prueba ? "1" : "0"); } catch { /* sin acceso */ }
      router.replace("/onboarding");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally { setLoading(false); }
  }

  async function submitRecupero(e: React.FormEvent) {
    e.preventDefault();
    if (!emailRecupero.trim()) { setError("Ingresá tu email"); return; }
    setLoading(true); setError("");
    try {
      const resp = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailRecupero.trim() }),
      });
      if (!resp.ok) { const data = await resp.json(); throw new Error(data.error || "Error"); }
      setVista("recupero-enviado");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally { setLoading(false); }
  }

  const ErrorBox = () => error ? (
    <div role="alert" style={{ color: "#B91C1C", fontSize: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", textAlign: "center", lineHeight: 1.5 }}>{error}</div>
  ) : null;

  if (vista === "recupero-enviado") return (
    <Pantalla>
      <div style={{ textAlign: "center" }}>
        <Logo />
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "#EAF2FE", marginBottom: 16 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={AZUL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M3.5 7l8.5 6 8.5-6" />
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: TINTA, marginBottom: 8 }}>Revisá tu email</div>
        <div style={{ fontSize: 15, color: TEXTO, lineHeight: 1.6, marginBottom: 24 }}>
          Si <strong style={{ color: TINTA }}>{emailRecupero}</strong> está registrado, te enviamos un link para cambiar tu contraseña. Revisá también el spam.
        </div>
        <button
          onClick={() => { setVista("login"); setError(""); setEmailRecupero(""); }}
          style={{ ...btnStyle(false), background: "#FFFFFF", border: `1px solid ${BORDE_INPUT}`, color: AZUL }}>
          Volver a iniciar sesión
        </button>
      </div>
    </Pantalla>
  );

  if (vista === "recupero") return (
    <Pantalla volver={() => { setVista("login"); setError(""); }}>
      <Logo />
      <div style={{ fontSize: 20, fontWeight: 700, color: TINTA, marginBottom: 6 }}>Recuperar contraseña</div>
      <div style={{ fontSize: 15, color: TEXTO, marginBottom: 20, lineHeight: 1.5 }}>
        Escribí tu email y te enviamos un link para crear una nueva contraseña.
      </div>
      <form onSubmit={submitRecupero} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="email" placeholder="Tu email" aria-label="Tu email" value={emailRecupero}
          onChange={e => { setEmailRecupero(e.target.value); setError(""); }}
          autoComplete="email" style={inp()} />
        <ErrorBox />
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>
    </Pantalla>
  );

  return (
    <Pantalla>
      <Logo />

      {/* Pestañas */}
      <div style={{ display: "flex", background: FONDO, borderRadius: 10, padding: 4, marginBottom: 22, gap: 4 }}>
        {(["login", "registro"] as const).map(t => (
          <button key={t}
            onClick={() => { setVista(t); setError(""); setForm({ email: "", password: "", confirmPassword: "", nombre: "", negocio: "", celular: "", cuit: "" }); }}
            style={{ flex: 1, padding: "11px", background: vista === t ? "#FFFFFF" : "transparent", color: vista === t ? AZUL : SUAVE, border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE, boxShadow: vista === t ? "0 1px 3px rgba(10,22,40,0.12)" : "none" }}>
            {t === "login" ? "Iniciar sesión" : "Registrarse"}
          </button>
        ))}
      </div>

      {vista === "login" && (
        <form onSubmit={submitLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={set("email")} autoComplete="email" style={inp()} />
          <PasswordField placeholder="Contraseña" value={form.password} onChange={set("password")} autoComplete="current-password" />
          <div style={{ textAlign: "right", marginTop: -2 }}>
            <button type="button" onClick={() => { setVista("recupero"); setError(""); setEmailRecupero(form.email); }}
              style={{ background: "none", border: "none", color: AZUL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: FUENTE }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <ErrorBox />
          <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? "Conectando..." : "Ingresar"}</button>
        </form>
      )}

      {vista === "registro" && (
        <form onSubmit={submitRegistro} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Tu nombre" aria-label="Tu nombre" value={form.nombre} onChange={set("nombre")} autoComplete="name" style={inp()} />
          <input placeholder="Nombre del negocio" aria-label="Nombre del negocio" value={form.negocio} onChange={set("negocio")} style={inp()} />
          <input type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={set("email")} autoComplete="email" style={inp()} />
          <PasswordField placeholder="Contraseña" value={form.password} onChange={set("password")} autoComplete="new-password" />
          <PasswordField placeholder="Confirmar contraseña" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
          <input type="tel" placeholder="Celular (con código de área)" aria-label="Celular" value={form.celular} onChange={set("celular")} autoComplete="tel" style={inp()} />
          <input inputMode="numeric" placeholder="CUIT (opcional)" aria-label="CUIT (opcional)" value={form.cuit} onChange={set("cuit")} style={inp()} />
          <p style={{ margin: "-2px 0 0", fontSize: 12, color: SUAVE, lineHeight: 1.5 }}>
            Usamos tu celular y tu CUIT solo para que cada negocio use la prueba gratis una vez.
          </p>
          <ErrorBox />
          <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? "Creando cuenta..." : "Crear cuenta"}</button>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: SUAVE, textAlign: "center", lineHeight: 1.6 }}>
            Al crear tu cuenta aceptás los <a href="/terminos" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>términos</a> y la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>política de privacidad</a>. LumoBi está en versión beta, sin compromiso.
          </p>
        </form>
      )}
    </Pantalla>
  );
}
