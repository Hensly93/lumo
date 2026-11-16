"use client";
// LumoBi hacia adentro: a quién escribirle hoy, cómo está cada cliente y hacia dónde va el negocio.
import { useCallback, useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Cliente = {
  usuario_id: number; negocio: string | null; persona: string | null; email: string; celular: string | null;
  registro: string; estado_plan: string; etapa: string; riesgo: number; nivel: "alto" | "medio" | "bajo"; motivos: string[];
  ultimo_visto: string | null; ultimo_dias: number | null; dias_activos_7: number; dias_activos_prev7: number;
  app: { instalada: boolean; la_abrio_hace_dias: number | null; vio_la_oferta: boolean; avisos_activados: boolean };
  mp: boolean; dias_con_ventas: number; ultima_venta_dias: number | null; ventas_7: number; ventas_prev7: number;
  precio_potencial: number | null; prueba_vence: string | null; contactado_hace_dias: number | null; notas: number;
  accion: string; mensaje: string; whatsapp: string | null; mailto: string | null;
};
type Panorama = {
  cuentas: number;
  kpis: { nuevas_7: number; nuevas_prev7: number; activas_semana: number; activadas: number; pagando: number; en_riesgo: number; dormidas: number; pruebas_por_vencer: number; con_app: number; con_avisos: number; con_mp: number };
  por_etapa: { etapa: string; n: number }[]; hoy: Cliente[];
  proyeccion: { semanas: { semana: string; registros: number }[]; registros_30d: number | null; tasa_activacion: number | null; activadas_30d: number | null; plata_potencial_activos: number; plata_en_riesgo: number; confianza: string; nota_plata: string };
};
type Ficha = {
  cliente: Cliente; actividad_30d: { dia: string; eventos: number }[]; pantallas: { ruta: string; vistas: number }[];
  acciones: { que: string; veces: number }[]; hitos: { que: string; cuando: string }[];
  errores: { tipo: string; ruta: string; detalle: string | null; creado: string }[];
  notas: { id: number; tipo: string; texto: string; creado: string }[]; aclaracion_app: string;
};

const card: React.CSSProperties = { background: "#fff", border: "1px solid #D8DEE8", borderRadius: 14, padding: 16, marginBottom: 14 };
const chico: React.CSSProperties = { fontSize: 12, color: "#5B6B80" };
const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const COLOR = { alto: "#B42318", medio: "#B45309", bajo: "#067647" } as const;
const FONDO = { alto: "#FEF3F2", medio: "#FFFAEB", bajo: "#ECFDF3" } as const;
const NIVEL = { alto: "Riesgo alto", medio: "Riesgo medio", bajo: "Sin riesgo" } as const;
const hace = (d: number | null) => (d == null ? "sin datos" : d === 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`);

function clave() { try { return sessionStorage.getItem("lb_adm") || ""; } catch { return ""; } }
async function pedir<T>(ruta: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API}/api/analitica${ruta}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${clave()}`, ...(opts?.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || "No se pudo cargar");
  return j as T;
}

function Etiqueta({ c }: { c: Cliente }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, color: COLOR[c.nivel], background: FONDO[c.nivel] }}>{NIVEL[c.nivel]} · {c.riesgo}</span>;
}
const btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: "1px solid #D8DEE8", background: "#fff", color: "#0A1628", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" };
const btnP: React.CSSProperties = { ...btn, background: "#0A5BD3", color: "#fff", border: "1px solid #0A5BD3" };

