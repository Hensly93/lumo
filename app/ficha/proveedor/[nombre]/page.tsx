"use client";
// Ficha de un proveedor: qué le comprás, cada cuánto, y cuánto te subió (tirar del hilo)
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "../../../components/ui";
import Nav from "../../../components/Nav";
import { $, titulo, Frases, Datos, Lista } from "../../FichaUI";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fecha = (s: string) => (s || "").split("-").reverse().join("/");
const pct = (n: number) => n.toLocaleString("es-AR") + "%";

export default function FichaProveedor() {
  const { nombre } = useParams<{ nombre: string }>();
  const quien = decodeURIComponent(nombre);
  const router = useRouter();
  const [f, setF] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    fetch(`${API}/api/ficha/proveedor/${encodeURIComponent(quien)}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => (d.error ? setError(d.error) : setF(d))).catch(() => setError("No se pudo cargar. Probá de nuevo."));
  }, [quien, router]);
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title={f?.proveedor || quien} sub="Proveedor" />
      <div style={{ padding: "0 16px" }}>
        {error && <div style={{ color: "var(--tinta-apagada)" }}>{error}</div>}
        {!f && !error && <div style={{ color: "var(--tinta-apagada)" }}>Cargando…</div>}
        {f && (<>
          <Frases frases={f.frases} />
          <Datos filas={[
            ["Compras", String(f.resumen.compras)],
            ["Últimos 30 días", $(f.resumen.ultimos_30)],
            ["Le comprás cada", f.resumen.cada_dias ? `${f.resumen.cada_dias} días` : "—"],
            ["Te sacan de ganancia", f.resumen.te_come_mes > 0 ? $(f.resumen.te_come_mes) + "/mes" : "—"],
          ]} />
          {f.subieron.length > 0 && (<>
            <div style={titulo}>Te subió en la última compra</div>
            <Lista vacio="" items={f.subieron.map((p: any) => ({ izq: p.nombre, sub: `+${pct(p.suba_ultima_pct)} (${$(p.suba_por_unidad)} por unidad)${p.te_come_mes > 0 ? ` · te saca ${$(p.te_come_mes)} por mes` : ""}`, rojo: true, der: $(p.precio_actual),
              ir: p.producto_id ? `/ficha/producto/${p.producto_id}` : undefined }))} />
          </>)}
          <div style={titulo}>Lo que le comprás</div>
          <Lista vacio="" items={f.productos.map((p: any) => ({ izq: p.nombre, sub: `${p.compras} ${p.compras === 1 ? "compra" : "compras"}${p.suba_total_pct != null ? ` · desde ${fecha(p.desde)} ${p.suba_total_pct >= 0 ? "+" : ""}${pct(p.suba_total_pct)}` : ""}`, der: $(p.precio_actual),
            ir: p.producto_id ? `/ficha/producto/${p.producto_id}` : undefined }))} />
          <div style={titulo}>Últimas facturas</div>
          <Lista vacio="" items={f.compras.map((c: any) => ({ izq: fecha(c.fecha), sub: c.numero ? `N° ${c.numero}` : undefined, der: $(c.total) }))} />
          <button onClick={() => router.push("/pedidos")} style={{ padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Armar el pedido →</button>
        </>)}
      </div>
      <Nav />
    </main>
  );
}
