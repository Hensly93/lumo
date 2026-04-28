"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

function inp(): React.CSSProperties {
  return {
    width: "100%", padding: "13px 16px",
    background: "var(--card2)", border: "1px solid var(--border)",
    borderRadius: 12, color: "var(--text)", fontSize: 14,
    fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box",
  };
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="var(--muted)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="var(--muted)" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{ width: "100%", padding: "13px 44px 13px 16px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

type Vista = "login" | "registro" | "recupero" | "recupero-enviado";

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <svg width="140" height="44" viewBox="0 0 140 44" fill="none">
          <defs>
            <linearGradient id="ll-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#007AFF"/><stop offset="100%" stopColor="#00C2FF"/></linearGradient>
            <radialGradient id="ll-h" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#007AFF" stopOpacity="0.15"/><stop offset="100%" stopColor="transparent"/></radialGradient>
            <filter id="ll-f"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="ll-t" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#007AFF"/><stop offset="100%" stopColor="#00A0CC"/></linearGradient>
            <linearGradient id="ll-s" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="transparent"/><stop offset="20%" stopColor="#007AFF" stopOpacity="0.5"/><stop offset="70%" stopColor="#00C2FF" stopOpacity="0.7"/><stop offset="100%" stopColor="transparent"/></linearGradient>
          </defs>
          <ellipse cx="18" cy="22" rx="20" ry="20" fill="url(#ll-h)"/>
          <path d="M2 22 C7 11 29 11 34 22 C29 33 7 33 2 22Z" stroke="url(#ll-g)" strokeWidth="1.8" fill="none" filter="url(#ll-f)"/>
          <circle cx="18" cy="22" r="6" fill="none" stroke="url(#ll-g)" strokeWidth="1.5" filter="url(#ll-f)"/>
          <circle cx="18" cy="22" r="3" fill="url(#ll-g)" filter="url(#ll-f)"/>
          <circle cx="16.5" cy="20.5" r="1.2" fill="white" fillOpacity="0.65"/>
          <line x1="18" y1="19" x2="18" y2="6" stroke="#007AFF" strokeWidth="1.3" strokeOpacity="0.35" strokeLinecap="round"/>
          <line x1="18" y1="19" x2="25" y2="9" stroke="#007AFF" strokeWidth="0.9" strokeOpacity="0.22" strokeLinecap="round"/>
          <line x1="18" y1="19" x2="11" y2="9" stroke="#007AFF" strokeWidth="0.9" strokeOpacity="0.22" strokeLinecap="round"/>
          <text x="42" y="30" fontFamily="Syne" fontWeight="800" fontSize="28" fill="url(#ll-t)" letterSpacing="-1">lumo</text>
          <rect x="42" y="36" width="96" height="2" rx="1" fill="url(#ll-s)"/>
        </svg>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>Tu socio operativo</div>
    </div>
  );
}

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: "100%", padding: "14px",
  background: loading ? "var(--card2)" : "linear-gradient(135deg,#007AFF,#00C2FF)",
  border: loading ? "1px solid var(--border)" : "none",
  borderRadius: 12, color: loading ? "var(--muted)" : "#fff",
  fontSize: 14, fontWeight: 700,
  cursor: loading ? "not-allowed" : "pointer",
  fontFamily: "'DM Sans',sans-serif",
  boxShadow: loading ? "none" : "0 4px 16px #007AFF20",
  opacity: loading ? 0.7 : 1,
});

export default function Login() {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", nombre: "", negocio: "" });
  const [emailRecupero, setEmailRecupero] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("lumo_token")) router.replace("/");
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
      router.replace("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally { setLoading(false); }
  }

  async function submitRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true); setError("");
    try {
      const resp = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, nombre: form.nombre, negocio: form.negocio }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error al conectar");
      localStorage.setItem("lumo_token", data.token);
      localStorage.setItem("lumo_usuario", JSON.stringify(data.usuario));
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
    <div style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>{error}</div>
  ) : null;

  if (vista === "recupero-enviado") return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
        <Logo />
        <div style={{ fontSize: 36, marginBottom: 16 }}>✉️</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Revisá tu email</div>
        <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 28 }}>
          Si <span style={{ color: "var(--cyan)" }}>{emailRecupero}</span> está registrado, te enviamos un link para resetear tu contraseña. Revisá también el spam.
        </div>
        <button
          onClick={() => { setVista("login"); setError(""); setEmailRecupero(""); }}
          style={{ padding: "12px 24px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--cyan)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          Volver al login
        </button>
      </div>
    </main>
  );

  if (vista === "recupero") return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans',sans-serif", position: "relative" }}>
      <button onClick={() => { setVista("login"); setError(""); }}
        style={{ position: "absolute", top: 20, left: 20, background: "transparent", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
        ← Volver
      </button>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <Logo />
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Recuperar contraseña</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.5 }}>
          Ingresá tu email y te enviamos un link para crear una nueva contraseña.
        </div>
        <form onSubmit={submitRecupero} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Tu email" value={emailRecupero}
            onChange={e => { setEmailRecupero(e.target.value); setError(""); }}
            autoComplete="email" style={inp()} />
          <ErrorBox />
          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? "Enviando..." : "Enviar link de recupero"}
          </button>
        </form>
      </div>
    </main>
  );

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <Logo />

        <div style={{ height: 1, background: "var(--border)", margin: "0 0 24px" }} />

        {/* Tabs */}
        <div style={{ display: "flex", background: "var(--card2)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 24 }}>
          {(["login", "registro"] as const).map(t => (
            <button key={t}
              onClick={() => { setVista(t); setError(""); setForm({ email: "", password: "", confirmPassword: "", nombre: "", negocio: "" }); }}
              style={{ flex: 1, padding: "11px", background: vista === t ? "var(--card)" : "transparent", color: vista === t ? "var(--cyan)" : "var(--muted)", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
              {t === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {vista === "login" && (
          <form onSubmit={submitLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" placeholder="Email" value={form.email} onChange={set("email")} autoComplete="email" style={inp()} />
            <PasswordField placeholder="Contraseña" value={form.password} onChange={set("password")} autoComplete="current-password" />
            <div style={{ textAlign: "right", marginTop: -4 }}>
              <button type="button" onClick={() => { setVista("recupero"); setError(""); setEmailRecupero(form.email); }}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <ErrorBox />
            <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? "Conectando..." : "Ingresar"}</button>
          </form>
        )}

        {vista === "registro" && (
          <form onSubmit={submitRegistro} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input placeholder="Tu nombre" value={form.nombre} onChange={set("nombre")} autoComplete="name" style={inp()} />
            <input placeholder="Nombre del negocio" value={form.negocio} onChange={set("negocio")} style={inp()} />
            <input type="email" placeholder="Email" value={form.email} onChange={set("email")} autoComplete="email" style={inp()} />
            <PasswordField placeholder="Contraseña" value={form.password} onChange={set("password")} autoComplete="new-password" />
            <PasswordField placeholder="Confirmar contraseña" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
            <ErrorBox />
            <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? "Creando cuenta..." : "Crear cuenta"}</button>
            <p style={{ marginTop: 4, fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
              Al registrarte aceptás que Lumo está en versión beta. Sin compromiso.
            </p>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 10, color: "var(--muted)", letterSpacing: 2 }}>
          LUMO · BETA · {new Date().getFullYear()}
        </div>
      </div>
    </main>
  );
}
