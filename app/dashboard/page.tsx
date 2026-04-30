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

type ModalContent = {
  title: string;
  text: string;
};

export default function Dashboard() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [perfil, setPerfil] = useState<PerfilNegocio | null>(null);
  const [pred, setPred] = useState<Prediccion | null>(null);
  const [ventas7d, setVentas7d] = useState<DiaSemana[]>([]);
  const [turnos, setTurnos] = useState<TurnoDato[]>([]);
  const [loading, setLoading] = useState(true);
  const [negocio, setNegocio] = useState("");
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

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

  const openModal = (title: string, text: string) => {
    setModalContent({ title, text });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <>
      {modalContent && (
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
                {modalContent.title}
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
                {modalContent.text}
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
                info: "Es la suma total de tus ventas del mes actual. NICOLE acumula cada transacción para darte una visión en tiempo real.\n\nLa proyección usa tu historial, tendencias y promedio diario para estimar cuánto facturarás al final del mes.",
              },
              {
                label: "Pérdida acumulada",
                valor: pred?.perdidas?.disponible ? fmt(pred.perdidas.perdida_acumulada_mes) : "—",
                color: T.red,
                delta: pred?.perdidas?.disponible
                  ? `Tendencia ${pred.perdidas.tendencia}`
                  : "Sin turnos cerrados",
                info: "Es la diferencia entre lo que esperabas vender (según tu baseline) y lo que realmente vendiste.\n\nNICOLE detecta estas brechas cuando cerrás cada turno. Una pérdida creciente puede indicar hurtos, errores de registro o problemas operativos.",
              },
              {
                label: "Venta diaria est.",
                valor: pred?.facturacion?.disponible ? fmt(pred.facturacion.venta_diaria_esperada) : "—",
                color: T.accent,
                delta: pred?.facturacion?.disponible ? `Confianza ${pred.facturacion.confianza.nivel}` : "—",
                info: "Es el promedio que NICOLE espera que vendas por día, basándose en tu historial reciente.\n\nEl nivel de confianza indica qué tan precisa es la estimación. Más datos históricos = mayor confianza.",
              },
              {
                label: "Brecha x turno",
                valor: pred?.perdidas?.disponible ? fmt(pred.perdidas.brecha_promedio_por_turno) : "—",
                color: T.yellow,
                delta: pred?.perdidas?.disponible ? "promedio" : "—",
                info: "Es la diferencia promedio entre lo esperado y lo real en cada turno cerrado.\n\nUna brecha alta y constante puede señalar hurtos, errores humanos o problemas en el proceso de cierre de turno.",
              },
            ].map(k => (
              <div
                key={k.label}
                onClick={() => openModal(k.label, k.info)}
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
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
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
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
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
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
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

      <Nav />
    </>
  );
}
