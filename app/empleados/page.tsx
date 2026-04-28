"use client";
import Nav from "../components/Nav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { PageHeader, StatRow, StatCard, SectionTitle, EmployeeCard, AlertCard, FilterChips, Divider } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Empleado = { id: number; nombre: string; activo: boolean };

type RankingItem = {
  empleado: string;
  n_turnos: number;
  brecha_promedio: number;
  tasa_inconsistencia: number;
  tasa_omision: number;
  score: number;
  nivel: string;
};

type Patron = {
  turno_mas_problematico: string | null;
  tasa_inconsistencia_global: number;
  turnos_analizados: number;
  racha_limpia: number;
  goteo?: { detectado: boolean; total_brechas: number; promedio_por_turno: number; acelerando: boolean };
};

const TIPOS_TURNO = ["MANANA", "TARDE", "NOCHE"] as const;
const LABEL_TURNO: Record<string, string> = { MANANA: "Mañana", TARDE: "Tarde", NOCHE: "Noche" };
const EAV_VARIANT = ["a", "b", "c"] as const;

function iniciales(nombre: string) {
  return nombre.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function nivelBadge(nivel: string): { text: string; variant: "ok" | "warn" } {
  if (nivel === "excelente" || nivel === "bueno") return { text: nivel.charAt(0).toUpperCase() + nivel.slice(1), variant: "ok" };
  return { text: nivel.charAt(0).toUpperCase() + nivel.slice(1), variant: "warn" };
}

export default function Empleados() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [rankings, setRankings] = useState<Record<string, RankingItem[]>>({});
  const [patrones, setPatrones] = useState<Patron | null>(null);
  const [turnoActivo, setTurnoActivo] = useState<string>("MANANA");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    const u = localStorage.getItem("lumo_usuario");
    const uid = u ? JSON.parse(u).id : null;
    if (!uid) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/caja/empleados/${uid}`, { headers }).then(r => r.json()).catch(() => ({ empleados: [] })),
      fetch(`${API}/api/caja/patrones/${uid}`, { headers }).then(r => r.json()).catch(() => null),
      ...TIPOS_TURNO.map(t =>
        fetch(`${API}/api/caja/ranking/${uid}/${t}`, { headers })
          .then(r => r.json()).then(d => ({ tipo: t, data: d.ranking || [] }))
          .catch(() => ({ tipo: t, data: [] }))
      ),
    ]).then(([emps, pats, ...ranks]) => {
      setEmpleados((emps as { empleados: Empleado[] }).empleados || []);
      setPatrones(pats as Patron);
      const rankMap: Record<string, RankingItem[]> = {};
      (ranks as { tipo: string; data: RankingItem[] }[]).forEach(r => { rankMap[r.tipo] = r.data; });
      setRankings(rankMap);
      setLoading(false);
    });
  }, [ready, token]);

  const ranking = rankings[turnoActivo] || [];
  const today = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  const chips = TIPOS_TURNO.map(t => ({
    label: LABEL_TURNO[t],
    active: turnoActivo === t,
    onClick: () => setTurnoActivo(t),
  }));

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader
        title="Tu equipo"
        sub={loading ? "Cargando..." : `${today.charAt(0).toUpperCase() + today.slice(1)} · ${empleados.length} empleados`}
      />

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Cargando...</div>
        </div>
      ) : (
        <>
          {patrones && patrones.turnos_analizados > 0 && (
            <StatRow>
              <StatCard
                label="Inconsistencias"
                value={`${Math.round(patrones.tasa_inconsistencia_global * 100)}%`}
                color={patrones.tasa_inconsistencia_global > 0.3 ? "red" : patrones.tasa_inconsistencia_global > 0.15 ? "yellow" : "green"}
              />
              <StatCard label="Turnos" value={String(patrones.turnos_analizados)} color="blue" />
              <StatCard
                label="Racha limpia"
                value={String(patrones.racha_limpia)}
                color={patrones.racha_limpia >= 7 ? "green" : "yellow"}
              />
            </StatRow>
          )}

          <FilterChips chips={chips} />

          <SectionTitle>Por turno · {LABEL_TURNO[turnoActivo]}</SectionTitle>

          {ranking.length === 0 ? (
            <AlertCard
              variant="ok"
              tag="Sin datos"
              title={`Sin turnos cerrados en ${LABEL_TURNO[turnoActivo]}`}
              desc="Se necesitan al menos 3 turnos para calcular el ranking."
            />
          ) : (
            ranking.map((r, i) => (
              <EmployeeCard
                key={r.empleado}
                initials={iniciales(r.empleado)}
                colorVariant={EAV_VARIANT[i % 3]}
                name={r.empleado}
                sub={`${LABEL_TURNO[turnoActivo]} · ${r.n_turnos} turnos · ${Math.round(r.tasa_inconsistencia * 100)}% incons.`}
                amount={`Score ${r.score}`}
                badge={nivelBadge(r.nivel)}
              />
            ))
          )}

          {patrones?.goteo?.detectado && (
            <>
              <Divider />
              <AlertCard
                variant="crit"
                tag={`Goteo${patrones.goteo.acelerando ? " · acelerando" : ""}`}
                title="Goteo detectado en el negocio"
                desc={`Promedio $${Math.round(patrones.goteo.promedio_por_turno).toLocaleString("es-AR")} por turno · ${patrones.goteo.total_brechas} brechas acumuladas`}
              />
            </>
          )}

          {patrones?.turno_mas_problematico && (
            <AlertCard
              variant="warn"
              tag="Patrón detectado"
              title={`Turno con más inconsistencias: ${LABEL_TURNO[patrones.turno_mas_problematico] || patrones.turno_mas_problematico}`}
              desc="Revisá los empleados asignados a este turno."
            />
          )}

          {empleados.length > 0 && (
            <>
              <Divider />
              <SectionTitle>Empleados registrados</SectionTitle>
              {empleados.map((e, i) => (
                <EmployeeCard
                  key={e.id}
                  initials={iniciales(e.nombre)}
                  colorVariant={EAV_VARIANT[i % 3]}
                  name={e.nombre}
                  sub={e.activo ? "Activo" : "Inactivo"}
                  amount=""
                  badge={e.activo ? { text: "Activo", variant: "ok" } : { text: "Inactivo", variant: "warn" }}
                />
              ))}
            </>
          )}

          {empleados.length === 0 && ranking.length === 0 && (
            <AlertCard
              variant="ok"
              tag="Sin datos"
              title="No hay empleados registrados"
              desc="Los empleados se registran desde /empleado"
            />
          )}
        </>
      )}

      <Nav />
    </main>
  );
}
