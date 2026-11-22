"use client";
// Panel del partner: su link, cuánto ganó y cuánto puede cobrar, su cartera (estado de cada negocio y qué le falta para arrancar),
// mensajes listos para WhatsApp, partners que invitó y sus datos de cobro.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DOLOR, QUE_HACE, CALLE, INTERNET, DUDAS, EN_30_SEGUNDOS, Item } from "../guia";
import { C, FUENTE, Copiar, boton, input, pedir, pesos, fecha, tarjeta, tokenPartner, salirPartner, whatsapp, Reglas } from "../comun";

type Cliente = { negocio_id: number; nombre: string; rubro: string | null; desde: string; estado: "prueba" | "pagando" | "sin_pagar" | "baja"; detalle: string; arranque: string; ganado: number; mensual: number };
type Mov = { id: number; tipo: "alta" | "cartera" | "bono_referido"; monto: number; estado: string; creado: string; nota: string | null; negocio: string | null };
type Panel = {
  partner: { nombre: string; email: string; codigo: string; link: string; link_partners: string; estado: string; zona: string | null; formacion: boolean; cobro: { cuit: string | null; alias_cbu: string | null; titular: string | null; completo: boolean } };
  reglas: Reglas;
  resumen: { clientes: number; pagando: number; en_prueba: number; este_mes: number; pendiente: number; disponible: number; cobrado: number; cartera_mensual: number; elite: boolean };
  clientes: Cliente[];
  movimientos: Mov[];
  referidos: { id: number; nombre: string; creado: string; pagando: number; bonos: number; ganado: number }[];
  liquidaciones: { id: number; total: number; estado: string; creado: string; pagada_en: string | null }[];
};
type Material = { link: string; mensajes: { titulo: string; texto: string }[]; consejos: string[] };

const COLOR_ESTADO: Record<Cliente["estado"], [string, string]> = {
  pagando: [C.ok, C.okFondo], prueba: [C.azul, "#E8F0FC"], sin_pagar: [C.atencion, C.atencionFondo], baja: [C.apagada, C.papel],
};
const NOMBRE_MOV: Record<Mov["tipo"], string> = { alta: "Comisión de alta", cartera: "Comisión de cartera", bono_referido: "Por un partner que invitaste" };
const NOMBRE_ESTADO_MOV: Record<string, string> = { pendiente: "en espera", disponible: "para cobrar", liquidada: "cobrada", anulada: "anulada" };

