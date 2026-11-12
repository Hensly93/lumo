"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Hallazgo = {
  id: string;
  tipo: "medido" | "calculado" | "estimado";
  titulo: string;
  detalle: string;
  evidencia: string[];
  monto: number;
  url: string;
  positivo?: boolean;
  monto_texto?: string;
  hid?: number;
  accion_texto?: string;
  acciones?: Accion[];
};
type Accion = { id: string; tipo: "ganar" | "perder_menos" | "probar"; titulo: string; detalle: string; arma?: boolean };

type Promo = {
  sin_promo: boolean; motivo?: string; nombre?: string; cuando?: string; precio_normal?: number; precio_promo?: number; ahorro?: number;
  descuento_pct?: number; ganancia_por_combo?: number | null; meta_combos_por_dia?: number | null; por_que?: string[]; aviso?: string | null;
  textos?: { whatsapp: string; instagram: string; cartel: string };
};

function copiar(t: string) { try { navigator.clipboard.writeText(t); } catch { /* sin portapapeles */ } }

// La promo que armó LumoBi: números, el porqué y los textos listos para copiar
function PromoDetalle({ p }: { p: Promo }) {
  if (p.sin_promo) return <div style={{ fontSize: 12, color: "var(--tinta)", marginTop: 6, lineHeight: 1.5 }}>{p.motivo}</div>;
  const f = (n?: number | null) => "$" + Math.round(n ?? 0).toLocaleString("es-AR");
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>{p.nombre}</div>
      <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 2 }}>
        <strong>{f(p.precio_promo)}</strong> en vez de {f(p.precio_normal)} ({p.descuento_pct}% menos). Válida {p.cuando}.
      </div>
      {p.ganancia_por_combo != null && <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600, marginTop: 2 }}>Cada combo te deja {f(p.ganancia_por_combo)} de ganancia.</div>}
      <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.6 }}>
        {(p.por_que ?? []).map((x, i) => <li key={i}>{x}</li>)}
      </ul>
      {p.aviso && <div style={{ fontSize: 12, color: "var(--critico)", marginTop: 4, lineHeight: 1.5 }}>{p.aviso}</div>}
      {p.meta_combos_por_dia ? <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 4, lineHeight: 1.5 }}>Para cerrar la brecha que detectamos harían falta unos {p.meta_combos_por_dia} combos por día (cuenta orientativa, no una promesa).</div> : null}
      {p.textos && ([["WhatsApp", p.textos.whatsapp], ["Instagram", p.textos.instagram], ["Cartel del local", p.textos.cartel]] as const).map(([t, x]) => (
        <div key={t} style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tinta-apagada)" }}>{t.toUpperCase()}</span>
            <button onClick={() => copiar(x)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)", cursor: "pointer" }}>Copiar</button>
          </div>
          <div style={{ fontSize: 12, color: "var(--tinta)", background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 8, padding: "6px 8px", marginTop: 3, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{x}</div>
        </div>
      ))}
    </div>
  );
}
type Resp = {
  suficiente: boolean;
  dias_con_ventas: number;
  dias_necesarios: number;
  faltan_dias: number;
  hallazgos: Hallazgo[];
};

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function etiqueta(h: Hallazgo) {
  if (h.positivo) return "Buena noticia";
  if (h.monto_texto) return h.monto_texto;
  if (h.tipo === "estimado") return `Hasta ~${fmt(h.monto)} más por mes (estimación)`;
  if (h.tipo === "medido") return `${fmt(h.monto)} medidos`;
  return `${fmt(h.monto)} en juego`;
}

