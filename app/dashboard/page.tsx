"use client";
import Nav from "../components/Nav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { darkTheme as T } from "../theme";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type DiaSemana = { dia: string; total: number };
type TurnoDato = { turno: string; ventas: number; eficiencia: number };

type PerfilNegocio = {
  tipo_negocio: string;
  capa_2: Array<{ metrica: string; valor_actual: number; total_transacciones: number }>;
  capas: {
    total_transacciones: number;
    peso_capa_1: number;
    peso_capa_2: number;
    porcentaje_progreso_capa_2: number;
    transacciones_restantes: number;
    capa_2_completa: boolean;
  };
};

type Prediccion = {
  disponible: boolean;
  facturacion?: {
    disponible: boolean;
    ventas_acumuladas_mes: number;
    venta_diaria_esperada: number;
    proyeccion_mes_completo: { min: number; esperado: number; max: number };
    confianza: { nivel: string; pct: number };
    factores_aplicados: { tendencia: number; quincena: number };
  };
  perdidas?: {
    disponible: boolean;
    perdida_acumulada_mes: number;
    brecha_promedio_por_turno: number;
    tendencia: string;
    proyeccion_perdida_mes_completo: { esperado: number };
  };
};

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

type ModalType = "facturacion" | "perdida" | "venta_diaria" | "brecha" | "ventas7d" | "turnos" | "precision" | null;

