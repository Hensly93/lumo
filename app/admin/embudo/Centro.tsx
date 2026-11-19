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
  accion: string; mensaje: string; whatsapp: string | null; mailto: string | null; prueba?: boolean; prueba_auto?: boolean;
};
type Radio = {
  ventas: { n: number; total: number; dias: number; ticket: number; desde: string | null; ultima: string | null; pct_efectivo: number | null; importadas: number; de_caja: number; por_dia: { dia: string; n: number; total: number }[] };
  catalogo: { productos: number; con_costo: number };
  equipo: { empleados: number; cierres: number; con_faltante: number; faltante: number; ultimo_cierre: string | null };
  compras: { n: number; total: number; ultima: string | null };
  precios_cambiados: number; mercado_pago: { cobros: number; monto: number };
  lo_que_encontramos: { plata_en_juego: number; hallazgos: { titulo: string; impacto: number }[] };
  checklist: { que: string; ok: boolean; detalle: string }[]; faltan: string[];
};
type RadioCliente = Radio & { usuario_id: number; negocio: string | null; persona: string | null; etapa: string; nivel: "alto" | "medio" | "bajo"; riesgo: number; ultimo_dias: number | null; registro: string };
type Evento = { cuando: string; negocio: string | null; persona: string | null; usuario_id: number; texto: string; grave: boolean; app: boolean };
type Panorama = {
  radiografias: RadioCliente[]; actividad: Evento[];
  cuentas: number;
  kpis: { nuevas_7: number; nuevas_prev7: number; activas_semana: number; activadas: number; pagando: number; en_riesgo: number; dormidas: number; pruebas_por_vencer: number; con_app: number; con_avisos: number; con_mp: number };
  por_etapa: { etapa: string; n: number }[]; hoy: Cliente[];
  proyeccion: { semanas: { semana: string; registros: number }[]; registros_30d: number | null; tasa_activacion: number | null; activadas_30d: number | null; plata_potencial_activos: number; plata_en_riesgo: number; confianza: string; nota_plata: string };
};
type Ficha = {
  cliente: Cliente; radiografia: Radio; actividad_30d: { dia: string; eventos: number }[]; pantallas: { ruta: string; vistas: number }[];
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


function Barras({ d }: { d: { dia: string; n: number; total: number }[] }) {
  if (!d.length) return <div style={chico}>Sin ventas en los últimos 14 días.</div>;
  const m = Math.max(1, ...d.map((x) => x.total));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 54 }}>
      {d.map((x) => <div key={x.dia} title={`${x.dia}: ${pesos(x.total)} (${x.n} ventas)`} style={{ flex: 1, minWidth: 5, height: `${Math.max(8, (x.total / m) * 100)}%`, background: "#0A5BD3", borderRadius: 2 }} />)}
    </div>
  );
}

