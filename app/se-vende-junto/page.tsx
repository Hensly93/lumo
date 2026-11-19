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

export default function SeVendeJunto() {
  const { token, ready } = useAuth();
  const [d, setD] = useState<D | null>(null);
  const [error, setError] = useState<string | null>(null);
  function cargar() {
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
      {d && d.suficiente && d.pares.map(p => (
        <div key={`${p.a.id}-${p.b.id}`} style={tarjeta}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{p.a.nombre} + {p.b.nombre}</div>
          <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 4, lineHeight: 1.5 }}>
            Se llevaron juntos en {p.juntos} tickets. Cuando alguien compra {p.a.nombre}, {p.pct_de_a}% también lleva {p.b.nombre}.
          </div>
          <div style={chico}>Aparecen juntos {p.lift} veces más que por casualidad.{p.a.precio && p.b.precio ? ` Un combo de los dos suma ${fmt(p.a.precio + p.b.precio)} a precio de lista.` : ""}</div>
        </div>
      ))}
      {d && d.suficiente && d.pares.length > 0 && <div style={{ ...chico, margin: "0 16px" }}>{d.aviso}</div>}
      <Nav />
    </main>
  );
}
