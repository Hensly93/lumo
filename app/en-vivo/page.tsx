"use client";
// Tu negocio en vivo — la sala de situación: lo que pasó, lo que está pasando y lo que viene.
// Todo sale de /api/sala, que usa las mismas fuentes que el Inicio, Predicciones y Alertas.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import { useSucursal } from "../hooks/useSucursal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const $ = (n: number | null | undefined) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("es-AR"));

type Hora = { hora: number; vendido: number | null; tickets: number; esperado: number | null; estado: "paso" | "ahora" | "viene" };
type Sala = {
  paso: { ayer: { dia: string; vendido: number; tickets: number; normal: number | null; dif_pct: number | null };
    ultimo_turno: { titulo: string; diferencia_caja: number; hechos: string[] } | null };
  ahora: { hora: string; vendido: number; tickets: number; esperado_hasta_ahora: number | null;
    cajas_abiertas: { quien: string; turno: string; local: string | null; desde: string; vendido: number; tickets: number }[];
    hora_por_hora: Hora[] };
  viene: { resto_del_dia: number | null; cierre_esperado: number | null; proxima_hora_fuerte: { hora: number; esperado: number } | null;
    manana: { dia: string; esperado: number; rango: [number, number] | null; porque: { texto: string; pesos: number }[]; hora_fuerte: number | null } | null };
  revisar: { prioridad: string; mensaje: string; url: string }[];
};

