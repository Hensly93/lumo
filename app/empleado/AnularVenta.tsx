"use client";
// Anular o devolver una venta del turno. Elegís la venta, decís por qué (opcional) y listo:
// la plata sale de la caja esperada y el stock vuelve. Si es grande o se repite, pide autorización del dueño.
import { useEffect, useState } from "react";

type FetchT = (url: string, opts?: RequestInit) => Promise<Response>;
type Venta = { id: number; monto: number; metodo_pago: string; hora: string; items: string | null; anulada: boolean };
type Aut = { requiere: (d: any, reintentar: (autorizacionId: number) => unknown) => boolean };

const C = { primary: "#007AFF", text: "#0A1628", muted: "#6B8099", border: "#E8EDF5", red: "#FF3B30", green: "#00C48C" };
const $ = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const MEDIO: Record<string, string> = { efectivo: "Efectivo", debito: "Débito", credito: "Crédito", transferencia: "Transferencia", mp: "Mercado Pago", qr: "QR" };
// Los códigos son los del backend (anular_venta.js): lista fija para poder comparar entre personas
const MOTIVOS: { codigo: string; texto: string }[] = [
  { codigo: "error_carga", texto: "Me equivoqué al cobrar" },
  { codigo: "arrepentimiento", texto: "El cliente se arrepintió" },
  { codigo: "devolucion", texto: "Devolución de un producto" },
  { codigo: "cambio", texto: "Cambio de producto" },
  { codigo: "otro", texto: "Otro" },
];

export default function AnularVenta({ fetchT, API, aut, onClose }: { fetchT: FetchT; API: string; aut: Aut; onClose: () => void }) {
  const [ventas, setVentas] = useState<Venta[] | null>(null);
  const [elegida, setElegida] = useState<Venta | null>(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState<string>("");
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    try {
      const r = await fetchT(`${API}/api/scanner/ventas-turno`);
      const d = await r.json();
      setVentas(Array.isArray(d.ventas) ? d.ventas : []);
    } catch { setError("No hay internet o se cortó. Probá de nuevo."); setVentas([]); }
  }
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function anular(v: Venta, autId?: number) {
    setEnviando(true); setError("");
    try {
      const r = await fetchT(`${API}/api/scanner/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(autId ? { "x-autorizacion": String(autId) } : {}) },
        body: JSON.stringify({ transaccion_id: v.id, motivo }),
      });
      const d = await r.json().catch(() => null);
      if (r.status === 403 && aut.requiere(d, (id) => anular(v, id))) { setEnviando(false); return; }
      if (!r.ok || !d || !d.ok) { setError((d && d.error) || "No se pudo anular. Probá de nuevo."); setEnviando(false); return; }
      setHecho(v.metodo_pago === "efectivo"
        ? `Venta anulada. Devolvé ${$(v.monto)} en efectivo al cliente.`
        : `Venta anulada. Ojo: ${$(v.monto)} se cobraron con ${MEDIO[v.metodo_pago] || v.metodo_pago}; la devolución de esa plata hacela desde ahí.`);
      setElegida(null); setMotivo("");
      await cargar();
    } catch { setError("No hay internet o se cortó. Probá de nuevo."); }
    setEnviando(false);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Anular una venta</div>
        <div style={{ fontSize: 14, color: C.muted, margin: "4px 0 14px", lineHeight: 1.5 }}>
          Elegí la venta. La plata sale de lo que tiene que haber en la caja y los productos vuelven al stock.
        </div>
        {hecho && <div style={{ padding: 12, borderRadius: 10, background: "rgba(0,196,140,0.1)", color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{hecho}</div>}
        {error && <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,59,48,0.08)", color: C.red, fontSize: 14, marginBottom: 12 }}>{error}</div>}

        {ventas === null ? <div style={{ color: C.muted }}>Cargando…</div>
          : ventas.length === 0 ? <div style={{ color: C.muted, fontSize: 14 }}>Todavía no hay ventas en este turno.</div>
          : ventas.map((v) => (
            <div key={v.id} style={{ padding: "12px 0", borderTop: `1px solid ${C.border}`, opacity: v.anulada ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{$(v.monto)} <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>· {v.hora} · {MEDIO[v.metodo_pago] || v.metodo_pago}</span></div>
                  <div style={{ fontSize: 13, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.items || "Sin detalle"}</div>
                </div>
                {v.anulada ? <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Anulada</span>
                  : <button onClick={() => { setElegida(v); setHecho(""); setError(""); }} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.red}`, background: "#fff", color: C.red, fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>Anular</button>}
              </div>
              {elegida?.id === v.id && (
                <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#F5F7FA" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>¿Por qué se anula?</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {MOTIVOS.map((m) => (
                      <button key={m.codigo} onClick={() => setMotivo(m.codigo)} style={{ padding: "6px 10px", borderRadius: 16, border: `1px solid ${motivo === m.codigo ? C.primary : C.border}`, background: motivo === m.codigo ? "rgba(0,122,255,0.08)" : "#fff", color: C.text, fontSize: 13, cursor: "pointer" }}>{m.texto}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={enviando || !motivo} onClick={() => anular(v)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: C.red, color: "#fff", fontWeight: 800, fontSize: 15, cursor: motivo ? "pointer" : "default", opacity: motivo ? 1 : 0.45 }}>
                      {enviando ? "Anulando…" : motivo ? `Sí, anular ${$(v.monto)}` : "Elegí por qué"}
                    </button>
                    <button onClick={() => setElegida(null)} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#fff", color: C.text, fontSize: 15, cursor: "pointer" }}>No</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        <button onClick={onClose} style={{ width: "100%", marginTop: 14, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, background: "#fff", color: C.text, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Volver a la caja</button>
      </div>
    </div>
  );
}
