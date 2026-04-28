"use client";
import React, { useEffect, useState } from "react";
import LumoEyeIcon from "./LumoEyeIcon";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type DataQualityResponse = {
  score: number;
  transactionsCount: number;
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
  const { token } = useAuth();
  const [state, setState] = useState<CardState>("loading");
  const [data, setData] = useState<DataQualityResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchDataQuality() {
      try {
        setState("loading");
        if (!token) {
          setError("Token no encontrado");
          setState("error");
          return;
        }

        const res = await fetch(`${API}/api/negocio/data-quality-score`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        setData(json);
        setState("success");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setError(msg);
        setState("error");
      }
    }

    if (token) {
      fetchDataQuality();
    }
  }, [token]);

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
      <div style={{
        margin: "0 12px 8px",
        borderRadius: 14,
        padding: 16,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: "var(--sh)",
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
    );
  }

  // Variante DEFAULT — full size
  return (
    <div style={{
      margin: "0 12px 8px",
      borderRadius: 14,
      padding: 16,
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      boxShadow: "var(--sh)",
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
        {data.transactionsCount} transacciones en {data.daysCount} {data.daysCount === 1 ? "día" : "días"}
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
  );
}
