"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const T = {
  bg: "#050D1A", bgCard: "#071428", border: "#0E2340",
  accent: "#38BDF8", accentDim: "rgba(56,189,248,0.10)", accentGlow: "rgba(56,189,248,0.20)",
  red: "#EF4444", green: "#34D399",
  textPrimary: "#E8F4FF", textSecondary: "#4A7A9B", textMuted: "#1E3A5F",
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke={T.textSecondary} strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke={T.textSecondary} strokeWidth="1.8"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke={T.textSecondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PasswordField({ placeholder, value, onChange }: {
  placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ width: "100%", padding: "13px 44px 13px 16px", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, color: T.textPrimary, fontSize: 14, fontFamily: "system-ui, sans-serif", outline: "none", boxSizing: "border-box" }}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Link inválido o expirado.");
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error");
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.green, marginBottom: 8 }}>Contraseña actualizada</div>
      <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 24 }}>Ya podés iniciar sesión con tu nueva contraseña.</div>
      <button onClick={() => router.replace("/login")}
        style={{ padding: "12px 24px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 12, color: T.accent, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Ir al login
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>Nueva contraseña</div>
      <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 8 }}>Elegí una contraseña nueva para tu cuenta de Lumo.</div>
      <PasswordField placeholder="Nueva contraseña" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} />
      <PasswordField placeholder="Confirmar contraseña" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} />
      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", color: T.red, fontSize: 13, textAlign: "center" }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading || !token}
        style={{ padding: "14px", background: loading ? T.bgCard : T.accentDim, border: `1px solid ${loading ? T.border : T.accent}`, borderRadius: 12, color: loading ? T.textMuted : T.accent, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  return (
    <main style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "24px", position: "relative" }}>
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 300, background: "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <button onClick={() => router.push("/login")}
        style={{ position: "absolute", top: 20, left: 20, background: "transparent", border: "none", color: T.textSecondary, fontSize: 13, cursor: "pointer" }}>
        ← Login
      </button>
      <svg width="110" height="34" viewBox="0 0 130 40" fill="none" style={{ marginBottom: 44 }}>
        <defs>
          <linearGradient id="beam-reset" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={T.accent} stopOpacity="0" />
            <stop offset="30%" stopColor={T.accent} stopOpacity="1" />
            <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="7" y1="6" x2="16" y2="1" stroke={T.accent} strokeWidth="1.3" strokeOpacity="0.8" strokeLinecap="round" />
        <circle cx="7" cy="6" r="2" fill={T.accent} />
        <text x="2" y="32" fontFamily="sans-serif" fontWeight="700" fontSize="30" fill={T.textPrimary} letterSpacing="-1">LUMO</text>
        <rect x="0" y="36" width="125" height="1.5" fill="url(#beam-reset)" />
      </svg>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <Suspense fallback={<div style={{ color: T.textMuted }}>Cargando...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