function Contacto({ c, onHecho, onFicha }: { c: Cliente; onHecho: () => void; onFicha?: () => void }) {
  const [msg, setMsg] = useState("");
  const hecho = async () => {
    try { await pedir(`/cliente/${c.usuario_id}/nota`, { method: "POST", body: JSON.stringify({ tipo: "contacto", texto: `Contacté: ${c.accion}` }) }); onHecho(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
      {c.whatsapp ? <a href={c.whatsapp} target="_blank" rel="noreferrer" style={btnP}>Escribir por WhatsApp</a> : <span style={{ ...btn, color: "#98A2B3", cursor: "default" }}>Sin celular cargado</span>}
      {c.mailto && <a href={c.mailto} style={btn}>Email</a>}
      <button onClick={hecho} style={btn}>Ya le hablé</button>
      {onFicha && <button onClick={onFicha} style={btn}>Ver ficha</button>}
      {msg && <span style={{ ...chico, color: "#B42318" }}>{msg}</span>}
    </div>
  );
}

function Numero({ t, v, sub, color }: { t: string; v: number | string; sub?: string; color?: string }) {
  return (
    <div style={{ ...card, marginBottom: 0, padding: 14 }}>
      <div style={chico}>{t}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || "#0A1628", lineHeight: 1.15 }}>{v}</div>
      {sub && <div style={{ ...chico, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Hoy ────────────────────────────────────────────────────────────────────
export function Hoy({ onFicha }: { onFicha: (id: number) => void }) {
  const [p, setP] = useState<Panorama | null>(null);
  const [err, setErr] = useState("");
  const cargar = useCallback(() => { pedir<Panorama>("/panorama").then(setP).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { cargar(); }, [cargar]);
  if (err) return <div style={{ ...card, color: "#B42318" }}>{err}</div>;
  if (!p) return <div style={card}>Leyendo tu negocio...</div>;
  const k = p.kpis;
  const dif = k.nuevas_7 - k.nuevas_prev7;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
        <Numero t="Cuentas nuevas (7 días)" v={k.nuevas_7} sub={`${dif >= 0 ? "+" : ""}${dif} vs la semana anterior`} />
        <Numero t="Entraron esta semana" v={k.activas_semana} sub={`de ${p.cuentas} cuentas`} />
        <Numero t="Ya cargaron ventas (3+ días)" v={k.activadas} />
        <Numero t="Pagando" v={k.pagando} />
        <Numero t="En riesgo de irse" v={k.en_riesgo} color={k.en_riesgo ? COLOR.alto : undefined} />
        <Numero t="Pruebas por vencer (3 días)" v={k.pruebas_por_vencer} color={k.pruebas_por_vencer ? COLOR.medio : undefined} />
      </div>

      <section style={card}>
        <h2 style={{ margin: "0 0 2px", fontSize: 17, color: "#0A1628" }}>A quién escribirle hoy</h2>
        <p style={{ ...chico, margin: "0 0 12px" }}>Ordenados por riesgo. Cada uno trae el motivo y un mensaje listo. Si tocás &quot;Ya le hablé&quot;, no vuelve a aparecer por 3 días.</p>
        {p.hoy.length === 0 && <div style={{ fontSize: 14, color: "#067647" }}>Hoy no hay nadie para rescatar. Buen momento para sumar cuentas nuevas.</div>}
        {p.hoy.map((c) => (
          <div key={c.usuario_id} style={{ borderTop: "1px solid #EEF1F5", padding: "12px 0" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <b style={{ fontSize: 15, color: "#0A1628" }}>{c.negocio || "Sin nombre"}</b>
              <span style={chico}>{c.persona}</span>
              <Etiqueta c={c} />
              <span style={chico}>{c.etapa}</span>
            </div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13, color: "#0A1628", lineHeight: 1.5 }}>
              {c.motivos.map((m) => <li key={m}>{m}</li>)}
            </ul>
            <div style={{ fontSize: 13, color: "#0A1628", marginTop: 6 }}><b>Qué hacer:</b> {c.accion}.</div>
            <Contacto c={c} onHecho={cargar} onFicha={() => onFicha(c.usuario_id)} />
          </div>
        ))}
      </section>
    </>
  );
}

// ─── Clientes ───────────────────────────────────────────────────────────────
export function Clientes({ abrir, onFicha }: { abrir: number | null; onFicha: (id: number | null) => void }) {
  const [lista, setLista] = useState<Cliente[] | null>(null);
  const [err, setErr] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [q, setQ] = useState("");
  useEffect(() => { pedir<{ clientes: Cliente[] }>("/clientes").then((j) => setLista(j.clientes)).catch((e) => setErr(e.message)); }, []);
  const etapas = ["Todos", "Nuevo", "Sin activar", "Activo", "Pagando", "Dormido", "En riesgo"];
  const vista = useMemo(() => (lista || []).filter((c) => {
    if (filtro === "En riesgo" ? c.nivel !== "alto" : filtro !== "Todos" && c.etapa !== filtro) return false;
    const t = q.trim().toLowerCase();
    return !t || `${c.negocio} ${c.persona} ${c.email}`.toLowerCase().includes(t);
  }), [lista, filtro, q]);
  if (abrir != null) return <FichaVista id={abrir} onVolver={() => onFicha(null)} />;
  if (err) return <div style={{ ...card, color: "#B42318" }}>{err}</div>;
  if (!lista) return <div style={card}>Cargando clientes...</div>;
  return (
    <section style={card}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {etapas.map((e) => (
          <button key={e} onClick={() => setFiltro(e)} style={{ ...btn, padding: "6px 11px", fontSize: 12, background: filtro === e ? "#0A1628" : "#fff", color: filtro === e ? "#fff" : "#0A1628" }}>{e}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar negocio o email" style={{ flex: "1 1 160px", padding: "7px 10px", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 13 }} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Negocio", "Etapa", "Riesgo", "Último ingreso", "Ventas cargadas", "App", "MP", "Plan"].map((h) => <th key={h} style={{ textAlign: "left", fontSize: 12, color: "#5B6B80", fontWeight: 600, padding: "6px 8px", borderBottom: "1px solid #E3E8F0", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>
            {vista.map((c) => (
              <tr key={c.usuario_id} onClick={() => onFicha(c.usuario_id)} style={{ cursor: "pointer" }}>
                <td style={td}><b>{c.negocio || "-"}</b><div style={chico}>{c.persona}</div></td>
                <td style={td}>{c.etapa}</td>
                <td style={td}><Etiqueta c={c} /></td>
                <td style={td}>{c.ultimo_dias == null ? <span style={chico}>sin datos</span> : hace(c.ultimo_dias)}</td>
                <td style={td}>{c.dias_con_ventas} {c.dias_con_ventas === 1 ? "día" : "días"}{c.ultima_venta_dias != null && <div style={chico}>última {hace(c.ultima_venta_dias)}</div>}</td>
                <td style={td}>{c.app.instalada ? (c.app.la_abrio_hace_dias == null ? "Instalada" : `Abrió ${hace(c.app.la_abrio_hace_dias)}`) : c.app.vio_la_oferta ? "Vio la oferta" : "No instaló"}</td>
                <td style={td}>{c.mp ? "Sí" : "No"}</td>
                <td style={td}>{c.estado_plan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {vista.length === 0 && <div style={{ ...chico, padding: 12 }}>No hay clientes con ese filtro.</div>}
    </section>
  );
}
const td: React.CSSProperties = { fontSize: 13, padding: "8px", borderBottom: "1px solid #EEF1F5", color: "#0A1628", verticalAlign: "top" };

function FichaVista({ id, onVolver }: { id: number; onVolver: () => void }) {
  const [f, setF] = useState<Ficha | null>(null);
  const [err, setErr] = useState("");
  const [texto, setTexto] = useState("");
  const cargar = useCallback(() => { pedir<Ficha>(`/cliente/${id}`).then(setF).catch((e) => setErr(e.message)); }, [id]);
  useEffect(() => { cargar(); }, [cargar]);
  const guardar = async () => {
    if (!texto.trim()) return;
    try { await pedir(`/cliente/${id}/nota`, { method: "POST", body: JSON.stringify({ texto, tipo: "nota" }) }); setTexto(""); cargar(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  };
  if (err) return <div style={{ ...card, color: "#B42318" }}>{err} <button style={btn} onClick={onVolver}>Volver</button></div>;
  if (!f) return <div style={card}>Cargando ficha...</div>;
  const c = f.cliente;
  const maxE = Math.max(1, ...f.actividad_30d.map((d) => d.eventos));
  return (
    <>
      <button style={{ ...btn, marginBottom: 12 }} onClick={onVolver}>← Volver a clientes</button>
      <section style={card}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#0A1628" }}>{c.negocio}</h2><Etiqueta c={c} /><span style={chico}>{c.etapa}</span>
        </div>
        <div style={{ ...chico, marginTop: 4 }}>{c.persona} · {c.email}{c.celular ? ` · ${c.celular}` : ""} · se registró {new Date(c.registro).toLocaleDateString("es-AR")}</div>
        {c.motivos.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: FONDO[c.nivel] }}>
            <b style={{ fontSize: 13, color: COLOR[c.nivel] }}>Por qué este puntaje</b>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13, color: "#0A1628", lineHeight: 1.5 }}>{c.motivos.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
        <div style={{ fontSize: 13, color: "#0A1628", marginTop: 10 }}><b>Qué hacer:</b> {c.accion}.</div>
        <div style={{ ...chico, marginTop: 4, fontStyle: "italic" }}>&ldquo;{c.mensaje}&rdquo;</div>
        <Contacto c={c} onHecho={cargar} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 14 }}>
        <Numero t="Días con ventas cargadas" v={c.dias_con_ventas} sub={c.ultima_venta_dias != null ? `última ${hace(c.ultima_venta_dias)}` : "ninguna todavía"} />
        <Numero t="Ventas (7 días)" v={c.ventas_7} sub={`${c.ventas_prev7} la semana anterior`} />
        <Numero t="Entró (7 días)" v={`${c.dias_activos_7} días`} sub={`${c.dias_activos_prev7} la semana anterior`} />
        <Numero t="Precio potencial" v={c.precio_potencial ? pesos(c.precio_potencial) : "-"} sub="según el tamaño que declaró" />
      </div>

      <section style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#0A1628" }}>La app y los avisos</h3>
        <div style={{ fontSize: 13, color: "#0A1628", lineHeight: 1.7 }}>
          Instalada: <b>{c.app.instalada ? "Sí" : c.app.vio_la_oferta ? "Vio la oferta y no instaló" : "No"}</b><br />
          Última vez que la abrió como app: <b>{c.app.la_abrio_hace_dias == null ? "nunca" : hace(c.app.la_abrio_hace_dias)}</b><br />
          Avisos al celular activados: <b>{c.app.avisos_activados ? "Sí" : "No"}</b> · Mercado Pago conectado: <b>{c.mp ? "Sí" : "No"}</b>
        </div>
        <p style={{ ...chico, margin: "8px 0 0" }}>{f.aclaracion_app}</p>
      </section>

      <section style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#0A1628" }}>Actividad de los últimos 30 días</h3>
        {f.actividad_30d.length === 0 ? <div style={chico}>Sin actividad medida en 30 días.</div> : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 70 }}>
            {f.actividad_30d.map((d) => <div key={d.dia} title={`${d.dia}: ${d.eventos}`} style={{ flex: 1, minWidth: 4, height: `${Math.max(6, (d.eventos / maxE) * 100)}%`, background: "#0A5BD3", borderRadius: 2 }} />)}
          </div>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        <section style={card}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#0A1628" }}>Su recorrido</h3>
          {f.hitos.length === 0 ? <div style={chico}>Sin hitos medidos.</div> : f.hitos.map((h) => (
            <div key={h.que} style={{ fontSize: 13, color: "#0A1628", padding: "4px 0" }}>{h.que} <span style={chico}>· {new Date(h.cuando).toLocaleDateString("es-AR")}</span></div>
          ))}
        </section>
        <section style={card}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#0A1628" }}>Qué pantallas y botones usa</h3>
          {f.pantallas.map((p) => <div key={p.ruta} style={{ fontSize: 13, color: "#0A1628", padding: "2px 0" }}>{p.ruta} <span style={chico}>· {p.vistas} vistas</span></div>)}
          {f.acciones.length > 0 && <div style={{ ...chico, margin: "8px 0 2px" }}>Acciones</div>}
          {f.acciones.map((a) => <div key={a.que} style={{ fontSize: 13, color: "#0A1628", padding: "2px 0" }}>{a.que} <span style={chico}>· {a.veces}</span></div>)}
          {f.pantallas.length === 0 && f.acciones.length === 0 && <div style={chico}>Sin uso medido.</div>}
        </section>
      </div>

      {f.errores.length > 0 && (
        <section style={card}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#0A1628" }}>Errores que le salieron</h3>
          {f.errores.map((e, i) => <div key={i} style={{ fontSize: 13, color: "#0A1628", padding: "3px 0" }}>{e.tipo} en {e.ruta} · {e.detalle || "sin detalle"} <span style={chico}>· {new Date(e.creado).toLocaleDateString("es-AR")}</span></div>)}
        </section>
      )}

      <section style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#0A1628" }}>Tus notas y contactos</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guardar(); }} placeholder="Qué hablaron, qué prometiste, qué sigue" style={{ flex: 1, padding: "9px 11px", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 14 }} />
          <button style={btnP} onClick={guardar}>Guardar</button>
        </div>
        {f.notas.map((n) => (
          <div key={n.id} style={{ borderTop: "1px solid #EEF1F5", marginTop: 10, paddingTop: 8, fontSize: 13, color: "#0A1628" }}>
            {n.tipo === "contacto" && <b style={{ color: "#0A5BD3" }}>Contacto · </b>}{n.texto}
            <div style={chico}>{new Date(n.creado).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</div>
          </div>
        ))}
      </section>
    </>
  );
}

// ─── Crecimiento ────────────────────────────────────────────────────────────
export function Crecimiento() {
  const [p, setP] = useState<Panorama | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { pedir<Panorama>("/panorama").then(setP).catch((e) => setErr(e.message)); }, []);
  if (err) return <div style={{ ...card, color: "#B42318" }}>{err}</div>;
  if (!p) return <div style={card}>Calculando...</div>;
  const py = p.proyeccion;
  const maxS = Math.max(1, ...py.semanas.map((s) => s.registros));
  const maxE = Math.max(1, ...p.por_etapa.map((e) => e.n));
  const k = p.kpis;
  return (
    <>
      <section style={card}>
        <h2 style={{ margin: "0 0 2px", fontSize: 17, color: "#0A1628" }}>Dónde está cada cuenta</h2>
        <p style={{ ...chico, margin: "0 0 10px" }}>Las {p.cuentas} cuentas reales (sin las de prueba) por etapa.</p>
        {p.por_etapa.map((e) => (
          <div key={e.etapa} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#0A1628" }}><span>{e.etapa}</span><b>{e.n}</b></div>
            <div style={{ height: 9, background: "#E3E8F0", borderRadius: 6, marginTop: 3 }}><div style={{ width: `${Math.max(2, (e.n / maxE) * 100)}%`, height: 9, background: "#0A5BD3", borderRadius: 6 }} /></div>
          </div>
        ))}
        <p style={{ ...chico, margin: "10px 0 0" }}>Con la app instalada: {k.con_app} · con avisos al celular: {k.con_avisos} · con Mercado Pago: {k.con_mp}</p>
      </section>

      <section style={card}>
        <h2 style={{ margin: "0 0 2px", fontSize: 17, color: "#0A1628" }}>Hacia dónde va</h2>
        <p style={{ ...chico, margin: "0 0 10px" }}>Cuentas nuevas por semana (últimas 8).</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
          {py.semanas.map((s) => (
            <div key={s.semana} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#5B6B80" }}>
              <div style={{ fontWeight: 700, color: "#0A1628" }}>{s.registros}</div>
              <div style={{ height: `${Math.max(6, (s.registros / maxS) * 60)}px`, background: "#0A5BD3", borderRadius: 3, marginTop: 2 }} />
              <div>{s.semana.slice(5)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginTop: 14 }}>
          <Numero t="Cuentas nuevas en 30 días (proyección)" v={py.registros_30d ?? "-"} />
          <Numero t="Llegan a cargar ventas" v={py.tasa_activacion == null ? "-" : `${py.tasa_activacion}%`} sub="de las cuentas con más de 14 días" />
          <Numero t="Activadas en 30 días (proyección)" v={py.activadas_30d ?? "-"} />
        </div>
        <p style={{ ...chico, margin: "10px 0 0" }}>{py.confianza}</p>
      </section>

      <section style={card}>
        <h2 style={{ margin: "0 0 2px", fontSize: 17, color: "#0A1628" }}>Plata en juego</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginTop: 8 }}>
          <Numero t="Por mes si las cuentas activas pagaran" v={pesos(py.plata_potencial_activos)} />
          <Numero t="Por mes en cuentas en riesgo alto" v={pesos(py.plata_en_riesgo)} color={py.plata_en_riesgo ? COLOR.alto : undefined} />
        </div>
        <p style={{ ...chico, margin: "10px 0 0" }}>{py.nota_plata}</p>
      </section>
    </>
  );
}
