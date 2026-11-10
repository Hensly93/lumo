"use client";
// Nueva contraseña — diseño claro de LumoBi (reset-claro).
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

const TINTA = "#0A1628";
const AZUL = "#0A5BD3";
const TEXTO = "#334155";
const SUAVE = "#64748B";
const LINEA = "#E2E8F0";
const BORDE_INPUT = "#CBD5E1";
const FONDO = "#F1F5F9";
const FUENTE = "var(--font-instrument),-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

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
        aria-label={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        style={{ width: "100%", padding: "14px 48px 14px 16px", background: "#FFFFFF", border: `1px solid ${BORDE_INPUT}`, borderRadius: 10, color: TINTA, fontSize: 16, fontFamily: FUENTE, outline: "none", boxSizing: "border-box" }}
      />
      <button type="button" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShow(s => !s)}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}>
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lumobi-logo-light.svg" alt="LumoBi" width={170} height={44} style={{ display: "inline-block", height: 44, width: "auto" }} />
    </div>
  );
}

const btn = (off: boolean): React.CSSProperties => ({
  width: "100%", padding: "15px", background: off ? "#E2E8F0" : AZUL, border: "none", borderRadius: 10,
  color: off ? SUAVE : "#FFFFFF", fontSize: 16, fontWeight: 700, cursor: off ? "not-allowed" : "pointer", fontFamily: FUENTE,
});

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
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "#EAF2FE", marginBottom: 16 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={AZUL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: TINTA, marginBottom: 8 }}>Contraseña actualizada</div>
      <div style={{ fontSize: 15, color: TEXTO, lineHeight: 1.6, marginBottom: 24 }}>Ya podés iniciar sesión con tu nueva contraseña.</div>
      <button onClick={() => router.replace("/login")} style={btn(false)}>Ir a iniciar sesión</button>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: TINTA }}>Nueva contraseña</div>
      <div style={{ fontSize: 15, color: TEXTO, lineHeight: 1.5, marginBottom: 6 }}>Elegí una contraseña nueva para tu cuenta de LumoBi.</div>
      <PasswordField placeholder="Nueva contraseña" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} />
      <PasswordField placeholder="Confirmar contraseña" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} />
      {error && (
        <div role="alert" style={{ color: "#B91C1C", fontSize: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", textAlign: "center", lineHeight: 1.5 }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading || !token} style={btn(loading || !token)}>
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  return (
    <main style={{ background: FONDO, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FUENTE, padding: "24px 16px", position: "relative" }}>
      <button onClick={() => router.push("/login")}
        style={{ position: "absolute", top: 18, left: 18, background: "transparent", border: "none", color: SUAVE, fontSize: 14, cursor: "pointer", fontFamily: FUENTE }}>
        ← Volver
      </button>
      <div style={{ width: "100%", maxWidth: 400, background: "#FFFFFF", border: `1px solid ${LINEA}`, borderRadius: 16, padding: "32px 26px" }}>
        <Logo />
        <Suspense fallback={<div style={{ color: SUAVE, textAlign: "center" }}>Cargando...</div>}>
          <ResetForm />
        </Suspense>
      </div>
      <div style={{ marginTop: 18, fontSize: 12, color: SUAVE }}>LumoBi · {new Date().getFullYear()}</div>
    </main>
  );
}
