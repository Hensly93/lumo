"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";
const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

type Hallazgo = {
  id: string; titulo: string; descripcion: string; duele: string; recomendacion: string;
  impacto_pesos: number; advertencia?: string; accion: { texto: string; href: string };
};
type Datos = {
  hay_datos: boolean; poca_data?: boolean; plata_en_juego?: number; hallazgos?: Hallazgo[];
  lectura?: { ventas: number; dias: number; total: number; ticket: number; pct_efectivo: number | null;
    mejor_dia: { nombre: string; promedio: number } | null; hora_pico: number | null } | null;
  mercado_pago?: { cobros: number; cobrado: number; comision: number; pct: number } | null;
};

// Número que sube hasta su valor: el ojo lo sigue y se lee como "calculado", no como un cartel.
function useContar(meta: number, activo: boolean, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!activo) return;
    const quieto = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (quieto || meta <= 0) { setV(meta); return; }
    let raf = 0; const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(meta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [meta, activo, ms]);
  return v;
}

const etiqueta: React.CSSProperties = {
  fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted, #64748B)", fontFamily: FUENTE,
};
const tarjeta: React.CSSProperties = {
  border: "1px solid var(--border, #E0E7F1)", borderRadius: 14, padding: "14px 16px", background: "var(--card, #fff)",
};
const nota: React.CSSProperties = { margin: 0, fontSize: 13, color: "var(--muted, #64748B)", lineHeight: 1.5, fontFamily: FUENTE };

