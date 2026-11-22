"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C, FUENTE, boton, input, pedir, tarjeta, guardarToken } from "../comun";

export default function IngresarPartner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setCargando(true);
    try {
      const j = await pedir<{ token: string }>("/api/partners/login", { cuerpo: { email, password } });
      guardarToken(j.token);
      router.push("/partners/panel");
    } catch (er) { setError((er as Error).message); } finally { setCargando(false); }
  }

  return (
    <main style={{ background: C.papel, minHeight: "100vh", fontFamily: FUENTE, color: C.tinta }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "40px 16px" }}>
        <img src="/brand/lumobi-logo-dark.svg" alt="LumoBi" width={128} height={33} style={{ marginBottom: 24 }} />
        <div style={tarjeta}>
          <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Ingresar como partner</h1>
          <p style={{ color: C.suave, margin: "0 0 18px", fontSize: 15 }}>Tu cartera, tus comisiones y tus mensajes listos.</p>
          <form onSubmit={entrar} style={{ display: "grid", gap: 10 }}>
            <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <input style={input} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <div style={{ color: C.critico, fontSize: 14 }}>{error}</div>}
            <button type="submit" style={{ ...boton, opacity: cargando ? 0.6 : 1 }} disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</button>
          </form>
          <p style={{ fontSize: 14, color: C.apagada, margin: "16px 0 0", textAlign: "center" }}>
            ¿Todavía no sos partner? <Link href="/partners#alta" style={{ color: C.azul, fontWeight: 700 }}>Sumate</Link>
          </p>
          <p style={{ fontSize: 13, color: C.apagada, margin: "8px 0 0", textAlign: "center" }}>
            ¿Te olvidaste la contraseña? Escribinos a hola@lumobi.com.ar
          </p>
        </div>
      </div>
    </main>
  );
}
