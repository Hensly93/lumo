"use client";
import Nav from "../components/Nav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import Autorizaciones from "./Autorizaciones";
import ActividadCaja from "./ActividadCaja";
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
  gasto_inesperado?: boolean | null;
};

type ERMNegocio = {
  empleados: EmpleadoERM[];
  resumen: { total: number; rojos: number; amarillos: number; verdes: number; sin_datos: number };
  alerta_equipo: string | null;
};

const TIPOS_TURNO = ["manana", "tarde", "noche"] as const;
const LABEL_TURNO: Record<string, string> = { manana: "Mañana", tarde: "Tarde", noche: "Noche", MANANA: "Mañana", TARDE: "Tarde", NOCHE: "Noche" };
const EAV_VARIANT = ["a", "b", "c"] as const;

function iniciales(nombre: string) {
  return nombre.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function nivelBadge(nivel: string): { text: string; variant: "ok" | "warn" } {
  if (nivel === "excelente" || nivel === "bueno") return { text: nivel.charAt(0).toUpperCase() + nivel.slice(1), variant: "ok" };
  return { text: nivel.charAt(0).toUpperCase() + nivel.slice(1), variant: "warn" };
}

function nivelBadgeERM(nivel: string): { text: string; variant: "ok" | "warn" } {
  if (nivel === "rojo") return { text: "Para revisar", variant: "warn" };
  if (nivel === "amarillo") return { text: "Para mirar", variant: "warn" };
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
  CUSUM_CAMBIO_CONDUCTUAL: { titulo: "Cambió su forma de cerrar la caja", explica: "Últimamente sus cierres vienen distintos a como eran antes." },
  ZSCORE_BRECHA: { titulo: "Diferencia de caja más grande que lo normal", explica: "La diferencia de este turno es mucho mayor que lo que pasa normalmente en tu negocio." },
  TICKET_INFLADO: { titulo: "Pocas ventas para tanta plata", explica: "Se declaró mucha plata para las pocas ventas que se cargaron." },
  TRAMO1_ANOMALO: { titulo: "Movimiento raro en la primera parte del turno", explica: "Entre que se abrió la caja y el conteo del medio entró o salió más plata que lo normal." },
  TRAMO2_ANOMALO: { titulo: "Movimiento raro en la segunda parte del turno", explica: "Entre el conteo del medio y el cierre entró o salió más plata que lo normal." },
  CONTEO_OMITIDO: { titulo: "No respondió un conteo de caja", explica: "Se le pidió contar la caja a mitad de turno y no respondió." },
  BRECHA_CAJA: { titulo: "Diferencia de caja", explica: "Lo que había en la caja al cerrar no coincide con lo que se vendió." },
  CRUCE_CAJA_TURNO: { titulo: "La caja no cierra con las ventas", explica: "Lo que se contó al cerrar no coincide con lo que se vendió en ese turno." },
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
          ? `Puntaje de referencia: ${e.score} de 100 (normal hasta 29, para mirar de 30 a 60, para revisar desde 61). Se calcula con los turnos cerrados de los últimos 30 días (mínimo 3 turnos) y muestra qué revisar, no quién hizo qué.`
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
        <div style={{ fontSize: 11, color: "var(--muted)" }}>No vimos nada raro en sus turnos.</div>
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
            {dif !== null && dif > 500 && <MarcaGasto turnoId={t.id} inicial={!!t.gasto_inesperado} />}
            <CuentaTurno turnoId={t.id} />
            <a href={`/ficha/turno/${t.id}`} style={{ display: "inline-block", marginTop: 2, fontSize: 10, fontWeight: 700, color: "var(--blue, #007AFF)", textDecoration: "none" }}>Ver cada venta del turno →</a>
          </div>
        );
      })}

      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 12, lineHeight: 1.45 }}>
        Estos datos describen diferencias de caja y conteos. Por sí solos no indican la causa: pueden deberse a errores de registro, gastos no cargados o cambios en la forma de trabajar.
      </div>
    </div>
  );
}