export default function Revelacion({ token, onSeguir, textoSeguir = "Seguir", esperar = false }: { token: string; onSeguir?: () => void; textoSeguir?: string; esperar?: boolean }) {
  const [d, setD] = useState<Datos | null>(null);
  const [fallo, setFallo] = useState(false);
  const [paso, setPaso] = useState(0); // 0 leyendo · 1 hechos · 2 cifra · 3 hallazgos

  useEffect(() => {
    let vivo = true; let intentos = 0; let t: ReturnType<typeof setTimeout>;
    const pedir = () => {
      fetch(`${API}/api/negocio/revelacion`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((j: Datos) => {
          if (!vivo) return;
          // Recién conectado Mercado Pago, la importación tarda: reintentamos hasta ~1 minuto.
          if (esperar && !j.hay_datos && ++intentos < 15) { t = setTimeout(pedir, 4000); return; }
          setD(j);
        })
        .catch(() => { if (vivo) setFallo(true); });
    };
    pedir();
    return () => { vivo = false; clearTimeout(t); };
  }, [token, esperar]);

  useEffect(() => {
    if (!d) return;
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (quieto) { setPaso(3); return; }
    const t = [setTimeout(() => setPaso(1), 150), setTimeout(() => setPaso(2), 1300), setTimeout(() => setPaso(3), 3200)];
    return () => t.forEach(clearTimeout);
  }, [d]);

  const plata = d?.plata_en_juego ?? 0;
  const cifra = useContar(plata, paso >= 2);
  const lec = d?.lectura;
  const aparece = (min: number): React.CSSProperties => ({
    opacity: paso >= min ? 1 : 0, transform: paso >= min ? "none" : "translateY(8px)", transition: "opacity .5s ease, transform .5s ease",
  });

  if (fallo) return <p style={nota}>Tus ventas ya están cargadas. No pudimos armar la lectura ahora; la ves en Inicio en unos minutos.</p>;
  if (!d) return <div style={{ ...tarjeta }}><div style={{ fontSize: 15, fontWeight: 700, fontFamily: FUENTE, color: "var(--text, #0A1628)" }}>Mirando tu negocio...</div><p style={{ ...nota, marginTop: 4 }}>Cruzando días, horas y medios de pago. Si recién conectaste Mercado Pago, puede tardar un poco.</p></div>;
  if (!d.hay_datos) return <p style={nota}>Todavía no hay ventas para leer. Cargá un archivo o conectá Mercado Pago y te mostramos qué encontramos.</p>;

  const hall = d.hallazgos ?? [];
  const hechos: [string, string][] = [];
  if (lec?.mejor_dia) hechos.push(["Tu mejor día", `${lec.mejor_dia.nombre} · ${pesos(lec.mejor_dia.promedio)}`]);
  if (lec?.hora_pico != null) hechos.push(["Tu hora fuerte", `${lec.hora_pico} a ${lec.hora_pico + 1} h`]);
  if (lec?.pct_efectivo != null) hechos.push(["En efectivo", `${lec.pct_efectivo}% de lo que cobrás`]);
  if (lec) hechos.push(["Gasto por cliente", pesos(lec.ticket)]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: FUENTE }}>
      {lec && (
        <div style={{ ...tarjeta, ...aparece(1) }}>
          <div style={etiqueta}>Esto es lo que leímos</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text, #0A1628)", marginTop: 6, lineHeight: 1.25 }}>
            {lec.ventas.toLocaleString("es-AR")} ventas en {lec.dias} {lec.dias === 1 ? "día" : "días"}
          </div>
          <div style={{ ...nota, marginTop: 2 }}>Entraron {pesos(lec.total)} en total.</div>
          {hechos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px", marginTop: 12 }}>
              {hechos.map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "var(--muted, #64748B)" }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text, #0A1628)", marginTop: 1 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {d.mercado_pago && (
        <div style={{ ...tarjeta, ...aparece(1) }}>
          <div style={etiqueta}>Lo que cobraste con Mercado Pago (30 días)</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text, #0A1628)", marginTop: 6 }}>
            {pesos(d.mercado_pago.cobrado)} en {d.mercado_pago.cobros} cobros
          </div>
          <div style={{ ...nota, marginTop: 2 }}>
            Te descontaron {pesos(d.mercado_pago.comision)} de comisión ({String(d.mercado_pago.pct).replace(".", ",")}%). Es plata real que se va en cada cobro.
          </div>
        </div>
      )}

      {hall.length > 0 ? (
        <>
          <div style={{ ...tarjeta, ...aparece(2), borderColor: "#0A1628", background: "#0A1628" }}>
            <div style={{ ...etiqueta, color: "#94A3B8" }}>Plata en juego por mes</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", marginTop: 4, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
              {pesos(cifra)}
            </div>
            <p style={{ ...nota, color: "#CBD5E1", marginTop: 4 }}>
              Es una estimación con tus propias ventas, no plata ya recuperada. Sale de {hall.length === 1 ? "el hallazgo" : `los ${hall.length} hallazgos`} de abajo.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, ...aparece(3) }}>
            {hall.map((h, i) => (
              <div key={h.id} style={tarjeta}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <span style={etiqueta}>Hallazgo {i + 1}</span>
                  {h.impacto_pesos > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: "#B45309" }}>{pesos(h.impacto_pesos)}/mes</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #0A1628)", lineHeight: 1.35, marginTop: 4 }}>{h.titulo}</div>
                <p style={{ ...nota, marginTop: 4 }}>{h.descripcion}</p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text, #0A1628)", lineHeight: 1.5 }}><b>Qué hacer:</b> {h.recomendacion}</p>
                {h.advertencia && <p style={{ ...nota, fontSize: 11, marginTop: 6 }}>{h.advertencia}</p>}
                <Link href={h.accion.href} style={{ display: "inline-block", marginTop: 10, padding: "9px 14px", borderRadius: 10, background: "#007AFF", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  {h.accion.texto}
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ ...tarjeta, ...aparece(2) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #0A1628)" }}>
            {d.poca_data ? "Todavía es muy pronto para hallar fugas" : "No encontramos fugas claras en estas ventas"}
          </div>
          <p style={{ ...nota, marginTop: 4 }}>
            {d.poca_data
              ? "Con pocos días no podemos decirte dónde se pierde plata sin inventar. Con 2 semanas empezamos a comparar días y horas."
              : "Eso es buena señal. Para ver más: cargá las facturas de tus proveedores (te avisamos qué precios subir) y cobrá desde la caja de LumoBi (vemos qué producto se queda sin stock)."}
          </p>
        </div>
      )}

      {onSeguir && (
        <button onClick={onSeguir} style={{ width: "100%", padding: 14, border: "1px solid var(--border, #E0E7F1)", borderRadius: 12, background: "transparent", color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE, ...aparece(3) }}>
          {textoSeguir}
        </button>
      )}
    </div>
  );
}
