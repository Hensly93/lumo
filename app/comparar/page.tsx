"use client";
// Comparar locales: cada local contra el resto de la red (ticket, margen, faltante de caja, anulaciones, productos).
// Solo habla cuando la diferencia es grande y hay datos suficientes; las cifras salen de /api/multilocal/comparar.
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "../components/Nav";
import Estado from "../components/Estado";
import { PageHeader } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

type Local = {
  id: number; nombre: string; ventas: number; tickets: number; ticket_promedio: number | null;
  margen_bruto_pct: number | null; faltante_pct: number; anulacion_pct: number; suficiente: boolean;
};
type Mejor = { mejor: string; peor: string } | null;
type Hallazgo = { id: string; detector: string; titulo: string; detalle: string; evidencia: string[]; pesos: number | null; accion: string };
type Resp = {
  comparable: boolean; aviso: string | null; dias: number; locales: Local[]; pesos_en_juego: number; hallazgos: Hallazgo[];
  ranking: { ventas: Mejor; ticket_promedio: Mejor; margen_bruto_pct: Mejor; faltante_pct: Mejor; anulacion_pct: Mejor };
};

const tarjeta: React.CSSProperties = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 16, margin: "0 16px 12px" };
const chico: React.CSSProperties = { fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 };

const COLUMNAS: { k: keyof Resp["ranking"]; campo: keyof Local; titulo: string; f: (l: Local) => string }[] = [
  { k: "ventas", campo: "ventas", titulo: "Ventas (30 días)", f: l => fmt(l.ventas) },
  { k: "ticket_promedio", campo: "ticket_promedio", titulo: "Ticket promedio", f: l => (l.ticket_promedio != null ? fmt(l.ticket_promedio) : "—") },
  { k: "margen_bruto_pct", campo: "margen_bruto_pct", titulo: "Margen sobre costo", f: l => (l.margen_bruto_pct != null ? `${l.margen_bruto_pct}%` : "sin costos") },
  { k: "faltante_pct", campo: "faltante_pct", titulo: "Falta en caja", f: l => `${l.faltante_pct}%` },
  { k: "anulacion_pct", campo: "anulacion_pct", titulo: "Ventas anuladas", f: l => `${l.anulacion_pct}%` },
];

export default function Comparar() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [d, setD] = useState<Resp | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!token) return;
    setCargando(true); setError(null);
    fetch(`${API}/api/multilocal/comparar`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((x: Resp) => setD(x))
      .catch(() => setError("No pudimos comparar tus locales ahora."))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    cargar();
  }, [ready, token, cargar, router]);

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 110 }}>
      <PageHeader title="Comparar locales" sub="Cada local contra el resto de tu red, con los últimos 30 días" />
      <div style={{ padding: "0 0" }}>
        <div style={{ margin: "0 16px" }}>
          <Estado cargando={cargando} error={error} onReintentar={cargar} vacio={!cargando && !error && d && d.aviso ? d.aviso : null} />
        </div>

        {d && d.comparable && (
          <>
            {d.pesos_en_juego > 0 && (
              <div style={{ ...tarjeta, background: "var(--azul-claro)", borderColor: "var(--azul)" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--tinta)" }}>{fmt(d.pesos_en_juego)} por mes</div>
                <div style={chico}>Lo que se podría mejorar si cada local se acercara a cómo le va al resto. Es una estimación prudente, no una promesa.</div>
              </div>
            )}

            <div style={{ ...tarjeta, padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 12px", color: "var(--tinta-apagada)", fontWeight: 600 }}>Local</th>
                    {COLUMNAS.map(c => <th key={c.k} style={{ textAlign: "right", padding: "12px 10px", color: "var(--tinta-apagada)", fontWeight: 600 }}>{c.titulo}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d.locales.map(l => (
                    <tr key={l.id} style={{ borderTop: "1px solid var(--linea)", opacity: l.suficiente ? 1 : 0.55 }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--tinta)" }}>
                        {l.nombre}
                        {!l.suficiente && <div style={{ ...chico, fontWeight: 400 }}>pocos datos todavía</div>}
                      </td>
                      {COLUMNAS.map(c => {
                        const r = d.ranking[c.k];
                        const esMejor = l.suficiente && r?.mejor === l.nombre;
                        const esPeor = l.suficiente && r?.peor === l.nombre;
                        return (
                          <td key={c.k} style={{ padding: "12px 10px", textAlign: "right", color: "var(--tinta)" }}>
                            <div style={{ fontWeight: esMejor || esPeor ? 700 : 500 }}>{c.f(l)}</div>
                            {esMejor && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ok)" }}>▲ el mejor</div>}
                            {esPeor && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--atencion)" }}>▼ a mejorar</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {d.hallazgos.length === 0 ? (
              <div style={tarjeta}>
                <div style={{ fontWeight: 700, color: "var(--tinta)" }}>Tus locales andan parejos</div>
                <div style={chico}>No hay diferencias grandes entre ellos. Cuando aparezca una, la vas a ver acá y en Qué hacer.</div>
              </div>
            ) : d.hallazgos.map(h => (
              <div key={h.id} style={tarjeta}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.35 }}>{h.titulo}</div>
                  {h.pesos != null && h.pesos > 0 && <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tinta)", flexShrink: 0 }}>{fmt(h.pesos)}</div>}
                </div>
                <div style={{ fontSize: 13, color: "var(--tinta-suave)", marginTop: 6, lineHeight: 1.55 }}>{h.detalle}</div>
                <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 8, fontWeight: 600 }}>Qué hacer: {h.accion}</div>
              </div>
            ))}

            <div style={{ margin: "0 16px" }}>
              <Link href="/que-hacer" style={{ fontSize: 13, fontWeight: 600, color: "var(--azul)" }}>Ver todo en Qué hacer</Link>
            </div>
          </>
        )}
      </div>
      <Nav />
    </main>
  );
}
