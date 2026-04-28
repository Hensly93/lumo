"use client";
import Nav from "../components/Nav";
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

export default function Alertas() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [alertasResp, setAlertasResp] = useState<AlertasResp | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Record<string, "confirmada" | "descartada">>({});

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

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>

      <PageHeader title="Alertas" sub={loading ? "Analizando..." : `${capLabel(today)} · ${alertas.length} activas`} />

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Analizando...</div>
        </div>
      ) : (
        <>
          <FilterChips chips={chips} />

          {stats && (
            <StatRow>
              <StatCard label="Críticas" value={String(stats.criticos)} color="red" />
              <StatCard label="Atención" value={String(stats.atencion)} color="yellow" />
              <StatCard label="Positivas" value={String(stats.positivos)} color="green" />
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
              return (
                <AlertCard
                  key={i}
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
                  }}
                />
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
  );
}
