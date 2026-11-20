"use client";
import { ActivacionCard } from "./components/Activacion";
import { RecuperadoLinea } from "./components/RecuperadoCard";
import { UltimoTurnoCard, ProyeccionCard, AprendizajeCard, type InformeTurno, type Proyeccion, type Aprendizaje } from "./components/PrimerosDias";
import Nav from "./components/Nav";
import BannerPasos from "./components/BannerPasos";
import ConectarMP from "./components/ConectarMP";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import { useSucursal } from "./hooks/useSucursal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Alerta = {
  tipo: string;
  prioridad: string;
  mensaje: string;
  accion: string;
  timestamp: string;
  datos?: Record<string, unknown>;
  url?: string;
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
  if (["critico", "inconsistencia"].includes(prioridad)) return "Urgente";
  if (["atencion", "ineficiencia"].includes(prioridad)) return "Para mirar";
  if (prioridad === "positivo") return "Todo ok";
  return "Info";
}

type ModalData = {
  title: string;
  text: string;
  actionButton?: { text: string; href: string };
};

type WowPattern = {
  id: string;
  icono: string;
  titulo: string;
  descripcion: string;
  duele: string;
  recomendacion: string;
  advertencia: string;
  impacto_pesos: number;
  confianza: number;
  detalle: Record<string, unknown>;
};

type WowModalData = {
  pattern: WowPattern;
};

function HomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { token, ready } = useAuth();

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [hayVentas, setHayVentas] = useState<boolean | null>(null);
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [motorCaido, setMotorCaido] = useState(false);
  const [informe, setInforme] = useState<InformeTurno | null>(null);
  const [verMas, setVerMas] = useState(false);
  const [proyeccion, setProyeccion] = useState<Proyeccion | null>(null);
  const [aprendizaje, setAprendizaje] = useState<Aprendizaje | null>(null);
  const [predPreliminar, setPredPreliminar] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [queHacer, setQueHacer] = useState<{ cantidad: number; urgentes: number; pesos_en_juego: number } | null>(null);
  const [pred, setPred] = useState<Prediccion | null>(null);
  const [vivo, setVivo] = useState<{ ventas?: number; tickets?: number; esperado_hasta_ahora?: number | null } | null>(null);
  const [locales, setLocales] = useState<{ sucursal_id: number; nombre: string; turno_activo: { tipo: string; desde: number; quien?: string | null } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [wowPatterns, setWowPatterns] = useState<WowPattern[]>([]);
  const [wowModalData, setWowModalData] = useState<WowModalData | null>(null);
  const { sucursalId } = useSucursal();

  useEffect(() => {
    if (typeof window === "undefined") return;
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
    // Carga rápida: lo último que vimos se muestra al instante y se actualiza en segundo plano.
    // El análisis completo tarda; el dueño no tiene que mirar "Cargando..." cada vez que entra.
    const clave = `lumo_inicio:${token.slice(-16)}:${sucursalId ?? 0}`;
    let vigente = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aplicar = (ini: any) => {
      setAnalisis(ini?.analisis ?? null);
      setAlertas(ini?.revisar?.items || []);
      // Si el motor no pudo analizar, no mostrar "En orden": no sabemos si está en orden
      setMotorCaido(!ini || !!ini.error || ini.motor_ok === false);
      setInforme(ini?.informe_turno ?? null);
      setVivo(ini?.en_vivo?.total ?? null);
      setLocales(Array.isArray(ini?.en_vivo?.sucursales) ? ini.en_vivo.sucursales : []);
      setProyeccion(ini?.proyeccion_hoy ?? null);
      setAprendizaje(ini?.aprendizaje ?? null);
      setPredPreliminar(!!ini?.hoy?.preliminar);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPred(ini?.hoy?.disponible ? { disponible: true, facturacion: { disponible: true, venta_diaria_esperada: ini.hoy.esperado_dia, confianza: { pct: ini.hoy.confianza_pct } } } as any : null);
    };
    let hayCache = false;
    try {
      const ci = localStorage.getItem(clave + ":i");
      if (ci) {
        const o = JSON.parse(ci);
        if (o && !o.error) {
          aplicar(o);
          const cw = localStorage.getItem(clave + ":w");
          if (cw) setWowPatterns(JSON.parse(cw)?.patrones || []);
          setLoading(false);
          hayCache = true;
        }
      }
    } catch { /* sin cache: se carga normal */ }

    // Cada pedido aparece apenas llega; ya no esperan el uno al otro
    fetch(`${API}/api/inicio${sucursalId ? `?sucursal_id=${sucursalId}` : ""}`, { headers }).then(r => r.json()).catch(() => null).then((ini) => {
      if (!vigente) return;
      if (ini && !ini.error) {
        aplicar(ini);
        try {
          // Se guarda solo lo de esta cuenta: las copias de otras sesiones se borran
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith("lumo_inicio:") && !k.startsWith(`lumo_inicio:${token.slice(-16)}:`)) localStorage.removeItem(k);
          }
          localStorage.setItem(clave + ":i", JSON.stringify(ini));
        } catch { /* sin espacio: no pasa nada */ }
      } else if (!hayCache) {
        aplicar(ini);
      }
      setLoading(false);
    });
    // La lista única de "qué hacer" (oportunidades + fugas + alertas): acá solo el resumen, el detalle está en /que-hacer
    fetch(`${API}/api/que-hacer${sucursalId ? `?sucursal_id=${sucursalId}` : ""}`, { headers }).then(r => (r.ok ? r.json() : null)).catch(() => null).then((q) => {
      if (vigente && q && q.resumen) setQueHacer(q.resumen);
    });
    fetch(`${API}/api/negocio/wow-moment`, { headers }).then(r => r.json()).catch(() => null).then((wow) => {
      if (!vigente || !wow) return;
      setWowPatterns(wow.patrones || []);
      try { localStorage.setItem(clave + ":w", JSON.stringify(wow)); } catch { /* idem */ }
    });
    return () => { vigente = false; };
  }, [ready, token, sucursalId]);

  const dq = dqScore(analisis?.data_quality_score);
  const facturacion = pred?.facturacion?.disponible ? pred.facturacion.venta_diaria_esperada : null;

  const openModal = (data: ModalData) => setModalData(data);
  const closeModal = () => setModalData(null);

  const openWowModal = (pattern: WowPattern) => setWowModalData({ pattern });
  const closeWowModal = () => setWowModalData(null);


  return (
    <>
      {modalData && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10,22,40,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#F5F7FA",
              borderRadius: 20,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
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
              }}>
                {modalData.text}
              </p>
            </div>

            {modalData.actionButton && (
              <button
                onClick={() => {
                  closeModal();
                  router.push(modalData.actionButton!.href);
                }}
                style={{
                  width: "100%",
                  background: "#007AFF",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                {modalData.actionButton.text}
              </button>
            )}

            <button
              onClick={() => router.push("/nicole")}
              style={{
                width: "100%",
                background: "white",
                color: "#007AFF",
                border: "1px solid #007AFF",
                borderRadius: 12,
                padding: 14,
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
                padding: 14,
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

      {wowModalData && (
        <div
          onClick={closeWowModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10,22,40,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#F5F7FA",
              borderRadius: 20,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 32 }}>{wowModalData.pattern.icono}</span>
                <h2 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0A1628",
                  margin: 0,
                }}>
                  {wowModalData.pattern.titulo}
                </h2>
              </div>
              <button
                onClick={closeWowModal}
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
                marginBottom: 16,
              }}>
                {wowModalData.pattern.descripcion}
              </p>

              <div style={{
                background: "#FEF2F2",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderLeft: "4px solid #EF4444",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Impacto
                </div>
                <div style={{ fontSize: 13, color: "#0A1628", lineHeight: 1.5 }}>
                  {wowModalData.pattern.duele}
                </div>
              </div>

              <div style={{
                background: "#F0F9FF",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#007AFF", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  💡 Recomendación
                </div>
                <div style={{ fontSize: 13, color: "#0A1628", lineHeight: 1.5 }}>
                  {textoRecomendacion(wowModalData.pattern.recomendacion)}
                </div>
              </div>

              <p style={{
                fontSize: 11,
                lineHeight: 1.5,
                color: "#94A3B8",
                margin: 0,
                fontStyle: "italic",
              }}>
                {wowModalData.pattern.advertencia}
              </p>
            </div>

            <button
              onClick={() => {
                closeWowModal();
                router.push("/nicole");
              }}
              style={{
                width: "100%",
                background: "white",
                color: "#007AFF",
                border: "1px solid #007AFF",
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              Hablá con NICOLE sobre esto →
            </button>

            <button
              onClick={closeWowModal}
              style={{
                width: "100%",
                background: "#007AFF",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: 14,
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

      <main style={{ minHeight: "100vh", background: "var(--papel)", paddingBottom: 100 }}>

        {toast && (
          <div style={{
            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100,
            background: "white", borderRadius: 12, padding: "12px 20px",
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            color: toast.ok ? "#00C48C" : "#EF4444",
            border: `1px solid ${toast.ok ? "#00C48C40" : "#EF444440"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "80px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 3, textTransform: "uppercase" }}>Cargando...</div>
          </div>
        ) : (
          <div style={{ padding: "0 16px" }}>

            <BannerPasos token={token} onVentas={setHayVentas} soloVentas />
            <ActivacionCard compacta />

            {hayVentas === false ? (
              <div style={{ margin: "0 0 16px", padding: "16px", borderRadius: 14, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)", marginBottom: 4 }}>Todavía no hay ventas</div>
                <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.55, marginBottom: 12 }}>
                  Cuando cobres tu primera venta con la caja, acá vas a ver cuánto vendiste, cuánto vas a vender y dónde se te va la plata.
                </div>
                <button onClick={() => router.push("/primeros-pasos?paso=cobrar")}
                  style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "var(--tinta)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Ir a la caja y cobrar
                </button>
              </div>
            ) : (<>
              {/* 1. HOY: una sola tarjeta (antes eran tres) */}
              <div style={{ margin: "0 0 16px", padding: 18, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase", marginBottom: 6 }}>Hoy</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif", lineHeight: 1.1 }}>{fmt(vivo?.ventas ?? 0)}</div>
                <div style={{ fontSize: 13, color: "var(--tinta-apagada)", marginTop: 4, lineHeight: 1.5 }}>
                  vendido en {vivo?.tickets ?? 0} ventas
                  {vivo?.esperado_hasta_ahora != null && vivo.esperado_hasta_ahora > 0 && (() => {
                    const d = Math.round(((vivo.ventas ?? 0) / vivo.esperado_hasta_ahora - 1) * 100);
                    return (vivo.ventas ?? 0) > 0
                      ? <> · <strong style={{ color: d >= -10 ? "var(--ok, #16A34A)" : "var(--critico, #DC2626)" }}>{Math.abs(d)}% {d >= 0 ? "más" : "menos"}</strong> que lo normal a esta hora</>
                      : <> · lo normal a esta hora: {fmt(vivo.esperado_hasta_ahora)}</>;
                  })()}
                </div>
                {facturacion != null && (
                  <div style={{ fontSize: 14, color: "var(--tinta)", marginTop: 10, lineHeight: 1.5 }}>
                    {predPreliminar ? "Un día normal tuyo (preliminar): " : "Deberías cerrar cerca de "}<strong>{fmt(facturacion)}</strong>.
                  </div>
                )}
                {facturacion == null && proyeccion && <div style={{ marginTop: 10 }}><ProyeccionCard p={proyeccion} /></div>}
                <button onClick={() => router.push("/en-vivo")}
                  style={{ width: "100%", marginTop: 14, padding: "11px", borderRadius: 8, border: "1px solid var(--linea)", background: "var(--papel)", color: "var(--tinta)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Ver en vivo: hora por hora y quién atiende →
                </button>
              </div>

              {/* 2. LO QUE TENÉS QUE MIRAR HOY: cada cosa una sola vez */}
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tinta)", margin: "8px 0 10px" }}>Lo que tenés que mirar hoy</div>
              {alertas.length === 0 ? (
                <div style={{ margin: "0 0 16px", padding: 16, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ok, #16A34A)" }}>{motorCaido ? "No pudimos revisar tu negocio ahora" : "Hoy está todo normal"}</div>
                  <div style={{ fontSize: 13, color: "var(--tinta-apagada)", marginTop: 2 }}>{motorCaido ? "Probá de nuevo en un rato." : "LumoBi no vio nada raro. Si aparece algo, te avisa al celu."}</div>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {alertas.slice(0, 3).map((a, i) => {
                    const crit = ["critico", "inconsistencia"].includes(a.prioridad);
                    return (
                      <div key={i} onClick={() => router.push(a.url || "/alertas")}
                        style={{ padding: 14, marginBottom: 8, borderRadius: 12, border: "1px solid var(--linea)", borderLeft: `4px solid ${crit ? "#DC2626" : "#D97706"}`, background: "var(--blanco)", cursor: "pointer" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: crit ? "#DC2626" : "#D97706", marginBottom: 2 }}>{crit ? "URGENTE" : "PARA MIRAR"}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.4 }}>{a.mensaje}</div>
                        {a.accion && <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.45, marginTop: 4 }}>{a.accion}</div>}
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#007AFF", marginTop: 6 }}>Ver detalle →</div>
                      </div>
                    );
                  })}
                  {alertas.length > 3 && (
                    <button onClick={() => router.push("/que-hacer")} style={{ padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      Ver las {alertas.length} →
                    </button>
                  )}
                </div>
              )}

              {queHacer && queHacer.cantidad > 0 && (
                <button onClick={() => router.push("/que-hacer")}
                  style={{ width: "100%", textAlign: "left", margin: "0 0 16px", padding: 14, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", cursor: "pointer" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>
                    {queHacer.cantidad} cosa{queHacer.cantidad === 1 ? "" : "s"} para hacer{queHacer.pesos_en_juego > 0 ? ` · $${Math.round(queHacer.pesos_en_juego).toLocaleString("es-AR")} en juego` : ""}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#007AFF", marginTop: 4 }}>Ver la lista completa →</div>
                </button>
              )}

              {/* Lo que ya funcionó: cerrar el círculo de los consejos */}
              <RecuperadoLinea />

              {/* Lo secundario queda a un toque: la Home responde "¿cómo voy y qué hago?" */}
              <button onClick={() => setVerMas(v => !v)} aria-expanded={verMas}
                style={{ width: "100%", margin: "0 0 12px", padding: "12px", borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {verMas ? "Ver menos" : "Ver más de hoy"}
              </button>
              {verMas && (<>
              {/* Quién está en la caja ahora */}
              {locales.length > 0 && (
                <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase", marginBottom: 6 }}>En la caja ahora</div>
                  {locales.map(l => (
                    <div key={l.sucursal_id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", fontSize: 14, color: "var(--tinta)" }}>
                      {locales.length > 1 && <span style={{ fontWeight: 600 }}>{l.nombre}</span>}
                      <span style={{ color: l.turno_activo ? "var(--tinta)" : "var(--tinta-apagada)", marginLeft: locales.length > 1 ? "auto" : 0 }}>
                        {l.turno_activo
                          ? `${l.turno_activo.quien ? l.turno_activo.quien + " · " : ""}turno ${l.turno_activo.tipo}, desde las ${l.turno_activo.desde}`
                          : "Sin turno abierto"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Atajos a lo que se hace todos los días */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "0 0 16px" }}>
                {[
                  { t: "Cobrar", h: "/caja" },
                  { t: "Caja en vivo", h: "/en-vivo" },
                  { t: "Cargar factura", h: "/compras" },
                  { t: "Contar stock", h: "/catalogo" },
                ].map(a => (
                  <button key={a.h} onClick={() => router.push(a.h)}
                    style={{ padding: "14px 10px", borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 48 }}>
                    {a.t}
                  </button>
                ))}
              </div>

              {hayVentas === true && <ConectarMP token={token} />}

              {/* 3. ÚLTIMO TURNO (corto) */}
              {informe && <UltimoTurnoCard informe={informe} compacto />}

              {/* 4. LO QUE ENCONTRÓ NICOLE: solo lo que no está arriba, máximo 2 */}
              {(() => {
                const yaArriba = alertas.some(a => /caja/i.test(a.mensaje));
                const lista = wowPatterns.filter(w => !(yaArriba && w.id === "diferencias_caja")).slice(0, 2);
                if (!lista.length) return null;
                return (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tinta)", margin: "8px 0 10px" }}>Lo que encontró NICOLE</div>
                    {lista.map((w, i) => (
                      <div key={i} onClick={() => openWowModal(w)}
                        style={{ padding: 14, marginBottom: 8, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", cursor: "pointer" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.4 }}>{w.titulo}</div>
                        <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.45, marginTop: 4 }}>{textoRecomendacion(w.recomendacion)}</div>
                      </div>
                    ))}
                    <button onClick={() => router.push("/oportunidades")} style={{ padding: 0, margin: "2px 0 16px", border: "none", background: "transparent", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      Ver todas tus oportunidades →
                    </button>
                  </>
                );
              })()}
              </>)}
            </>)}

            {verMas && aprendizaje && !aprendizaje.completo && <AprendizajeCard a={aprendizaje} />}
          </div>
        )}

        <Nav />
      </main>
    </>
  );
}

// Una recomendación puede venir como texto o como objeto {descripcion, contexto, accion_recomendada, texto_completo}
function textoRecomendacion(r: unknown): string {
  if (r == null) return "";
  if (typeof r === "string" || typeof r === "number") return String(r);
  const o = r as { texto_completo?: string; accion_recomendada?: string; descripcion?: string };
  return o.texto_completo || o.accion_recomendada || o.descripcion || "";
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
