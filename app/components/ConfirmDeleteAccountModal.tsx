"use client";
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function ConfirmDeleteAccountModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"confirm" | "password">("confirm");

  const handleDelete = async () => {
    if (!password) {
      setError("Contraseña requerida");
      return;
    }

    if (!token) {
      setError("Token no encontrado");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/usuario/me`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error borrando cuenta");
      }

      const data = await response.json();
      console.log("✅ Cuenta borrada:", data);
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 998,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 999,
          padding: "16px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "var(--card2)",
            borderRadius: 16,
            padding: 24,
            maxWidth: 420,
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            border: "1px solid var(--border)",
            pointerEvents: "auto",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          {/* Step 1: Confirmación */}
          {step === "confirm" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#EF4444",
                    marginBottom: 8,
                  }}
                >
                  🗑️ Borrar cuenta permanentemente
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text2)",
                    lineHeight: 1.5,
                  }}
                >
                  Esta acción no se puede deshacer. Se eliminarán todos tus datos.
                </p>
              </div>

              {/* Lista de qué se borra */}
              <div
                style={{
                  padding: 12,
                  background: "#FFF5F5",
                  borderRadius: 8,
                  border: "1px solid #EF444422",
                  marginBottom: 20,
                  fontSize: 12,
                  color: "var(--text2)",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ marginBottom: 8, fontWeight: 600, color: "#EF4444" }}>
                  Se borrará:
                </div>
                <div style={{ marginBottom: 6 }}>
                  ✗ Tu cuenta y perfil
                </div>
                <div style={{ marginBottom: 6 }}>
                  ✗ Todas tus transacciones
                </div>
                <div style={{ marginBottom: 6 }}>
                  ✗ Configuración de Lumo
                </div>
                <div>
                  ✗ Historial completo
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card3)",
                    color: "var(--text)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "var(--card4)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "var(--card3)")
                  }
                >
                  Cancelar
                </button>

                <button
                  onClick={() => setStep("password")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#EF4444",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#DC2626")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#EF4444")
                  }
                >
                  Borrar cuenta
                </button>
              </div>
            </>
          )}

          {/* Step 2: Contraseña */}
          {step === "password" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  Confirmar contraseña
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  Ingresá tu contraseña para confirmar que deseas borrar tu cuenta.
                </p>
              </div>

              {/* Input */}
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Contraseña"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card3)",
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
                disabled={loading}
              />

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: 12,
                    background: "#FFF5F5",
                    borderRadius: 8,
                    border: "1px solid #EF444422",
                    color: "#EF4444",
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                >
                  ❌ {error}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setStep("confirm");
                    setPassword("");
                    setError("");
                  }}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card3)",
                    color: "var(--text)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseOver={(e) =>
                    !loading && (e.currentTarget.style.background = "var(--card4)")
                  }
                  onMouseOut={(e) =>
                    !loading && (e.currentTarget.style.background = "var(--card3)")
                  }
                >
                  Atrás
                </button>

                <button
                  onClick={handleDelete}
                  disabled={loading || !password}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: loading || !password ? "#EF444499" : "#EF4444",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading || !password ? "not-allowed" : "pointer",
                  }}
                  onMouseOver={(e) =>
                    !loading &&
                    password &&
                    (e.currentTarget.style.background = "#DC2626")
                  }
                  onMouseOut={(e) =>
                    !loading &&
                    password &&
                    (e.currentTarget.style.background = "#EF4444")
                  }
                >
                  {loading ? "Borrando..." : "Confirmar borrado"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
