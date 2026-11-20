"use client";
// Qué hacer: UNA sola lista con todo lo que LumoBi encontró (oportunidades, fugas, alertas, equipo),
// ordenada por urgencia y por plata. Inicio, Oportunidades, Fugas y Alertas son vistas de esta misma lista.
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "../components/Nav";
import { PageHeader } from "../components/ui";
import CalidadDatos from "../components/CalidadDatos";
import { useAuth } from "../hooks/useAuth";
import { useSucursal } from "../hooks/useSucursal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

type Accion = { id: string; tipo: string; titulo: string; detalle: string; arma?: boolean };
type Item = {
  id: string; origen: "hallazgo" | "alerta" | "comparacion" | "vencimiento"; hid: number | null; titulo: string; detalle: string; evidencia: string[];
  pesos: number | null; pesos_texto: string | null; urgente: boolean; acciones: Accion[]; accion_texto: string; url: string; puede_responder: boolean;
};
type Medido = { id: number; titulo: string; recuperado: number };
type Resp = {
  resumen: { cantidad: number; urgentes: number; pesos_en_juego: number; sin_monto: number; texto: string };
  items: Item[];
  recuperado: { total_mensual: number; medidos: Medido[]; en_seguimiento: { id: number; titulo: string; dias_faltan: number }[] } | null;
};

const tarjeta: React.CSSProperties = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 16, marginBottom: 12 };
const chico: React.CSSProperties = { fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 };
const btn = (primario = false): React.CSSProperties => ({
  fontSize: 13, fontWeight: 600, padding: "8px 12px", borderRadius: 8, cursor: "pointer", textDecoration: "none", display: "inline-block",
  border: primario ? "none" : "1px solid var(--linea)", background: primario ? "var(--tinta)" : "var(--blanco)", color: primario ? "var(--blanco)" : "var(--tinta)",
});

