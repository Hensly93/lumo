"use client";
// Ficha de un producto: todo lo que pasa con él, conectado (Palantir)
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "../../../components/ui";
import Nav from "../../../components/Nav";
import { $, titulo, Frases, Datos, Lista } from "../../FichaUI";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const DIA_CAP = (d: string | null) => (d ? d[0].toUpperCase() + d.slice(1) : "—");

export default function FichaProducto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [f, setF] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    fetch(`${API}/api/ficha/producto/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => (d.error ? setError(d.error) : setF(d))).catch(() => setError("No se pudo cargar. Probá de nuevo."));
  }, [id, router]);
  const u = f?.producto?.unidad === "kg" ? "kg" : "u.";
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title={f ? f.producto.nombre : "Producto"} sub={f ? [f.producto.marca, f.producto.categoria].filter(Boolean).join(" · ") || "Todo lo de este producto" : ""} />
      <div style={{ padding: "0 16px" }}>
        {error && <div style={{ color: "var(--tinta-apagada)" }}>{error}</div>}
        {!f && !error && <div style={{ color: "var(--tinta-apagada)" }}>Cargando…</div>}
        {f && (<>
          <Frases frases={f.frases} />
          <Datos filas={[
            ["Precio", $(f.producto.precio)],
            ["Te deja por unidad", f.ganancia ? `${$(f.ganancia.por_unidad)} (${f.ganancia.pct}%)` : "Falta el costo"],
            ["Vendido en 30 días", `${f.ventas.unidades.toLocaleString("es-AR")} ${u} · ${$(f.ventas.plata)}`],
            ["Stock", f.stock.actual == null ? "Sin control" : `${f.stock.actual.toLocaleString("es-AR")} ${u}${f.stock.alcanza_dias != null ? ` · ${f.stock.alcanza_dias} días` : ""}`],
            ["Mejor día", DIA_CAP(f.cuando.mejor_dia)],
            ["Hora en que más sale", f.cuando.hora_pico != null ? `${f.cuando.hora_pico} h` : "—"],
          ]} />
          <div style={titulo}>Quién lo vende</div>
          <Lista vacio="Todavía no se vendió con la caja de LumoBi." items={f.quien_lo_vende.map((x: any) => ({ izq: x.empleado, der: $(x.plata), sub: `${x.unidades.toLocaleString("es-AR")} ${u}`, ir: `/ficha/persona/${encodeURIComponent(x.empleado)}` }))} />
          <div style={titulo}>Compras al proveedor</div>
          <Lista vacio="No hay facturas de proveedor con este producto. Sacale foto a la factura en Plata → Facturas." items={f.proveedor.ultimas.map((x: any) => ({ izq: x.proveedor || "Proveedor", sub: x.fecha.split("-").reverse().join("/"), der: $(x.precio), ir: x.proveedor ? `/ficha/proveedor/${encodeURIComponent(x.proveedor)}` : undefined }))} />
          <div style={titulo}>Cambios de precio</div>
          <Lista vacio="No se cambió el precio." items={f.cambios_precio.map((x: any) => ({ izq: `${x.campo === "precio_costo" ? "Costo" : "Precio"}: ${$(x.antes)} → ${$(x.despues)}`, sub: `${x.cuando}${x.empleado ? ` · ${x.empleado}` : ""}` }))} />
          <button onClick={() => router.push("/catalogo")} style={{ marginTop: 6, padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Editar en Productos →</button>
        </>)}
      </div>
      <Nav />
    </main>
  );
}
