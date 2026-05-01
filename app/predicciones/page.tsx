"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import DataQualityCard from "../components/DataQualityCard";
import { usePush } from "../hooks/usePush";
import { HeroCard, PageHeader, PredCard, AlertCard } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function formatFecha(iso: string) {
  const d = new Date(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

type Evento = { tipo: string; intensidad: number; descripcion: string };

type Prediccion = {
  fecha_target: string;
  valor_predicho: number;
  confianza: number;
  horizonte: string;
  senales_usadas: { W1: number; W3: number; dias_datos: number; eventos_contexto: Evento[] };
};

type RespuestaPredicciones = {
  disponible: boolean;
  motivo?: string;
  horizonte?: string;
  dias_datos?: number;
  confianza?: number;
  pesos?: { W1: number; W2: number; W3: number };
  predicciones?: Prediccion[];
  mensaje_nicole?: string;
};

function iconoEvento(tipo: string) {
  if (tipo === "quincena")  return "💸";
  if (tipo === "aguinaldo") return "⭐";
  if (tipo === "feriado")   return "📅";
  return "◆";
}

function CardDia({ p, mensajeNicole, esHoy }: { p: Prediccion; mensajeNicole?: string; esHoy: boolean }) {
  const [expandido, setExpandido] = useState(false);
  const eventos = p.senales_usadas?.eventos_contexto ?? [];
  const pctConf = Math.round(p.confianza * 100);
  const warningBadge = pctConf < 55 ? "Confianza baja · pocos datos" : undefined;
  const eventLabel = eventos.map(e => `${iconoEvento(e.tipo)} ${e.descripcion}`).join(" · ");

  return (
    <div onClick={() => setExpandido(v => !v)} style={{ cursor: "pointer" }}>
      <PredCard
        title={`${formatFecha(p.fecha_target)}${esHoy ? " · HOY" : ""}${eventLabel ? ` — ${eventLabel}` : ""}`}
        rows={[
          { label: "Ventas esperadas", value: fmt(p.valor_predicho) },
          ...(esHoy && mensajeNicole ? [] : []),
        ]}
        confidence={pctConf}
        confidenceLabel={`Confianza ${pctConf}% · ${p.senales_usadas?.dias_datos ?? 0} días de datos`}
        warningBadge={warningBadge}
      />
      {expandido && (
        <div style={{ margin: "-2px 12px 8px", background: "var(--card2)", borderRadius: "0 0 14px 14px", padding: "12px 14px", border: "1px solid var(--border)", borderTop: "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Señal propia</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "var(--emerald)" }}>
                {Math.round((p.senales_usadas?.W1 ?? 0) * 100)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Contexto país</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "var(--yellow)" }}>
                {Math.round((p.senales_usadas?.W3 ?? 0) * 100)}%
              </div>
            </div>
            {eventos.length > 0 && (
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Impacto eventos</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "var(--yellow)" }}>
                  ×{eventos.reduce((a, e) => a * e.intensidad, 1).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {esHoy && mensajeNicole && (
        <div style={{ margin: "-2px 12px 8px", background: "linear-gradient(135deg,#007AFF08,#00C2FF05)", borderRadius: "0 0 14px 14px", padding: "12px 14px", border: "1px solid #007AFF15", borderTop: "none" }}>
          <div style={{ fontSize: 9, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>NICOLE</div>
          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{mensajeNicole}</div>
        </div>
      )}
    </div>
  );
}

type ModalData = {
  title: string;
  text: string;
};

export default function Predicciones() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<RespuestaPredicciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  usePush(token);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
    fetch(`${API}/api/predicciones`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const predicciones = data?.predicciones ?? [];
  const hoyStr = new Date().toISOString().slice(0, 10);
  const totalSemana = predicciones.slice(0, 7).reduce((s, p) => s + p.valor_predicho, 0);

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
                whiteSpace: "pre-line",
              }}>
                {modalData.text}
              </p>
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
      <PageHeader title="Predicciones" sub="NICOLE · próximos 7 días" />

      <DataQualityCard variant="predicciones" title="Confianza de predicción" />

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Analizando...</div>
        </div>
      ) : !data?.disponible ? (
        <>
          <AlertCard
            variant="ok"
            tag="Aprendiendo"
            title="NICOLE necesita más datos para predecir"
            desc={`Seguí registrando tus ventas. ${data?.dias_datos != null ? `Tenés ${data.dias_datos} / 3 días mínimos.` : "Se necesitan al menos 3 días de historial."}`}
          />
        </>
      ) : (
        <>
          {totalSemana > 0 && (
            <div onClick={() => openModal({
              title: "¿Cómo se calcula esta proyección?",
              text: "NICOLE combina dos señales para predecir tus ventas de la semana:\n\n• Señal propia: tu historial real de ventas de las últimas semanas\n• Contexto Argentina: calendario económico (quincena, aguinaldo, feriados)\n\nCuantos más días de datos tengas, mayor es la confianza de la predicción. Con 30+ días, la confianza llega al 95%."
            })} style={{ cursor: "pointer" }}>
              <HeroCard
                gradient="green"
                label="Proyección esta semana"
                value={fmt(totalSemana)}
                sub={`Confianza ${Math.round((data.confianza ?? 0) * 100)}%`}
              />
            </div>
          )}

          {predicciones.map(p => (
            <CardDia
              key={p.fecha_target}
              p={p}
              esHoy={p.fecha_target === hoyStr}
              mensajeNicole={p.fecha_target === hoyStr ? data.mensaje_nicole : undefined}
            />
          ))}

          <div style={{ margin: "4px 12px 8px", background: "var(--card2)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7 }}>
              Las predicciones combinan tus ventas históricas con el calendario económico argentino — quincenas, aguinaldo y feriados. La confianza crece con más datos propios.
            </div>
          </div>
        </>
      )}

      <Nav />
    </main>
    </>
  );
}
