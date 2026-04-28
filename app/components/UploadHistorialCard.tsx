"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import LumoEyeIcon from "./LumoEyeIcon";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type FlowState = "options" | "upload" | "loading" | "success" | "error" | "skipped";

type UploadResponse = {
  success: boolean;
  transacciones_cargadas: number;
  dias_datos: number;
  total_efectivo: number;
  total_mercado_pago: number;
  ratio_efectivo: number;
  ticket_promedio: number;
  baseline_status: string;
  baseline_listo: boolean;
  mensaje: string;
  advertencias?: string | null;
};

export default function UploadHistorialCard({
  onSkip,
  onMPConnect,
  onUploadSuccess,
}: {
  onSkip?: () => void;
  onMPConnect?: () => void;
  onUploadSuccess?: () => void;
}) {
  const { token } = useAuth();
  const [flowState, setFlowState] = useState<FlowState>("options");
  const [data, setData] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Crear CSV simple como fallback template
    const csv = "fecha\thora\tmonto\tmetodo_pago\templeado\tdescripcion\n2026-04-01\t08:30\t150.50\nefectivo\tJuan\tVenta mostrador\n2026-04-01\t09:15\t250.00\tmercado_pago\tMaria\tVenta online\n2026-04-02\t10:00\t500.00\nefectivo\tJuan\tVenta mayorista";
    const blob = new Blob([csv], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_transacciones.csv");
    link.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!token) {
      setError("Token no encontrado");
      setFlowState("error");
      return;
    }

    try {
      setFlowState("loading");
      setError("");
      setData(null);

      const formData = new FormData();
      formData.append("archivo", file);

      const response = await fetch(`${API}/api/negocio/upload-historial`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setFlowState("success");
      onUploadSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      setFlowState("error");
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFlowState("options");
    setData(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSkip = () => {
    setFlowState("skipped");
    onSkip?.();
  };

  const handleMPClick = () => {
    onMPConnect?.();
  };

  // Estado: LOADING
  if (flowState === "loading") {
    return (
      <div
        style={{
          margin: "0 12px 16px",
          borderRadius: 14,
          padding: 24,
          background: "var(--card2)",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Cargando archivo...
          </div>
          <div
            style={{
              width: "100%",
              height: 6,
              background: "rgba(0,0,0,0.1)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                borderRadius: 3,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
            Por favor aguardá mientras procesamos el archivo...
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Estado: ERROR
  if (flowState === "error") {
    return (
      <div
        style={{
          margin: "0 12px 16px",
          borderRadius: 14,
          padding: 20,
          background: "#FFF5F5",
          border: "1px solid #EF444422",
          boxShadow: "var(--sh)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#EF4444",
            marginBottom: 12,
          }}
        >
          ❌ Error en la carga
        </div>
        <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 16 }}>
          {error}
        </div>
        <button
          onClick={handleReset}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#EF4444",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#DC2626")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#EF4444")}
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // Estado: SUCCESS
  if (flowState === "success" && data) {
    const baselineColor = data.baseline_listo
      ? data.dias_datos >= 30
        ? "#00C48C"
        : "#F59E0B"
      : "#9CA3AF";

    return (
      <div
        style={{
          margin: "0 12px 16px",
          borderRadius: 14,
          padding: 20,
          background: "var(--card2)",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh)",
        }}
      >
        {/* Header: ✅ Success */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#00C48C",
              marginBottom: 4,
            }}
          >
            ✅ Carga exitosa
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            {data.mensaje}
          </div>
        </div>

        {/* Grid: Métricas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* Transacciones */}
          <div
            style={{
              padding: 12,
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: 8,
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
              Transacciones
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#3B82F6",
                fontFamily: "'Syne',sans-serif",
              }}
            >
              {data.transacciones_cargadas}
            </div>
          </div>

          {/* Días de datos */}
          <div
            style={{
              padding: 12,
              background: "rgba(139, 92, 246, 0.1)",
              borderRadius: 8,
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
              Días de historial
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#8B5CF6",
                fontFamily: "'Syne',sans-serif",
              }}
            >
              {data.dias_datos}
            </div>
          </div>

          {/* Efectivo */}
          <div
            style={{
              padding: 12,
              background: "rgba(0, 196, 140, 0.1)",
              borderRadius: 8,
              border: "1px solid rgba(0, 196, 140, 0.2)",
            }}
          >
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
              Efectivo
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#00C48C",
                fontFamily: "'Syne',sans-serif",
              }}
            >
              ${data.total_efectivo.toLocaleString("es-AR")}
            </div>
          </div>

          {/* Mercado Pago */}
          <div
            style={{
              padding: 12,
              background: "rgba(52, 168, 219, 0.1)",
              borderRadius: 8,
              border: "1px solid rgba(52, 168, 219, 0.2)",
            }}
          >
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
              Mercado Pago
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#34A8DB",
                fontFamily: "'Syne',sans-serif",
              }}
            >
              ${data.total_mercado_pago.toLocaleString("es-AR")}
            </div>
          </div>
        </div>

        {/* Ratio Efectivo */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted)",
              marginBottom: 8,
            }}
          >
            Composición de pagos
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                height: 8,
                background: "rgba(0,0,0,0.1)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${data.ratio_efectivo * 100}%`,
                  background: "#00C48C",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text)",
                minWidth: 45,
                textAlign: "right",
              }}
            >
              {Math.round(data.ratio_efectivo * 100)}% E
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              marginTop: 4,
            }}
          >
            {Math.round((1 - data.ratio_efectivo) * 100)}% Mercado Pago
          </div>
        </div>

        {/* Ticket Promedio */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            Ticket promedio:{" "}
            <span style={{ fontWeight: 700, color: "var(--text)" }}>
              ${data.ticket_promedio.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        {/* Baseline Status */}
        <div
          style={{
            padding: 12,
            background: `rgba(${
              baselineColor === "#00C48C" ? "0, 196, 140" : "245, 158, 11"
            }, 0.1)`,
            borderRadius: 8,
            border: `1px solid ${baselineColor}44`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: baselineColor,
              marginBottom: 4,
            }}
          >
            {data.baseline_status}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>
            {data.baseline_listo
              ? "El motor NICOLE ya está calibrado con tus datos."
              : `Necesitás más historial para que NICOLE funcione óptimamente.`}
          </div>
        </div>

        {/* Advertencias */}
        {data.advertencias && (
          <div
            style={{
              padding: 12,
              background: "#FFFBF0",
              borderRadius: 8,
              border: "1px solid #F59E0B44",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 10, color: "#D97706", fontWeight: 600 }}>
              ⚠️ Advertencia
            </div>
            <div style={{ fontSize: 10, color: "#D97706", marginTop: 4 }}>
              {data.advertencias}
            </div>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card2)",
              color: "var(--text)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--card3)")
            }
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--card2)")}
          >
            Cargar otro archivo
          </button>
          <a
            href="/dashboard"
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#3B82F6",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              textAlign: "center",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "#2563EB")
            }
            onMouseOut={(e) => (e.currentTarget.style.background = "#3B82F6")}
          >
            Ir al dashboard
          </a>
        </div>
      </div>
    );
  }

  // Estado: OPTIONS (Pantalla principal)
  if (flowState === "options") {
    return (
      <div
        style={{
          margin: "0 12px 16px",
          borderRadius: 14,
          padding: 24,
          background: "var(--card2)",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh)",
        }}
      >
        {/* Header con ojo Lumo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <LumoEyeIcon size={20} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              Contanos cómo viene tu negocio
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Calibrá NICOLE con tus datos para mejores predicciones
            </div>
          </div>
        </div>

        {/* Opción A: Mercado Pago (Recomendado) */}
        <button
          onClick={handleMPClick}
          style={{
            width: "100%",
            padding: 20,
            borderRadius: 12,
            border: "2px solid #00C48C",
            background: "rgba(0, 196, 140, 0.05)",
            cursor: "pointer",
            marginBottom: 12,
            transition: "all 0.2s",
            position: "relative",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(0, 196, 140, 0.1)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(0, 196, 140, 0.05)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                🔗 Conectá Mercado Pago
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                Sincronización automática en tiempo real. Datos precisos desde el día 1.
              </div>
            </div>
            <div
              style={{
                background: "#00C48C",
                color: "white",
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                whiteSpace: "nowrap",
                marginLeft: 12,
              }}
            >
              RECOMENDADO
            </div>
          </div>
        </button>

        {/* Opción B: Upload Manual */}
        <button
          onClick={() => setFlowState("upload")}
          style={{
            width: "100%",
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card3)",
            cursor: "pointer",
            marginBottom: 16,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "var(--card4)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--card3)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
              📁 Subí tus registros
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
              Excel, CSV, PDF o foto. Importá los últimos 15-30 días para calibración rápida.
            </div>
          </div>
        </button>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--border)",
            margin: "16px 0",
          }}
        />

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--muted)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          ❓ ¿No tenés datos? Usamos benchmark sectorial
        </button>
      </div>
    );
  }

  // Estado: UPLOAD (Pantalla de carga de archivo)
  if (flowState === "upload") {
    return (
      <div
        style={{
          margin: "0 12px 16px",
          borderRadius: 14,
          padding: 24,
          background: "var(--card2)",
          border: "1px solid var(--border)",
          boxShadow: "var(--sh)",
        }}
      >
        {/* Back button + Título */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setFlowState("options")}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              padding: 0,
              color: "var(--text)",
            }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              📁 Subí tus registros
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Excel, CSV, PDF o imagen de últimos 15-30 días
            </div>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          style={{
            border: `2px dashed ${dragActive ? "#3B82F6" : "var(--border)"}`,
            borderRadius: 10,
            padding: 32,
            textAlign: "center",
            background: dragActive ? "rgba(59, 130, 246, 0.05)" : "transparent",
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            {dragActive ? "Soltá aquí" : "Arrastrá archivo o hacé clic"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            Excel, CSV, PDF o imagen
          </div>
        </div>

        {/* Ejemplo de estructura */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            📋 Estructura esperada
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(0,0,0,0.05)",
              border: "1px solid var(--border)",
              fontSize: 10,
              color: "var(--muted)",
              fontFamily: "monospace",
              lineHeight: 1.6,
              overflow: "auto",
            }}
          >
            <div>
              <strong style={{ color: "var(--text)" }}>Columnas:</strong> fecha, hora,
              monto, método_pago, empleado, descripción
            </div>
            <div style={{ marginTop: 8 }}>
              <strong style={{ color: "var(--text)" }}>Ejemplo:</strong>
            </div>
            <div>2026-04-01 | 08:30 | 150.50 | efectivo | Juan | Venta</div>
            <div>2026-04-01 | 09:15 | 250.00 | mercado_pago | Maria | Online</div>
          </div>
        </div>

        {/* Descargar template */}
        <button
          onClick={downloadTemplate}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "#3B82F6",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 16,
            transition: "background 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)")
          }
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          📥 Descargar template CSV
        </button>

        {/* Nota de seguridad */}
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "rgba(52, 168, 219, 0.1)",
            border: "1px solid rgba(52, 168, 219, 0.2)",
            fontSize: 10,
            color: "#0369A1",
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          <strong>🔒 Privacidad:</strong> Solo usamos tus datos para calcular
          tendencias. No los guardamos después de procesar.
        </div>

        {/* Tip */}
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            fontSize: 10,
            color: "#7C3AED",
            lineHeight: 1.5,
          }}
        >
          <strong>💡 Tip:</strong> Incluí transacciones de 8-30 días para máxima
          precisión de calibración.
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleInputChange}
          style={{ display: "none" }}
          aria-label="Seleccionar archivo para cargar"
        />
      </div>
    );
  }

  // Estado: SKIPPED
  if (flowState === "skipped") {
    return null;
  }

  return null;
}