function Radiografia({ r }: { r: Radio }) {
  const v = r.ventas;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 12 }}>
        <Numero t="Ventas cargadas" v={v.n.toLocaleString("es-AR")} sub={v.n ? `${v.de_caja} de la caja · ${v.importadas} importadas` : undefined} />
        <Numero t="Total vendido" v={pesos(v.total)} sub={v.desde ? `desde el ${v.desde.slice(8, 10)}/${v.desde.slice(5, 7)}` : undefined} />
        <Numero t="Días con ventas" v={v.dias} />
        <Numero t="Gasto por cliente" v={v.n ? pesos(v.ticket) : "-"} sub={v.pct_efectivo != null ? `${v.pct_efectivo}% efectivo` : undefined} />
        <Numero t="Productos" v={r.catalogo.productos} sub={`${r.catalogo.con_costo} con costo`} />
        <Numero t="Cierres de caja" v={r.equipo.cierres} sub={r.equipo.faltante ? `faltaron ${pesos(r.equipo.faltante)}` : undefined} />
      </div>
      <div style={{ ...chico, marginBottom: 4 }}>Ventas por día (últimos 14 días)</div>
      <Barras d={v.por_dia} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "4px 16px", marginTop: 14 }}>
        {r.checklist.map((c) => (
          <div key={c.que} style={{ fontSize: 13, color: "#0A1628", display: "flex", gap: 8 }}>
            <b style={{ color: c.ok ? "#067647" : "#B42318", width: 14 }}>{c.ok ? "✓" : "✕"}</b>
            <span>{c.que} <span style={chico}>· {c.detalle}</span></span>
          </div>
        ))}
      </div>
      {r.lo_que_encontramos.hallazgos.length > 0 && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#F4F6FA" }}>
          <div style={{ fontSize: 13, color: "#0A1628" }}><b>Lo que LumoBi le encontró: {pesos(r.lo_que_encontramos.plata_en_juego)} por mes en juego</b> <span style={chico}>(estimado)</span></div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13, color: "#0A1628", lineHeight: 1.5 }}>
            {r.lo_que_encontramos.hallazgos.map((h) => <li key={h.titulo}>{h.titulo}{h.impacto > 0 && <span style={chico}> · {pesos(h.impacto)}/mes</span>}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function TarjetaCliente({ r, onFicha }: { r: RadioCliente; onFicha: (id: number) => void }) {
  return (
    <section style={card}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#0A1628" }}>{r.negocio || "Sin nombre"}</h2>
          <span style={chico}>{r.persona}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#EEF1F5", color: "#0A1628" }}>{r.etapa}</span>
          <span style={chico}>entró {hace(r.ultimo_dias)}</span>
        </div>
        <button style={btn} onClick={() => onFicha(r.usuario_id)}>Ver ficha completa</button>
      </div>
      {r.faltan.length > 0 && <div style={{ fontSize: 13, color: "#B45309", margin: "8px 0 12px" }}>Le falta: {r.faltan.slice(0, 3).join(" · ")}</div>}
      {r.faltan.length === 0 && <div style={{ fontSize: 13, color: "#067647", margin: "8px 0 12px" }}>Tiene todo cargado.</div>}
      <Radiografia r={r} />
    </section>
  );
}

function Feed({ e, onFicha }: { e: Evento[]; onFicha: (id: number) => void }) {
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 2px", fontSize: 17, color: "#0A1628" }}>Qué pasó (últimos 14 días)</h2>
      <p style={{ ...chico, margin: "0 0 8px" }}>Todo lo que hicieron tus clientes reales, lo último primero. Las cuentas de prueba no aparecen.</p>
      {e.length === 0 && <div style={chico}>Todavía no hay actividad de clientes reales.</div>}
      {e.map((x, i) => (
        <div key={i} onClick={() => onFicha(x.usuario_id)} style={{ display: "flex", gap: 10, padding: "6px 0", borderTop: i ? "1px solid #EEF1F5" : "none", fontSize: 13, color: x.grave ? "#B42318" : "#0A1628", cursor: "pointer" }}>
          <span style={{ ...chico, width: 92, flexShrink: 0 }}>{new Date(x.cuando).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          <span><b>{x.negocio || x.persona}</b> · {x.texto}{x.app ? " (desde la app)" : ""}</span>
        </div>
      ))}
    </section>
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

      {p.radiografias.length === 0 && <div style={card}>Todavía no hay clientes reales. Las cuentas de prueba están aisladas y no se cuentan.</div>}
      {p.radiografias.map((r) => <TarjetaCliente key={r.usuario_id} r={r} onFicha={onFicha} />)}
      <Feed e={p.actividad} onFicha={onFicha} />

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

type PesoNeg = { negocio_id: number; nombre: string; puntaje: number; serie: number[]; baja: boolean; cambio: number | null; partes: Record<string, number> | null };
const PARTES: Record<string, string> = { historia: "Historia", caja: "Caja", costos: "Costos", facturas: "Facturas", acciones: "Acciones", ventas_al_dia: "Ventas al día" };
// Cuánto pesa LumoBi en cada negocio (0 a 100). Interno: el cliente no lo ve.
function Peso() {
  const [d, setD] = useState<PesoNeg[] | null>(null);
  useEffect(() => { pedir<{ negocios: PesoNeg[] }>("/peso").then((j) => setD(j.negocios)).catch(() => setD([])); }, []);
  if (!d || d.length === 0) return null;
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, color: "#0A1628" }}>Cuánto pesa LumoBi en cada negocio</h2>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#5B6B80" }}>De 0 a 100: historia, caja, costos, facturas, acciones y ventas al día. Los de abajo son los que más cerca están de soltarse. Te llega un aviso si uno baja dos semanas seguidas.</p>
      {d.map((n) => (
        <div key={n.negocio_id} style={{ padding: "8px 0", borderTop: "1px solid #EEF1F5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, color: "#0A1628" }}>
            <span style={{ fontWeight: 600 }}>{n.nombre}{n.baja ? "  ⚠️ bajando" : ""}</span>
            <span><strong>{n.puntaje}</strong>{n.serie.length > 1 ? <span style={{ color: "#5B6B80", fontSize: 12 }}>  ({n.serie.join(" → ")})</span> : null}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#E3E8F0", marginTop: 5 }}><div style={{ width: `${n.puntaje}%`, height: "100%", borderRadius: 3, background: n.puntaje >= 60 ? "#12B76A" : n.puntaje >= 35 ? "#F79009" : "#F04438" }} /></div>
          {n.partes && <div style={{ fontSize: 11, color: "#5B6B80", marginTop: 4 }}>{Object.entries(n.partes).map(([k, v]) => `${PARTES[k] || k} ${v}`).join(" · ")}</div>}
        </div>
      ))}
    </section>
  );
}

export function Clientes({ abrir, onFicha }: { abrir: number | null; onFicha: (id: number | null) => void }) {
  const [lista, setLista] = useState<Cliente[] | null>(null);
  const [err, setErr] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [q, setQ] = useState("");
  useEffect(() => { pedir<{ clientes: Cliente[] }>("/clientes?pruebas=1").then((j) => setLista(j.clientes)).catch((e) => setErr(e.message)); }, []);
  const etapas = ["Todos", "Nuevo", "Sin activar", "Activo", "Pagando", "Dormido", "En riesgo"];
  const reales = useMemo(() => (lista || []).filter((c) => !c.prueba), [lista]);
  const pruebas = useMemo(() => (lista || []).filter((c) => c.prueba), [lista]);
  const marcar = async (id: number, esPrueba: boolean) => {
    try {
      await pedir("/marcar-prueba", { method: "POST", body: JSON.stringify({ usuario_id: id, es_prueba: esPrueba }) });
      const j = await pedir<{ clientes: Cliente[] }>("/clientes?pruebas=1"); setLista(j.clientes);
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  };
  const vista = useMemo(() => reales.filter((c) => {
    if (filtro === "En riesgo" ? c.nivel !== "alto" : filtro !== "Todos" && c.etapa !== filtro) return false;
    const t = q.trim().toLowerCase();
    return !t || `${c.negocio} ${c.persona} ${c.email}`.toLowerCase().includes(t);
  }), [reales, filtro, q]);
  if (abrir != null) return <FichaVista id={abrir} onVolver={() => onFicha(null)} />;
  if (err) return <div style={{ ...card, color: "#B42318" }}>{err}</div>;
  if (!lista) return <div style={card}>Cargando clientes...</div>;
  return (
    <>
    <Peso />
    <section style={card}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {etapas.map((e) => (
          <button key={e} onClick={() => setFiltro(e)} style={{ ...btn, padding: "6px 11px", fontSize: 12, background: filtro === e ? "#0A1628" : "#fff", color: filtro === e ? "#fff" : "#0A1628" }}>{e}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar negocio o email" style={{ flex: "1 1 160px", padding: "7px 10px", border: "1px solid #D8DEE8", borderRadius: 10, fontSize: 13 }} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Negocio", "Etapa", "Riesgo", "Último ingreso", "Ventas cargadas", "App", "MP", "Plan", ""].map((h) => <th key={h} style={{ textAlign: "left", fontSize: 12, color: "#5B6B80", fontWeight: 600, padding: "6px 8px", borderBottom: "1px solid #E3E8F0", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
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
                <td style={td}><button style={{ ...btn, padding: "4px 8px", fontSize: 11 }} onClick={(e) => { e.stopPropagation(); marcar(c.usuario_id, true); }}>Es de prueba</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {vista.length === 0 && <div style={{ ...chico, padding: 12 }}>No hay clientes con ese filtro.</div>}
      <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #E3E8F0" }}>
        <b style={{ fontSize: 14, color: "#0A1628" }}>Cuentas de prueba, aisladas ({pruebas.length})</b>
        <p style={{ ...chico, margin: "2px 0 8px" }}>No cuentan en ningún número ni aparecen en &quot;Qué pasó&quot;. Se aíslan solas las tuyas (mismo navegador que tu cuenta de admin) y las que dicen test, prueba o demo. Si alguna es un cliente de verdad, tocá &quot;Es un cliente real&quot; y no se vuelve a marcar.</p>
        {pruebas.map((c) => (
          <div key={c.usuario_id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "6px 0", borderTop: "1px solid #EEF1F5", fontSize: 13, color: "#0A1628" }}>
            <span><b>{c.negocio}</b> <span style={chico}>{c.email}{c.prueba_auto ? " · detectada sola" : ""}</span></span>
            <button style={{ ...btn, padding: "4px 8px", fontSize: 11 }} onClick={() => marcar(c.usuario_id, false)}>Es un cliente real</button>
          </div>
        ))}
      </div>
    </section>
    </>
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

      <section style={card}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#0A1628" }}>Su negocio en LumoBi</h3>
        <Radiografia r={f.radiografia} />
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