export default function Dashboard() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [perfil, setPerfil] = useState<PerfilNegocio | null>(null);
  const [pred, setPred] = useState<Prediccion | null>(null);
  const [ventas7d, setVentas7d] = useState<DiaSemana[]>([]);
  const [turnos, setTurnos] = useState<TurnoDato[]>([]);
  const [loading, setLoading] = useState(true);
  const [negocio, setNegocio] = useState("");
  const [modalOpen, setModalOpen] = useState<ModalType>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }

    const u = localStorage.getItem("lumo_usuario");
    if (u) setNegocio(JSON.parse(u).negocio || "");

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/negocio/perfil`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/predicciones`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/ventas-diarias?dias=14`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([p, pr, vd]) => {
      setPerfil(p);
      setPred(pr);

      // Ventas reales por día (últimos 14, mostramos 7)
      if (vd?.dias?.length > 0) {
        const ultimos7 = vd.dias.slice(-7);
        const DIAS_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        setVentas7d(ultimos7.map((d: { dia: string; total: number }) => ({
          dia: DIAS_LABEL[new Date(d.dia).getDay()],
          total: d.total,
        })));
      }

      // Turnos desde baseline
      if (p?.capa_2) {
        const turnosData: TurnoDato[] = [];
        ["MANANA", "TARDE", "NOCHE"].forEach((t, i) => {
          const m = p.capa_2.find((x: { metrica: string }) => x.metrica === `ventas_${t.toLowerCase()}_promedio`);
          const nombres = ["Mañana", "Tarde", "Noche"];
          const base2 = p.capa_2.find((x: { metrica: string }) => x.metrica === "ventas_por_turno");
          const refVal = base2?.valor_actual || 1;
          const val = m?.valor_actual || (refVal * (0.9 - i * 0.1));
          const eficiencia = Math.min(99, Math.round((val / (refVal * 1.2)) * 100));
          turnosData.push({ turno: nombres[i], ventas: val, eficiencia });
        });
        if (turnosData.some(t => t.ventas > 0)) setTurnos(turnosData);
      }

      setLoading(false);
    });
  }, [ready, token]);

  const max = Math.max(...ventas7d.map(d => d.total), 1);

  const efColor = (ef: number) => ef >= 75 ? T.green : ef >= 50 ? T.yellow : T.red;

  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalOpen(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setModalOpen(null);
    }
  };

  const renderModal = () => {
    if (!modalOpen) return null;

    const modals = {
      facturacion: {
        title: "Facturación este mes",
        content: (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Qué es la facturación del mes?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Es la suma total de todas tus ventas registradas en el mes actual. NICOLE acumula cada transacción para darte una visión en tiempo real de tu facturación.
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Cómo funciona la proyección?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Basándose en tu historial de ventas, tendencias y el promedio diario, NICOLE calcula cuánto facturarás al final del mes. La proyección incluye un rango (mínimo, esperado, máximo) para darte una visión realista.
            </p>
            <div style={{ background: "#F0F9FF", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 600, marginBottom: 8 }}>
                💡 Consejo
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628" }}>
                Si tu facturación está por debajo de la proyección, revisá tus turnos de menor rendimiento para identificar oportunidades de mejora.
              </div>
            </div>
          </>
        ),
      },
      perdida: {
        title: "Pérdida acumulada",
        content: (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Qué es la pérdida acumulada?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Es la diferencia entre lo que esperabas vender (según tu baseline) y lo que realmente vendiste. NICOLE detecta estas brechas cuando cerrás cada turno.
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Cómo se calcula?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Cada vez que cerrás un turno, NICOLE compara la venta real con el promedio esperado. Si vendiste menos, se suma a la pérdida acumulada del mes. La tendencia te indica si está mejorando o empeorando.
            </p>
            <div style={{ background: "#FFF5F5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 600, marginBottom: 8 }}>
                ⚠️ Alerta
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628" }}>
                Una pérdida creciente puede indicar hurtos, errores de registro o problemas operativos. Revisá las alertas de NICOLE para más detalles.
              </div>
            </div>
          </>
        ),
      },
      venta_diaria: {
        title: "Venta diaria estimada",
        content: (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Qué es la venta diaria estimada?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Es el promedio que NICOLE espera que vendas por día, basándose en tu historial reciente. Este número considera tendencias, estacionalidad y el patrón de ventas de tu negocio.
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              Nivel de confianza
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              NICOLE calcula un nivel de confianza (bajo, medio, alto) que indica qué tan precisa es la estimación. Más datos históricos = mayor confianza.
            </p>
            <div style={{ background: "#F0FFF8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 600, marginBottom: 8 }}>
                ✅ Tip
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628" }}>
                Usá esta métrica para establecer metas diarias realistas para tu equipo. Si un día estás muy por debajo, puede indicar un problema operativo.
              </div>
            </div>
          </>
        ),
      },
      brecha: {
        title: "Brecha promedio por turno",
        content: (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Qué es la brecha por turno?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Es la diferencia promedio entre lo esperado y lo real en cada turno cerrado. Si la brecha es grande, puede indicar inconsistencias operativas o problemas sistemáticos.
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Por qué importa?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Una brecha alta y constante puede señalar hurtos, errores humanos o problemas en el proceso de cierre de turno. NICOLE te alerta cuando detecta patrones anormales.
            </p>
            <div style={{ background: "#FFFBF0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 600, marginBottom: 8 }}>
                💡 Análisis
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628" }}>
                Compará esta métrica con el rendimiento por turno para identificar qué momentos del día tienen mayores inconsistencias.
              </div>
            </div>
          </>
        ),
      },
      ventas7d: {
        title: "Ventas últimos 7 días",
        content: (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Qué muestra este gráfico?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Este gráfico te muestra las ventas reales de los últimos 7 días. El día actual aparece destacado en azul para que veas rápidamente tu rendimiento reciente.
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Para qué sirve?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Te ayuda a identificar patrones semanales, días de alto/bajo rendimiento, y tendencias recientes. Podés comparar el día actual con días anteriores para saber si vas bien.
            </p>
            <div style={{ background: "#F0F9FF", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 600, marginBottom: 8 }}>
                📊 Insight
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628" }}>
                Si notás una caída abrupta, revisá las alertas de NICOLE. Podría haber detectado anomalías o problemas operativos.
              </div>
            </div>
          </>
        ),
      },
      turnos: {
        title: "Rendimiento por turno",
        content: (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Cómo se mide el rendimiento?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              NICOLE compara las ventas de cada turno (Mañana, Tarde, Noche) con tu baseline histórico. La eficiencia muestra qué tan cerca estás del rendimiento óptimo esperado.
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              Códigos de color
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              <strong style={{ color: "#00C48C" }}>Verde (≥75%)</strong>: Rendimiento excelente<br/>
              <strong style={{ color: "#F59E0B" }}>Amarillo (50-74%)</strong>: Rendimiento aceptable, mejorable<br/>
              <strong style={{ color: "#EF4444" }}>Rojo (&lt;50%)</strong>: Rendimiento bajo, requiere atención
            </p>
            <div style={{ background: "#F0FFF8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 600, marginBottom: 8 }}>
                💼 Acción
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628" }}>
                Identificá qué turnos tienen bajo rendimiento y optimizá la cobertura de personal o procesos operativos en esos horarios.
              </div>
            </div>
          </>
        ),
      },
      precision: {
        title: "Precisión del motor",
        content: (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Qué es el aprendizaje propio?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              NICOLE aprende de tu negocio en dos fases:<br/>
              <strong>Capa 1</strong>: Datos genéricos del sector<br/>
              <strong>Capa 2</strong>: Datos propios de tu negocio (más preciso)
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginTop: 0, marginBottom: 12 }}>
              ¿Por qué importa?
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#0A1628", marginBottom: 16 }}>
              Mientras más calibrado esté el motor (Capa 2 completa), más precisas serán las alertas, predicciones y detecciones de anomalías. Al 100%, NICOLE conoce tu negocio a la perfección.
            </p>
            <div style={{ background: "#F0F9FF", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#0A1628", fontWeight: 600, marginBottom: 8 }}>
                🚀 Progreso
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#0A1628" }}>
                Cada transacción que registrás mejora la precisión del motor. Cuanto más uses Lumo, mejor te conocerá NICOLE.
              </div>
            </div>
          </>
        ),
      },
    };

    const current = modals[modalOpen];
    if (!current) return null;

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
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0A1628",
              margin: 0,
            }}>
              {current.title}
            </h2>
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

          {/* Content */}
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}>
            {current.content}
          </div>

          {/* Footer - NICOLE link */}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            ¿Tenés dudas? Hablá con NICOLE →
          </button>

          {/* Close button */}
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
  };

  return (
    <main style={{ background: T.bg, minHeight: "100vh", paddingBottom: 100, fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 4, color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>// Vista del negocio</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: T.textPrimary }}>{negocio || "Mi negocio"}</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>
          {perfil?.tipo_negocio || "—"} · {perfil?.capas.total_transacciones ?? "—"} transacciones
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: T.textMuted, letterSpacing: 2 }}>CARGANDO...</div>
        </div>
      ) : (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              {
                label: "Facturación este mes",
                valor: pred?.facturacion?.disponible ? fmt(pred.facturacion.ventas_acumuladas_mes) : "—",
                color: T.green,
                delta: pred?.facturacion?.disponible ? `Proyectado: ${fmt(pred.facturacion.proyeccion_mes_completo.esperado)}` : "Sin datos suficientes",
                modal: "facturacion" as ModalType,
              },
              {
                label: "Pérdida acumulada",
                valor: pred?.perdidas?.disponible ? fmt(pred.perdidas.perdida_acumulada_mes) : "—",
                color: T.red,
                delta: pred?.perdidas?.disponible
                  ? `Tendencia ${pred.perdidas.tendencia}`
                  : "Sin turnos cerrados",
                modal: "perdida" as ModalType,
              },
              {
                label: "Venta diaria est.",
                valor: pred?.facturacion?.disponible ? fmt(pred.facturacion.venta_diaria_esperada) : "—",
                color: T.accent,
                delta: pred?.facturacion?.disponible ? `Confianza ${pred.facturacion.confianza.nivel}` : "—",
                modal: "venta_diaria" as ModalType,
              },
              {
                label: "Brecha x turno",
                valor: pred?.perdidas?.disponible ? fmt(pred.perdidas.brecha_promedio_por_turno) : "—",
                color: T.yellow,
                delta: pred?.perdidas?.disponible ? "promedio" : "—",
                modal: "brecha" as ModalType,
              },
            ].map(k => (
              <div
                key={k.label}
                onClick={() => setModalOpen(k.modal)}
                style={{
                  background: T.bgCard,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 16,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: k.color, marginBottom: 4 }}>{k.valor}</div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Gráfico ventas 7d */}
          {ventas7d.length > 0 && (
            <div
              onClick={() => setModalOpen("ventas7d")}
              style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, cursor: "pointer" }}
            >
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.textMuted, textTransform: "uppercase", marginBottom: 16 }}>// Ventas 7 días</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
                {ventas7d.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ width: "100%", background: i === ventas7d.length - 1 ? T.accent : `${T.accent}40`, borderRadius: "4px 4px 0 0", height: `${(d.total / max) * 100}%`, transition: "height 0.5s" }} />
                    <div style={{ fontSize: 10, color: i === ventas7d.length - 1 ? T.accent : T.textMuted }}>{d.dia}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 12, textAlign: "center" }}>
                Ventas reales · últimos 7 días
              </div>
            </div>
          )}

          {/* Turnos */}
          {turnos.length > 0 && (
            <div
              onClick={() => setModalOpen("turnos")}
              style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, cursor: "pointer" }}
            >
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.textMuted, textTransform: "uppercase", marginBottom: 14 }}>// Rendimiento por turno</div>
              {turnos.map(t => (
                <div key={t.turno} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600 }}>{t.turno}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 13, color: T.textSecondary }}>{fmt(t.ventas)}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 13, color: efColor(t.eficiencia), fontWeight: 700 }}>{t.eficiencia}%</span>
                    </div>
                  </div>
                  <div style={{ background: T.bgSecondary, borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${t.eficiencia}%`, height: "100%", background: efColor(t.eficiencia), borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progreso capa 2 */}
          {perfil?.capas && (
            <div
              onClick={() => setModalOpen("precision")}
              style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, cursor: "pointer" }}
            >
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.textMuted, textTransform: "uppercase", marginBottom: 14 }}>// Precisión del motor</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: T.textSecondary }}>Aprendizaje propio</span>
                <span style={{ fontFamily: "monospace", fontSize: 13, color: T.accent, fontWeight: 700 }}>{perfil.capas.porcentaje_progreso_capa_2}%</span>
              </div>
              <div style={{ background: T.bgSecondary, borderRadius: 4, height: 6, marginBottom: 8 }}>
                <div style={{ width: `${perfil.capas.porcentaje_progreso_capa_2}%`, height: "100%", background: T.accent, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: T.textMuted }}>
                {perfil.capas.capa_2_completa
                  ? "Motor completamente calibrado con tu negocio"
                  : `${perfil.capas.transacciones_restantes} transacciones para calibración completa`}
              </div>
            </div>
          )}
        </div>
      )}

      {renderModal()}

      <Nav />
    </main>
  );
}
