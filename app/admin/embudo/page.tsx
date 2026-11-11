"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const RUTAS_APP = ["/dashboard", "/fugas", "/nicole", "/predicciones", "/rentabilidad", "/catalogo", "/alertas", "/empleados", "/benchmark", "/red", "/periodos", "/ajustes", "/negocio", "/mas", "/primeros-pasos", "/onboarding"];

type Resumen = {
  dias: number;
  totales: { visitantes: number; sesiones: number; eventos: number; usuarios: number; negocios: number };
  embudo: { paso: string; n: number }[];
  pantallas: { ruta: string; vistas: number; personas: number; seg_medio: number; salidas: number }[];
  acciones: { tipo: string; ruta: string; que: string; veces: number; personas: number }[];
  por_dia: { dia: string; visitantes: number; usuarios: number; registros: number }[];
  origen: { origen: string; visitantes: number; registros: number }[];
  dispositivos: { disp: string; visitantes: number }[];
  errores: { tipo: string; ruta: string; detalle: string | null; estado: string; veces: number; personas: number }[];
  scroll_landing: { pct: number; visitantes: number }[];
  cuentas: { por_estado: { estado: string; n: number; nuevas: number }[]; trial_vencido_sin_pagar: number } | null;
  activacion?: { paso: string; n: number }[] | null;
  cuentas_detalle?: { negocio: string | null; registro: string; mp: boolean; dias_ventas: number; vio_analisis: boolean; estado: string }[] | null;
  negocios: { negocio_id: string; nombre?: string | null; ultimo: string; dias_activos: number; pantallas: number; eventos: number }[];
};

