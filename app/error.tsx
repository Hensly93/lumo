"use client";
// Red de seguridad: si una pantalla falla, se muestra esto en vez de la pantalla blanca.
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[LumoBi] Error en pantalla:", error); }, [error]);
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#F4F7FB", fontFamily: "DM Sans, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center", background: "white", borderRadius: 20, padding: "32px 24px", boxShadow: "0 8px 30px rgba(10,22,40,0.08)" }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#64748B", fontWeight: 700, marginBottom: 12 }}>LUMOBI</div>
        <h1 style={{ fontSize: 22, color: "#0A1628", margin: "0 0 10px" }}>Algo no cargó bien</h1>
        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, margin: "0 0 24px" }}>
          Tus datos están a salvo. Probá de nuevo; si sigue pasando, avisanos.
        </p>
        <button onClick={() => reset()} style={{ width: "100%", padding: 14, border: "none", borderRadius: 12, background: "#007AFF", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>
          Reintentar
        </button>
        <button onClick={() => { window.location.href = "/"; }} style={{ width: "100%", padding: 14, border: "1px solid #E0E7F1", borderRadius: 12, background: "white", color: "#0A1628", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Ir al inicio
        </button>
      </div>
    </main>
  );
}