export default function PanelPartner() {
  const router = useRouter();
  const [d, setD] = useState<Panel | null>(null);
  const [m, setM] = useState<Material | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"cartera" | "mensajes" | "guia" | "plata" | "cuenta">("cartera");
  const [enviados, setEnviados] = useState(0);
  const [nuevo, setNuevo] = useState(false);

  const cargar = useCallback(async () => {
    const t = tokenPartner();
    if (!t) { router.replace("/partners/ingresar"); return; }
    try {
      const [p, mm] = await Promise.all([pedir<Panel>("/api/partners/yo", { token: t }), pedir<Material>("/api/partners/material", { token: t })]);
      setD(p); setM(mm);
    } catch (e) {
      const er = e as Error & { status?: number };
      if (er.status === 401) { salirPartner(); router.replace("/partners/ingresar"); return; }
      setError(er.message);
    }
  }, [router]);

  useEffect(() => {
    const esNuevo = new URLSearchParams(window.location.search).get("nuevo") === "1";
    let env = 0;
    try { env = (JSON.parse(localStorage.getItem("lumobi_partner_formacion") || "{}").mision || []).length; } catch { /* nada */ }
    cargar().then(() => { if (esNuevo) setNuevo(true); setEnviados(env); });
  }, [cargar]);

  if (error) return <Marco><div style={tarjeta}><p style={{ color: C.critico }}>{error}</p><button style={boton} onClick={cargar}>Reintentar</button></div></Marco>;
  if (!d || !m) return <Marco><p style={{ color: C.apagada, textAlign: "center", marginTop: 60 }}>Cargando tu panel…</p></Marco>;

  const R = d.reglas, s = d.resumen;
  const primer = d.partner.nombre.split(" ")[0];
  const faltaElite = Math.max(0, R.elite_clientes - s.pagando);

  return (
    <Marco onSalir={() => { salirPartner(); router.replace("/partners/ingresar"); }}>
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Hola, {primer}</h1>
      <p style={{ color: C.suave, margin: "0 0 16px", fontSize: 15 }}>{s.clientes ? `Tenés ${s.clientes} ${s.clientes === 1 ? "negocio" : "negocios"} en tu cartera.` : "Todavía no sumaste negocios. Empezá mandando tu link."}</p>

      {nuevo && (
        <div style={{ ...tarjeta, background: C.okFondo, borderColor: "#B7DFCB" }}>
          <b>¡Listo, ya sos partner!</b>
          <p style={{ margin: "6px 0 0", color: C.suave, fontSize: 15, lineHeight: 1.5 }}>Tu primer paso: mandale tu link a 3 comercios que conozcas. En <b>📲 Mensajes</b> tenés los textos listos.</p>
        </div>
      )}

      <Tarea d={d} enviados={enviados} onEnviar={() => {
        const n = enviados + 1; setEnviados(n);
        try { const p = JSON.parse(localStorage.getItem("lumobi_partner_formacion") || "{}"); p.mision = Array.from(new Set([...(p.mision || []), ...Array.from({ length: n }, (_, k) => k)])); localStorage.setItem("lumobi_partner_formacion", JSON.stringify(p)); } catch { /* nada */ }
      }} irA={(t) => setTab(t)} irFormacion={() => router.push("/partners/formacion")} mensaje={m.mensajes[0]?.texto || d.partner.link} />

      <div style={{ ...tarjeta, background: C.tinta, borderColor: C.tinta, color: C.blanco }}>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Tu link (todo negocio que se registre con él queda en tu cartera)</div>
        <div style={{ fontSize: 15, fontWeight: 700, wordBreak: "break-all", marginBottom: 10 }}>{d.partner.link}</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>Código: <b style={{ letterSpacing: 1 }}>{d.partner.codigo}</b></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Copiar texto={d.partner.link} etiqueta="Copiar link" />
          <a href={whatsapp(m.mensajes[0]?.texto || d.partner.link)} target="_blank" rel="noreferrer" style={{ ...boton, background: "#1FA855", textAlign: "center", textDecoration: "none" }}>Mandar por WhatsApp</a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <Dato titulo="Este mes" valor={pesos(s.este_mes)} />
        <Dato titulo="Para cobrar" valor={pesos(s.disponible)} destacado={s.disponible > 0} />
        <Dato titulo={`En espera (${R.retencion_dias} días)`} valor={pesos(s.pendiente)} />
        <Dato titulo="Tu cartera te deja por mes" valor={pesos(s.cartera_mensual)} />
      </div>

      <div style={tarjeta}>
        {s.elite ? (
          <div><b>Sos partner Elite.</b> <span style={{ color: C.suave }}>Los comercios que sumes desde ahora te dejan {pesos(R.elite_cartera_monto)} por mes.</span></div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <b>Camino a Elite</b><span style={{ color: C.suave }}>{s.pagando} de {R.elite_clientes} negocios pagando</span>
            </div>
            <div style={{ height: 10, background: C.papel, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (s.pagando / R.elite_clientes) * 100)}%`, height: "100%", background: C.azul }} />
            </div>
            <div style={{ fontSize: 13, color: C.apagada, marginTop: 8 }}>Te faltan {faltaElite}. En Elite, cada comercio nuevo te deja {pesos(R.elite_cartera_monto)} por mes en vez de {pesos(R.cartera_monto)}.</div>
          </>
        )}
      </div>

      {!d.partner.cobro.completo && d.resumen.pagando + d.resumen.pendiente + d.resumen.disponible > 0 && (
        <div style={{ ...tarjeta, background: C.atencionFondo, borderColor: "#F1D29A" }}>
          <b>Cargá tus datos de cobro</b>
          <p style={{ margin: "6px 0 10px", color: C.suave, fontSize: 14 }}>Sin tu CBU, CVU o alias no te podemos transferir.</p>
          <button style={{ ...boton, padding: "10px 14px", fontSize: 15, width: "auto" }} onClick={() => setTab("cuenta")}>Cargar ahora</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {([["cartera", "👥 Mis clientes"], ["mensajes", "📲 Mensajes"], ["guia", "🎓 Guía"], ["plata", "💸 Mi plata"], ["cuenta", "⚙️ Mis datos"]] as const).map(([k, t]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 14px", borderRadius: 20, border: `1px solid ${tab === k ? C.azul : C.linea}`, background: tab === k ? C.azul : C.blanco, color: tab === k ? C.blanco : C.tinta, fontWeight: 700, fontSize: 14, fontFamily: FUENTE, whiteSpace: "nowrap", cursor: "pointer" }}>{t}</button>
        ))}
      </div>

      {tab === "cartera" && (
        <>
          {!d.clientes.length && (
            <div style={tarjeta}><p style={{ margin: 0, color: C.suave, lineHeight: 1.6 }}>Cuando un comercio se registre con tu link, aparece acá: vas a ver si está en la prueba, si ya paga y si arrancó a usar la caja, para que sepas a quién darle una mano.</p></div>
          )}
          {d.clientes.map((c) => {
            const [col, fondo] = COLOR_ESTADO[c.estado];
            return (
              <div key={c.negocio_id} style={tarjeta}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{c.nombre}</div>
                    <div style={{ fontSize: 13, color: C.apagada }}>Desde el {fecha(c.desde)}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col, background: fondo, borderRadius: 10, padding: "4px 8px", whiteSpace: "nowrap" }}>{c.detalle}</span>
                </div>
                <div style={{ fontSize: 14, color: C.suave, marginTop: 8 }}>{c.arranque}</div>
                {(c.ganado > 0 || c.mensual > 0) && (
                  <div style={{ fontSize: 14, marginTop: 6 }}>Te dejó {pesos(c.ganado)}{c.mensual ? ` · ${pesos(c.mensual)} por mes` : ""}</div>
                )}
                {c.estado === "prueba" && c.arranque !== "Ya usa la caja" && (
                  <div style={{ fontSize: 13, color: C.azul, marginTop: 8 }}>Ayudalo a hacer su primera venta y cerrar un turno: es lo que más hace que se quede.</div>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === "mensajes" && (
        <>
          {m.mensajes.map((x) => (
            <div key={x.titulo} style={tarjeta}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{x.titulo}</div>
              <div style={{ fontSize: 15, color: C.suave, lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 12 }}>{x.texto}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Copiar texto={x.texto} />
                <a href={whatsapp(x.texto)} target="_blank" rel="noreferrer" style={{ ...boton, background: "#1FA855", textAlign: "center", textDecoration: "none", padding: "13px 10px" }}>Mandar</a>
              </div>
            </div>
          ))}
          <div style={tarjeta}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Consejos</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: C.suave, lineHeight: 1.6, fontSize: 15 }}>{m.consejos.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div style={tarjeta}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Invitá a otros partners</div>
            <p style={{ margin: "0 0 10px", color: C.suave, fontSize: 14, lineHeight: 1.5 }}>Por cada comercio que traiga y pague alguien que invitaste, cobrás {pesos(R.bono_por_negocio)}, hasta {R.bono_tope} comercios por partner ({pesos(R.bono_por_negocio * R.bono_tope)}). No cobrás de los que invite él.</p>
            <Copiar texto={d.partner.link_partners} etiqueta="Copiar link para partners" />
            {d.referidos.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {d.referidos.map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderTop: `1px solid ${C.linea}` }}>
                    <span>{r.nombre}</span>
                    <span style={{ color: r.bonos ? C.ok : C.apagada, fontWeight: 600 }}>{r.bonos} de {R.bono_tope} comercios · {pesos(r.ganado)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "guia" && (
        <>
          <div style={{ ...tarjeta, background: "#E8F0FC", borderColor: "#C9DAF6" }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Explicalo en 30 segundos</div>
            <div style={{ fontSize: 16, lineHeight: 1.55, color: C.tinta, marginBottom: 12 }}>{EN_30_SEGUNDOS}</div>
            <Copiar texto={EN_30_SEGUNDOS} />
          </div>
          <Bloque titulo="El problema: el comercio pierde plata y no se entera" items={DOLOR} />
          <Bloque titulo="La solución: qué hace LumoBi" items={QUE_HACE} />
          <Bloque titulo="Buscar clientes en la calle" items={CALLE} numerado />
          <Bloque titulo="Buscar clientes por internet" items={INTERNET} />
          <div style={tarjeta}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>Cuando te dicen…</div>
            {DUDAS.map((x) => (
              <div key={x.pregunta} style={{ padding: "10px 0", borderTop: `1px solid ${C.linea}` }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{x.pregunta}</div>
                <div style={{ fontSize: 15, color: C.suave, lineHeight: 1.5, marginTop: 3 }}>{x.respuesta}</div>
              </div>
            ))}
          </div>
          <button style={{ ...boton, background: C.blanco, color: C.azul, border: `1px solid ${C.azul}` }} onClick={() => router.push("/partners/formacion")}>🎓 Ver la formación de nuevo</button>
        </>
      )}

      {tab === "plata" && (
        <>
          <Proyeccion d={d} />
          <div style={tarjeta}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 6 }}><span>Cobrado en total</span><b>{pesos(s.cobrado)}</b></div>
            <p style={{ margin: 0, fontSize: 13, color: C.apagada, lineHeight: 1.5 }}>Cada comisión queda {R.retencion_dias} días en espera por si el pago se cae y después pasa a &quot;para cobrar&quot;. Liquidamos por transferencia a tu alias o CBU.</p>
          </div>
          {d.liquidaciones.length > 0 && (
            <div style={tarjeta}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Transferencias</div>
              {d.liquidaciones.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderTop: `1px solid ${C.linea}` }}>
                  <span>{fecha(l.creado)}</span>
                  <span><b>{pesos(l.total)}</b> · {l.estado === "pagada" ? "transferida" : "en proceso"}</span>
                </div>
              ))}
            </div>
          )}
          <div style={tarjeta}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Movimientos</div>
            {!d.movimientos.length && <div style={{ fontSize: 14, color: C.apagada }}>Todavía no hay comisiones. Se generan cuando un negocio de tu cartera paga.</div>}
            {d.movimientos.map((x) => (
              <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14, padding: "9px 0", borderTop: `1px solid ${C.linea}` }}>
                <div><div style={{ fontWeight: 600 }}>{NOMBRE_MOV[x.tipo]}</div><div style={{ color: C.apagada, fontSize: 13 }}>{x.negocio || x.nota || ""} · {fecha(x.creado)}</div></div>
                <div style={{ textAlign: "right" }}><b style={{ textDecoration: x.estado === "anulada" ? "line-through" : "none" }}>{pesos(x.monto)}</b><div style={{ color: C.apagada, fontSize: 12 }}>{NOMBRE_ESTADO_MOV[x.estado] || x.estado}</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "cuenta" && <DatosCobro d={d} alGuardar={cargar} />}
    </Marco>
  );
}

// Proyección desde la cartera REAL del partner: lo que ya cobra por mes + los comercios nuevos que sume, acumulándose.
function Proyeccion({ d }: { d: Panel }) {
  const R = d.reglas;
  const [n, setN] = useState(10);
  const fila = (m: number) => {
    const cartera = d.resumen.pagando + n * (m - 1);
    const total = d.resumen.cartera_mensual + n * (m - 1) * R.cartera_monto + n * R.alta_monto;
    return { cartera, total };
  };
  const btn: React.CSSProperties = { width: 48, height: 48, borderRadius: 24, border: `2px solid ${C.azul}`, background: C.blanco, color: C.azul, fontSize: 26, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE, lineHeight: 1 };
  return (
    <div style={tarjeta}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Tu proyección</div>
      <div style={{ fontSize: 14, color: C.suave, marginBottom: 12, lineHeight: 1.5 }}>Hoy tenés {d.resumen.pagando} {d.resumen.pagando === 1 ? "comercio pagando" : "comercios pagando"} ({pesos(d.resumen.cartera_mensual)} por mes). Si sumás por mes:</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
        <button style={btn} onClick={() => setN(Math.max(0, n - 1))}>−</button>
        <input type="number" inputMode="numeric" min={0} max={999} value={n} onChange={(e) => setN(Math.max(0, Math.min(999, Math.floor(Number(e.target.value) || 0))))} style={{ width: 96, fontSize: 36, fontWeight: 800, textAlign: "center", border: `2px solid ${C.linea}`, borderRadius: 12, padding: "2px 0", color: C.tinta, fontFamily: FUENTE, background: C.blanco }} />
        <button style={btn} onClick={() => setN(Math.min(999, n + 1))}>+</button>
      </div>
      {[3, 6, 12].map((m) => { const f = fila(m); return (
        <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.papel, borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: C.suave }}>Dentro de {m} meses<br /><b style={{ color: C.tinta }}>{f.cartera} en cartera</b> + {n} nuevos</span>
          <b style={{ fontSize: 20 }}>{pesos(f.total)}</b>
        </div>
      ); })}
      <div style={{ fontSize: 12, color: C.apagada, lineHeight: 1.5 }}>Poné tu número. No hay tope: cuantos más sumás, más cobrás. La cuenta supone que tus comercios siguen pagando.</div>
    </div>
  );
}

// "Tu próxima tarea": una sola cosa para hacer ahora, la más importante. Así nunca se pregunta qué sigue.
function Tarea({ d, enviados, onEnviar, irA, irFormacion, mensaje }: { d: Panel; enviados: number; onEnviar: () => void; irA: (t: "cartera" | "mensajes" | "guia" | "plata" | "cuenta") => void; irFormacion: () => void; mensaje: string }) {
  const sinArrancar = d.clientes.find((c) => c.estado === "prueba" && c.arranque !== "Ya usa la caja");
  let t: { icono: string; titulo: string; texto: string; boton: string; accion?: () => void; href?: string };
  if (!d.partner.formacion) t = { icono: "🎓", titulo: "Hacé tu formación", texto: "7 lecciones cortas: el problema que resuelve LumoBi, cómo encontrar clientes en la calle y por internet, y qué decir.", boton: "Empezar", accion: irFormacion };
  else if (!d.clientes.length && enviados < 3) t = { icono: "📲", titulo: `Mandale tu link a ${3 - enviados} comercio${3 - enviados === 1 ? "" : "s"} más`, texto: "Se abre WhatsApp con el mensaje listo. Elegís el contacto y enviás.", boton: "Mandar por WhatsApp", href: whatsapp(mensaje) };
  else if (sinArrancar) t = { icono: "💬", titulo: `Ayudá a ${sinArrancar.nombre} a arrancar`, texto: `${sinArrancar.arranque}. Escribile: el que usa la caja en la prueba es el que se queda.`, boton: "Ver mis clientes", accion: () => irA("cartera") };
  else if (d.resumen.disponible > 0 && !d.partner.cobro.completo) t = { icono: "🏦", titulo: "Cargá tus datos para cobrar", texto: `Tenés ${pesos(d.resumen.disponible)} para cobrar. Sin tu CBU, CVU o alias no te podemos transferir.`, boton: "Cargar mis datos", accion: () => irA("cuenta") };
  else t = { icono: "🚀", titulo: "Sumá otro comercio", texto: "Cada comercio que se queda te deja plata todos los meses.", boton: "Mandar por WhatsApp", href: whatsapp(mensaje) };
  const estilo: React.CSSProperties = { ...boton, display: "block", textAlign: "center", textDecoration: "none", background: t.href ? "#1FA855" : C.azul };
  return (
    <div style={{ ...tarjeta, border: `2px solid ${C.azul}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.azul, letterSpacing: 0.5, marginBottom: 8 }}>TU PRÓXIMA TAREA</div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 34 }}>{t.icono}</span>
        <div><div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25 }}>{t.titulo}</div><div style={{ fontSize: 15, color: C.suave, lineHeight: 1.5, marginTop: 4 }}>{t.texto}</div></div>
      </div>
      {t.href ? <a href={t.href} target="_blank" rel="noreferrer" onClick={onEnviar} style={estilo}>{t.boton}</a> : <button onClick={t.accion} style={estilo}>{t.boton}</button>}
    </div>
  );
}

