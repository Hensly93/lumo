"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { useSucursal } from "../hooks/useSucursal";
import { HeroCard, PageHeader, PredCard, AlertCard } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}
function fmtSigno(n: number) {
  return (n > 0 ? "+" : "−") + "$" + Math.abs(Math.round(n)).toLocaleString("es-AR");
}

const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

// Las fechas llegan como "YYYY-MM-DD". Se leen al mediodía para que la zona horaria
// no las corra al día anterior (bug de la versión vieja).
function formatFecha(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

type Evento = { tipo: string; intensidad: number; descripcion: string };
type Efecto = { variable: string; descripcion: string; efecto_pesos: number };
type ClimaDia = { clima: string; precipitacion_mm?: number; temp_max?: number };
type Hora = { hora: number; esperado: number };

type Prediccion = {
  fecha_target: string;
  dia_semana?: string;
  valor_predicho: number;
  rango_min?: number;
  rango_max?: number;
  tickets_esperados?: number | null;
  ticket_promedio?: number | null;
  base_dia_semana?: number;
  dias_base?: number;
  efectos?: Efecto[];
  clima_pronostico?: Record<string, ClimaDia> | null;
  franjas?: { por_hora: Hora[]; hora_pico: Hora; hora_floja: Hora } | null;
  confianza: number;
  horizonte: string;
  senales_usadas?: { dias_datos?: number; eventos_contexto?: Evento[] };
};

type Coeficiente = {
  variable: string;
  descripcion: string;
  factor: number;
  prior: number;
  dias_observados: number;
  fuente: "aprendido" | "prior";
};

type RespuestaPredicciones = {
  disponible: boolean;
  motivo?: string;
  dias_con_ventas?: number;
  minimo_requerido?: number;
  ventana_dias?: number;
  horizonte?: string;
  dias_datos?: number;
  confianza?: number;
  modelo?: {
    tipo: "condiciones" | "simple";
    error_tipico_pct?: number;
    coeficientes?: Coeficiente[];
    motivo?: string;
  };
  predicciones?: Prediccion[];
  mensaje_nicole?: string;
};

function iconoEvento(tipo: string) {
  if (tipo === "quincena")  return "💸";
  if (tipo === "aguinaldo") return "⭐";
  if (tipo === "feriado")   return "📅";
  return "◆";
}

function iconoClima(clima: string) {
  if (clima === "lluvia") return "🌧️";
  if (clima === "calor_extremo") return "🔥";
  if (clima === "frio_extremo") return "❄️";
  if (clima === "normal") return "⛅";
  return "";
}

// Clima "dominante" del día entre sucursales: si alguna tiene lluvia, se muestra lluvia.
function climaDelDia(p: Prediccion): string | null {
  const vals = Object.values(p.clima_pronostico ?? {}).map(c => c.clima).filter(c => c && c !== "desconocido");
  if (!vals.length) return null;
  for (const c of ["lluvia", "calor_extremo", "frio_extremo"]) if (vals.includes(c)) return c;
  return "normal";
}

const etiqueta: CSSProperties = { fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 };
const valorChico: CSSProperties = { fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "var(--text)" };

function CardDia({ p }: { p: Prediccion }) {
  const [expandido, setExpandido] = useState(false);
  const eventos = p.senales_usadas?.eventos_contexto ?? [];
  const efectos = p.efectos ?? [];
  const pctConf = Math.round(p.confianza * 100);
  const warningBadge = pctConf < 55 ? "Confianza baja · pocos datos" : undefined;
  const clima = climaDelDia(p);
  const extras = [
    clima && clima !== "normal" ? `${iconoClima(clima)} ${clima === "lluvia" ? "Lluvia" : clima === "calor_extremo" ? "Calor" : "Frío"}` : "",
    ...eventos.map(e => `${iconoEvento(e.tipo)} ${e.descripcion}`),
  ].filter(Boolean).join(" · ");

  const rows = [{ label: "Ventas esperadas", value: fmt(p.valor_predicho) }];
  if (p.rango_min != null && p.rango_max != null) {
    rows.push({ label: "Rango probable", value: `${fmt(p.rango_min)} – ${fmt(p.rango_max)}` });
  }

  return (
    <div onClick={() => setExpandido(v => !v)} style={{ cursor: "pointer" }}>
      <PredCard
        title={`${formatFecha(p.fecha_target)}${extras ? ` — ${extras}` : ""}`}
        rows={rows}
        confidence={pctConf}
        confidenceLabel={`Confianza ${pctConf}% · tocá para ver por qué`}
        warningBadge={warningBadge}
      />
      {expandido && (
        <div style={{ margin: "-2px 12px 8px", background: "var(--card2)", borderRadius: "0 0 14px 14px", padding: "12px 14px", border: "1px solid var(--border)", borderTop: "none" }}>

          {/* Números del día */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div>
              <div style={etiqueta}>Tickets</div>
              <div style={valorChico}>{p.tickets_esperados ?? "—"}</div>
            </div>
            <div>
              <div style={etiqueta}>Ticket prom.</div>
              <div style={valorChico}>{p.ticket_promedio ? fmt(p.ticket_promedio) : "—"}</div>
            </div>
            <div>
              <div style={etiqueta}>Días base</div>
              <div style={valorChico}>{p.dias_base ?? "—"}</div>
            </div>
          </div>

          {/* ¿Por qué este número? */}
          <div style={etiqueta}>¿Por qué este número?</div>
          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.7, marginBottom: 12 }}>
            {p.base_dia_semana != null && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Un {p.dia_semana ?? "día"} normal tuyo</span>
                <strong>{fmt(p.base_dia_semana)}</strong>
              </div>
            )}
            {efectos.map(e => (
              <div key={e.variable} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{e.descripcion}</span>
                <strong style={{ color: e.efecto_pesos >= 0 ? "var(--emerald)" : "var(--red, #E5484D)" }}>{fmtSigno(e.efecto_pesos)}</strong>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 4 }}>
              <span>Esperado</span>
              <strong>{fmt(p.valor_predicho)}</strong>
            </div>
          </div>

          {/* Franjas */}
          {p.franjas && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={etiqueta}>Hora pico</div>
                <div style={{ ...valorChico, color: "var(--emerald)" }}>
                  {p.franjas.hora_pico.hora} h · {fmt(p.franjas.hora_pico.esperado)}
                </div>
              </div>
              <div>
                <div style={etiqueta}>Hora más floja</div>
                <div style={{ ...valorChico, color: "var(--yellow)" }}>
                  {p.franjas.hora_floja.hora} h · {fmt(p.franjas.hora_floja.esperado)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function pct(factor: number) {
  const v = Math.round((factor - 1) * 1000) / 10;
  return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toLocaleString("es-AR") + "%";
}

function Aprendido({ coef, errorTipico }: { coef: Coeficiente[]; errorTipico?: number }) {
  const conDatos = coef.filter(c => c.fuente === "aprendido" && c.dias_observados > 0);
  const sinDatos = coef.filter(c => c.fuente === "prior" || c.dias_observados === 0);
  return (
    <div style={{ margin: "4px 12px 8px", background: "var(--card2)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
      <div style={{ ...etiqueta, marginBottom: 8 }}>Lo que NICOLE aprendió de tu negocio</div>
      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.8 }}>
        {conDatos.map(c => (
          <div key={c.variable} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{c.descripcion} <span style={{ color: "var(--muted)" }}>({c.dias_observados} {c.variable === "tendencia" ? "días" : "obs."})</span></span>
            <strong style={{ color: c.factor >= 1 ? "var(--emerald)" : "var(--red, #E5484D)" }}>{pct(c.factor)}</strong>
          </div>
        ))}
      </div>
      {sinDatos.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>
          Todavía sin datos propios: {sinDatos.map(c => c.descripcion.toLowerCase()).join(", ")}. Mientras tanto se usa un valor de referencia.
        </div>
      )}
      {errorTipico != null && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          Margen de error típico: ±{errorTipico.toLocaleString("es-AR")}%
        </div>
      )}
    </div>
  );
}

type ModalData = {
  title: string;
  text: string;
};

const TEXTO_MODELO =
  "NICOLE no compara a ciegas el martes que viene con el martes pasado.\n\n" +
  "1. Limpia cada día pasado de lo que lo afectó: si llovió, si era quincena o feriado, y la tendencia de esas semanas.\n\n" +
  "2. Con eso calcula cómo es un día normal tuyo, para cada día de la semana y cada sucursal.\n\n" +
  "3. A ese día normal le aplica lo que va a pasar: el pronóstico del clima de cada sucursal, el calendario y la tendencia.\n\n" +
  "Cuánto te afecta cada cosa lo aprende de tus propias ventas. Al principio usa valores de referencia y los va corrigiendo con tus datos.";

export default function Predicciones() {
  const router = useRouter();
  const { sucursalId } = useSucursal();
  const [data, setData] = useState<RespuestaPredicciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setLoading(true);
    fetch(`${API}/api/predicciones${sucursalId ? `?sucursal_id=${sucursalId}` : ""}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sucursalId]);

  const predicciones = data?.predicciones ?? [];
  const totalSemana = predicciones.slice(0, 7).reduce((s, p) => s + p.valor_predicho, 0);
  const modelo = data?.modelo;

  const openModal = (d: ModalData) => setModalData(d);
  const closeModal = () => setModalData(null);

  let textoNoDisponible = "Seguí registrando tus ventas. Se necesitan al menos 3 días con ventas.";
  if (data?.motivo === "sin_ventas_recientes") {
    textoNoDisponible = `No hay ventas en los últimos ${data.ventana_dias ?? 60} días. NICOLE predice con tus ventas recientes: cuando vuelvas a registrar al menos ${data.minimo_requerido ?? 3} días, aparecen las predicciones.`;
  } else if (data?.dias_con_ventas != null) {
    textoNoDisponible = `Seguí registrando tus ventas. Tenés ${data.dias_con_ventas} de ${data.minimo_requerido ?? 3} días mínimos.`;
  }

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

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Analizando...</div>
        </div>
      ) : !data?.disponible ? (
        <AlertCard
          variant="ok"
          tag="Aprendiendo"
          title="NICOLE necesita más datos para predecir"
          desc={textoNoDisponible}
        />
      ) : (
        <>
          {totalSemana > 0 && (
            <div onClick={() => openModal({ title: "¿Cómo predice NICOLE?", text: TEXTO_MODELO })} style={{ cursor: "pointer" }}>
              <HeroCard
                gradient="green"
                label="Proyección próximos 7 días"
                value={fmt(totalSemana)}
                sub={`Confianza ${Math.round((data.confianza ?? 0) * 100)}% · tocá para ver cómo se calcula`}
              />
            </div>
          )}

          {data.mensaje_nicole && (
            <div style={{ margin: "4px 12px 8px", background: "linear-gradient(135deg,#007AFF08,#00C2FF05)", borderRadius: 14, padding: "12px 14px", border: "1px solid #007AFF15" }}>
              <div style={{ fontSize: 9, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>NICOLE</div>
              <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{data.mensaje_nicole}</div>
            </div>
          )}

          {predicciones.map(p => (
            <CardDia key={p.fecha_target} p={p} />
          ))}

          {modelo?.tipo === "condiciones" && modelo.coeficientes && (
            <Aprendido coef={modelo.coeficientes} errorTipico={modelo.error_tipico_pct} />
          )}

          <div style={{ margin: "4px 12px 8px", background: "var(--card2)", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7 }}>
              {modelo?.tipo === "simple"
                ? "Con menos de 14 días de ventas, NICOLE usa tu promedio por día de la semana y el calendario. Desde los 14 días suma clima y tendencia, y aprende cuánto te afecta cada uno."
                : "Las predicciones combinan tus ventas, el pronóstico del clima de cada sucursal y el calendario argentino (quincenas, aguinaldo y feriados). Tocá cada día para ver qué movió el número."}
            </div>
          </div>
        </>
      )}

      <Nav />
    </main>
    </>
  );
}
