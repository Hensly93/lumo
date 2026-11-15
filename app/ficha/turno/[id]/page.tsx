"use client";
// Ficha de un turno: la cuenta de la caja paso a paso y cada venta que la compone (tirar del hilo)
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "../../../components/ui";
import Nav from "../../../components/Nav";
import { $, caja, titulo, Frases, Lista } from "../../FichaUI";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const METODO: Record<string, string> = { efectivo: "Efectivo", mixto: "Efectivo + otro", qr: "QR", mp: "Mercado Pago", mercadopago: "Mercado Pago", debito: "Débito", credito: "Crédito", tarjeta: "Tarjeta", transferencia: "Transferencia" };
const HECHO: Record<string, string> = { item_borrado: "Sacó un producto del carrito", cantidad_reducida: "Bajó la cantidad", precio_cambiado: "Cambió un precio", producto_creado: "Creó un producto", egreso: "Sacó plata de la caja", venta_anulada: "Anuló una venta", descuento: "Hizo un descuento", espera_descartada: "Cerró con una venta en espera sin cobrar" };

export default function FichaTurno() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [f, setF] = useState<any>(null);
  const [error, setError] = useState("");
  const [abierta, setAbierta] = useState<number | null>(null);
  const [todas, setTodas] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    fetch(`${API}/api/ficha/turno/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => (d.error ? setError(d.error) : setF(d))).catch(() => setError("No se pudo cargar. Probá de nuevo."));
  }, [id, router]);
  const ventas = f ? (todas ? f.ventas : f.ventas.slice(0, 15)) : [];
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title={f ? `Turno de ${f.turno.empleado || "—"}` : "Turno"} sub={f ? `${f.turno.abre}${f.turno.local ? " · " + f.turno.local : ""}` : ""} />
      <div style={{ padding: "0 16px" }}>
        {error && <div style={{ color: "var(--tinta-apagada)" }}>{error}</div>}
        {!f && !error && <div style={{ color: "var(--tinta-apagada)" }}>Cargando…</div>}
        {f && (<>
          <Frases frases={f.frases} senales={f.senales} />

          <div style={titulo}>La cuenta de la caja</div>
          <div style={caja}>
            {f.cuenta.map((c: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: c.total || c.resultado ? "1px solid var(--linea)" : "none", fontWeight: c.total || c.resultado ? 800 : 500 }}>
                <div style={{ fontSize: 14, color: "var(--tinta)" }}>{c.signo && <span style={{ display: "inline-block", width: 16, color: "var(--tinta-apagada)" }}>{c.signo}</span>}{c.paso}
                  {c.nota && <div style={{ fontSize: 12, fontWeight: 500, color: "var(--tinta-apagada)", marginLeft: 16 }}>{c.nota}</div>}</div>
                <div style={{ fontSize: 15, color: c.falta ? "#B45309" : "var(--tinta)", whiteSpace: "nowrap" }}>{$(c.monto)}</div>
              </div>
            ))}
            <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 8, lineHeight: 1.5 }}>
              Las ventas con QR, tarjeta o transferencia ({$(f.totales.digital)}) no entran al cajón, por eso no suman acá.
            </div>
          </div>

          {f.egresos.length > 0 && (<>
            <div style={titulo}>Plata que sacó de la caja</div>
            <Lista vacio="" items={f.egresos.map((e: any) => ({ izq: e.motivo || "Sin motivo", sub: e.hora, der: $(e.monto) }))} />
          </>)}

          {f.hechos.length > 0 && (<>
            <div style={titulo}>Lo que pasó en la caja</div>
            <Lista vacio="" items={f.hechos.map((h: any) => ({ izq: HECHO[h.tipo] || h.tipo, sub: `${h.hora}${h.producto_nombre ? " · " + h.producto_nombre : ""}${h.detalle ? " · " + h.detalle : ""}`, der: h.valor ? $(h.valor) : undefined,
              ir: h.producto_id ? `/ficha/producto/${h.producto_id}` : undefined }))} />
          </>)}

          {f.mas_vendidos.length > 0 && (<>
            <div style={titulo}>Lo que más se vendió</div>
            <Lista vacio="" items={f.mas_vendidos.map((p: any) => ({ izq: p.nombre, sub: `${p.cantidad.toLocaleString("es-AR")} u.`, der: $(p.plata), ir: `/ficha/producto/${p.producto_id}` }))} />
          </>)}

          <div style={titulo}>Cada venta ({f.totales.cantidad})</div>
          <div style={caja}>
            {f.ventas.length === 0 && <div style={{ fontSize: 14, color: "var(--tinta-apagada)" }}>No hubo ventas en este turno.</div>}
            {ventas.map((v: any, i: number) => (
              <div key={v.id} style={{ borderTop: i ? "1px solid var(--linea)" : "none" }}>
                <div onClick={() => v.items.length && setAbierta(abierta === v.id ? null : v.id)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", cursor: v.items.length ? "pointer" : "default" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: v.tipo === "anulacion" ? "#B45309" : "var(--tinta)", textDecoration: v.anulada ? "line-through" : "none" }}>
                      {v.hora} · {v.tipo === "anulacion" ? "Anulación" : METODO[String(v.metodo_pago || "").toLowerCase()] || v.metodo_pago || "Venta"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--tinta-apagada)" }}>
                      {v.anulada ? "Anulada después" : v.tipo === "anulacion" && v.motivo ? v.motivo : v.items.length ? `${v.items.length} ${v.items.length === 1 ? "producto" : "productos"}` : "Sin detalle de productos"}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: v.monto < 0 ? "#B45309" : "var(--tinta)" }}>{$(v.monto)}</div>
                </div>
                {abierta === v.id && v.items.map((it: any, k: number) => (
                  <div key={k} onClick={() => it.producto_id && router.push(`/ficha/producto/${it.producto_id}`)} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 4px 14px", fontSize: 13, color: "var(--tinta-apagada)", cursor: it.producto_id ? "pointer" : "default" }}>
                    <span>{it.cantidad.toLocaleString("es-AR")} × {it.nombre}{it.producto_id ? " ›" : ""}</span><span>{$(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            ))}
            {f.ventas.length > 15 && !todas && <button onClick={() => setTodas(true)} style={{ marginTop: 8, padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Ver las {f.ventas.length} ventas</button>}
          </div>

          {f.turno.empleado && <button onClick={() => router.push(`/ficha/persona/${encodeURIComponent(f.turno.empleado)}`)} style={{ padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Ver la ficha de {f.turno.empleado} →</button>}
        </>)}
      </div>
      <Nav />
    </main>
  );
}
