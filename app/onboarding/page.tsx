"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function Onboarding() {
  const router = useRouter();
  const [pantalla, setPantalla] = useState<"bienvenida"|"registro"|"nicole"|"procesando"|"wow">("bienvenida");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [tipoNegocio, setTipoNegocio] = useState("");
  const [zona, setZona] = useState("");
  const [procesandoStep, setProcesandoStep] = useState(0);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const lumoToken = localStorage.getItem("lumo_token");
    if (!lumoToken) {
      router.replace("/login");
      return;
    }
    setToken(lumoToken);

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
  }, [router]);

  const guardarRegistro = async () => {
    if (!nombreNegocio || !tipoNegocio) {
      setError("Completá nombre y tipo de negocio");
      return;
    }

    try {
      await fetch(`${API}/api/perfil`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tipo_negocio: tipoNegocio, zona: zona || null })
      });
      setPantalla("nicole");
    } catch (err) {
      console.error("Error guardando registro:", err);
      setError("Error al guardar. Intentá de nuevo.");
    }
  };

  const handleMPConnect = () => {
    window.location.href = `${API}/api/mp/auth`;
  };

  const handleSubirArchivo = () => {
    setPantalla("procesando");
    simularProcesamiento();
  };

  const simularProcesamiento = () => {
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => {
        setProcesandoStep(i);
        if (i === 5) {
          setTimeout(() => {
            setPantalla("wow");
          }, 800);
        }
      }, i * 1200);
    }
  };

  const terminar = async () => {
    try {
      await fetch(`${API}/api/perfil`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ onboarding_done: true })
      });

      const usuarioStr = localStorage.getItem("lumo_usuario");
      if (usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        usuario.onboarding_done = true;
        localStorage.setItem("lumo_usuario", JSON.stringify(usuario));
      }

      router.replace("/");
    } catch (err) {
      console.error("Error finalizando onboarding:", err);
      router.replace("/");
    }
  };

  const progreso = pantalla === "registro" ? 33 : pantalla === "nicole" ? 66 : 0;

  return (
    <div style={{ background: "#0D1520", minHeight: "100vh" }}>
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
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ marginBottom: "32px" }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ margin: "0 auto", display: "block" }}>
              <ellipse cx="36" cy="36" rx="20" ry="13" fill="#007AFF" />
              <circle cx="36" cy="36" r="8" fill="white" />
              <circle cx="36" cy="36" r="5" fill="#0D1520" />
            </svg>
          </div>

          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "28px", color: "white", marginBottom: "8px", textAlign: "center", lineHeight: "1.2" }}>
            Iluminamos lo que<br/>tu negocio pierde.
          </h1>

          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "48px", textAlign: "center" }}>
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
                color: "white",
                width: "100%",
                border: "none",
                marginBottom: "12px",
                boxShadow: "0 4px 20px rgba(0,122,255,0.4)",
                cursor: "pointer"
              }}
            >
              Empezá gratis — 15 días
            </button>

            <button
              onClick={() => router.replace("/login")}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "14px",
                color: "rgba(255,255,255,0.6)",
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
        <div style={{ background: "#0D1520", padding: "24px", paddingTop: "32px", minHeight: "100vh" }}>
          <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{ height: "100%", width: `${progreso}%`, background: "#007AFF", transition: "width 0.5s" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#007AFF", fontWeight: 600, marginBottom: "24px", textAlign: "center" }}>
            Tu NICOLE está al {progreso}% de su potencial
          </p>

          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "white", marginBottom: "4px" }}>
            Contanos sobre tu negocio
          </h1>

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "28px" }}>
            60 segundos y listo
          </p>

          <label style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "8px" }}>
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
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              color: "white",
              fontSize: "15px",
              outline: "none",
              marginBottom: "20px",
              boxSizing: "border-box"
            }}
          />

          <label style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "8px" }}>
            TIPO DE NEGOCIO
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {[
              { label: "Cafetería", emoji: "☕" },
              { label: "Kiosko", emoji: "🏪" },
              { label: "Restobar", emoji: "🍽️" },
              { label: "Farmacia", emoji: "💊" },
              { label: "Otro", emoji: "🏬" }
            ].map(({ label, emoji }) => (
              <button
                key={label}
                onClick={() => { setTipoNegocio(label); setError(""); }}
                style={{
                  padding: "14px 10px",
                  background: tipoNegocio === label ? "rgba(0,122,255,0.2)" : "rgba(255,255,255,0.05)",
                  border: tipoNegocio === label ? "1px solid #007AFF" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "center",
                  color: tipoNegocio === label ? "white" : "rgba(255,255,255,0.7)",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {emoji} {label}
              </button>
            ))}
          </div>

          <label style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "8px" }}>
            ZONA
          </label>

          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              color: "white",
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
              color: "white",
              border: "none",
              cursor: nombreNegocio && tipoNegocio ? "pointer" : "not-allowed",
              opacity: nombreNegocio && tipoNegocio ? 1 : 0.5
            }}
          >
            Continuar →
          </button>
        </div>
      )}

      {pantalla === "nicole" && (
        <div style={{ background: "#0D1520", padding: "24px", paddingTop: "32px", minHeight: "100vh" }}>
          <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{ height: "100%", width: `${progreso}%`, background: "#007AFF", transition: "width 0.5s" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#007AFF", fontWeight: 600, marginBottom: "24px", textAlign: "center" }}>
            Tu NICOLE está al {progreso}% de su potencial
          </p>

          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "white", marginBottom: "4px" }}>
            Despertá a NICOLE
          </h1>

          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>
            Sin tus ventas no puede ver nada
          </p>

          <div style={{ background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.15)", borderRadius: "16px", padding: "24px", marginBottom: "20px", overflow: "hidden", position: "relative" }}>
            <svg width="100%" height="160" viewBox="0 0 300 160" style={{ display: "block" }}>
              <line x1="30" y1="80" x2="60" y2="30" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 2s infinite alternate" }} />
              <line x1="60" y1="30" x2="90" y2="120" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 2.5s infinite alternate" }} />
              <line x1="120" y1="50" x2="150" y2="90" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 3s infinite alternate" }} />
              <line x1="150" y1="90" x2="170" y2="30" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 2.2s infinite alternate" }} />
              <line x1="200" y1="70" x2="220" y2="130" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 2.8s infinite alternate" }} />
              <line x1="240" y1="50" x2="260" y2="90" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 2.4s infinite alternate" }} />
              <line x1="150" y1="90" x2="150" y2="140" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 2.6s infinite alternate" }} />
              <line x1="260" y1="90" x2="280" y2="40" stroke="rgba(0,122,255,0.2)" strokeWidth="0.5" style={{ animation: "nicPulse 3s infinite alternate" }} />

              <circle cx="30" cy="80" r="3" fill="#007AFF" style={{ animation: "float-0 3s ease-in-out infinite alternate, nicPulse 2s infinite" }} />
              <circle cx="60" cy="30" r="3" fill="#00C2FF" style={{ animation: "float-1 2.5s ease-in-out infinite alternate 0.3s, nicPulse 1.8s infinite" }} />
              <circle cx="90" cy="120" r="3" fill="#007AFF" style={{ animation: "float-2 3.5s ease-in-out infinite alternate 0.6s, nicPulse 2.2s infinite" }} />
              <circle cx="120" cy="50" r="3" fill="#00C2FF" style={{ animation: "float-3 3s ease-in-out infinite alternate 0.9s, nicPulse 1.5s infinite" }} />
              <circle cx="150" cy="90" r="3" fill="#007AFF" style={{ animation: "float-4 2.8s ease-in-out infinite alternate 1.2s, nicPulse 2.5s infinite" }} />
              <circle cx="170" cy="30" r="3" fill="#00C2FF" style={{ animation: "float-5 4s ease-in-out infinite alternate 0.2s, nicPulse 1.7s infinite" }} />
              <circle cx="200" cy="70" r="3" fill="#007AFF" style={{ animation: "float-6 3.2s ease-in-out infinite alternate 0.5s, nicPulse 2.3s infinite" }} />
              <circle cx="220" cy="130" r="3" fill="#00C2FF" style={{ animation: "float-7 2.7s ease-in-out infinite alternate 0.8s, nicPulse 1.9s infinite" }} />
              <circle cx="240" cy="50" r="3" fill="#007AFF" style={{ animation: "float-8 3.3s ease-in-out infinite alternate 1.1s, nicPulse 2.1s infinite" }} />
              <circle cx="260" cy="90" r="3" fill="#00C2FF" style={{ animation: "float-9 2.9s ease-in-out infinite alternate 1.4s, nicPulse 2.7s infinite" }} />
              <circle cx="280" cy="40" r="3" fill="#007AFF" style={{ animation: "float-10 3.4s ease-in-out infinite alternate 0.4s, nicPulse 2s infinite" }} />
              <circle cx="150" cy="140" r="3" fill="#00C2FF" style={{ animation: "float-11 3.1s ease-in-out infinite alternate 0.7s, nicPulse 2.4s infinite" }} />
            </svg>

            <p style={{ color: "#007AFF", fontSize: "10px", letterSpacing: "4px", textAlign: "center", marginTop: "8px", fontWeight: 600 }}>
              NICOLE
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", marginTop: "4px" }}>
              Necesito tus ventas para arrancar...
            </p>
          </div>

          <button
            onClick={handleMPConnect}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              width: "100%",
              padding: "18px 20px",
              background: "rgba(0,122,255,0.12)",
              border: "1px solid rgba(0,122,255,0.4)",
              borderRadius: "14px",
              marginBottom: "10px",
              cursor: "pointer"
            }}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#007AFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
              💳
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>Conectar Mercado Pago</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Ve todo en tiempo real</div>
            </div>
            <div style={{ color: "#007AFF", fontSize: "24px", marginLeft: "auto" }}>›</div>
          </button>

          <button
            onClick={handleSubirArchivo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              width: "100%",
              padding: "18px 20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              marginBottom: "10px",
              cursor: "pointer"
            }}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
              📄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>Subir mis ventas</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Excel o CSV</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "24px", marginLeft: "auto" }}>›</div>
          </button>

          <p onClick={terminar} style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: "20px", cursor: "pointer" }}>
            o lo hago después — NICOLE no podrá analizar tu negocio
          </p>
        </div>
      )}

      {pantalla === "procesando" && (
        <div style={{ background: "#0D1520", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "2px solid #007AFF",
            background: "radial-gradient(circle at center, rgba(0,122,255,0.3), transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
            animation: "pulse 2s infinite"
          }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <ellipse cx="28" cy="28" rx="16" ry="10" fill="none" stroke="#007AFF" strokeWidth="2" />
              <circle cx="28" cy="28" r="6" fill="#007AFF" />
            </svg>
          </div>

          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", color: "white", textAlign: "center", marginBottom: "8px" }}>
            NICOLE está revisando tu negocio
          </h1>

          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: "40px" }}>
            Ya casi. En unos segundos te contamos lo que encontramos.
          </p>

          <div style={{ width: "100%", maxWidth: "300px" }}>
            {[
              "Tus ventas llegaron bien",
              "Revisando cómo venís cada turno",
              "Buscando dónde se va la plata...",
              "Calculando cuánto es en pesos",
              "Armando tu primer reporte"
            ].map((item, index) => {
              const completado = procesandoStep > index;
              const enProgreso = procesandoStep === index + 1;

              return (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", textAlign: "left", width: "100%" }}>
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: completado ? "#00C48C" : enProgreso ? "#007AFF" : "rgba(255,255,255,0.15)",
                    animation: enProgreso ? "pulse 1.5s infinite" : "none"
                  }} />
                  <span style={{ fontSize: "14px", color: completado ? "white" : "rgba(255,255,255,0.3)" }}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pantalla === "wow" && (
        <div style={{ background: "#0D1520", minHeight: "100vh", padding: "48px 24px 32px", display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: "11px", letterSpacing: "3px", color: "#007AFF", textTransform: "uppercase", textAlign: "center", marginBottom: "32px", fontWeight: 600 }}>
            NICOLE DETECTÓ ALGO
          </p>

          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "72px", color: "#FF9500", textAlign: "center", lineHeight: 1, marginBottom: "20px" }}>
            $47.200
          </div>

          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: "1.5", marginBottom: "16px" }}>
            Es lo que perdió <span style={{ fontWeight: 700, color: "white" }}>{nombreNegocio || "tu negocio"}</span> en el turno tarde durante el último mes.
          </p>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "20px 0" }} />

          <div style={{ marginTop: "auto", paddingTop: "32px" }}>
            <button
              onClick={terminar}
              style={{
                background: "linear-gradient(135deg, #FF9500, #FF6B00)",
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: 700,
                color: "white",
                border: "none",
                marginBottom: "12px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(255,149,0,0.4)"
              }}
            >
              Ver qué está pasando →
            </button>

            <button
              onClick={terminar}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "14px",
                color: "rgba(255,255,255,0.6)",
                fontSize: "14px",
                fontWeight: 600,
                width: "100%",
                padding: "14px",
                cursor: "pointer"
              }}
            >
              Ver resumen completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
