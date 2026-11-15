"use client";
// Pedidos: qué pedir, cuánto y a quién. Con el stock que baja solo en cada venta y el ritmo real de venta.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const $ = (n: number | null) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("es-AR"));
type Item = { id: number; nombre: string; marca: string | null; unidad: string; pedir: number; costo_estimado: number | null; porque: string; urgencia: "agotado" | "ya" | "esta_semana" };
type Grupo = { proveedor: string; items: Item[]; total: number; texto: string };
type R = { cobertura_dias: number; urgentes: number; items: Item[]; por_proveedor: Grupo[]; sin_control: number };

const ETQ = { agotado: ["AGOTADO", "#DC2626"], ya: ["PEDÍ HOY", "#DC2626"], esta_semana: ["ESTA SEMANA", "#D97706"] } as const;

export default function Pedidos() {
  const router = useRouter();
  const [r, setR] = useState<R | null>(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    fetch(`${API}/api/pedidos`, { headers: { Authorization: `Bearer ${t}` } })
      .then(x => x.json()).then(d => (d.error ? setError(d.error) : setR(d))).catch(() => setError("No se pudo cargar. Probá de nuevo."));
  }, [router]);
  const copiar = async (g: Grupo) => { try { await navigator.clipboard.writeText(g.texto); setCopiado(g.proveedor); setTimeout(() => setCopiado(""), 3000); } catch { /* sin permiso */ } };
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Pedidos" sub="Qué pedir, cuánto y a quién" />
      <div style={{ padding: "0 16px" }}>
        {error && <div style={{ color: "var(--tinta-apagada)" }}>{error}</div>}
        {!r && !error && <div style={{ color: "var(--tinta-apagada)" }}>Calculando…</div>}
        {r && r.items.length === 0 && (
          <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", fontSize: 15, color: "var(--tinta)", lineHeight: 1.5 }}>
            {r.sin_control > 0 && r.items.length === 0
              ? <>No hay nada para pedir esta semana. Ojo: {r.sin_control} productos no tienen el stock cargado, así que LumoBi no los puede controlar. Cargalo en <a href="/catalogo" style={{ color: "#007AFF" }}>Productos</a> (contá lo que tenés y anotalo una vez: después baja solo con cada venta).</>
              : "No hay nada para pedir esta semana: todo lo que se vende alcanza para más de 7 días."}
          </div>
        )}
        {r && r.items.length > 0 && (<>
          <div style={{ fontSize: 14, color: "var(--tinta-apagada)", lineHeight: 1.5, marginBottom: 12 }}>
            Lo que te alcanza para 7 días o menos, con lo que conviene pedir para cubrir {r.cobertura_dias} días según cómo vendés de verdad.
          </div>
          {r.por_proveedor.map(g => (
            <div key={g.proveedor} style={{ padding: 16, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tinta)" }}>{g.proveedor}</div>
                {g.total > 0 && <div style={{ fontSize: 13, color: "var(--tinta-apagada)" }}>unos {$(g.total)}</div>}
              </div>
              {g.items.map(it => (
                <div key={it.id} onClick={() => router.push(`/ficha/producto/${it.id}`)} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: "1px solid var(--linea)", cursor: "pointer" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: ETQ[it.urgencia][1] }}>{ETQ[it.urgencia][0]}</span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{it.nombre}{it.marca ? ` · ${it.marca}` : ""}</div>
                    <div style={{ fontSize: 13, color: "var(--tinta-apagada)" }}>{it.porque}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--tinta-apagada)" }}>Pedí</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--tinta)" }}>{it.pedir.toLocaleString("es-AR")} {it.unidad}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <a href={`https://wa.me/?text=${encodeURIComponent(g.texto)}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", padding: 11, borderRadius: 10, background: "var(--tinta)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Mandar por WhatsApp</a>
                <button onClick={() => copiar(g)} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{copiado === g.proveedor ? "Copiado ✓" : "Copiar el pedido"}</button>
              </div>
            </div>
          ))}
          {r.sin_control > 0 && <div style={{ fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 }}>{r.sin_control} productos no tienen stock cargado y no entran en este cálculo.</div>}
        </>)}
      </div>
      <Nav />
    </main>
  );
}
