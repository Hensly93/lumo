"use client";
// Ficha de una persona del equipo: cómo vende, cómo cierra la caja y qué hace en la caja, contra el resto (Palantir)
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "../../../components/ui";
import Nav from "../../../components/Nav";
import { $, titulo, Frases, Datos, Lista } from "../../FichaUI";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function FichaPersona() {
  const { nombre } = useParams<{ nombre: string }>();
  const quien = decodeURIComponent(nombre);
  const router = useRouter();
  const [f, setF] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    fetch(`${API}/api/ficha/empleado/${encodeURIComponent(quien)}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => (d.error ? setError(d.error) : setF(d))).catch(() => setError("No se pudo cargar. Probá de nuevo."));
  }, [quien, router]);
  const a = f?.acciones;
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title={quien} sub="Últimos 30 días" />
      <div style={{ padding: "0 16px" }}>
        {error && <div style={{ color: "var(--tinta-apagada)" }}>{error}</div>}
        {!f && !error && <div style={{ color: "var(--tinta-apagada)" }}>Cargando…</div>}
        {f && (<>
          <Frases frases={f.frases} senales={f.senales} />
          <Datos filas={[
            ["Vendió", $(f.ventas.plata)],
            ["Ventas", String(f.ventas.ventas)],
            ["Gasto por cliente", $(f.ventas.gasto_por_cliente)],
            ["Ventas por hora", f.ventas.por_hora != null ? f.ventas.por_hora.toLocaleString("es-AR") : "—"],
            ["Cierres con faltante", `${f.caja.con_faltante} de ${f.caja.cierres}`],
            ["Faltó en total", $(f.caja.faltante)],
          ]} />
          <div style={titulo}>Lo que hizo en la caja</div>
          <Lista vacio="" items={[
            { izq: "Ventas anuladas", der: `${a.anulaciones.n} · ${$(a.anulaciones.plata)}` },
            { izq: "Descuentos", der: `${a.descuentos.n} · ${$(a.descuentos.plata)}` },
            { izq: "Productos sacados del carrito", der: `${a.sacados_del_carrito.n} · ${$(a.sacados_del_carrito.plata)}` },
            { izq: "Ventas en espera sin cobrar", der: `${a.esperas_sin_cobrar.n} · ${$(a.esperas_sin_cobrar.plata)}` },
            { izq: "Plata sacada de la caja", der: `${a.egresos.n} · ${$(a.egresos.plata)}` },
            { izq: "Precios cambiados", der: String(a.precios_cambiados) },
            { izq: "Conteos de caja sin responder", der: String(f.caja.conteos_sin_responder) },
          ]} />
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5, margin: "4px 2px 12px" }}>
            Esto muestra hechos de la caja, no culpas: una anulación o un descuento pueden tener una buena razón. Usalo para preguntar, no para acusar.
          </div>
          <button onClick={() => router.push("/empleados")} style={{ padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Ver cada turno en Equipo →</button>
        </>)}
      </div>
      <Nav />
    </main>
  );
}
