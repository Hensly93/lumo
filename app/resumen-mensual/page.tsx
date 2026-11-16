"use client";
// Resumen del mes: lo que LumoBi hizo por tu negocio. Separa lo recuperado (medido) de lo detectado (plata en juego).
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import { $, caja, titulo, Lista } from "../ficha/FichaUI";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

function Contenido() {
  const router = useRouter();
  const mes = useSearchParams().get("mes") || "";
  const [r, setR] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setR(null); setError("");
    fetch(`${API}/api/resumen-mensual${mes ? `?mes=${mes}` : ""}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(x => x.json()).then(d => (d.error ? setError(d.error) : setR(d))).catch(() => setError("No se pudo cargar. Probá de nuevo."));
  }, [mes, router]);
  const ir = (m: string) => router.push(`/resumen-mensual?mes=${m}`);
  const flecha = { border: "1px solid var(--linea)", background: "var(--blanco)", borderRadius: 16, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "var(--tinta)", cursor: "pointer" } as const;
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Resumen del mes" sub={r ? `${r.etiqueta}${r.parcial ? " (hasta hoy)" : ""}` : ""} />
      <div style={{ padding: "0 16px" }}>
        {error && <div style={{ color: "var(--tinta-apagada)" }}>{error}</div>}
        {!r && !error && <div style={{ color: "var(--tinta-apagada)" }}>Cargando…</div>}
        {r && (<>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <button style={flecha} onClick={() => ir(r.anterior)}>‹ Mes anterior</button>
            {r.siguiente ? <button style={flecha} onClick={() => ir(r.siguiente)}>Mes siguiente ›</button> : <span />}
          </div>

          <div style={{ ...caja, marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.45 }}>{r.titular}</div>
            {r.ventas.cantidad > 0 && <div style={{ fontSize: 13, color: "var(--tinta-apagada)", marginTop: 6 }}>Vendiste {$(r.ventas.total)} en {r.ventas.cantidad.toLocaleString("es-AR")} ventas.</div>}
          </div>

          <div style={titulo}>Plata que recuperaste (medida)</div>
          {r.recuperado.consejos.length > 0 ? (
            <Lista vacio="" items={r.recuperado.consejos.map((c: any) => ({ izq: c.titulo, sub: c.accion || "Lo resolviste y bajó el problema", der: `${$(c.recuperado)}/mes` }))} />
          ) : (
            <div style={caja}><div style={{ fontSize: 14, color: "var(--tinta-apagada)", lineHeight: 1.5 }}>
              {r.recuperado.total_por_mes > 0 && r.parcial ? `Ya recuperás ${$(r.recuperado.total_por_mes)} por mes con consejos anteriores. ` : ""}
              Cuando pruebes un consejo en Oportunidades, a los 28 días LumoBi mide si el problema bajó y lo cuenta acá.
            </div></div>
          )}

          <div style={titulo}>Lo que LumoBi detectó (plata en juego)</div>
          {r.detecto.length > 0 ? (
            <Lista vacio="" items={r.detecto.map((d: any) => ({ izq: d.texto, ir: d.ver }))} />
          ) : <div style={caja}><div style={{ fontSize: 14, color: "var(--tinta-apagada)" }}>No encontró nada raro en este mes.</div></div>}
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5, marginTop: 6 }}>{r.aviso}</div>

          {r.hizo.length > 0 && (<>
            <div style={titulo}>Lo que hizo por vos</div>
            <div style={caja}>{r.hizo.map((h: string, i: number) => <div key={i} style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.5, padding: "3px 0" }}>· {h}</div>)}</div>
          </>)}
        </>)}
      </div>
      <Nav />
    </main>
  );
}

export default function ResumenMensual() { return <Suspense fallback={null}><Contenido /></Suspense>; }
