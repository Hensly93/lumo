"use client";
// Se vende junto: productos que se llevan en el mismo ticket mucho más de lo que pasaría por casualidad.
import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Estado from "../components/Estado";
import { PageHeader } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const tarjeta: React.CSSProperties = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 16, margin: "0 16px 12px" };
const chico: React.CSSProperties = { fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 };

type Par = { a: { id: number; nombre: string; precio: number | null }; b: { id: number; nombre: string; precio: number | null }; juntos: number; lift: number; pct_de_a: number; pct_de_b: number };
type D = { suficiente: boolean; dias: number; tickets: number; pares: Par[]; aviso: string };
type Est = { combos_nuevos: number; combos_que_ya_compraban: number; facturacion_extra: number; ingreso_extra: number; descuento_regalado: number; ganancia_neta: number | null; adopcion_equilibrio_pct: number | null };
type Prop = { ok: boolean; motivo?: string; nombre?: string; precio?: number; precio_normal?: number; ahorro?: number; descuento_pct?: number; dias?: number; duraciones?: number[]; estimacion?: Est; supuesto?: string; aviso?: string | null };
type Combo = { id: number; nombre: string; precio: number; combo_desde: string; combo_hasta: string; vigente: boolean; vendidos: number; facturado: number; descuento_dado: number };
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" });
const boton: React.CSSProperties = { background: "var(--azul)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" };

