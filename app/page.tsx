"use client";
import Nav from "./components/Nav";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Alerta = {
  tipo: string;
  prioridad: string;
  mensaje: string;
  accion: string;
  timestamp: string;
  datos?: Record<string, unknown>;
};

type Prediccion = {
  disponible: boolean;
  resumen?: {
    facturacion_esperada_mes: { min: number; esperado: number; max: number };
    perdida_esperada_mes: { esperado: number };
    semaforo: "verde" | "amarillo" | "rojo";
    porcentaje_perdida: number;
  };
  facturacion?: {
    disponible: boolean;
    ventas_acumuladas_mes: number;
    venta_diaria_esperada: number;
    confianza: { nivel: string; pct: number };
  };
};

type DataQuality = { score: number; detalle?: Record<string, number> };

type Analisis = {
  señales?: Alerta[];
  score?: number;
  data_quality_score?: number | DataQuality;
};

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function dqScore(dq: number | DataQuality | undefined): number | null {
  if (dq == null) return null;
  return typeof dq === "object" ? dq.score : dq;
}

function alertVariant(prioridad: string): "ok" | "warn" | "crit" {
  if (["critico", "inconsistencia"].includes(prioridad)) return "crit";
  if (["atencion", "ineficiencia"].includes(prioridad)) return "warn";
  return "ok";
}

function alertTag(prioridad: string): string {
  if (["critico", "inconsistencia"].includes(prioridad)) return "Crítico";
  if (["atencion", "ineficiencia"].includes(prioridad)) return "Atención";
  if (prioridad === "positivo") return "Todo ok";
  return "Info";
}

type ModalData = {
  title: string;
  text: string;
  actionButton?: { text: string; href: string };
};

type WowPattern = {
  id: string;
  icono: string;
  titulo: string;
  descripcion: string;
  duele: string;
  recomendacion: string;
  advertencia: string;
  impacto_pesos: number;
  confianza: number;
  detalle: Record<string, unknown>;
};

type WowModalData = {
  pattern: WowPattern;
};

function HomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { token, ready } = useAuth();

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [pred, setPred] = useState<Prediccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [wowPatterns, setWowPatterns] = useState<WowPattern[]>([]);
  const [wowModalData, setWowModalData] = useState<WowModalData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (params.get("mp_conectado") === "true") {
      setToast({ msg: "Mercado Pago conectado", ok: true });
      window.history.replaceState({}, "", "/");
      setTimeout(() => setToast(null), 4000);
    } else if (params.get("mp_error")) {
      setToast({ msg: `Error MP: ${params.get("mp_error")}`, ok: false });
      window.history.replaceState({}, "", "/");
      setTimeout(() => setToast(null), 5000);
    }
  }, [params]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/landing"); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/analisis`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/alertas`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/predicciones`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/negocio/wow-moment`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([an, al, pr, wow]) => {
      setAnalisis(an);
      setAlertas(al?.alertas || []);
      setPred(pr);
      setWowPatterns(wow?.patrones || []);
      setLoading(false);
    });
  }, [ready, token]);

  const dq = dqScore(analisis?.data_quality_score);
  const critCount = alertas.filter(a => ["critico", "inconsistencia"].includes(a.prioridad)).length;
  const warnCount = alertas.filter(a => ["atencion", "ineficiencia"].includes(a.prioridad)).length;
  const facturacion = pred?.facturacion?.disponible ? pred.facturacion.venta_diaria_esperada : null;
  const perdidaMes = pred?.resumen?.perdida_esperada_mes?.esperado ?? null;
  const confianzaPct = pred?.facturacion?.confianza?.pct ?? null;

  const openModal = (data: ModalData) => setModalData(data);
  const closeModal = () => setModalData(null);

  const openWowModal = (pattern: WowPattern) => setWowModalData({ pattern });
  const closeWowModal = () => setWowModalData(null);

  const dqColor = dq == null ? "#94A3B8" : dq >= 70 ? "#00C48C" : dq >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <>
      {modalData && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10,22,40,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#F5F7FA",
              borderRadius: 20,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0A1628",
                margin: 0,
              }}>
                {modalData.title}
              </h2>
              <button
                onClick={closeModal}
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

            <div style={{
              background: "white",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}>
              <p style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#0A1628",
                margin: 0,
              }}>
                {modalData.text}
              </p>
            </div>

            {modalData.actionButton && (
              <button
                onClick={() => {
                  closeModal();
                  router.push(modalData.actionButton!.href);
                }}
                style={{
                  width: "100%",
                  background: "#007AFF",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                {modalData.actionButton.text}
              </button>
            )}

            <button
              onClick={() => router.push("/nicole")}
              style={{
                width: "100%",
                background: "white",
                color: "#007AFF",
                border: "1px solid #007AFF",
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              ¿Tenés dudas? Hablá con NICOLE →
            </button>

            <button
              onClick={closeModal}
              style={{
                width: "100%",
                background: "#007AFF",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {wowModalData && (
        <div
          onClick={closeWowModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10,22,40,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#F5F7FA",
              borderRadius: 20,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 32 }}>{wowModalData.pattern.icono}</span>
                <h2 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0A1628",
                  margin: 0,
                }}>
                  {wowModalData.pattern.titulo}
                </h2>
              </div>
              <button
                onClick={closeWowModal}
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

            <div style={{
              background: "white",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}>
              <p style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#0A1628",
                margin: 0,
                marginBottom: 16,
              }}>
                {wowModalData.pattern.descripcion}
              </p>

              <div style={{
                background: "#FEF2F2",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderLeft: "4px solid #EF4444",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Impacto
                </div>
                <div style={{ fontSize: 13, color: "#0A1628", lineHeight: 1.5 }}>
                  {wowModalData.pattern.duele}
                </div>
              </div>

              <div style={{
                background: "#F0F9FF",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#007AFF", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  💡 Recomendación
                </div>
                <div style={{ fontSize: 13, color: "#0A1628", lineHeight: 1.5 }}>
                  {wowModalData.pattern.recomendacion}
                </div>
              </div>

              <p style={{
                fontSize: 11,
                lineHeight: 1.5,
                color: "#94A3B8",
                margin: 0,
                fontStyle: "italic",
              }}>
                {wowModalData.pattern.advertencia}
              </p>
            </div>

            <button
              onClick={() => {
                closeWowModal();
                router.push("/nicole");
              }}
              style={{
                width: "100%",
                background: "white",
                color: "#007AFF",
                border: "1px solid #007AFF",
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              Hablá con NICOLE sobre esto →
            </button>

            <button
              onClick={closeWowModal}
              style={{
                width: "100%",
                background: "#007AFF",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main style={{ minHeight: "100vh", background: "#F5F7FA", paddingBottom: 100 }}>

        {toast && (
          <div style={{
            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100,
            background: "white", borderRadius: 12, padding: "12px 20px",
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            color: toast.ok ? "#00C48C" : "#EF4444",
            border: `1px solid ${toast.ok ? "#00C48C40" : "#EF444440"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "80px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase" }}>Cargando...</div>
          </div>
        ) : (
          <div style={{ padding: "16px 16px 0" }}>

            {/* Hero Card */}
            <div
              onClick={() => openModal({
                title: "Facturación estimada hoy",
                text: "NICOLE proyecta tus ventas de hoy en base a tu historial de transacciones. Cuantos más datos tenga, más precisa será la proyección. El número se actualiza cada vez que registrás una venta."
              })}
              style={{
                background: "linear-gradient(135deg, #007AFF 0%, #00C2FF 100%)",
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,122,255,0.25)",
              }}
            >
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 8,
                letterSpacing: 0.5,
              }}>
                Facturación estimada hoy
              </div>

              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 42,
                fontWeight: 800,
                color: "white",
                marginBottom: 16,
                lineHeight: 1,
              }}>
                {facturacion != null ? fmt(facturacion) : "—"}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {perdidaMes != null && (
                  <div style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "white",
                    fontWeight: 600,
                  }}>
                    Pérdida est. mes: {fmt(perdidaMes)}
                  </div>
                )}
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "white",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dqColor,
                    display: "inline-block",
                  }} />
                  Calidad datos: {dq != null ? `${Math.round(dq)}%` : "—"}
                </div>
              </div>
            </div>

            {/* StatRow - 3 cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 24,
            }}>
              {/* Críticas */}
              <div
                onClick={() => openModal({
                  title: "Alertas críticas",
                  text: "Cantidad de inconsistencias críticas detectadas hoy. NICOLE requiere mínimo 2 señales simultáneas para generar una alerta crítica.",
                  actionButton: { text: "Ver alertas →", href: "/alertas" }
                })}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 16,
                  borderTop: `3px solid ${critCount > 0 ? "#EF4444" : "#00C48C"}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748B",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  Críticas
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0A1628",
                }}>
                  {critCount}
                </div>
              </div>

              {/* Atención */}
              <div
                onClick={() => openModal({
                  title: "Alertas de atención",
                  text: "Cantidad de situaciones que requieren atención detectadas hoy. Menor prioridad que las críticas pero vale revisarlas.",
                  actionButton: { text: "Ver alertas →", href: "/alertas" }
                })}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 16,
                  borderTop: `3px solid ${warnCount > 0 ? "#F59E0B" : "#00C48C"}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748B",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  Atención
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0A1628",
                }}>
                  {warnCount}
                </div>
              </div>

              {/* Score */}
              <div
                onClick={() => openModal({
                  title: "Score",
                  text: "El score resume el nivel de inconsistencia operativa del negocio. Se calcula combinando ticket promedio, ratio efectivo/digital y volumen por turno. Sin datos suficientes aparece como —."
                })}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 16,
                  borderTop: "3px solid #007AFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748B",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  Score
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0A1628",
                }}>
                  {analisis?.score != null ? String(analisis.score) : "—"}
                </div>
              </div>
            </div>

            {/* Sección WOW */}
            {wowPatterns.length > 0 && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: 3,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}>
                    // LO QUE ENCONTRÓ NICOLE
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "#64748B",
                    marginBottom: 16,
                  }}>
                    Análisis de tus últimos 30 días · Preliminar
                  </div>
                </div>

                {wowPatterns.slice(0, 3).map((pattern, i) => (
                  <div
                    key={i}
                    onClick={() => openWowModal(pattern)}
                    style={{
                      marginBottom: 12,
                      background: "white",
                      borderRadius: 16,
                      padding: 20,
                      border: "1px solid #E0E7F1",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                      <span style={{ fontSize: 36, lineHeight: 1 }}>{pattern.icono}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#0A1628",
                          marginBottom: 6,
                          lineHeight: 1.3,
                        }}>
                          {pattern.titulo}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: "#EF4444",
                          fontWeight: 600,
                          marginBottom: 8,
                        }}>
                          {pattern.duele}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: "#0A1628",
                          lineHeight: 1.5,
                          marginBottom: 12,
                        }}>
                          {pattern.descripcion}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 12,
                          borderTop: "1px solid #F1F5F9",
                        }}>
                          <div style={{
                            fontSize: 11,
                            color: "#64748B",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}>
                            💡 {pattern.recomendacion}
                          </div>
                          <div style={{
                            fontFamily: "monospace",
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#EF4444",
                          }}>
                            {fmt(pattern.impacto_pesos)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Sección Alertas activas */}
            <div style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: 3,
              color: "#94A3B8",
              textTransform: "uppercase",
              marginBottom: 16,
              marginTop: 24,
            }}>
              // ALERTAS ACTIVAS
            </div>

            {alertas.length === 0 ? (
              <div
                onClick={() => openModal({
                  title: "Sin anomalías detectadas",
                  text: "Tu negocio opera dentro del rango esperado hoy. NICOLE no detectó patrones fuera de lo normal. Esto es una buena señal."
                })}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 20,
                  border: "1px solid #E0E7F1",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{
                      display: "inline-block",
                      background: "#00C48C15",
                      color: "#00C48C",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 6,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}>
                      Todo ok
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0A1628",
                      marginBottom: 4,
                    }}>
                      Sin anomalías detectadas
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: "#64748B",
                    }}>
                      Tu negocio opera dentro del rango esperado.
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#00C48C",
                  }}>
                    En orden ✓
                  </div>
                </div>
              </div>
            ) : (
              alertas.map((a, i) => {
                const variant = alertVariant(a.prioridad);
                const tag = alertTag(a.prioridad);
                const bgColor = variant === "crit" ? "#EF444415" : variant === "warn" ? "#F59E0B15" : "#00C48C15";
                const textColor = variant === "crit" ? "#EF4444" : variant === "warn" ? "#F59E0B" : "#00C48C";

                return (
                  <div
                    key={i}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      padding: 20,
                      border: "1px solid #E0E7F1",
                      marginBottom: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{
                      display: "inline-block",
                      background: bgColor,
                      color: textColor,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 6,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}>
                      {tag}
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0A1628",
                      marginBottom: 4,
                    }}>
                      {a.mensaje}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: "#64748B",
                      marginBottom: 8,
                    }}>
                      {a.accion}
                    </div>
                    {a.timestamp && (
                      <div style={{
                        fontSize: 11,
                        color: "#94A3B8",
                        fontFamily: "monospace",
                      }}>
                        {new Date(a.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <Nav />
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