// "Cómo se calculó": la cuenta completa del cierre (Palantir: ningún número sin su porqué)
type Cruce = {
  formula?: { caja_apertura: number; total_ventas: number; total_mp: number; total_efectivo: number; total_egresos: number;
    efectivo_esperado: number; caja_cierre: number; brecha: number; cantidad_tx: number; ticket_promedio: number };
  grado_brecha?: string; señales?: { tipo: string; descripcion: string }[]; turnos_historicos_usados?: number; error?: string;
};
function CuentaTurno({ turnoId }: { turnoId: number }) {
  const [abierto, setAbierto] = useState(false);
  const [c, setC] = useState<Cruce | null | "error">(null);
  const abrir = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo && c === null) {
      fetch(`${API}/api/caja/cruce/${turnoId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("lumo_token")}` } })
        .then(r => (r.ok ? r.json() : null)).then(d => setC(d && d.formula ? d : "error")).catch(() => setC("error"));
    }
  };
  const fila = (k: string, v: string, fuerte = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", fontWeight: fuerte ? 700 : 400, color: "var(--text)" }}><span>{k}</span><span>{v}</span></div>
  );
  return (
    <div style={{ marginTop: 4 }}>
      <button onClick={abrir} style={{ fontSize: 10, fontWeight: 700, padding: 0, border: "none", background: "transparent", color: "var(--blue, #007AFF)", cursor: "pointer" }}>
        {abierto ? "Ocultar la cuenta" : "Ver cómo se calculó"}
      </button>
      {abierto && (c === null ? <div style={{ fontSize: 10, color: "var(--muted)" }}>Calculando…</div>
        : c === "error" ? <div style={{ fontSize: 10, color: "var(--muted)" }}>No se pudo traer la cuenta de este cierre.</div>
        : (() => {
          const f = c.formula!;
          const dif = f.brecha;
          return (
            <div style={{ marginTop: 6, padding: 10, borderRadius: 8, background: "var(--card2)", border: "1px solid var(--border)" }}>
              {fila("Abrió la caja con", pesos(f.caja_apertura))}
              {fila("+ Cobró en efectivo", pesos(f.total_efectivo))}
              {f.total_egresos > 0 && fila("− Sacó de la caja (gastos cargados)", pesos(f.total_egresos))}
              {fila("= Tenía que haber", pesos(f.efectivo_esperado), true)}
              {fila("Contaron al cerrar", pesos(f.caja_cierre))}
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: Math.abs(dif) >= 500 ? "var(--yellow)" : "var(--emerald)" }}>
                {Math.abs(dif) < 1 ? "La caja cerró justa." : `${dif > 0 ? "Faltaron" : "Sobraron"} ${pesos(Math.abs(dif))}.`}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
                En total vendió {pesos(f.total_ventas)} en {f.cantidad_tx} ventas (cada cliente gastó en promedio {pesos(f.ticket_promedio)}).
                {f.total_mp > 0 ? ` ${pesos(f.total_mp)} entraron por tarjeta, QR o transferencia: esa plata no está en la caja.` : ""}
              </div>
              {c.grado_brecha && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                  {c.grado_brecha === "normal" ? "Para este negocio es una diferencia normal" : "Es una diferencia más grande que lo normal en este negocio"}
                  {c.turnos_historicos_usados ? ` (comparado con ${c.turnos_historicos_usados} cierres anteriores).` : "."}
                </div>
              )}
              {(c.señales || []).map(sg => <div key={sg.tipo} style={{ fontSize: 10, color: "var(--text)", marginTop: 4 }}>· {sg.descripcion}</div>)}
            </div>
          );
        })())}
    </div>
  );
}