const card: React.CSSProperties = { background: "#fff", border: "1px solid #D8DEE8", borderRadius: 14, padding: 16, marginBottom: 14 };
const th: React.CSSProperties = { textAlign: "left", fontSize: 12, color: "#5B6B80", fontWeight: 600, padding: "6px 8px", borderBottom: "1px solid #E3E8F0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { fontSize: 13, padding: "7px 8px", borderBottom: "1px solid #EEF1F5", color: "#0A1628" };

function Tabla({ cab, filas }: { cab: string[]; filas: (string | number)[][] }) {
  if (!filas.length) return <div style={{ fontSize: 13, color: "#5B6B80" }}>Sin datos todavía.</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{cab.map((c) => <th key={c} style={th}>{c}</th>)}</tr></thead>
        <tbody>{filas.map((f, i) => <tr key={i}>{f.map((v, j) => <td key={j} style={{ ...td, textAlign: j === 0 ? "left" : "right" }}>{v}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, color: "#0A1628" }}>{titulo}</h2>
      {nota && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#5B6B80" }}>{nota}</p>}
      {children}
    </section>
  );
}

export default function AdminEmbudo() {
  const [clave, setClave] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [modoClave, setModoClave] = useState(false);
  const [dias, setDias] = useState(7);
  const [data, setData] = useState<Resumen | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async (k: string, d: number) => {
    setCargando(true); setError("");
    try {
      const r = await fetch(`${API}/api/analitica/resumen?dias=${d}`, { headers: { Authorization: `Bearer ${k}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(r.status === 401 && !modoClave ? "Esa cuenta no tiene permiso para ver este panel. Falta cargar tu email en ADMIN_EMAILS (Render)." : (j.error || "No se pudo cargar")); setData(null); if (r.status === 401) { try { sessionStorage.removeItem("lb_adm"); } catch { /* */ } } }
      else {
        setData(j as Resumen);
        try { sessionStorage.setItem("lb_adm", k); localStorage.setItem("lb_ignorar", "1"); } catch { /* */ }
      }
    } catch { setError("No hay conexión con el servidor"); }
    setCargando(false);
  }, [modoClave]);

  useEffect(() => {
    try { const k = sessionStorage.getItem("lb_adm"); if (k) { setClave(k); cargar(k, dias); } } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = async () => {
    if (modoClave) { if (clave) cargar(clave, dias); return; }
    if (!email.trim() || !pass) { setError("Poné tu email y tu contraseña"); return; }
    setCargando(true); setError("");
    try {
      const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password: pass }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) { setError(j.error || "Email o contraseña incorrectos"); setCargando(false); return; }
      setPass("");
      await cargar(j.token, dias);
    } catch { setError("No hay conexión con el servidor"); setCargando(false); }
  };

  const salir = () => {
    try { sessionStorage.removeItem("lb_adm"); } catch { /* */ }
    setData(null); setClave(""); setEmail(""); setPass(""); setError("");
  };

  const max = data ? Math.max(1, ...data.embudo.map((e) => e.n)) : 1;
  const usadas = new Set((data?.pantallas ?? []).map((p) => p.ruta));
  const sinUso = RUTAS_APP.filter((r) => !usadas.has(r));
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) + "%" : "-");

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "20px 14px 60px", background: "#EEF1F5", minHeight: "100vh", fontFamily: "var(--font-instrument),sans-serif" }}>
      <h1 style={{ fontSize: 22, margin: "0 0 4px", color: "#0A1628" }}>Embudo y uso de LumoBi</h1>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#5B6B80" }}>Panel privado. Los datos empiezan a juntarse desde que se publicó este panel.</p>

      <div style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {!data && !modoClave && (
          <>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email de LumoBi" autoComplete="username"
              style={{ flex: "1 1 200px", padding: "11px 12px", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 14 }} />
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Tu contraseña" autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
              style={{ flex: "1 1 200px", padding: "11px 12px", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 14 }} />
          </>
        )}
        {!data && modoClave && (
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave técnica"
            onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
            style={{ flex: "1 1 220px", padding: "11px 12px", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 14 }} />
        )}
        <select value={dias} onChange={(e) => { const d = Number(e.target.value); setDias(d); if (data) { try { const k = sessionStorage.getItem("lb_adm"); if (k) cargar(k, d); } catch { /* */ } } }}
          style={{ padding: "11px 12px", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 14, background: "#fff" }}>
          <option value={1}>Últimas 24 horas</option><option value={7}>7 días</option><option value={30}>30 días</option><option value={90}>90 días</option>
        </select>
        <button onClick={() => { if (data) { try { const k = sessionStorage.getItem("lb_adm"); if (k) cargar(k, dias); } catch { /* */ } } else entrar(); }} disabled={cargando}
          style={{ padding: "11px 18px", background: "#0A5BD3", color: "#fff", border: 0, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {cargando ? "Cargando" : data ? "Actualizar" : "Entrar"}
        </button>
        {data && (
          <button onClick={salir} style={{ padding: "11px 14px", background: "#fff", color: "#0A1628", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>Salir</button>
        )}
        {!data && (
          <button onClick={() => { setModoClave(!modoClave); setError(""); }}
            style={{ background: "none", border: 0, color: "#5B6B80", fontSize: 12, textDecoration: "underline", cursor: "pointer" }}>
            {modoClave ? "Entrar con mi cuenta" : "Usar clave técnica"}
          </button>
        )}
      </div>
      {error && <div style={{ ...card, color: "#B42318", borderColor: "#F3C4BF" }}>{error}</div>}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
            {[["Visitantes", data.totales.visitantes], ["Sesiones", data.totales.sesiones], ["Usuarios con cuenta", data.totales.usuarios], ["Negocios activos", data.totales.negocios]].map(([t, v]) => (
              <div key={String(t)} style={card}><div style={{ fontSize: 12, color: "#5B6B80" }}>{t}</div><div style={{ fontSize: 26, fontWeight: 700, color: "#0A1628" }}>{v}</div></div>
            ))}
          </div>

          <Seccion titulo="Embudo de conversión" nota="Cuenta personas distintas que hicieron cada paso en el período. Alguien puede registrarse sin pasar por la landing, por eso un paso puede superar al anterior.">
            {data.embudo.map((e, i) => (
              <div key={e.paso} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#0A1628" }}>
                  <span>{e.paso}</span>
                  <span><b>{e.n}</b>{i > 0 && <span style={{ color: "#5B6B80" }}> · {pct(e.n, data.embudo[i - 1].n)} del paso anterior</span>}</span>
                </div>
                <div style={{ height: 10, background: "#E3E8F0", borderRadius: 6, marginTop: 4 }}>
                  <div style={{ width: `${Math.max(2, (e.n / max) * 100)}%`, height: 10, background: "#0A5BD3", borderRadius: 6 }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize: 13, color: "#0A1628", marginTop: 6 }}>
              De cada 100 que ven la landing se registran <b>{pct(data.embudo[5].n, data.embudo[0].n).replace("%", "")}</b>.
            </div>
          </Seccion>

          <Seccion titulo="Cuentas y planes" nota="Se lee de la base de usuarios, no de las visitas. Hoy el plan se activa a mano, así que las pagas aparecen cuando vos las activás.">
            {data.cuentas ? (
              <>
                <Tabla cab={["Estado de la cuenta", "Total", "Nuevas en el período"]} filas={data.cuentas.por_estado.map((c) => [c.estado, c.n, c.nuevas])} />
                <p style={{ fontSize: 13, color: "#0A1628", margin: "12px 0 0" }}>Prueba vencida sin pagar: <b>{data.cuentas.trial_vencido_sin_pagar}</b></p>
              </>
            ) : <div style={{ fontSize: 13, color: "#5B6B80" }}>No se pudieron leer las cuentas.</div>}
          </Seccion>

          {data.activacion && data.activacion.length > 0 && (
            <Seccion titulo="Activación de las cuentas nuevas" nota="Cuentas creadas en el período (sin las internas ni las de prueba). Sale de la base de datos, no de las visitas: conectar Mercado Pago, cargar ventas, ver el análisis y pagar.">
              {data.activacion.map((e, i) => {
                const m = Math.max(1, data.activacion![0].n);
                return (
                  <div key={e.paso} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#0A1628" }}>
                      <span>{e.paso}</span>
                      <span><b>{e.n}</b>{i > 0 && <span style={{ color: "#5B6B80" }}> · {pct(e.n, data.activacion![i - 1].n)} del paso anterior</span>}</span>
                    </div>
                    <div style={{ height: 10, background: "#E3E8F0", borderRadius: 6, marginTop: 4 }}>
                      <div style={{ width: `${Math.max(2, (e.n / m) * 100)}%`, height: 10, background: "#00A3D9", borderRadius: 6 }} />
                    </div>
                  </div>
                );
              })}
              <p style={{ fontSize: 12, color: "#5B6B80", margin: "8px 0 0" }}>Con menos de 30 cuentas por paso no saques conclusiones: mirá la tendencia, no el porcentaje.</p>
            </Seccion>
          )}

          {data.cuentas_detalle && data.cuentas_detalle.length > 0 && (
            <Seccion titulo="Cuenta por cuenta" nota="Las últimas cuentas creadas en el período y hasta dónde llegó cada una.">
              <Tabla cab={["Negocio", "Se registró", "Mercado Pago", "Días con ventas", "Vio análisis", "Plan"]}
                filas={data.cuentas_detalle.map((c) => [c.negocio || "-", new Date(c.registro).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }), c.mp ? "Sí" : "No", c.dias_ventas, c.vio_analisis ? "Sí" : "No", c.estado])} />
            </Seccion>
          )}

          <Seccion titulo="Hasta dónde bajan en la landing" nota="Personas que llegaron a cada punto de la página.">
            <Tabla cab={["Punto de la página", "Personas"]} filas={data.scroll_landing.map((s) => [`${s.pct}%`, s.visitantes])} />
          </Seccion>

          <Seccion titulo="Pantallas" nota="Salidas = veces que fue la última pantalla de una sesión (dónde se van). Tiempo medio en segundos.">
            <Tabla cab={["Pantalla", "Vistas", "Personas", "Tiempo medio (s)", "Salidas"]} filas={data.pantallas.map((p) => [p.ruta, p.vistas, p.personas, p.seg_medio, p.salidas])} />
            {sinUso.length > 0 && <p style={{ fontSize: 13, color: "#5B6B80", margin: "12px 0 0" }}><b>Sin ninguna visita en el período:</b> {sinUso.join(", ")}</p>}
          </Seccion>

          <Seccion titulo="Qué hacen en la app" nota="Clicks en botones y enlaces, y acciones que guardan algo en el servidor (POST, PUT, DELETE). De más usado a menos usado.">
            <Tabla cab={["Qué", "Dónde", "Veces", "Personas"]} filas={data.acciones.map((a) => [a.que, a.ruta, a.veces, a.personas])} />
          </Seccion>

          <Seccion titulo="Por día">
            <Tabla cab={["Día", "Visitantes", "Usuarios", "Registros"]} filas={data.por_dia.map((d) => [d.dia, d.visitantes, d.usuarios, d.registros])} />
          </Seccion>

          <Seccion titulo="De dónde vienen" nota="Origen / medio / campaña / anuncio (utm) o sitio de origen. Con los links ?utm_source=facebook&utm_medium=paid&utm_campaign=lanzamiento&utm_content=perdidas ves qué anuncio trae gente.">
            <Tabla cab={["Origen", "Visitantes", "Registros"]} filas={data.origen.map((o) => [o.origen, o.visitantes, o.registros])} />
          </Seccion>

          <Seccion titulo="Negocios con actividad" nota="Quién usa la app y cuánto. Los días activos distintos muestran si vuelven.">
            <Tabla cab={["Negocio", "Última vez", "Días activos", "Pantallas", "Eventos"]}
              filas={data.negocios.map((n) => [n.nombre || n.negocio_id.slice(0, 8), new Date(n.ultimo).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }), n.dias_activos, n.pantallas, n.eventos])} />
          </Seccion>

          <Seccion titulo="Errores" nota="Fallas del servidor, errores de pantalla y registros o ingresos rechazados.">
            <Tabla cab={["Tipo", "Dónde", "Detalle", "Estado", "Veces", "Personas"]} filas={data.errores.map((e) => [e.tipo, e.ruta, e.detalle ?? "", e.estado, e.veces, e.personas])} />
          </Seccion>

          <Seccion titulo="Dispositivos">
            <Tabla cab={["Tipo", "Visitantes"]} filas={data.dispositivos.map((d) => [d.disp === "m" ? "Celular (web)" : d.disp === "d" ? "Computadora" : d.disp === "pwa" ? "App instalada" : d.disp, d.visitantes])} />
          </Seccion>
        </>
      )}
    </main>
  );
}
