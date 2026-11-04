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
  racha_limpia_actual: number;
  goteo?: { detectado: boolean; total_brechas: number; promedio_por_turno: number; acelerando: boolean };
};

type EmpleadoERM = {
  empleado: string;
  score: number | null;
  nivel: string;
  motivo?: string;
  señales: { tipo: string; descripcion: string; peso: number }[];
  confianza?: { señales_disponibles: number; señales_totales: number };
  detalle?: {
    n_turnos: number;
    brecha_promedio_abs: number;
    tasa_inconsistencia: number;
    tasa_omision_conteos: number;
    racha_limpia: number;
    ultimo_turno: string | null;
  };
  cusum_turnos?: { turno: string; disponible: boolean; pct_umbral: number | null; alarma: boolean }[];
};

type TurnoEvidencia = {
  id: number;
  hora_apertura: string;
  tipo_turno: string;
  sucursal: string | null;
  caja_esperada: number | string | null;
  caja_cierre: number | string | null;
  brecha: number | string | null;
  conteo_aleatorio_omitido: boolean | null;
  conteo_aleatorio2_omitido: boolean | null;
};

type ERMNegocio = {
  empleados: EmpleadoERM[];
  resumen: { total: number; rojos: number; amarillos: number; verdes: number; sin_datos: number };
  alerta_equipo: string | null;
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

function nivelBadgeERM(nivel: string): { text: string; variant: "ok" | "warn" } {
  if (nivel === "rojo") return { text: "Alto riesgo", variant: "warn" };
  if (nivel === "amarillo") return { text: "Atención", variant: "warn" };
  if (nivel === "verde") return { text: "Normal", variant: "ok" };
  return { text: "Sin datos", variant: "ok" };
}

const pesos = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("es-AR");
const NOMBRE_TURNO: Record<string, string> = { manana: "Mañana", tarde: "Tarde", noche: "Noche" };
const NOMBRE_SENAL: Record<string, { titulo: string; explica: string }> = {
  CUSUM: { titulo: "Desvío sostenido en el turno", explica: "Mide si las diferencias de caja del turno vienen creciendo de forma sostenida. Se calcula sobre todo el turno del negocio, no solo sobre esta persona." },
  ZSCORE_PROPIO: { titulo: "Se aparta de su propio patrón", explica: "Compara su diferencia promedio con lo que le pasa habitualmente a esta misma persona." },
  BRECHA_PROMEDIO: { titulo: "Diferencia promedio de caja", explica: "Promedio de las diferencias entre lo esperado y lo declarado al cerrar, y porcentaje de turnos con diferencia." },
  COMPORTAMIENTO_PEERS: { titulo: "Distinto del resto del equipo", explica: "Compara con otras personas que trabajaron el mismo turno." },
  OMISION_CONTEOS: { titulo: "Conteos aleatorios sin responder", explica: "Porcentaje de conteos de caja a mitad de turno que no se respondieron." },
  RACHA_POSITIVA: { titulo: "Racha sin diferencias", explica: "Turnos seguidos con diferencia de hasta $500. Baja el puntaje." },
};

function Titulo({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--muted)", margin: "12px 0 6px" }}>{children}</div>;
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, padding: "3px 0" }}>
      <span style={{ color: "var(--muted)" }}>{k}</span>
      <span style={{ color: "var(--text)", fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function DetalleRiesgo({ e, turnos }: { e: EmpleadoERM; turnos: TurnoEvidencia[] | "cargando" | "error" | undefined }) {
  const d = e.detalle;
  const cusum = (e.cusum_turnos || []).filter(c => c.disponible && c.pct_umbral !== null);
  return (
    <div style={{ margin: "0 12px 10px", background: "var(--card2)", borderRadius: 14, padding: 14, border: "1px solid var(--border)", boxShadow: "var(--sh)" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
        {e.score !== null
          ? `Puntaje ${e.score} de 100. Normal hasta 29, atención de 30 a 60, alto riesgo desde 61. Se calcula con los turnos cerrados de los últimos 30 días (mínimo 3 turnos).`
          : (e.motivo || "Todavía no hay datos suficientes para calcular el puntaje.")}
      </div>

      {d && (
        <>
          <Titulo>Últimos 30 días</Titulo>
          <Fila k="Turnos analizados" v={String(d.n_turnos)} />
          <Fila k="Turnos con diferencia" v={`${d.tasa_inconsistencia}%`} />
          <Fila k="Diferencia promedio" v={pesos(d.brecha_promedio_abs)} />
          <Fila k="Conteos sin responder" v={`${d.tasa_omision_conteos}%`} />
          <Fila k="Racha sin diferencias" v={`${d.racha_limpia} turnos`} />
        </>
      )}

      {e.score !== null && <Titulo>De dónde sale el puntaje</Titulo>}
      {e.score === null ? null : e.señales.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Ninguna señal superó su umbral.</div>
      ) : e.señales.map(s => {
        const info = NOMBRE_SENAL[s.tipo];
        return (
          <div key={s.tipo} style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{info ? info.titulo : s.tipo}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.peso < 0 ? "var(--emerald)" : "var(--yellow)" }}>{s.peso > 0 ? "+" : ""}{Math.round(s.peso)} pts</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{s.descripcion}</div>
            {info && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{info.explica}</div>}
          </div>
        );
      })}
      {cusum.length > 0 && (
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
          Desvío del turno: {cusum.map(c => `${NOMBRE_TURNO[String(c.turno).toLowerCase()] || c.turno} ${Math.round(c.pct_umbral as number)}% del umbral`).join(" · ")}
        </div>
      )}
      {e.confianza && (
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
          Señales estadísticas con datos suficientes: {e.confianza.señales_disponibles} de {e.confianza.señales_totales}
        </div>
      )}

      <Titulo>Turnos analizados</Titulo>
      {turnos === undefined || turnos === "cargando" ? (
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Cargando turnos...</div>
      ) : turnos === "error" ? (
        <div style={{ fontSize: 11, color: "var(--muted)" }}>No se pudieron cargar los turnos. Probá de nuevo.</div>
      ) : turnos.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--muted)" }}>No hay turnos cerrados en los últimos 30 días.</div>
      ) : turnos.map(t => {
        const dif = t.brecha === null ? null : Number(t.brecha);
        const omitidos = (t.conteo_aleatorio_omitido ? 1 : 0) + (t.conteo_aleatorio2_omitido ? 1 : 0);
        const fecha = new Date(t.hora_apertura).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        return (
          <div key={t.id} style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{fecha} · {NOMBRE_TURNO[String(t.tipo_turno).toLowerCase()] || t.tipo_turno}{t.sucursal ? ` · ${t.sucursal}` : ""}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
              {t.caja_esperada !== null ? `Esperado ${pesos(Number(t.caja_esperada))}` : "Esperado —"} · {t.caja_cierre !== null ? `Declarado ${pesos(Number(t.caja_cierre))}` : "Declarado —"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: dif !== null && Math.abs(dif) >= 200 ? "var(--yellow)" : "var(--emerald)" }}>
              {dif === null ? "Sin diferencia calculada" : Math.abs(dif) < 1 ? "Sin diferencia" : `Diferencia ${pesos(dif)} ${dif > 0 ? "de menos" : "de más"}`}
              {omitidos > 0 ? ` · ${omitidos} conteo(s) sin responder` : ""}
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 12, lineHeight: 1.45 }}>
        Estos datos describen diferencias de caja y conteos. Por sí solos no indican la causa: pueden deberse a errores de registro, gastos no cargados o cambios en la forma de trabajar.
      </div>
    </div>
  );
}

