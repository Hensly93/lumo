"use client";
import Nav from "../components/Nav";
import DataQualityCard from "../components/DataQualityCard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { PageHeader, FilterChips, StatRow, StatCard, AlertCard, SectionTitle } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Alerta = {
  id_interno: string;
  tipo: string;
  prioridad: string;
  mensaje: string;
  accion: string;
  timestamp: string;
  feedback?: { confirmada: boolean | null; descartada: boolean };
  datos?: Record<string, unknown>;
};

type Recomendacion = {
  id: string;
  categoria: string;
  prioridad: string;
  mensaje: string;
  accion: string;
};

type AlertasResp = {
  alertas: Alerta[];
  suprimidas: number;
  stats?: {
    total: number;
    criticos: number;
    atencion: number;
    positivos: number;
    caps: { fuertes_usadas: number; fuertes_max: number; total_usadas: number; total_max: number };
  };
};

const FILTROS = ["Todas", "Críticas", "Atención", "Positivas"] as const;
type Filtro = typeof FILTROS[number];

function alertVariant(prioridad: string): "ok" | "warn" | "crit" {
  if (["critico", "inconsistencia"].includes(prioridad)) return "crit";
  if (["atencion", "ineficiencia", "error_operativo"].includes(prioridad)) return "warn";
  return "ok";
}

function alertTag(prioridad: string): string {
  if (["critico", "inconsistencia"].includes(prioridad)) return "Crítico";
  if (["atencion", "ineficiencia", "error_operativo"].includes(prioridad)) return "Atención";
  if (prioridad === "positivo") return "Todo ok";
  return "Info";
}

function matchFiltro(a: Alerta, f: Filtro) {
  if (f === "Todas") return true;
  if (f === "Críticas") return ["critico", "inconsistencia"].includes(a.prioridad);
  if (f === "Atención") return ["atencion", "ineficiencia", "error_operativo"].includes(a.prioridad);
  if (f === "Positivas") return ["positivo", "info"].includes(a.prioridad);
  return true;
}

function recVariant(prioridad: string): "ok" | "warn" | "crit" {
  if (prioridad === "critica") return "crit";
  if (prioridad === "alta") return "warn";
  return "ok";
}

type ModalData = {
  title: string;
  text: string;
  details?: {
    description: string;
    evidence?: string;
    action: string;
    calculation: string;
  };
};