// Si la plata que faltó fue un gasto que no se cargó (un proveedor, un retiro), el dueño lo marca
// y ese cierre deja de contar como faltante en Fugas, Alertas, Períodos y avisos.
function MarcaGasto({ turnoId, inicial }: { turnoId: number; inicial: boolean }) {
  const [marcado, setMarcado] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const cambiar = async () => {
    setEnviando(true);
    try {
      const r = await fetch(`${API}/api/caja/gasto-inesperado`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("lumo_token")}` },
        body: JSON.stringify({ turno_id: turnoId, valor: !marcado }),
      });
      if (r.ok) setMarcado(!marcado);
    } catch { /* sin conexión: queda como estaba */ }
    setEnviando(false);
  };
  return (
    <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {marcado && <span style={{ fontSize: 10, color: "var(--emerald)", fontWeight: 700 }}>Marcado como gasto: no cuenta como faltante</span>}
      <button disabled={enviando} onClick={(e) => { e.stopPropagation(); cambiar(); }}
        style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)", cursor: "pointer" }}>
        {marcado ? "Deshacer" : "Fue un gasto que no se cargó"}
      </button>
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
  const [turnoActivo, setTurnoActivo] = useState<string>("manana");
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [info, setInfo] = useState<Record<string, { erm?: EmpleadoERM; turnos?: TurnoEvidencia[] | "cargando" | "error" }>>({});

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/caja/empleados`, { headers }).then(r => r.json()).catch(() => ({ empleados: [] })),
      fetch(`${API}/api/caja/patrones`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/erm`, { headers }).then(r => r.json()).catch(() => null),
      ...TIPOS_TURNO.map(t =>
        fetch(`${API}/api/caja/ranking/${t}`, { headers })
          // El servidor manda { empleados: [{ nombre, n_turnos, tasa_inconsistencia, score }] }
          .then(r => r.json()).then(d => ({ tipo: t, data: (d.empleados || d.ranking || []).map((x: any) => ({ ...x, empleado: x.empleado || x.nombre, nivel: x.nivel || (x.score >= 70 ? 'verde' : x.score >= 40 ? 'amarillo' : 'rojo') })) }))
          .catch(() => ({ tipo: t, data: [] }))
      ),
    ]).then(([emps, pats, ermData, ...ranks]) => {
      // /api/caja/empleados devuelve la lista directa (antes se buscaba .empleados y siempre daba 0)
      const lista = Array.isArray(emps) ? emps : ((emps as { empleados?: Empleado[] }).empleados || []);
      setEmpleados(lista.map((e: any) => ({ ...e, activo: e.activo !== false })));
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
        sub={loading ? "Cargando..." : `${today.charAt(0).toUpperCase() + today.slice(1)} · ${Math.max(empleados.length, erm?.empleados?.length || 0)} ${Math.max(empleados.length, erm?.empleados?.length || 0) === 1 ? "persona" : "personas"}`}
      />

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Cargando...</div>
        </div>
      ) : (
        <>
          {/* 1. TU GENTE: cada persona, cómo viene y su ficha */}
          {(() => {
            const conTurnos = new Set((erm?.empleados || []).map(e => e.empleado));
            const sinTurnos = empleados.filter(e => !conTurnos.has(e.nombre));
            if (!(erm?.empleados?.length) && !sinTurnos.length) return null;
            return (
              <>
                <SectionTitle>Tu gente</SectionTitle>
                {erm && erm.resumen && erm.empleados.length > 0 && (
                  <div style={{ display: "flex", gap: 8, padding: "0 14px 10px", flexWrap: "wrap" }}>
                    {erm.resumen.rojos > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>{erm.resumen.rojos} para revisar</span>}
                    {erm.resumen.amarillos > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(217,119,6,0.12)", color: "#B45309" }}>{erm.resumen.amarillos} para mirar</span>}
                    {erm.resumen.verdes > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(22,163,74,0.1)", color: "#15803D" }}>{erm.resumen.verdes} bien</span>}
                  </div>
                )}
                {erm?.alerta_equipo && <AlertCard variant="crit" tag="Todo el equipo" title={erm.alerta_equipo} desc="" />}
                {(erm?.empleados || []).map((e, i) => (
                  <div key={e.empleado}>
                    <div onClick={() => abrirDetalle(e.empleado)} style={{ cursor: "pointer" }}>
                      <EmployeeCard
                        initials={iniciales(e.empleado)}
                        colorVariant={EAV_VARIANT[i % 3]}
                        name={e.empleado}
                        sub={e.score === null ? "Todavía pocos turnos para saber cómo trabaja" : e.nivel === "verde" ? "Cierra la caja bien" : (e.señales[0]?.descripcion || "Hay algo para mirar")}
                        amount={abierto === e.empleado ? "Cerrar ▲" : "Ver ▼"}
                        badge={nivelBadgeERM(e.nivel)}
                      />
                    </div>
                    {abierto === e.empleado && (
                      <>
                        <a href={`/ficha/persona/${encodeURIComponent(e.empleado)}`} style={{ display: "block", margin: "4px 20px 10px", fontSize: 14, fontWeight: 700, color: "#007AFF", textDecoration: "none" }}>Ver la ficha completa de {e.empleado} →</a>
                        <DetalleRiesgo e={{ ...(info[e.empleado]?.erm ?? {}), ...e }} turnos={info[e.empleado]?.turnos} />
                        {e.score !== null && e.nivel !== "verde" && token && <FeedbackERM empleado={e.empleado} token={token} />}
                      </>
                    )}
                  </div>
                ))}
                {sinTurnos.map((e, i) => (
                  <EmployeeCard key={e.id} initials={iniciales(e.nombre)} colorVariant={EAV_VARIANT[(i + 1) % 3]} name={e.nombre}
                    sub="Todavía no cerró turnos" amount="" badge={{ text: "Nuevo", variant: "ok" }} />
                ))}
                <div style={{ fontSize: 11, color: "var(--muted)", padding: "2px 20px 6px", lineHeight: 1.5 }}>Son señales para revisar la operación, no una acusación. Tocá a una persona para ver en qué turnos se basan.</div>
                {patrones?.goteo?.detectado && (
                  <AlertCard variant="crit" tag={patrones.goteo.acelerando ? "Cada vez más" : "Para revisar"} title="Se está yendo plata de a poco"
                    desc={`Unos $${Math.round(patrones.goteo.promedio_por_turno).toLocaleString("es-AR")} por turno, en ${patrones.goteo.total_brechas} cierres.`} />
                )}
                {patrones?.turno_mas_problematico && (
                  <AlertCard variant="warn" tag="Turno para mirar" title={`El turno ${(LABEL_TURNO[patrones.turno_mas_problematico] || patrones.turno_mas_problematico).toLowerCase()} es el que más diferencias tiene`}
                    desc="Mirá quiénes atendieron en ese turno y cómo cerraron la caja." />
                )}
                <Divider />
              </>
            );
          })()}

          {/* 2. Lo que necesita tu OK y lo que pasó en la caja */}
          <Autorizaciones token={token} />
          <ActividadCaja token={token} />

          {/* 3. Cómo cierra cada turno */}
          <Divider />
          <SectionTitle>Cómo cierra la caja cada turno</SectionTitle>
          <FilterChips chips={chips} />
          {ranking.length === 0 ? (
            <AlertCard variant="ok" tag="Todavía no" title={`Pocos cierres en el turno ${LABEL_TURNO[turnoActivo].toLowerCase()}`}
              desc="Cuando al menos 2 personas cierren 3 turnos acá, vas a ver quién cierra mejor." />
          ) : (
            ranking.map((r, i) => (
              <EmployeeCard
                key={r.empleado}
                initials={iniciales(r.empleado)}
                colorVariant={EAV_VARIANT[i % 3]}
                name={r.empleado}
                sub={`${Math.round(r.tasa_inconsistencia > 1 ? r.tasa_inconsistencia : r.tasa_inconsistencia * 100)}% de sus cierres con diferencia`}
                amount={`${r.n_turnos} turnos`}
                badge={nivelBadgeERM(r.nivel)}
              />
            ))
          )}

          {empleados.length === 0 && !(erm?.empleados?.length) && (
            <AlertCard
              variant="ok"
              tag="Sin datos"
              title="Todavía no cargaste a nadie"
              desc="Andá a Equipo → Caja del local y agregá a quien atiende, con su clave de 4 números."
            />
          )}
        </>
      )}

      <Nav />
    </main>
  );
}

// Respuesta del dueño sobre el riesgo de un empleado: entrena el ERM (POST /api/erm/:empleado/feedback)
function FeedbackERM({ empleado, token }: { empleado: string; token: string }) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const enviar = async (tipo: "confirma_riesgo_real" | "descarta_como_normal") => {
    setEstado("enviando");
    const r = await fetch(`${API}/api/erm/${encodeURIComponent(empleado)}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tipo_feedback: tipo }),
    }).catch(() => null);
    setEstado(r && r.ok ? "ok" : "error");
  };
  const btn = { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" } as const;
  if (estado === "ok") {
    return <div style={{ margin: "0 20px 16px", fontSize: 12, color: "var(--muted)" }}>Gracias. LumoBi usa tu respuesta para ajustar el riesgo de este empleado.</div>;
  }
  return (
    <div style={{ margin: "0 20px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>¿Lo revisaste? Tu respuesta ajusta el cálculo.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={btn} disabled={estado === "enviando"} onClick={() => enviar("confirma_riesgo_real")}>Había un problema</button>
        <button style={btn} disabled={estado === "enviando"} onClick={() => enviar("descarta_como_normal")}>Estaba todo bien</button>
      </div>
      {estado === "error" && <div style={{ fontSize: 12, color: "var(--critico)", marginTop: 6 }}>No se pudo guardar. Probá de nuevo.</div>}
    </div>
  );
}