function DatosCobro({ d, alGuardar }: { d: Panel; alGuardar: () => void }) {
  const [f, setF] = useState({ cuit: d.partner.cobro.cuit || "", alias_cbu: d.partner.cobro.alias_cbu || "", titular: d.partner.cobro.titular || "" });
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setErr("");
    try {
      await pedir("/api/partners/yo", { metodo: "PATCH", cuerpo: f, token: tokenPartner() });
      setMsg("Guardado."); alGuardar();
    } catch (er) { setErr((er as Error).message); }
  }
  return (
    <div style={tarjeta}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Datos para cobrar</div>
      <p style={{ margin: "0 0 12px", color: C.suave, fontSize: 14 }}>Solo necesitamos tu CBU, CVU o alias para transferirte.</p>
      <form onSubmit={guardar} style={{ display: "grid", gap: 10 }}>
        <input style={input} placeholder="CBU, CVU o alias" value={f.alias_cbu} onChange={(e) => setF({ ...f, alias_cbu: e.target.value })} />
        <input style={input} placeholder="Titular de la cuenta (opcional)" value={f.titular} onChange={(e) => setF({ ...f, titular: e.target.value })} />
        {err && <div style={{ color: C.critico, fontSize: 14 }}>{err}</div>}
        {msg && <div style={{ color: C.ok, fontSize: 14 }}>{msg}</div>}
        <button type="submit" style={boton}>Guardar</button>
      </form>
      <p style={{ fontSize: 13, color: C.apagada, margin: "14px 0 0" }}>Email de la cuenta: {d.partner.email}</p>
    </div>
  );
}