export default function Empleados() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [rankings, setRankings] = useState<Record<string, RankingItem[]>>({});
  const [patrones, setPatrones] = useState<Patron | null>(null);
  const [erm, setErm] = useState<ERMNegocio | null>(null);
  const [turnoActivo, setTurnoActivo] = useState<string>("MANANA");
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [info, setInfo] = useState<Record<string, { erm?: EmpleadoERM; turnos?: TurnoEvidencia[] | "cargando" | "error" }>>({});

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    const u = localStorage.getItem("lumo_usuario");
    const uid = u ? JSON.parse(u).id : null;
    if (!uid) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/caja/empleados`, { headers }).then(r => r.json()).catch(() => ({ empleados: [] })),
      fetch(`${API}/api/caja/patrones`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/erm`, { headers }).then(r => r.json()).catch(() => null),
      ...TIPOS_TURNO.map(t =>
        fetch(`${API}/api/caja/ranking/${t}`, { headers })
          .then(r => r.json()).then(d => ({ tipo: t, data: d.ranking || [] }))
          .catch(() => ({ tipo: t, data: [] }))
      ),
    ]).then(([emps, pats, ermData, ...ranks]) => {
      setEmpleados((emps as { empleados: Empleado[] }).empleados || []);
      setPatrones(pats as Patron);
      setErm(ermData as ERMNegocio | null);
      const rankMap: Record<string, RankingItem[]> = {};
      (ranks as { tipo: string; data: RankingItem[] }[]).forEach(r => { rankMap[r.tipo] = r.data; });
      setRankings(rankMap);
      setLoading(false);
    });
  }, [ready, token]);

  const abrirDetalle = (nombre: string) => {
    if (abierto === nombre) { setAbierto(null); return; }
    setAbierto(nombre);
    if (info[nombre]?.turnos !== undefined && info[nombre]?.turnos !== "error") return;
    const headers = { Authorization: `Bearer ${token}` };
    const base = `${API}/api/erm/${encodeURIComponent(nombre)}`;
    setInfo(prev => ({ ...prev, [nombre]: { ...prev[nombre], turnos: "cargando" } }));
    fetch(base, { headers }).then(r => r.json())
      .then(d => { if (d && typeof d === "object" && !d.error) setInfo(prev => ({ ...prev, [nombre]: { ...prev[nombre], erm: d as EmpleadoERM } })); })
      .catch(() => {});
    fetch(`${base}/turnos`, { headers }).then(r => r.json())
      .then(d => setInfo(prev => ({ ...prev, [nombre]: { ...prev[nombre], turnos: Array.isArray(d.turnos) ? d.turnos : "error" } })))
      .catch(() => setInfo(prev => ({ ...prev, [nombre]: { ...prev[nombre], turnos: "error" } })));
  };

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
                value={`${Math.round(patrones.tasa_inconsistencia_global)}%`}
                color={patrones.tasa_inconsistencia_global > 30 ? "red" : patrones.tasa_inconsistencia_global > 15 ? "yellow" : "green"}
              />
              <StatCard label="Turnos" value={String(patrones.turnos_analizados)} color="blue" />
              <StatCard
                label="Racha limpia"
                value={String(patrones.racha_limpia_actual)}
                color={patrones.racha_limpia_actual >= 7 ? "green" : "yellow"}
              />
            </StatRow>
          )}

          {erm && Array.isArray(erm.empleados) && erm.empleados.length > 0 && (
            <>
              <SectionTitle>Riesgo del equipo</SectionTitle>
              <StatRow>
                <StatCard label="Rojo" value={String(erm.resumen.rojos)} color="red" />
                <StatCard label="Atención" value={String(erm.resumen.amarillos)} color="yellow" />
                <StatCard label="Normal" value={String(erm.resumen.verdes)} color="green" />
              </StatRow>
              {erm.alerta_equipo && (
                <AlertCard variant="crit" tag="Alerta de equipo" title={erm.alerta_equipo} desc="" />
              )}
              <div style={{ fontSize: 10, color: "var(--muted)", padding: "0 14px 8px" }}>Tocá a una persona para ver de dónde sale su puntaje.</div>
              {erm.empleados.map((e, i) => (
                <div key={e.empleado}>
                  <div onClick={() => abrirDetalle(e.empleado)} style={{ cursor: "pointer" }}>
                    <EmployeeCard
                      initials={iniciales(e.empleado)}
                      colorVariant={EAV_VARIANT[i % 3]}
                      name={e.empleado}
                      sub={e.score !== null && e.señales.length > 0 ? e.señales[0].descripcion : e.score === null ? "Datos insuficientes" : "Sin señales activas"}
                      amount={e.score !== null ? `Riesgo ${e.score}` : "—"}
                      badge={nivelBadgeERM(e.nivel)}
                    />
                  </div>
                  {abierto === e.empleado && (
                    <DetalleRiesgo e={{ ...(info[e.empleado]?.erm ?? {}), ...e }} turnos={info[e.empleado]?.turnos} />
                  )}
                </div>
              ))}
              <Divider />
            </>
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