export default function QueHacer() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const { sucursalId } = useSucursal();
  const [d, setD] = useState<Resp | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  const [hechos, setHechos] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<"todo" | "urgentes" | "oportunidades" | "alertas">("todo");

  const cargar = useCallback(() => {
    if (!token) return;
    setCargando(true); setError(false);
    fetch(`${API}/api/que-hacer${sucursalId ? `?sucursal_id=${sucursalId}` : ""}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((x: Resp) => setD(x))
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, [token, sucursalId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    cargar();
  }, [ready, token, cargar, router]);

  function post(ruta: string, body: unknown, id: string, texto: string) {
    setHechos(h => ({ ...h, [id]: texto }));
    fetch(`${API}/api/hallazgos/${ruta}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
    }).then(r => { if (!r.ok) throw new Error(); }).catch(() => setHechos(h => { const n = { ...h }; delete n[id]; return n; }));
  }

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Qué hacer" sub="Todo lo que encontró LumoBi, ordenado por lo urgente y por la plata en juego" />
      <div style={{ padding: "0 16px" }}>
        {cargando && <div style={{ ...tarjeta, ...chico }}>Armando tu lista…</div>}

        {!cargando && error && (
          <div style={tarjeta}>
            <div style={{ fontSize: 14, color: "var(--tinta)", marginBottom: 10 }}>No pude cargar la lista ahora.</div>
            <button style={btn(true)} onClick={cargar}>Probar de nuevo</button>
          </div>
        )}

        {!cargando && !error && d && (
          <>
            <div style={tarjeta}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--tinta)" }}>{d.resumen.cantidad ? d.resumen.texto : "Nada para hacer ahora"}</div>
              {d.resumen.urgentes > 0 && <div style={{ ...chico, color: "var(--critico)", fontWeight: 600, marginTop: 4 }}>{d.resumen.urgentes} urgente{d.resumen.urgentes === 1 ? "" : "s"}</div>}
              {d.resumen.sin_monto > 0 && d.resumen.cantidad > 0 && (
                <div style={{ ...chico, marginTop: 4 }}>{d.resumen.sin_monto} no tiene{d.resumen.sin_monto === 1 ? "" : "n"} un monto calculado: LumoBi no inventa números.</div>
              )}
              {d.recuperado && d.recuperado.total_mensual > 0 && (
                <div style={{ ...chico, color: "var(--ok)", fontWeight: 600, marginTop: 6 }}>
                  Ya recuperaste {fmt(d.recuperado.total_mensual)} por mes (medido, 28 días después de resolver cada cosa).
                </div>
              )}
              {d.recuperado && d.recuperado.en_seguimiento.length > 0 && (
                <div style={{ ...chico, marginTop: 4 }}>
                  {d.recuperado.en_seguimiento.length} en seguimiento: LumoBi mide si el problema bajó.
                </div>
              )}
            </div>

            <CalidadDatos />

            {d.items.length === 0 && (
              <div style={{ ...tarjeta, ...chico }}>
                Cuando LumoBi encuentre plata que se te escapa o algo para mirar, aparece acá con qué hacer. Mientras más ventas cargues, más ve.
              </div>
            )}

            {d.items.length > 0 && (() => {
              const cuenta = {
                todo: d.items.length,
                urgentes: d.items.filter(i => i.urgente).length,
                oportunidades: d.items.filter(i => i.origen === "hallazgo").length,
                alertas: d.items.filter(i => i.origen !== "hallazgo").length,
              };
              const chips: { k: typeof filtro; t: string }[] = [
                { k: "todo", t: "Todo" }, { k: "urgentes", t: "Urgentes" }, { k: "oportunidades", t: "Oportunidades" }, { k: "alertas", t: "Alertas" },
              ];
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 12px" }}>
                  {chips.filter(c => c.k === "todo" || cuenta[c.k] > 0).map(c => (
                    <button key={c.k} onClick={() => setFiltro(c.k)} aria-pressed={filtro === c.k}
                      style={{ fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 99, cursor: "pointer",
                        border: filtro === c.k ? "1px solid var(--tinta)" : "1px solid var(--linea)",
                        background: filtro === c.k ? "var(--tinta)" : "var(--blanco)", color: filtro === c.k ? "var(--blanco)" : "var(--tinta)" }}>
                      {c.t} {cuenta[c.k]}
                    </button>
                  ))}
                </div>
              );
            })()}

            {d.items.filter(it => filtro === "todo" || (filtro === "urgentes" ? it.urgente : filtro === "oportunidades" ? it.origen === "hallazgo" : it.origen !== "hallazgo")).map(it => {
              const respondido = hechos[it.id];
              const abierto = abiertos[it.id];
              return (
                <div key={it.id} style={{ ...tarjeta, borderLeft: it.urgente ? "4px solid var(--critico)" : "1px solid var(--linea)", opacity: respondido ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: it.urgente ? "var(--critico)" : "var(--tinta-apagada)" }}>
                        {it.urgente ? "URGENTE" : it.origen === "hallazgo" ? "OPORTUNIDAD" : it.origen === "comparacion" ? "ENTRE TUS LOCALES" : it.origen === "vencimiento" ? "VENCE PRONTO" : "PARA MIRAR"}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)", marginTop: 2, lineHeight: 1.35 }}>{it.titulo}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {it.pesos != null ? (
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tinta)" }}>{fmt(it.pesos)}</div>
                      ) : (
                        <div style={chico}>sin monto</div>
                      )}
                      {it.pesos_texto && <div style={chico}>{it.pesos_texto}</div>}
                    </div>
                  </div>

                  {it.detalle && <div style={{ ...chico, marginTop: 6, color: "var(--tinta)" }}>{it.detalle}</div>}

                  {it.evidencia.length > 0 && (
                    <>
                      <button onClick={() => setAbiertos(a => ({ ...a, [it.id]: !a[it.id] }))} style={{ ...chico, background: "none", border: "none", padding: 0, marginTop: 8, cursor: "pointer", textDecoration: "underline" }}>
                        {abierto ? "Ocultar de dónde sale" : "¿De dónde sale?"}
                      </button>
                      {abierto && <ul style={{ ...chico, margin: "6px 0 0", paddingLeft: 18 }}>{it.evidencia.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                    </>
                  )}

                  {respondido ? (
                    <div style={{ ...chico, marginTop: 10, fontWeight: 600 }}>{respondido}</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {it.acciones.filter(a => !a.arma).slice(0, 2).map(a => (
                        <button key={a.id} style={btn(true)} onClick={() => post(`${it.hid}/accion`, { accion_id: a.id }, it.id, `Anotado: probás "${a.titulo}". En 28 días LumoBi mide si bajó.`)}>
                          Probar: {a.titulo.length > 38 ? a.titulo.slice(0, 36) + "…" : a.titulo}
                        </button>
                      ))}
                      {it.acciones.some(a => a.arma) && <Link href="/oportunidades" style={btn(true)}>Que LumoBi arme la promo</Link>}
                      {it.acciones.filter(a => !a.arma).length === 0 && !it.acciones.some(a => a.arma) && (
                        <Link href={it.url} style={btn(true)}>{it.accion_texto.length > 40 ? "Ver el detalle" : it.accion_texto}</Link>
                      )}
                      {(it.acciones.length > 0) && <Link href={it.url} style={btn()}>Ver el detalle</Link>}
                      {it.puede_responder && it.hid != null && (
                        <>
                          <button style={btn()} onClick={() => post(`${it.hid}/feedback`, { accion: "util" }, it.id, "Anotado: era real. Eso ayuda a que LumoBi afine lo que te avisa.")}>Era real</button>
                          <button style={btn()} onClick={() => post(`${it.hid}/feedback`, { accion: "resuelto" }, it.id, "Marcado como resuelto. LumoBi mide en 28 días si bajó.")}>Ya lo resolví</button>
                          <button style={btn()} onClick={() => post(`${it.hid}/feedback`, { accion: "no_sirve" }, it.id, "Listo, no te lo muestro más.")}>No me sirve</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, margin: "4px 2px 8px" }}>
              <Link href="/resumen-mensual" style={{ fontSize: 14, fontWeight: 700, color: "#007AFF", textDecoration: "none" }}>Resumen del mes →</Link>
              <Link href="/fugas" style={{ fontSize: 14, fontWeight: 700, color: "#007AFF", textDecoration: "none" }}>Fugas de plata →</Link>
            </div>
          </>
        )}
      </div>
      <Nav />
    </main>
  );
}
