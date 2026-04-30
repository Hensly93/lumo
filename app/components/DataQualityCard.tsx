"use client";
import React, { useEffect, useState } from "react";
import LumoEyeIcon from "./LumoEyeIcon";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type DataQualityResponse = {
  score: number;
  total_transacciones: number;
  daysCount: number;
  message: string;
  status: "good" | "warning" | "critical";
};

type CardState = "loading" | "success" | "error";
type Variant = "default" | "mini" | "predicciones";

type DataQualityCardProps = {
  variant?: Variant;
  title?: string;
  hideIfGood?: boolean;
};

function getScoreColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 90) {
    return { bg: "#F0FFF8", text: "#00C48C", border: "#00C48C22" };
  } else if (score >= 70) {
    return { bg: "#FFFBF0", text: "#F59E0B", border: "#F59E0B22" };
  } else {
    return { bg: "#FFF5F5", text: "#EF4444", border: "#EF444422" };
  }
}

function getProgressBarColor(score: number): string {
  if (score >= 90) return "#00C48C";
  if (score >= 70) return "#F59E0B";
  return "#EF4444";
}

export default function DataQualityCard({
  variant = "default",
  title = "Calidad de datos",
  hideIfGood = false,
}: DataQualityCardProps) {
  const { token, user } = useAuth();
  console.log("🔐 Token disponible:", !!token);
  console.log("👤 User ID:", user?.id);
  console.log("🏪 Negocio ID:", user?.negocio_id);

  const [state, setState] = useState<CardState>("loading");
  const [data, setData] = useState<DataQualityResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log("⏳ useEffect disparado, token:", !!token);

    async function fetchDataQuality() {
      try {
        setState("loading");
        if (!token) {
          setError("Token no encontrado");
          setState("error");
          return;
        }

        const apiUrl = `${API}/api/negocio/data-quality-score${user?.negocio_id ? `?negocioId=${user.negocio_id}` : ""}`;
        console.log("🌐 Fetcheando URL:", apiUrl);

        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📡 Response status:", res.status);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        console.log("📦 Response data:", json);

        setData(json);
        console.log("✅ Estado actualizado a: success");
        setState("success");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        console.error("❌ Error fetching:", e);
        setError(msg);
        console.log("✅ Estado actualizado a: error");
        setState("error");
      }
    }

    if (token) {
      fetchDataQuality();
    }
  }, [token, user?.negocio_id]);

  // hideIfGood: si score >= 90 y está habilitado, no mostrar nada
  if (hideIfGood && data && data.score >= 90) {
    return null;
  }

  if (state === "loading") {
    return (
      <div style={{
        margin: "0 12px 8px",
        borderRadius: 14,
        padding: 16,
        background: "var(--card2)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: variant === "mini" ? 80 : 140,
      }}>
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
          Cargando...
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{
        margin: "0 12px 8px",
        borderRadius: 14,
        padding: 14,
        background: "#FFF5F5",
        border: "1px solid #EF444422",
        boxShadow: "var(--sh)",
      }}>
        <div style={{ fontSize: 12, color: "#EF4444" }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const colors = getScoreColor(data.score);
  const barColor = getProgressBarColor(data.score);

  const handleCardClick = () => {
    if (variant !== "mini") {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  function getScoreMeaning(score: number): string {
    if (score >= 90) {
      return "Tu negocio tiene datos excelentes. Las alertas de NICOLE son altamente confiables y las predicciones serán muy precisas.";
    } else if (score >= 70) {
      return "Tus datos son buenos, pero podrían mejorar. NICOLE funciona bien, aunque más historial aumentará la precisión de las alertas.";
    } else if (score >= 40) {
      return "Datos insuficientes. NICOLE funciona con limitaciones. Las alertas pueden ser aproximadas hasta que tengas más historial.";
    } else {
      return "Datos muy limitados. NICOLE necesita más información para funcionar correctamente. Registrá más transacciones diarias.";
    }
  }

  // Variante MINI — compacta para alertas
  if (variant === "mini") {
    return (
      <div style={{
        margin: "0 12px 8px",
        borderRadius: 14,
        padding: 12,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: "var(--sh)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LumoEyeIcon size={16} />
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>
            {title}: {data.score}%
          </span>
        </div>
        <div style={{ width: 60, height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${data.score}%`,
              background: barColor,
            }}
          />
        </div>
      </div>
    );
  }

  // Variante PREDICCIONES — con título personalizado
  if (variant === "predicciones") {
    return (
      <>
      <div
        onClick={handleCardClick}
        style={{
          margin: "0 12px 8px",
          borderRadius: 14,
          padding: 16,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          boxShadow: "var(--sh)",
          cursor: "pointer",
        }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}>
          <LumoEyeIcon size={20} />
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "var(--muted)",
          }}>
            {title}
          </span>
        </div>

        <div style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 32,
          fontWeight: 800,
          color: colors.text,
          lineHeight: 1,
          marginBottom: 8,
        }} aria-label={`${title}: ${data.score}%`}>
          {data.score}%
        </div>

        <div style={{
          width: "100%",
          height: 6,
          background: "rgba(0,0,0,0.1)",
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 8,
        }}>
          <div
            style={{
              height: "100%",
              width: `${data.score}%`,
              background: barColor,
              transition: "width 0.3s ease",
            }}
            role="progressbar"
            aria-valuenow={data.score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          {data.message}
        </div>
      </div>
      {isModalOpen && renderModal()}
      </>
    );
  }

  function renderModal() {
    if (!data) return null;

    return (
      <div
        onClick={handleOverlayClick}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(10, 22, 40, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#EEF3FC",
            borderRadius: 20,
            padding: 24,
            maxWidth: 500,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <LumoEyeIcon size={24} />
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0A1628",
                margin: 0,
              }}>
                Calidad de Datos
              </h2>
            </div>
            <button
              onClick={handleCloseModal}
              style={{
                background: "white",
                border: "1px solid #E0E7F1",
                borderRadius: 10,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 20,
                color: "#0A1628",
              }}
            >
              ×
            </button>
          </div>

          {/* Score Card */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            border: `2px solid ${colors.border}`,
          }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 48,
              fontWeight: 800,
              color: colors.text,
              lineHeight: 1,
              marginBottom: 12,
            }}>
              {data.score}%
            </div>
            <div style={{
              width: "100%",
              height: 8,
              background: "rgba(0,0,0,0.08)",
              borderRadius: 4,
              overflow: "hidden",
            }}>
              <div
                style={{
                  height: "100%",
                  width: `${data.score}%`,
                  background: barColor,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Cómo se calcula */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0A1628",
              marginTop: 0,
              marginBottom: 12,
            }}>
              Cómo se calcula
            </h3>
            <p style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#0A1628",
              margin: 0,
            }}>
              Analizamos <strong>{data.total_transacciones} transacciones</strong> de los últimos <strong>{data.daysCount} {data.daysCount === 1 ? "día" : "días"}</strong>. Un score alto significa que tus datos son consistentes y las alertas de NICOLE son más confiables.
            </p>
          </div>

          {/* Estadísticas */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0A1628",
              marginTop: 0,
              marginBottom: 12,
            }}>
              Estadísticas
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#6B7280" }}>Total de transacciones</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>
                  {data.total_transacciones}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#6B7280" }}>Días con datos</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>
                  {data.daysCount}
                </span>
              </div>
            </div>
          </div>

          {/* Qué significa */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0A1628",
              marginTop: 0,
              marginBottom: 12,
            }}>
              Qué significa para tu negocio
            </h3>
            <p style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#0A1628",
              margin: 0,
            }}>
              {getScoreMeaning(data.score)}
            </p>
          </div>

          {/* Botón Cerrar */}
          <button
            onClick={handleCloseModal}
            style={{
              width: "100%",
              background: "#007AFF",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "14px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Variante DEFAULT — full size
  return (
    <>
    <div
      onClick={handleCardClick}
      style={{
        margin: "0 12px 8px",
        borderRadius: 14,
        padding: 16,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: "var(--sh)",
        cursor: "pointer",
      }}>
      {/* Header: Logo + Título */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}>
        <LumoEyeIcon size={20} />
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "var(--muted)",
        }}>
          {title}
        </span>
      </div>

      {/* Score grande */}
      <div style={{
        fontFamily: "'Syne',sans-serif",
        fontSize: 40,
        fontWeight: 800,
        color: colors.text,
        lineHeight: 1,
        marginBottom: 8,
      }} aria-label={`Puntuación de ${title.toLowerCase()}: ${data.score}%`}>
        {data.score}%
      </div>

      {/* Barra de progreso */}
      <div style={{
        width: "100%",
        height: 6,
        background: "rgba(0,0,0,0.1)",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 12,
      }}>
        <div
          style={{
            height: "100%",
            width: `${data.score}%`,
            background: barColor,
            transition: "width 0.3s ease",
          }}
          role="progressbar"
          aria-valuenow={data.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Barra de progreso de calidad de datos"
        />
      </div>

      {/* Subtexto: Transacciones y días */}
      <div style={{
        fontSize: 11,
        color: "var(--muted)",
        marginBottom: 8,
      }}>
        {data.total_transacciones} transacciones en {data.daysCount} {data.daysCount === 1 ? "día" : "días"}
      </div>

      {/* Mensaje contextual */}
      <div style={{
        fontSize: 11,
        color: colors.text,
        fontWeight: 500,
        lineHeight: 1.4,
      }}>
        {data.message}
      </div>
    </div>
    {isModalOpen && renderModal()}
    </>
  );
}
