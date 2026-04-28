"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import ConfirmCancelSubscriptionModal from "../components/ConfirmCancelSubscriptionModal";
import ConfirmDeleteAccountModal from "../components/ConfirmDeleteAccountModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type SubscriptionInfo = {
  subscription_status: string;
  subscription_end_date: string | null;
  plan_id: string | null;
  email: string;
  nombre: string;
  negocio: string;
};

export default function AjustesPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    // Fetch subscription info
    fetch(`${API}/api/usuario/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setSubscription({
          subscription_status: data.subscription_status || "activa",
          subscription_end_date: data.subscription_end_date,
          plan_id: data.plan_id || "basico",
          email: data.email,
          nombre: data.nombre,
          negocio: data.negocio,
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, router]);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Cargando ajustes...</div>
        </div>
      </main>
    );
  }

  if (error || !subscription) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", color: "#EF4444" }}>
          {error}
        </div>
      </main>
    );
  }

  const diasRestantes = subscription.subscription_end_date
    ? Math.ceil(
        (new Date(subscription.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "var(--text)", marginBottom: 8 }}>
            Ajustes
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Administrá tu cuenta y suscripción
          </p>
        </div>

        {/* SECCIÓN: Mi Suscripción */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            💳 Mi Suscripción
          </h2>

          <div style={{ background: "var(--card)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", boxShadow: "var(--sh)" }}>
            {/* Estado */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Estado</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
                  {subscription.subscription_status === "activa" ? "🟢 Activa" : "🔴 Cancelada"}
                </div>
              </div>
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: subscription.subscription_status === "activa" ? "rgba(0, 196, 140, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: subscription.subscription_status === "activa" ? "#00C48C" : "#EF4444",
                }}
              >
                {subscription.subscription_status === "activa" ? "ACTIVA" : "CANCELADA"}
              </div>
            </div>

            {/* Plan */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Plan</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
                {subscription.plan_id || "Básico"}
              </div>
            </div>

            {/* Vencimiento */}
            {subscription.subscription_end_date && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Vencimiento</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  {new Date(subscription.subscription_end_date).toLocaleDateString("es-AR")}
                </div>
                {diasRestantes !== null && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {diasRestantes > 0
                      ? `${diasRestantes} días restantes`
                      : diasRestantes === 0
                        ? "Vence hoy"
                        : "Vencida"}
                  </div>
                )}
              </div>
            )}

            {/* Botón Cancelar */}
            {subscription.subscription_status === "activa" && (
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#F59E0B",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#D97706")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#F59E0B")}
              >
                ⚠️ Cancelar suscripción
              </button>
            )}
          </div>
        </section>

        {/* SECCIÓN: Mi Cuenta */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            👤 Mi Cuenta
          </h2>

          <div style={{ background: "var(--card)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", boxShadow: "var(--sh)" }}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", wordBreak: "break-all" }}>
                {subscription.email}
              </div>
            </div>

            {/* Nombre */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Nombre</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {subscription.nombre || "—"}
              </div>
            </div>

            {/* Negocio */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Negocio</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {subscription.negocio || "—"}
              </div>
            </div>

            {/* Botón Borrar Cuenta */}
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                background: "#EF4444",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#DC2626")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#EF4444")}
            >
              🗑️ Borrar cuenta permanentemente
            </button>
          </div>
        </section>

        {/* SECCIÓN: Soporte */}
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            💬 Soporte
          </h2>

          <div style={{ background: "var(--card)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", boxShadow: "var(--sh)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a
                href="https://docs.lumo.io"
                target="_blank"
                rel="noopener"
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "#3B82F6",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                📚 Documentación
              </a>

              <a
                href="mailto:soporte@lumo.io"
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "#3B82F6",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                ✉️ Contactar soporte
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Modales */}
      {showCancelModal && (
        <ConfirmCancelSubscriptionModal
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            // Reload subscription info
            fetch(`${API}/api/usuario/perfil`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(r => r.json())
              .then(data => {
                setSubscription(prev => prev ? { ...prev, subscription_status: data.subscription_status } : prev);
              });
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            // Redirigir a login
            localStorage.clear();
            router.replace("/login");
          }}
        />
      )}
    </main>
  );
}