function Bloque({ titulo, items, numerado }: { titulo: string; items: Item[]; numerado?: boolean }) {
  return (
    <div style={tarjeta}>
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 12 }}>{titulo}</div>
      {items.map((x, k) => (
        <div key={x.titulo} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: C.papel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: numerado ? 17 : 21, fontWeight: 800, flexShrink: 0 }}>{numerado ? k + 1 : x.icono}</div>
          <div><div style={{ fontWeight: 700, fontSize: 16 }}>{x.titulo}</div><div style={{ fontSize: 15, color: C.suave, lineHeight: 1.45 }}>{x.texto}</div></div>
        </div>
      ))}
    </div>
  );
}

function Dato({ titulo, valor, destacado }: { titulo: string; valor: string; destacado?: boolean }) {
  return (
    <div style={{ background: C.blanco, border: `1px solid ${destacado ? C.ok : C.linea}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 12, color: C.apagada, marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: destacado ? C.ok : C.tinta }}>{valor}</div>
    </div>
  );
}

function Marco({ children, onSalir }: { children: React.ReactNode; onSalir?: () => void }) {
  return (
    <main style={{ background: C.papel, minHeight: "100vh", fontFamily: FUENTE, color: C.tinta }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 16px 60px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/brand/lumobi-logo-light.svg" alt="LumoBi" width={104} height={27} />
            <span style={{ fontWeight: 700, fontSize: 14, color: C.suave }}>Partners</span>
          </div>
          {onSalir && <button onClick={onSalir} style={{ background: "none", border: "none", color: C.azul, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FUENTE }}>Salir</button>}
        </header>
        {children}
      </div>
    </main>
  );
}
