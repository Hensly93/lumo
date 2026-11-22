"use client";
// Panel del partner: su link, cuánto ganó y cuánto puede cobrar, su cartera (estado de cada negocio y qué le falta para arrancar),
// mensajes listos para WhatsApp, partners que invitó y sus datos de cobro.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, FUENTE, Copiar, boton, input, pedir, pesos, fecha, tarjeta, tokenPartner, salirPartner, whatsapp, Reglas } from "../comun";

type Cliente = { negocio_id: number; nombre: string; rubro: string | null; desde: string; estado: "prueba" | "pagando" | "sin_pagar" | "baja"; detalle: string; arranque: string; ganado: number; mensual: number };
type Mov = { id: number; tipo: "alta" | "cartera" | "bono_referido"; monto: number; estado: string; creado: string; nota: string | null; negocio: string | null };
type Panel = {
  partner: { nombre: string; email: string; codigo: string; link: string; link_partners: string; estado: string; zona: string | null; cobro: { cuit: string | null; alias_cbu: string | null; titular: string | null; completo: boolean } };
  reglas: Reglas;
  resumen: { clientes: number; pagando: number; en_prueba: number; este_mes: number; pendiente: number; disponible: number; cobrado: number; cartera_mensual: number; elite: boolean };
  clientes: Cliente[];
  movimientos: Mov[];
  referidos: { id: number; nombre: string; creado: string; pagando: number; bono: boolean }[];
  liquidaciones: { id: number; total: number; estado: string; creado: string; pagada_en: string | null }[];
};
type Material = { link: string; mensajes: { titulo: string; texto: string }[]; consejos: string[] };

const COLOR_ESTADO: Record<Cliente["estado"], [string, string]> = {
  pagando: [C.ok, C.okFondo], prueba: [C.azul, "#E8F0FC"], sin_pagar: [C.atencion, C.atencionFondo], baja: [C.apagada, C.papel],
};
const NOMBRE_MOV: Record<Mov["tipo"], string> = { alta: "Comisión de alta", cartera: "Comisión de cartera", bono_referido: "Bono por partner invitado" };
const NOMBRE_ESTADO_MOV: Record<string, string> = { pendiente: "en espera", disponible: "para cobrar", liquidada: "cobrada", anulada: "anulada" };

export default function PanelPartner() {
  const router = useRouter();
  const [d, setD] = useState<Panel | null>(null);
  const [m, setM] = useState<Material | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"cartera" | "mensajes" | "plata" | "cuenta">("cartera");
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
    cargar().then(() => { if (esNuevo) setNuevo(true); });
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
          <p style={{ margin: "6px 0 0", color: C.suave, fontSize: 15, lineHeight: 1.5 }}>Tu primer paso: mandale tu link a 3 comercios que conozcas. En la pestaña <b>Mensajes</b> tenés los textos listos.</p>
        </div>
      )}

      <div style={{ ...tarjeta, background: C.tinta, borderColor: C.tinta, color: C.blanco }}>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Tu link (todo negocio que se registre con él queda en tu cartera)</div>
        <div style={{ fontSize: 15, fontWeight: 700, wordBreak: "break-all", marginBottom: 10 }}>{d.partner.link}</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>Código: <b style={{ letterSpacing: 1 }}>{d.partner.codigo}</b></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Copiar texto={d.partner.link} etiqueta="Copiar link" />
          <a href={whatsapp(m.mensajes[0]?.texto || d.partner.link)} target="_blank" rel="noreferrer" style={{ ...boton, background: "#1FA855", textAlign: "center", textDecoration: "none" }}>WhatsApp</a>
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
          <div><b>Sos partner Elite.</b> <span style={{ color: C.suave }}>Los negocios que sumes desde ahora te dejan {pesos((R.precio_base || 45000) * R.elite_cartera_pct)} por mes.</span></div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <b>Camino a Elite</b><span style={{ color: C.suave }}>{s.pagando} de {R.elite_clientes} negocios pagando</span>
            </div>
            <div style={{ height: 10, background: C.papel, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (s.pagando / R.elite_clientes) * 100)}%`, height: "100%", background: C.azul }} />
            </div>
            <div style={{ fontSize: 13, color: C.apagada, marginTop: 8 }}>Te faltan {faltaElite}. En Elite, cada negocio nuevo te deja {pesos((R.precio_base || 45000) * R.elite_cartera_pct)} por mes en vez de {pesos((R.precio_base || 45000) * R.cartera_pct)}.</div>
          </>
        )}
      </div>

      {!d.partner.cobro.completo && (
        <div style={{ ...tarjeta, background: C.atencionFondo, borderColor: "#F1D29A" }}>
          <b>Cargá tus datos de cobro</b>
          <p style={{ margin: "6px 0 10px", color: C.suave, fontSize: 14 }}>Sin tu CUIT/CUIL y tu alias o CBU no te podemos transferir.</p>
          <button style={{ ...boton, padding: "10px 14px", fontSize: 15, width: "auto" }} onClick={() => setTab("cuenta")}>Cargar ahora</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {([["cartera", "Cartera"], ["mensajes", "Mensajes"], ["plata", "Mi plata"], ["cuenta", "Mis datos"]] as const).map(([k, t]) => (
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
            <p style={{ margin: "0 0 10px", color: C.suave, fontSize: 14, lineHeight: 1.5 }}>Si alguien que invitás llega a {R.bono_meta} negocios pagando, cobrás {pesos(R.bono_referido)} una vez. No cobrás de lo que venda después.</p>
            <Copiar texto={d.partner.link_partners} etiqueta="Copiar link para partners" />
            {d.referidos.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {d.referidos.map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderTop: `1px solid ${C.linea}` }}>
                    <span>{r.nombre}</span>
                    <span style={{ color: r.bono ? C.ok : C.apagada, fontWeight: 600 }}>{r.bono ? "Bono ganado" : `${Math.min(r.pagando, R.bono_meta)} de ${R.bono_meta}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "plata" && (
        <>
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
      <p style={{ margin: "0 0 12px", color: C.suave, fontSize: 14 }}>La cuenta tiene que estar a tu nombre.</p>
      <form onSubmit={guardar} style={{ display: "grid", gap: 10 }}>
        <input style={input} placeholder="CUIT o CUIL" inputMode="numeric" value={f.cuit} onChange={(e) => setF({ ...f, cuit: e.target.value })} />
        <input style={input} placeholder="Alias o CBU/CVU" value={f.alias_cbu} onChange={(e) => setF({ ...f, alias_cbu: e.target.value })} />
        <input style={input} placeholder="Titular de la cuenta" value={f.titular} onChange={(e) => setF({ ...f, titular: e.target.value })} />
        {err && <div style={{ color: C.critico, fontSize: 14 }}>{err}</div>}
        {msg && <div style={{ color: C.ok, fontSize: 14 }}>{msg}</div>}
        <button type="submit" style={boton}>Guardar</button>
      </form>
      <p style={{ fontSize: 13, color: C.apagada, margin: "14px 0 0" }}>Email de la cuenta: {d.partner.email}</p>
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
            <img src="/brand/lumobi-logo-dark.svg" alt="LumoBi" width={104} height={27} />
            <span style={{ fontWeight: 700, fontSize: 14, color: C.suave }}>Partners</span>
          </div>
          {onSalir && <button onClick={onSalir} style={{ background: "none", border: "none", color: C.azul, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FUENTE }}>Salir</button>}
        </header>
        {children}
      </div>
    </main>
  );
}
