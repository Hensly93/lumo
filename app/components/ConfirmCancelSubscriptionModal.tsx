"use client";
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function ConfirmCancelSubscriptionModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    if (!token) {
      setError("Token no encontrado");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/usuario/me/subscription/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error cancelando suscripción");
      }

      const data = await response.json();
      console.log("✅ Suscripción cancelada:", data);
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

          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              ⚠️ Cancelar suscripción
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text2)",
                lineHeight: 1.5,
              }}
            >
              Vas a cancelar tu suscripción. Tendrás acceso durante 30 días más.
            </p>
          </div>

          {/* Lista de cambios */}
          <div
            style={{
              padding: 12,
              background: "rgba(245, 158, 11, 0.08)",
              borderRadius: 8,
              border: "1px solid rgba(245, 158, 11, 0.2)",
              marginBottom: 20,
              fontSize: 12,
              color: "var(--text2)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              ✓ Se cancelará inmediatamente en Mercado Pago
            </div>
            <div style={{ marginBottom: 8 }}>
              ✓ Seguirás usando Lumo hasta el 28 de mayo
            </div>
            <div>
              ✓ Podrás reactivar en cualquier momento
            </div>
          </div>

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
              onClick={onClose}
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
                transition: "background 0.2s",
                opacity: loading ? 0.6 : 1,
              }}
              onMouseOver={(e) =>
                !loading && (e.currentTarget.style.background = "var(--card4)")
              }
              onMouseOut={(e) =>
                !loading && (e.currentTarget.style.background = "var(--card3)")
              }
            >
              Mantener suscripción
            </button>

            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#F59E0B99" : "#F59E0B",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                !loading && (e.currentTarget.style.background = "#D97706")
              }
              onMouseOut={(e) =>
                !loading && (e.currentTarget.style.background = "#F59E0B")
              }
            >
              {loading ? "Cancelando..." : "Cancelar suscripción"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
