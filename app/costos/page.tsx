"use client";
// Precios que se te comieron: el costo subió, el precio no. Frase en criollo + el precio nuevo con un botón.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Estado from "../components/Estado";
import Nav from "../components/Nav";
import BotonAplicar from "../components/BotonAplicar";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const $ = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

type Item = {
  producto_id: number; nombre: string; frase: string; por_mes: string; gana_mes: number;
  proveedor: string | null; aplicar: { boton: string } & Record<string, unknown>;
};
type Resp = { hay_datos: boolean; items: Item[]; total_mes: number; frase: string; aplicar_todos: ({ boton: string } & Record<string, unknown>) | null };

export default function CostosPage() {
  const router = useRouter();
  const [d, setD] = useState<Resp | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    fetch(`${API}/api/costos-precios`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(x => (x.error ? setError(x.error) : setD(x))).catch(() => setError("No se pudo cargar. Probá de nuevo."));
  }, [router]);

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Precios que se te comieron" sub="Tu proveedor subió y vos no" negocioEntero />
      <div style={{ padding: "0 16px" }}>
        <Estado error={error} cargando={!d && !error} />
        {d && !d.hay_datos && (
          <div style={{ color: "var(--tinta)", lineHeight: 1.6, fontSize: 14 }}>
            Todavía no puedo compararte costos: necesito al menos dos facturas de proveedor con el mismo producto. Sacale foto a las facturas en “Facturas de proveedores” y acá te aparece qué precio subir.
          </div>
        )}
        {d && d.hay_datos && (<>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.45, marginBottom: 12 }}>{d.frase}</div>
          {d.aplicar_todos && (
            <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "var(--tinta)" }}>Poner todos juntos: ganás {$(d.total_mes)} más por mes (si vendés lo mismo).</div>
              <BotonAplicar p={{ aplicar: d.aplicar_todos }} />
            </div>
          )}
          {d.items.map(i => (
            <div key={i.producto_id} style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.55 }}>{i.frase}</div>
              <div style={{ fontSize: 13, color: "var(--ok)", fontWeight: 600, marginTop: 6 }}>{i.por_mes}</div>
              {i.proveedor && <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 4 }}>Proveedor: {i.proveedor}</div>}
              <BotonAplicar p={{ aplicar: i.aplicar }} />
            </div>
          ))}
        </>)}
      </div>
      <Nav />
    </main>
  );
}
