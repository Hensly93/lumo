"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

function Contador({ titulo, valor, min, max, onChange }: {
  titulo: string; valor: number; min: number; max: number; onChange: (v: number) => void;
}) {
  const boton: React.CSSProperties = {
    width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--border)",
    background: "var(--card)", color: "var(--text)", fontSize: "20px", cursor: "pointer"
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <span style={{ fontSize: "14px", color: "var(--text)" }}>{titulo}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => onChange(Math.max(min, valor - 1))} style={boton}>-</button>
        <span style={{ minWidth: "28px", textAlign: "center", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{valor}</span>
        <button type="button" onClick={() => onChange(Math.min(max, valor + 1))} style={boton}>+</button>
      </div>
    </div>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pantalla, setPantalla] = useState<"bienvenida"|"registro">("bienvenida");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [tipoNegocio, setTipoNegocio] = useState("");
  const [zona, setZona] = useState("");
  const [locales, setLocales] = useState(1);
  const [cajas, setCajas] = useState(1);
  const [empleados, setEmpleados] = useState(1);
  const [calculo, setCalculo] = useState<{ plan: string; precio: number | null } | null>(null);

  useEffect(() => {
    let vigente = true;
    fetch(`${API}/api/plan/calcular`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cajas: Array.from({ length: locales }, () => cajas), empleados }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (vigente) setCalculo(d); })
      .catch(() => { if (vigente) setCalculo(null); });
    return () => { vigente = false; };
  }, [locales, cajas, empleados]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const lumoToken = localStorage.getItem("lumo_token");
    if (!lumoToken) {
      router.replace("/login");
      return;
    }
    setToken(lumoToken);
    // Si llega desde "Completar los datos" de primeros pasos, ya tiene cuenta: no se le muestra la bienvenida.
    if (window.location.search.includes("desde=pasos")) setPantalla("registro");

    const usuarioStr = localStorage.getItem("lumo_usuario");
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        if (usuario.negocio) {
          setNombreNegocio(usuario.negocio);
        }
      } catch (e) {
        console.error("Error parseando usuario:", e);
      }
    }

    if (typeof window !== "undefined" && window.location.search.includes("mp_conectado=true")) {
      router.replace("/primeros-pasos");
      return;
    }
  }, [router, searchParams]);

  const guardarRegistro = async () => {
    if (!nombreNegocio || !tipoNegocio) {
      setError("Completá nombre y tipo de negocio");
      return;
    }

    try {
      const resp = await fetch(`${API}/api/perfil`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tipo_negocio: tipoNegocio, zona: zona || null })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(data.error || "No pudimos guardar. Intentá de nuevo.");
        return;
      }
      try {
        await fetch(`${API}/api/plan/tamano`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ locales, cajas, empleados })
        });
      } catch { /* si falla, el tamaño se puede cargar después */ }
      router.replace("/primeros-pasos");
    } catch (err) {
      console.error("Error guardando registro:", err);
      setError("Error al guardar. Intentá de nuevo.");
    }
  };

  const progreso = pantalla === "registro" ? 50 : 0;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }
        @keyframes float-0 { 0%{transform:translateY(0px)} 100%{transform:translateY(-4px)} }
        @keyframes float-1 { 0%{transform:translateY(0px)} 100%{transform:translateY(5px)} }
        @keyframes float-2 { 0%{transform:translateY(0px)} 100%{transform:translateY(-4px)} }
        @keyframes float-3 { 0%{transform:translateY(0px)} 100%{transform:translateY(6px)} }
        @keyframes float-4 { 0%{transform:translateY(0px)} 100%{transform:translateY(-5px)} }
        @keyframes float-5 { 0%{transform:translateY(0px)} 100%{transform:translateY(3px)} }
        @keyframes float-6 { 0%{transform:translateY(0px)} 100%{transform:translateY(-6px)} }
        @keyframes float-7 { 0%{transform:translateY(0px)} 100%{transform:translateY(5px)} }
        @keyframes float-8 { 0%{transform:translateY(0px)} 100%{transform:translateY(-3px)} }
        @keyframes float-9 { 0%{transform:translateY(0px)} 100%{transform:translateY(4px)} }
        @keyframes float-10 { 0%{transform:translateY(0px)} 100%{transform:translateY(-5px)} }
        @keyframes float-11 { 0%{transform:translateY(0px)} 100%{transform:translateY(6px)} }
        @keyframes nicPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>

      {pantalla === "bienvenida" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg)" }}>
          <div style={{ marginBottom: "32px" }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ margin: "0 auto", display: "block" }}>
              <ellipse cx="36" cy="36" rx="20" ry="13" fill="#007AFF" />
              <circle cx="36" cy="36" r="8" fill="white" />
              <circle cx="36" cy="36" r="5" fill="var(--bg)" />
            </svg>
          </div>

          <h1 style={{ fontFamily: "var(--font-instrument), sans-serif", fontWeight: 800, fontSize: "28px", color: "var(--text)", marginBottom: "8px", textAlign: "center", lineHeight: "1.2" }}>
            Iluminamos lo que<br/>tu negocio pierde.
          </h1>

          <p style={{ fontFamily: "var(--font-instrument), sans-serif", fontSize: "14px", color: "var(--muted)", marginBottom: "48px", textAlign: "center" }}>
            Con NICOLE detectás fugas en tiempo real
          </p>

          <div style={{ width: "100%", maxWidth: "360px" }}>
            <button
              onClick={() => setPantalla("registro")}
              style={{
                background: "linear-gradient(135deg, #007AFF, #00C2FF)",
                padding: "16px",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text)",
                width: "100%",
                border: "none",
                marginBottom: "12px",
                boxShadow: "0 4px 20px rgba(0,122,255,0.4)",
                cursor: "pointer"
              }}
            >
              Empezá gratis — 5 días
            </button>

            <button
              onClick={() => router.replace("/login")}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                color: "var(--muted)",
                fontSize: "14px",
                fontWeight: 600,
                width: "100%",
                padding: "14px",
                cursor: "pointer"
              }}
            >
              Ya tengo cuenta → Ingresar
            </button>
          </div>
        </div>
      )}

      {pantalla === "registro" && (
        <div style={{ background: "var(--bg)", padding: "24px", paddingTop: "32px", minHeight: "100vh" }}>
          <div style={{ height: "3px", background: "var(--border)", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{ height: "100%", width: `${progreso}%`, background: "#007AFF", transition: "width 0.5s" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#007AFF", fontWeight: 600, marginBottom: "24px", textAlign: "center" }}>
            Tu NICOLE está al {progreso}% de su potencial
          </p>

          <h1 style={{ fontFamily: "var(--font-instrument), sans-serif", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "4px" }}>
            Contanos sobre tu negocio
          </h1>

          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "28px" }}>
            60 segundos y listo
          </p>

          <label style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
            NOMBRE DEL NEGOCIO
          </label>

          <input
            type="text"
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            placeholder="Ej: Café Central"
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--text)",
              fontSize: "15px",
              outline: "none",
              marginBottom: "20px",
              boxSizing: "border-box"
            }}
          />

          <label style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
            TIPO DE NEGOCIO
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {[
              { label: "Restaurante y parrilla", valor: "restaurante" },
              { label: "Café y bar", valor: "cafeteria" },
              { label: "Panadería", valor: "panaderia" },
              { label: "Kiosco", valor: "kiosko" },
              { label: "Almacén", valor: "almacen" },
              { label: "Supermercado", valor: "supermercado" },
              { label: "Farmacia", valor: "farmacia" },
              { label: "Indumentaria y otros comercios", valor: "retail" }
            ].map(({ label, valor }) => (
              <button
                key={label}
                onClick={() => { setTipoNegocio(valor); setError(""); }}
                style={{
                  padding: "14px 10px",
                  background: tipoNegocio === valor ? "rgba(0,122,255,0.2)" : "rgba(255,255,255,0.05)",
                  border: tipoNegocio === valor ? "1px solid #007AFF" : "1px solid var(--border)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "center",
                  color: tipoNegocio === valor ? "white" : "var(--text)",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <label style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
            ZONA
          </label>

          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none",
              marginBottom: "28px",
              appearance: "none",
              boxSizing: "border-box"
            }}
          >
            <option value="">Seleccioná tu zona</option>
            <option value="GBA Norte">GBA Norte</option>
            <option value="GBA Sur">GBA Sur</option>
            <option value="GBA Oeste">GBA Oeste</option>
            <option value="CABA">CABA</option>
            <option value="Interior">Interior</option>
          </select>

          <label style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
            TAMAÑO DE TU NEGOCIO
          </label>

          <div style={{ marginBottom: "16px" }}>
            <Contador titulo="Locales" valor={locales} min={1} max={10} onChange={setLocales} />
            <Contador titulo="Cajas por local" valor={cajas} min={1} max={20} onChange={setCajas} />
            <Contador titulo="Empleados" valor={empleados} min={0} max={100} onChange={setEmpleados} />
          </div>

          {calculo !== null && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px", marginBottom: "28px", fontSize: "13px", color: "var(--text)", lineHeight: 1.5 }}>
              {calculo.plan === "empresarial"
                ? "Tu negocio entra en el plan EMPRESARIAL: te armamos un precio a medida."
                : "Tu abono estimado: $" + (calculo.precio ?? 0).toLocaleString("es-AR") + " por mes, después de 5 días gratis."}
            </div>
          )}

          {error && (
            <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
          )}

          <button
            onClick={guardarRegistro}
            disabled={!nombreNegocio || !tipoNegocio}
            style={{
              background: nombreNegocio && tipoNegocio ? "linear-gradient(135deg, #007AFF, #00C2FF)" : "rgba(255,255,255,0.1)",
              width: "100%",
              padding: "15px",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text)",
              border: "none",
              cursor: nombreNegocio && tipoNegocio ? "pointer" : "not-allowed",
              opacity: nombreNegocio && tipoNegocio ? 1 : 0.5
            }}
          >
            Continuar →
          </button>
        </div>
      )}

    </div>
  );
}

export default function Onboarding() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