const caja = { padding: 16, borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)", marginBottom: 12 } as const;
const titulo = { fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase" as const, margin: "18px 0 8px" };
const gris = { fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.5 } as const;

function Barras({ horas }: { horas: Hora[] }) {
  const max = Math.max(1, ...horas.map(h => Math.max(h.vendido ?? 0, h.esperado ?? 0)));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 110 }}>
        {horas.map(h => {
          const alto = ((h.estado === "viene" ? h.esperado : h.vendido) ?? 0) / max * 100;
          const esp = (h.esperado ?? 0) / max * 100;
          return (
            <div key={h.hora} title={`${h.hora} h: vendido ${$(h.vendido)} · normal ${$(h.esperado)}`} style={{ flex: 1, position: "relative", height: "100%", display: "flex", alignItems: "flex-end" }}>
              {h.estado !== "viene" && h.esperado != null && <div style={{ position: "absolute", left: 0, right: 0, bottom: `${esp}%`, borderTop: "2px dashed var(--tinta-apagada)" }} />}
              <div style={{ width: "100%", height: `${alto}%`, minHeight: 2, borderRadius: 3,
                background: h.estado === "viene" ? "var(--papel)" : h.estado === "ahora" ? "#00C2FF" : "var(--tinta)",
                border: h.estado === "viene" ? "1px dashed var(--linea)" : "none" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
        {horas.map(h => <div key={h.hora} style={{ flex: 1, fontSize: 9, textAlign: "center", color: "var(--tinta-apagada)" }}>{h.hora}</div>)}
      </div>
      <div style={{ ...gris, fontSize: 11, marginTop: 6 }}>Barra oscura: lo que vendiste · línea punteada: lo normal a esa hora · gris: lo que se espera que venga</div>
    </div>
  );
}

export default function EnVivo() {
  const router = useRouter();
  const { sucursalId } = useSucursal();
  const [s, setS] = useState<Sala | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("lumo_token");
    if (!token) { router.replace("/login"); return; }
    let vivo = true;
    const cargar = () => fetch(`${API}/api/sala${sucursalId ? `?sucursal_id=${sucursalId}` : ""}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject())).then(d => { if (vivo) { setS(d); setError(false); } })
      .catch(() => { if (vivo) setError(true); });
    cargar();
    const id = setInterval(cargar, 60000);
    return () => { vivo = false; clearInterval(id); };
  }, [sucursalId, router]);

  return (
    <div style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Tu negocio en vivo" sub="Lo que pasó, lo que está pasando y lo que viene" />
      <div style={{ padding: "0 16px" }}>
        {error && !s && <div style={caja}><div style={gris}>No se pudo cargar. Revisá la conexión y probá de nuevo.</div></div>}
        {!s && !error && <div style={gris}>Cargando…</div>}
        {s && (<>
          {/* AHORA */}
          <div style={titulo}>Ahora · {s.ahora.hora} h</div>
          <div style={caja}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--tinta)" }}>{$(s.ahora.vendido)}</div>
            <div style={gris}>
              vendido hoy en {s.ahora.tickets} ventas
              {s.ahora.esperado_hasta_ahora != null && s.ahora.esperado_hasta_ahora > 0 && ` · lo normal a esta hora: ${$(s.ahora.esperado_hasta_ahora)}`}
            </div>
            {s.ahora.hora_por_hora.length > 0 && <div style={{ marginTop: 14 }}><Barras horas={s.ahora.hora_por_hora} /></div>}
          </div>
          <div style={caja}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", marginBottom: 6 }}>Cajas abiertas</div>
            {s.ahora.cajas_abiertas.length === 0
              ? <div style={gris}>No hay ninguna caja abierta ahora. Si alguien está atendiendo, pedile que abra el turno: sin turno no hay control de caja.</div>
              : s.ahora.cajas_abiertas.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: i ? "1px solid var(--linea)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>{c.quien}</div>
                    <div style={gris}>Turno {c.turno}{c.local ? ` · ${c.local}` : ""} · desde las {c.desde}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>{$(c.vendido)}</div>
                    <div style={gris}>{c.tickets} ventas</div>
                  </div>
                </div>
              ))}
          </div>

          {/* LO QUE VIENE */}
          <div style={titulo}>Lo que viene</div>
          <div style={caja}>
            {s.viene.cierre_esperado != null && (
              <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.6 }}>
                Hoy deberías cerrar cerca de <strong>{$(s.viene.cierre_esperado)}</strong>.
                {s.viene.resto_del_dia != null && s.viene.resto_del_dia > 0 && <> Faltan entrar unos <strong>{$(s.viene.resto_del_dia)}</strong>.</>}
                {s.viene.proxima_hora_fuerte && <> La próxima hora fuerte es a las <strong>{s.viene.proxima_hora_fuerte.hora} h</strong>: tené la caja y la mercadería listas.</>}
              </div>
            )}
            {s.viene.manana && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--linea)" }}>
                <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.6 }}>
                  Mañana {s.viene.manana.dia}: unos <strong>{$(s.viene.manana.esperado)}</strong>
                  {s.viene.manana.rango && <span style={gris}> (entre {$(s.viene.manana.rango[0])} y {$(s.viene.manana.rango[1])})</span>}.
                  {s.viene.manana.hora_fuerte != null && <> Lo más fuerte, a las {s.viene.manana.hora_fuerte} h.</>}
                </div>
                {s.viene.manana.porque.length > 0 && s.viene.manana.porque.map((p, i) => (
                  <div key={i} style={gris}>· {p.texto}: {p.pesos >= 0 ? "+" : "−"}{$(Math.abs(p.pesos))}</div>
                ))}
                <button onClick={() => router.push("/predicciones")} style={{ marginTop: 8, padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Ver la semana →</button>
              </div>
            )}
            {s.viene.cierre_esperado == null && !s.viene.manana && <div style={gris}>LumoBi necesita unos días de ventas para decirte qué viene.</div>}
          </div>

          {/* LO QUE PASÓ */}
          <div style={titulo}>Lo que pasó</div>
          <div style={caja}>
            <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.6 }}>
              Ayer ({s.paso.ayer.dia}) vendiste <strong>{$(s.paso.ayer.vendido)}</strong> en {s.paso.ayer.tickets} ventas.
              {s.paso.ayer.normal != null && s.paso.ayer.dif_pct != null && (
                <> Un {s.paso.ayer.dia} normal vendés {$(s.paso.ayer.normal)}: fue <strong style={{ color: s.paso.ayer.dif_pct >= 0 ? "var(--ok, #16A34A)" : "var(--critico, #DC2626)" }}>{Math.abs(s.paso.ayer.dif_pct)}% {s.paso.ayer.dif_pct >= 0 ? "más" : "menos"}</strong>.</>
              )}
            </div>
            {s.paso.ultimo_turno && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--linea)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>{s.paso.ultimo_turno.titulo}</div>
                {s.paso.ultimo_turno.hechos.map((h, i) => <div key={i} style={gris}>· {h}</div>)}
              </div>
            )}
          </div>

          {/* PARA MIRAR */}
          <div style={titulo}>Para mirar</div>
          <div style={caja}>
            {s.revisar.length === 0
              ? <div style={gris}>No hay nada raro ahora. Si aparece algo, te avisa al celu.</div>
              : s.revisar.map((r, i) => (
                <div key={i} onClick={() => router.push(r.url)} style={{ padding: "8px 0", borderTop: i ? "1px solid var(--linea)" : "none", cursor: "pointer" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: r.prioridad === "critico" ? "#DC2626" : "#D97706" }}>{r.prioridad === "critico" ? "URGENTE" : "PARA MIRAR"}</span>
                  <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.45 }}>{r.mensaje} <span style={{ color: "#007AFF" }}>→</span></div>
                </div>
              ))}
          </div>
        </>)}
      </div>
      <Nav />
    </div>
  );
}
