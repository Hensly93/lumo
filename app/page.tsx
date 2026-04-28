"use client";
import Nav from "./components/Nav";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import { HeroCard, StatRow, StatCard, AlertCard, SectionTitle } from "./components/ui";

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

function HomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { token, ready } = useAuth();

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [pred, setPred] = useState<Prediccion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    ]).then(([an, al, pr]) => {
      setAnalisis(an);
      setAlertas(al?.alertas || []);
      setPred(pr);
      setLoading(false);
    });
  }, [ready, token]);

  const dq = dqScore(analisis?.data_quality_score);
  const critCount = alertas.filter(a => ["critico", "inconsistencia"].includes(a.prioridad)).length;
  const facturacion = pred?.facturacion?.disponible ? pred.facturacion.venta_diaria_esperada : null;

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>

      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100,
          background: "var(--card)", borderRadius: 12, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
          color: toast.ok ? "var(--emerald)" : "var(--red)",
          border: `1px solid ${toast.ok ? "#00C48C40" : "#EF444440"}`,
          boxShadow: "var(--sh2)",
        }}>
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Cargando...</div>
        </div>
      ) : (
        <>
          <HeroCard
            label="Facturación estimada hoy"
            value={facturacion != null ? fmt(facturacion) : "—"}
            sub={pred?.facturacion?.confianza ? `Confianza ${pred.facturacion.confianza.pct}%` : "NICOLE · proyección"}
          />

          <StatRow>
            <StatCard
              label="Calidad datos"
              value={dq != null ? `${Math.round(dq)}%` : "—"}
              color={dq == null ? "blue" : dq >= 70 ? "blue" : dq >= 40 ? "yellow" : "red"}
            />
            <StatCard
              label="Alertas hoy"
              value={String(critCount)}
              color={critCount > 0 ? "yellow" : "green"}
            />
            <StatCard
              label="Score"
              value={analisis?.score != null ? String(analisis.score) : "—"}
              color="blue"
            />
          </StatRow>

          <SectionTitle>Alertas activas</SectionTitle>

          {alertas.length === 0 ? (
            <AlertCard
              variant="ok"
              tag="Todo ok"
              title="Sin anomalías detectadas"
              desc="Tu negocio opera dentro del rango esperado."
              amount="En orden ✓"
              positive
            />
          ) : (
            alertas.map((a, i) => (
              <AlertCard
                key={i}
                variant={alertVariant(a.prioridad)}
                tag={alertTag(a.prioridad)}
                title={a.mensaje}
                desc={a.accion}
                time={a.timestamp
                  ? new Date(a.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                  : undefined}
              />
            ))
          )}
        </>
      )}

      <Nav />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
