"use client";
// Vencimientos: los gastos que se repiten cada mes (alquiler, luz, sueldos, cuotas). LumoBi avisa antes de que venzan.
import { useCallback, useEffect, useState } from "react";
import Nav from "../components/Nav";
import Estado from "../components/Estado";
import { PageHeader } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const tarjeta: React.CSSProperties = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 16, margin: "0 16px 12px" };
const chico: React.CSSProperties = { fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 };
const campo: React.CSSProperties = { padding: "10px 12px", borderRadius: 8, border: "1px solid var(--linea)", fontSize: 15, minWidth: 0, boxSizing: "border-box" };

type Item = { id: number; nombre: string; monto: number; dia_mes: number; fecha: string; dias: number };
type D = { items: Item[]; total_7: number; total_30: number; total_mensual: number; venta_diaria: number | null; dias_de_venta_para_cubrir: number | null; nota: string };

const cuando = (n: number) => (n === 0 ? "hoy" : n === 1 ? "mañana" : `en ${n} días`);

export default function Vencimientos() {
  const { token, ready } = useAuth();
  const [d, setD] = useState<D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(""); const [monto, setMonto] = useState(""); const [dia, setDia] = useState("");
  const [guardando, setGuardando] = useState(false); const [errForm, setErrForm] = useState("");

  const pedir = useCallback(async (metodo: string, ruta = "", body?: unknown) => {
    const r = await fetch(`${API}/api/vencimientos${ruta}`, { method: metodo, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && j.error) || "No pude hacerlo. Probá de nuevo.");
    return j as D;
  }, [token]);
  const cargar = useCallback(() => { setError(null); pedir("GET").then(setD).catch(e => setError(e.message)); }, [pedir]);
  useEffect(() => { if (ready && token) cargar(); }, [ready, token, cargar]);

  async function agregar() {
    setErrForm("");
    const m = Number(monto.replace(/\./g, "").replace(",", "."));
    if (!nombre.trim()) { setErrForm("Poné el nombre, por ejemplo Alquiler."); return; }
    if (!(m > 0)) { setErrForm("Poné el monto."); return; }
    const dm = parseInt(dia, 10);
    if (!(dm >= 1 && dm <= 31)) { setErrForm("El día del mes va de 1 a 31."); return; }
    setGuardando(true);
    try { setD(await pedir("POST", "", { nombre: nombre.trim(), monto: m, dia_mes: dm })); setNombre(""); setMonto(""); setDia(""); }
    catch (e) { setErrForm(e instanceof Error ? e.message : "No pude guardar."); }
    setGuardando(false);
  }
  async function sacar(i: Item) {
    try { setD(await pedir("DELETE", `/${i.id}`)); } catch (e) { setError(e instanceof Error ? e.message : "No pude sacarlo."); }
  }

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 150 }}>
      <PageHeader title="Vencimientos" sub="Lo que pagás todos los meses" negocioEntero />
      <Estado cargando={!d && !error} error={error} onReintentar={cargar} />
      {d && (
        <>
          {d.items.length > 0 && (
            <div style={tarjeta}>
              <div style={chico}>Esta semana vence</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--tinta)" }}>{fmt(d.total_7)}</div>
              <div style={chico}>En los próximos 30 días: {fmt(d.total_30)}.{d.dias_de_venta_para_cubrir != null ? ` Con lo que vendés por día (${fmt(d.venta_diaria ?? 0)}), son unos ${d.dias_de_venta_para_cubrir} días de ventas.` : ""}</div>
              <div style={{ ...chico, marginTop: 4 }}>{d.nota}</div>
            </div>
          )}
          {d.items.length === 0 && (
            <div style={{ ...tarjeta, fontSize: 14, color: "var(--tinta)", lineHeight: 1.5 }}>Cargá tus gastos fijos (alquiler, luz, sueldos, cuotas) y LumoBi te avisa cuando se acerca cada vencimiento.</div>
          )}
          {d.items.map(i => (
            <div key={i.id} style={{ ...tarjeta, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{i.nombre}</div>
                <div style={{ ...chico, color: i.dias <= 2 ? "#D97706" : "var(--tinta-apagada)", fontWeight: i.dias <= 2 ? 700 : 400 }}>Vence {cuando(i.dias)} · todos los {i.dia_mes}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{fmt(i.monto)}</div>
                <button onClick={() => sacar(i)} style={{ padding: 0, border: "none", background: "none", color: "var(--tinta-apagada)", fontSize: 12, cursor: "pointer" }}>Sacar</button>
              </div>
            </div>
          ))}
          <div style={tarjeta}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", marginBottom: 8 }}>Agregar un gasto</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px", gap: 8 }}>
              <input style={campo} placeholder="Ej: Alquiler" value={nombre} onChange={e => setNombre(e.target.value)} aria-label="Nombre del gasto" />
              <input style={campo} inputMode="numeric" placeholder="Monto" value={monto} onChange={e => setMonto(e.target.value)} aria-label="Monto" />
              <input style={campo} inputMode="numeric" placeholder="Día" value={dia} onChange={e => setDia(e.target.value)} aria-label="Día del mes" />
            </div>
            {errForm && <div style={{ fontSize: 12, color: "var(--critico, #DC2626)", marginTop: 6 }}>{errForm}</div>}
            <button onClick={agregar} disabled={guardando} style={{ marginTop: 10, width: "100%", padding: 12, borderRadius: 8, border: "none", background: "var(--tinta)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{guardando ? "Guardando…" : "Agregar"}</button>
            <div style={{ ...chico, marginTop: 6 }}>El día es el del mes en que vence (si ese mes no lo tiene, vence el último día).</div>
          </div>
        </>
      )}
      <Nav />
    </main>
  );
}