export default function Alertas() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [alertasResp, setAlertasResp] = useState<AlertasResp | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Record<string, "confirmada" | "descartada">>({});
  const [modalData, setModalData] = useState<ModalData | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/alertas`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/recomendaciones`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([al, rec]) => {
      setAlertasResp(al);
      setRecomendaciones(rec?.recomendaciones || []);
      setLoading(false);
    });
  }, [ready, token]);

  async function darFeedback(idInterno: string, confirmada: boolean) {
    setFeedbacks(f => ({ ...f, [idInterno]: confirmada ? "confirmada" : "descartada" }));
    await fetch(`${API}/api/alertas/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ alerta_id: idInterno, confirmada }),
    }).catch(() => null);
  }

  const alertas = alertasResp?.alertas || [];
  const stats = alertasResp?.stats;
  const filtradas = alertas.filter(a => matchFiltro(a, filtro));

  const today = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const capLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const chips = FILTROS.map(f => ({
    label: f === "Todas"
      ? `Todas (${alertas.length})`
      : f === "Críticas"
      ? `Críticas (${stats?.criticos ?? 0})`
      : f === "Atención"
      ? `Atención (${stats?.atencion ?? 0})`
      : `Positivas (${stats?.positivos ?? 0})`,
    active: filtro === f,
    onClick: () => setFiltro(f),
  }));

  const openModal = (data: ModalData) => setModalData(data);
  const closeModal = () => setModalData(null);

  return (
    <>
      {modalData && (
        <div
          onClick={closeModal}
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
                marginBottom: modalData.details ? 20 : 0,
              }}>
                {modalData.text}
              </p>

              {modalData.details && (
                <>
                  {modalData.details.evidence && (
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 8 }}>
                        Evidencia
                      </h3>
                      <p style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628", margin: 0 }}>
                        {modalData.details.evidence}
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 8 }}>
                      Acción recomendada
                    </h3>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628", margin: 0 }}>
                      {modalData.details.action}
                    </p>
                  </div>

                  <div style={{ background: "#F0F9FF", borderRadius: 12, padding: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 8 }}>
                      ¿Cómo lo detectó NICOLE?
                    </h3>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628", margin: 0 }}>
                      {modalData.details.calculation}
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => router.push("/nicole")}
              style={{
                width: "100%",
                background: "white",
                color: "#007AFF",
                border: "1px solid #007AFF",
                borderRadius: 12,
                padding: "14px",
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
      )}

    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>

      <PageHeader title="Alertas" sub={loading ? "Analizando..." : `${capLabel(today)} · ${alertas.length} activas`} />

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Analizando...</div>
        </div>
      ) : (
        <>
          <DataQualityCard variant="mini" hideIfGood={true} />

          <FilterChips chips={chips} />

          {stats && (
            <StatRow>
              <div onClick={() => openModal({
                title: "Alertas Críticas",
                text: "Alertas críticas son inconsistencias con z-score mayor a 3.0. Requieren atención inmediata. NICOLE detectó al menos 2 señales simultáneas fuera del rango normal para generarlas."
              })} style={{ cursor: "pointer" }}>
                <StatCard label="Críticas" value={String(stats.criticos)} color="red" />
              </div>
              <div onClick={() => openModal({
                title: "Alertas de Atención",
                text: "Alertas de atención son inconsistencias moderadas. No son urgentes pero conviene revisarlas dentro del turno. Pueden indicar patrones que se están desarrollando."
              })} style={{ cursor: "pointer" }}>
                <StatCard label="Atención" value={String(stats.atencion)} color="yellow" />
              </div>
              <div onClick={() => openModal({
                title: "Alertas Positivas",
                text: "Registros positivos son turnos o períodos donde todo operó dentro del rango esperado o mejor. Celebramos lo que funciona bien."
              })} style={{ cursor: "pointer" }}>
                <StatCard label="Positivas" value={String(stats.positivos)} color="green" />
              </div>
            </StatRow>
          )}

          {filtradas.length === 0 ? (
            <AlertCard
              variant="ok"
              tag="Todo ok"
              title="Sin alertas en esta categoría"
              desc="Todo dentro del rango esperado."
            />
          ) : (
            filtradas.map((a, i) => {
              const fb = feedbacks[a.id_interno];
              const evidence = a.datos ? Object.entries(a.datos).map(([k, v]) => `${k}: ${v}`).join(", ") : undefined;

              return (
                <div
                  key={i}
                  onClick={() => openModal({
                    title: a.mensaje,
                    text: fb
                      ? (fb === "confirmada" ? "Esta alerta fue confirmada. NICOLE ajustó su motor para detectar mejor este tipo de inconsistencias." : "Esta alerta fue descartada como falso positivo. NICOLE ajustó su motor para reducir este tipo de alertas.")
                      : a.tipo || "Inconsistencia detectada",
                    details: {
                      description: a.mensaje,
                      evidence,
                      action: a.accion,
                      calculation: "NICOLE analiza múltiples señales en tiempo real (ticket promedio, ratio efectivo/digital, volumen por turno) y compara cada métrica con tu baseline histórico. Cuando detecta al menos 2 desviaciones simultáneas con z-score fuera del rango normal, genera una alerta.",
                    }
                  })}
                  style={{ cursor: "pointer" }}
                >
                  <AlertCard
                    variant={alertVariant(a.prioridad)}
                    tag={alertTag(a.prioridad)}
                    title={a.mensaje}
                    desc={fb ? (fb === "confirmada" ? "Confirmada — motor ajustado" : "Descartada — motor ajustado") : a.accion}
                    time={a.timestamp
                      ? new Date(a.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                      : undefined}
                    actions={fb ? undefined : {
                      primary: "Es real",
                      secondary: "Falso positivo",
                      onPrimary: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        darFeedback(a.id_interno, true);
                      },
                      onSecondary: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        darFeedback(a.id_interno, false);
                      },
                    }}
                  />
                </div>
              );
            })
          )}

          {recomendaciones.length > 0 && (
            <>
              <SectionTitle>Recomendaciones</SectionTitle>
              {recomendaciones.map((r, i) => (
                <AlertCard
                  key={i}
                  variant={recVariant(r.prioridad)}
                  tag={`${r.prioridad.toUpperCase()} · ${r.categoria.replace(/_/g, " ")}`}
                  title={r.mensaje}
                  desc={r.accion}
                />
              ))}
            </>
          )}
        </>
      )}

      <Nav />
    </main>
    </>
  );
}
