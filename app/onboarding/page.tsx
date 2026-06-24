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
  const [itemsCompletados, setItemsCompletados] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("lumo_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (pantalla === "procesando") {
      const timers: NodeJS.Timeout[] = [];
      for (let i = 0; i < 5; i++) {
        const timer = setTimeout(() => {
          setItemsCompletados(i + 1);
          if (i === 4) {
            setTimeout(() => setPantalla("wow"), 800);
          }
        }, (i + 1) * 1200);
        timers.push(timer);
      }
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [pantalla]);

  const terminar = async () => {
    const token = localStorage.getItem("lumo_token");
    if (!token) return;

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
    } catch (error) {
      console.error("Error al finalizar onboarding:", error);
    }
  };

  const progreso = pantalla === "bienvenida" ? 0 : pantalla === "registro" ? 33 : pantalla === "nicole" ? 66 : pantalla === "procesando" ? 85 : 100;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>

      {(pantalla === "registro" || pantalla === "nicole") && (
        <div style={{ width: "100%", maxWidth: "500px", marginBottom: "16px" }}>
          <div style={{ height: "3px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progreso}%`, background: "var(--cyan)", transition: "width 0.5s" }} />
          </div>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "var(--muted)", marginTop: "8px", textAlign: "right" }}>
            Tu NICOLE está al {progreso}% de su potencial
          </p>
        </div>
      )}

      {pantalla === "bienvenida" && (
        <div style={{ background: "var(--card)", padding: "48px", borderRadius: "16px", maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: "32px" }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ margin: "0 auto" }}>
              <circle cx="60" cy="60" r="50" fill="var(--cyan)" opacity="0.15" />
              <ellipse cx="60" cy="60" rx="30" ry="20" fill="var(--cyan)" />
              <circle cx="60" cy="60" r="12" fill="white" />
              <circle cx="60" cy="60" r="8" fill="black" />
            </svg>
          </div>

          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "36px", color: "var(--text)", marginBottom: "16px", lineHeight: "1.2" }}>
            Iluminamos lo que tu negocio pierde.
          </h1>

          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "16px", color: "var(--muted)", marginBottom: "32px" }}>
            NICOLE detecta fugas de dinero invisibles con inteligencia artificial
          </p>

          <button
            onClick={() => setPantalla("registro")}
            style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, var(--cyan), #2563eb)", color: "white", border: "none", borderRadius: "999px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "16px", cursor: "pointer", marginBottom: "12px" }}
          >
            Empezá gratis — 15 días
          </button>

          <button
            onClick={() => router.push("/login")}
            style={{ width: "100%", padding: "16px", background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "999px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "16px", cursor: "pointer" }}
          >
            Ya tengo cuenta → Ingresar
          </button>
        </div>
      )}

      {pantalla === "registro" && (
        <div style={{ background: "var(--card)", padding: "48px", borderRadius: "16px", maxWidth: "500px", width: "100%" }}>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "32px", color: "var(--text)", marginBottom: "24px" }}>
            Contanos sobre tu negocio
          </h1>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "8px" }}>
              Nombre del negocio
            </label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              placeholder="Ej: Café Central"
              style={{ width: "100%", padding: "12px 16px", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", fontFamily: "DM Sans, sans-serif", fontSize: "16px", color: "var(--text)", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "8px" }}>
              Tipo de negocio
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "Cafetería", emoji: "☕" },
                { label: "Kiosko", emoji: "🏪" },
                { label: "Restobar", emoji: "🍽️" },
                { label: "Farmacia", emoji: "💊" },
                { label: "Otro", emoji: "🏬" }
              ].map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() => setTipoNegocio(label)}
                  style={{
                    padding: "12px",
                    background: tipoNegocio === label ? "var(--cyan)" : "var(--bg)",
                    color: tipoNegocio === label ? "white" : "var(--text)",
                    border: `1px solid ${tipoNegocio === label ? "var(--cyan)" : "var(--border)"}`,
                    borderRadius: "8px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "8px" }}>
              Zona
            </label>
            <select
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", fontFamily: "DM Sans, sans-serif", fontSize: "16px", color: zona ? "var(--text)" : "var(--muted)", outline: "none" }}
            >
              <option value="">Seleccioná tu zona</option>
              <option value="GBA Norte">GBA Norte</option>
              <option value="GBA Sur">GBA Sur</option>
              <option value="GBA Oeste">GBA Oeste</option>
              <option value="CABA">CABA</option>
              <option value="Interior">Interior</option>
            </select>
          </div>

          <button
            onClick={() => setPantalla("nicole")}
            disabled={!nombreNegocio || !tipoNegocio}
            style={{
              width: "100%",
              padding: "16px",
              background: nombreNegocio && tipoNegocio ? "linear-gradient(135deg, var(--cyan), #2563eb)" : "var(--border)",
              color: "white",
              border: "none",
              borderRadius: "999px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 600,
              fontSize: "16px",
              cursor: nombreNegocio && tipoNegocio ? "pointer" : "not-allowed",
              opacity: nombreNegocio && tipoNegocio ? 1 : 0.5
            }}
          >
            Continuar →
          </button>
        </div>
      )}

      {pantalla === "nicole" && (
        <div style={{ background: "var(--card)", padding: "48px", borderRadius: "16px", maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: "24px", opacity: 0.5 }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ margin: "0 auto" }}>
              <circle cx="70" cy="70" r="60" fill="var(--cyan)" opacity="0.1" />
              <ellipse cx="70" cy="70" rx="35" ry="25" fill="var(--cyan)" opacity="0.3" />
              <circle cx="70" cy="70" r="15" fill="var(--cyan)" opacity="0.2" />
            </svg>
          </div>

          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "var(--muted)", marginBottom: "8px" }}>
            Necesita tus ventas para arrancar...
          </p>

          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "32px", color: "var(--text)", marginBottom: "32px" }}>
            Despertá a NICOLE
          </h1>

          <button
            onClick={() => window.location.href = `${API}/api/mp/auth`}
            style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, var(--cyan), #2563eb)", color: "white", border: "none", borderRadius: "999px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "16px", cursor: "pointer", marginBottom: "12px" }}
          >
            💳 Conectar Mercado Pago
          </button>

          <button
            onClick={() => setPantalla("procesando")}
            style={{ width: "100%", padding: "16px", background: "white", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "999px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "16px", cursor: "pointer", marginBottom: "12px" }}
          >
            📄 Subir mis ventas
          </button>

          <button
            onClick={terminar}
            style={{ width: "100%", padding: "8px", background: "transparent", color: "var(--muted)", border: "none", fontFamily: "DM Sans, sans-serif", fontSize: "12px", cursor: "pointer", opacity: 0.3 }}
          >
            lo hago después
          </button>
        </div>
      )}

      {pantalla === "procesando" && (
        <div style={{ background: "var(--card)", padding: "48px", borderRadius: "16px", maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: "32px", animation: "pulse 2s infinite" }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ margin: "0 auto" }}>
              <circle cx="70" cy="70" r="60" fill="var(--cyan)" opacity="0.2" />
              <ellipse cx="70" cy="70" rx="35" ry="25" fill="var(--cyan)" />
              <circle cx="70" cy="70" r="15" fill="white" />
              <circle cx="70" cy="70" r="10" fill="black" />
            </svg>
          </div>

          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "32px", color: "var(--text)", marginBottom: "32px" }}>
            NICOLE está revisando tu negocio
          </h1>

          <div style={{ textAlign: "left" }}>
            {[
              "Analizando transacciones...",
              "Calibrando algoritmos...",
              "Detectando patrones sospechosos...",
              "Calculando riesgos...",
              "Generando tu reporte..."
            ].map((item, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", opacity: itemsCompletados > index ? 1 : 0.3, transition: "opacity 0.5s" }}>
                {itemsCompletados > index ? (
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="10" fill="var(--cyan)" />
                    <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                ) : (
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--border)" }} />
                )}
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "16px", color: "var(--text)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pantalla === "wow" && (
        <div style={{ background: "var(--card)", padding: "48px", borderRadius: "16px", maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
            NICOLE detectó algo
          </p>

          <div style={{ background: "#0A1628", padding: "32px", borderRadius: "12px", marginBottom: "24px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "64px", color: "#FF9500", marginBottom: "16px" }}>
              $47.200
            </div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "16px", color: "white", marginBottom: "8px" }}>
              es lo que {nombreNegocio || "tu negocio"} podría estar perdiendo este mes
            </p>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
              según el análisis preliminar de NICOLE
            </p>
          </div>

          <button
            onClick={terminar}
            style={{ width: "100%", padding: "16px", background: "#FF9500", color: "white", border: "none", borderRadius: "999px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "16px", cursor: "pointer", marginBottom: "12px" }}
          >
            Ver qué está pasando →
          </button>

          <button
            onClick={terminar}
            style={{ width: "100%", padding: "16px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "999px", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "16px", cursor: "pointer" }}
          >
            Ver resumen completo
          </button>
        </div>
      )}
    </div>
  );
}