// Radiografía: lo más importante que LumoBi encontró en el negocio, con plata y evidencia.
export default function RadiografiaCard() {
  const [data, setData] = useState<Resp | null>(null);
  const [resp, setResp] = useState<Record<number, string>>({});
  const [probando, setProbando] = useState<Record<number, string>>({});

  // El dueño elige una idea para probar: LumoBi la anota y dentro de 28 días mide si el problema bajó
  function elegir(hid: number, a: Accion) {
    setProbando(p => ({ ...p, [hid]: a.titulo }));
    setResp(r => ({ ...r, [hid]: "resuelto" }));
    const t = localStorage.getItem("lumo_token");
    const deshacer = () => { setProbando(p => { const n = { ...p }; delete n[hid]; return n; }); setResp(r => { const n = { ...r }; delete n[hid]; return n; }); };
    fetch(`${API}/api/hallazgos/${hid}/accion`, {
      method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ accion_id: a.id }),
    }).then(r => { if (!r.ok) throw new Error(); }).catch(deshacer);
  }

  // LumoBi arma la promo con los datos del negocio (combo, precio, textos); recién después el dueño decide si la prueba
  const [promos, setPromos] = useState<Record<string, Promo>>({});
  const [armando, setArmando] = useState("");
  function armar(hid: number, a: Accion) {
    const k = `${hid}:${a.id}`;
    setArmando(k);
    const t = localStorage.getItem("lumo_token");
    const falla: Promo = { sin_promo: true, motivo: "No pude armar la promo ahora. Probá de nuevo en un rato." };
    fetch(`${API}/api/hallazgos/${hid}/promo`, {
      method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ accion_id: a.id }),
    }).then(r => (r.ok ? r.json() : falla)).catch(() => falla).then(p => { setPromos(x => ({ ...x, [k]: p })); setArmando(""); });
  }

  // El dueño le dice a LumoBi si el hallazgo le sirvió: lo que no sirve deja de mostrarse y de avisarse
  function responder(hid: number, accion: string) {
    setResp(r => ({ ...r, [hid]: accion }));
    const t = localStorage.getItem("lumo_token");
    fetch(`${API}/api/hallazgos/${hid}/feedback`, {
      method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ accion }),
    }).then(r => { if (!r.ok) throw new Error(); }).catch(() => setResp(r => { const n = { ...r }; delete n[hid]; return n; }));
  }

  useEffect(() => {
    let vivo = true;
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/radiografia`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (vivo && d && Array.isArray(d.hallazgos)) setData(d); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!data) return null;
  const sinHallazgos = data.hallazgos.length === 0;
  if (sinHallazgos && data.dias_con_ventas === 0) return null;

  const avance = Math.min(100, Math.round((data.dias_con_ventas / data.dias_necesarios) * 100));

  return (
    <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 18, margin: "16px 0" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif" }}>
        Radiografía de tu negocio
      </div>
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 2, marginBottom: 12 }}>
        Lo más importante que encontró LumoBi en tus últimas 8 semanas.
      </div>

      {!data.suficiente && (
        <div style={{ background: "var(--papel)", borderRadius: 8, padding: "10px 12px", marginBottom: sinHallazgos ? 0 : 12 }}>
          <div style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.5 }}>
            {sinHallazgos
              ? <>Para armar tu radiografía necesito ver al menos {data.dias_necesarios} días de ventas. Llevás <strong>{data.dias_con_ventas}</strong>.</>
              : <>Con {data.dias_necesarios} días de ventas la radiografía es completa. Llevás <strong>{data.dias_con_ventas}</strong>.</>}
          </div>
          <div style={{ height: 6, background: "var(--linea)", borderRadius: 3, marginTop: 8 }}>
            <div style={{ width: `${avance}%`, height: 6, background: "var(--cian)", borderRadius: 3 }} />
          </div>
        </div>
      )}

      {data.hallazgos.filter(h => !(h.hid && ["no_sirve", "ya_lo_sabia", "resuelto"].includes(resp[h.hid]) && !probando[h.hid])).map((h, i) => h.hid && probando[h.hid] ? (
        <div key={h.id} style={{ padding: "12px 0", borderTop: i || !data.suficiente ? "1px solid var(--linea)" : "none" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ok)" }}>Anotado: vas a probar «{probando[h.hid]}».</div>
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 3, lineHeight: 1.5 }}>En 28 días LumoBi mide si mejoró y te cuenta cuánto.</div>
          {Object.entries(promos).filter(([k, p]) => k.startsWith(`${h.hid}:`) && !p.sin_promo).slice(0, 1).map(([k, p]) => <PromoDetalle key={k} p={p} />)}
        </div>
      ) : (
        <div key={h.id} style={{ padding: "12px 0", borderTop: i || !data.suficiente ? "1px solid var(--linea)" : "none" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: h.positivo ? "var(--ok-fondo)" : "var(--critico-fondo)", color: h.positivo ? "var(--ok)" : "var(--critico)", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {i + 1}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.4 }}>{h.titulo}</div>
              {h.detalle && <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 3, lineHeight: 1.5 }}>{h.detalle}</div>}
              <div style={{ fontSize: 12, fontWeight: 700, color: h.positivo ? "var(--ok)" : "var(--critico)", marginTop: 4 }}>{etiqueta(h)}</div>
              {h.evidencia.length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary style={{ fontSize: 12, color: "var(--tinta-apagada)", cursor: "pointer" }}>Cómo lo calculé</summary>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.6 }}>
                    {h.evidencia.map((e, k) => <li key={k}>{e}</li>)}
                  </ul>
                </details>
              )}
              <a href={h.url} style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "var(--azul)", textDecoration: "none" }}>{h.accion_texto ?? "Ver detalle"} →</a>
              {h.hid && !h.positivo && (h.acciones?.length ?? 0) > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 12, fontWeight: 600, color: "var(--azul)", cursor: "pointer" }}>Qué podés hacer</summary>
                  {h.acciones!.map(a => (
                    <div key={a.id} style={{ marginTop: 8, padding: "8px 10px", background: "var(--papel)", borderRadius: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: "var(--tinta-apagada)" }}>{a.tipo === "ganar" ? "PARA GANAR MÁS" : a.tipo === "perder_menos" ? "PARA PERDER MENOS" : "PARA PROBAR"}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tinta)", marginTop: 2, lineHeight: 1.4 }}>{a.titulo}</div>
                      <div style={{ fontSize: 12, color: "var(--tinta)", marginTop: 2, lineHeight: 1.5 }}>{a.detalle}</div>
                      {a.arma && !promos[`${h.hid}:${a.id}`] ? (
                        <button disabled={armando === `${h.hid}:${a.id}`} onClick={() => armar(h.hid as number, a)}
                          style={{ marginTop: 6, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 14, border: "1px solid var(--azul)", background: "var(--azul)", color: "var(--blanco)", cursor: "pointer" }}>{armando === `${h.hid}:${a.id}` ? "Armando…" : "Armar la promo"}</button>
                      ) : (
                        <>
                          {a.arma && promos[`${h.hid}:${a.id}`] && <PromoDetalle p={promos[`${h.hid}:${a.id}`]} />}
                          {!(a.arma && promos[`${h.hid}:${a.id}`]?.sin_promo) && (
                            <button onClick={() => elegir(h.hid as number, a)}
                              style={{ marginTop: 8, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 14, border: "1px solid var(--azul)", background: "var(--blanco)", color: "var(--azul)", cursor: "pointer" }}>Lo voy a probar</button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: "var(--tinta-apagada)", marginTop: 6, lineHeight: 1.5 }}>Son propuestas para probar, no promesas. Si elegís una, LumoBi mide en 28 días si mejoró.</div>
                </details>
              )}
              {h.hid && !h.positivo && (
                <div style={{ marginTop: 10 }}>
                  {resp[h.hid] === "util" ? (
                    <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>Gracias, lo tengo en cuenta.</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--tinta-apagada)" }}>¿Te sirvió?</span>
                      {([["util", "Me sirvió"], ["resuelto", "Ya lo resolví"], ["ya_lo_sabia", "Ya lo sabía"], ["no_sirve", "No me sirve"]] as const).map(([a, t]) => (
                        <button key={a} onClick={() => responder(h.hid as number, a)}
                          style={{ fontSize: 11, padding: "5px 10px", borderRadius: 14, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)", cursor: "pointer" }}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