// Propuesta de combo para un par: precio, duración, lo que se estima y el botón Aceptar
function ComboPar({ par, token, onAceptado }: { par: Par; token: string; onAceptado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState(14);
  const [p, setP] = useState<Prop | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function pedir(d: number) {
    setCargando(true); setErr(null);
    fetch(`${API}/api/se-vende-junto/propuesta?a=${par.a.id}&b=${par.b.id}&dias=${d}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setP(j)).catch(() => setErr("No pude armar la propuesta.")).finally(() => setCargando(false));
  }
  function abrir() { setAbierto(true); pedir(dias); }
  function cambiarDias(d: number) { setDias(d); pedir(d); }
  function aceptar() {
    setEnviando(true); setErr(null);
    fetch(`${API}/api/se-vende-junto/aceptar`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ a: par.a.id, b: par.b.id, dias }) })
      .then(async r => { const j = await r.json().catch(() => null); if (!r.ok) throw new Error((j && j.error) || "No pude crear el combo."); return j; })
      .then(j => { setListo(j.texto + (j.aviso ? " " + j.aviso : "")); onAceptado(); })
      .catch(e => setErr(e.message)).finally(() => setEnviando(false));
  }

  if (listo) return <div style={{ marginTop: 10, padding: 10, background: "#EAF6EE", borderRadius: 8, fontSize: 13, color: "var(--tinta)", lineHeight: 1.5 }}>{listo}</div>;
  if (!abierto) return <button onClick={abrir} style={{ ...boton, marginTop: 10 }}>Armar combo</button>;
  const e = p?.estimacion;
  return (
    <div style={{ marginTop: 10, borderTop: "1px solid var(--linea)", paddingTop: 10 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {(p?.duraciones || [7, 14, 30]).map(d => (
          <button key={d} onClick={() => cambiarDias(d)} style={{ border: "1px solid var(--linea)", background: d === dias ? "var(--tinta)" : "var(--blanco)", color: d === dias ? "#fff" : "var(--tinta)", borderRadius: 16, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{d} días</button>
        ))}
      </div>
      {cargando && <div style={chico}>Calculando…</div>}
      {!cargando && p && p.precio && (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{p.nombre}</div>
          <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 4, lineHeight: 1.5 }}>
            Precio del combo: <b>{fmt(p.precio)}</b> en vez de {fmt(p.precio_normal || 0)} ({p.descuento_pct}% menos, {fmt(p.ahorro || 0)} de ahorro para el cliente).
          </div>
          {e && (
            <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 8, lineHeight: 1.6 }}>
              En {dias} días, calculo:<br />
              · Unos <b>{e.combos_nuevos}</b> combos de clientes que hoy llevan solo uno de los dos: {fmt(e.ingreso_extra)} más de venta.<br />
              · Unos {e.combos_que_ya_compraban} combos de clientes que igual llevaban los dos: {fmt(e.descuento_regalado)} que dejás de cobrar.<br />
              <b>{e.facturacion_extra >= 0 ? `Facturación estimada: ${fmt(e.facturacion_extra)} más.` : `Facturación estimada: ${fmt(-e.facturacion_extra)} menos.`}</b>
              {e.ganancia_neta != null && <> Ganancia estimada después de costos: <b>{e.ganancia_neta >= 0 ? fmt(e.ganancia_neta) : "-" + fmt(-e.ganancia_neta)}</b>.</>}
            </div>
          )}
          {p.supuesto && <div style={{ ...chico, marginTop: 6 }}>{p.supuesto}</div>}
          {p.aviso && <div style={{ ...chico, marginTop: 6, color: "#8A5A00" }}>{p.aviso}</div>}
          {!p.ok && <div style={{ fontSize: 13, color: "#8A1F1F", marginTop: 8, lineHeight: 1.5 }}>{p.motivo}</div>}
          {p.ok && (
            <>
              <div style={{ ...chico, marginTop: 8 }}>Al aceptar, el combo aparece en la caja de tus empleados y sale solo el último día. Podés desactivarlo antes desde el catálogo.</div>
              <button onClick={aceptar} disabled={enviando} style={{ ...boton, marginTop: 10, opacity: enviando ? 0.6 : 1 }}>{enviando ? "Creando…" : `Aceptar y mandar a la caja por ${dias} días`}</button>
            </>
          )}
        </>
      )}
      {!cargando && p && !p.precio && <div style={{ fontSize: 13, color: "#8A1F1F", lineHeight: 1.5 }}>{p.motivo}</div>}
      {err && <div style={{ fontSize: 13, color: "#8A1F1F", marginTop: 8 }}>{err}</div>}
    </div>
  );
}

export default function SeVendeJunto() {
  const { token, ready } = useAuth();
  const [d, setD] = useState<D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  function cargarCombos() {
    fetch(`${API}/api/se-vende-junto/combos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setCombos(Array.isArray(j.combos) ? j.combos : [])).catch(() => {});
  }
  function cargar() {
    cargarCombos();
    setError(null);
    fetch(`${API}/api/se-vende-junto`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { const j = await r.json().catch(() => null); if (!r.ok) throw new Error((j && j.error) || "No pude cargarlo."); return j; })
      .then(setD).catch(e => setError(e.message));
  }
  useEffect(() => { if (ready && token) cargar(); }, [ready, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 150 }}>
      <PageHeader title="Qué se vende junto" sub="Productos que se llevan en el mismo ticket" negocioEntero />
      <Estado cargando={!d && !error} error={error} onReintentar={cargar}
        vacio={d && !d.suficiente ? d.aviso : d && d.pares.length === 0 ? `Con los ${d.tickets} tickets de los últimos ${d.dias} días no aparece ningún par que se compre junto más de lo normal.` : null} />
      {combos.length > 0 && (
        <div style={tarjeta}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)", marginBottom: 6 }}>Tus combos</div>
          {combos.map(c => (
            <div key={c.id} style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.5, padding: "6px 0", borderTop: "1px solid var(--linea)" }}>
              <b>{c.nombre}</b> · {fmt(c.precio)} · {c.vigente ? `en la caja hasta el ${fecha(c.combo_hasta)}` : `terminó el ${fecha(c.combo_hasta)}`}<br />
              <span style={chico}>{c.vendidos} {c.vendidos === 1 ? "vendido" : "vendidos"} · {fmt(c.facturado)} facturados · {fmt(c.descuento_dado)} de descuento dado</span>
            </div>
          ))}
        </div>
      )}
      {d && d.suficiente && d.pares.map(p => (
        <div key={`${p.a.id}-${p.b.id}`} style={tarjeta}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{p.a.nombre} + {p.b.nombre}</div>
          <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 4, lineHeight: 1.5 }}>
            Se llevaron juntos en {p.juntos} tickets. Cuando alguien compra {p.a.nombre}, {p.pct_de_a}% también lleva {p.b.nombre}.
          </div>
          <div style={chico}>Aparecen juntos {p.lift} veces más que por casualidad.{p.a.precio && p.b.precio ? ` Un combo de los dos suma ${fmt(p.a.precio + p.b.precio)} a precio de lista.` : ""}</div>
          <ComboPar par={p} token={token as string} onAceptado={cargarCombos} />
        </div>
      ))}
      {d && d.suficiente && d.pares.length > 0 && <div style={{ ...chico, margin: "0 16px" }}>{d.aviso}</div>}
      <Nav />
    </main>
  );
}
