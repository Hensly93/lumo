"use client";
// Paneles de cobro de la caja (14/11/2026):
//   · Efectivo con vuelto: "¿con cuánto paga?" y cuánto devolver
//   · Pago mixto: parte en efectivo y el resto con otro medio
//   · Algo sin código: precio a mano ("varios")
//   · Descuento: % o pesos sobre el total, con motivo (si es grande pide autorización)
import { useState } from "react";

type FetchT = (url: string, opts?: RequestInit) => Promise<Response>;
type Aut = { requiere: (d: any, reintentar: (autorizacionId: number) => unknown) => boolean };

const C = { primary: "#007AFF", text: "#0A1628", muted: "#6B8099", border: "#E8EDF5", red: "#FF3B30", green: "#00C48C", bg: "#F5F7FA" };
const $ = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const num = (s: string) => { const n = Number(String(s).replace(/\./g, "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const btn = (fondo: string, extra: React.CSSProperties = {}): React.CSSProperties => ({ padding: "14px 10px", borderRadius: 12, border: "none", background: fondo, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", ...extra });
const input: React.CSSProperties = { width: "100%", padding: "14px 12px", fontSize: 22, fontWeight: 800, borderRadius: 12, border: `2px solid ${C.border}`, color: C.text, boxSizing: "border-box" };

function Hoja({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 12 }}>{titulo}</div>
        {children}
        <button onClick={onClose} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: "#fff", color: C.text, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Volver</button>
      </div>
    </div>
  );
}

// Billetes que tiene sentido ofrecer: el justo y los redondeos para arriba
function billetes(total: number): number[] {
  const out = new Set<number>([total]);
  for (const b of [1000, 2000, 5000, 10000, 20000]) { const r = Math.ceil(total / b) * b; if (r > total) out.add(r); }
  return [...out].sort((a, b) => a - b).slice(0, 5);
}

export function PanelEfectivo({ total, onCobrar, onClose }: { total: number; onCobrar: () => void; onClose: () => void }) {
  const [paga, setPaga] = useState<string>("");
  const p = num(paga);
  const vuelto = p - total;
  return (
    <Hoja titulo={`Cobrar ${$(total)} en efectivo`} onClose={onClose}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>¿Con cuánto paga?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {billetes(total).map((b) => (
          <button key={b} onClick={() => setPaga(String(b))} style={{ padding: "10px 14px", borderRadius: 10, border: `2px solid ${p === b ? C.primary : C.border}`, background: p === b ? "rgba(0,122,255,0.08)" : "#fff", color: C.text, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
            {b === total ? "Justo" : $(b)}
          </button>
        ))}
      </div>
      <input inputMode="numeric" placeholder="Otro monto" value={paga} onChange={(e) => setPaga(e.target.value.replace(/[^\d.,]/g, ""))} style={input} autoFocus
        onKeyDown={(e) => { if (e.key === "Enter" && (p === 0 || vuelto >= 0)) onCobrar(); }} />
      <div style={{ margin: "14px 0", padding: 14, borderRadius: 12, background: vuelto < 0 && p > 0 ? "rgba(255,59,48,0.08)" : C.bg, textAlign: "center" }}>
        {p === 0 ? <span style={{ color: C.muted, fontSize: 15 }}>Si paga justo, tocá Cobrar.</span>
          : vuelto < 0 ? <span style={{ color: C.red, fontSize: 16, fontWeight: 700 }}>Faltan {$(-vuelto)}</span>
          : <><div style={{ fontSize: 14, color: C.muted }}>Vuelto</div><div style={{ fontSize: 34, fontWeight: 800, color: C.text }}>{$(vuelto)}</div></>}
      </div>
      <button disabled={p > 0 && vuelto < 0} onClick={onCobrar} style={btn(C.green, { width: "100%", opacity: p > 0 && vuelto < 0 ? 0.5 : 1 })}>Cobrar {$(total)}</button>
    </Hoja>
  );
}

export function PanelMixto({ total, fetchT, API, onListo, onClose }: { total: number; fetchT: FetchT; API: string; onListo: (msg: string, id?: number) => void; onClose: () => void }) {
  const [ef, setEf] = useState("");
  const [medio, setMedio] = useState("debito");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const e = num(ef);
  const resto = total - e;
  const NOMBRE: Record<string, string> = { debito: "Débito", credito: "Crédito", transferencia: "Transferencia" };
  async function cobrar() {
    setEnviando(true); setError("");
    try {
      const r = await fetchT(`${API}/api/scanner/finalizar-venta`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo_pago: "mixto", monto_efectivo: e, metodo_resto: medio }) });
      const d = await r.json();
      if (!r.ok || d.error) { setError(d.error || "No se pudo cobrar."); setEnviando(false); return; }
      onListo(`Venta registrada: ${$(total)} (${$(e)} en efectivo + ${$(resto)} con ${NOMBRE[medio]})`, d.transaccion_id);
    } catch { setError("No hay internet o se cortó. Probá de nuevo."); }
    setEnviando(false);
  }
  return (
    <Hoja titulo={`Pagar ${$(total)} con dos medios`} onClose={onClose}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>¿Cuánto paga en efectivo?</div>
      <input inputMode="numeric" placeholder="Ej: 5000" value={ef} onChange={(x) => setEf(x.target.value.replace(/[^\d.,]/g, ""))} style={input} autoFocus />
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "14px 0 8px" }}>El resto ({resto > 0 && e > 0 ? $(resto) : "—"}) lo paga con:</div>
      <div style={{ display: "flex", gap: 8 }}>
        {Object.entries(NOMBRE).map(([k, v]) => (
          <button key={k} onClick={() => setMedio(k)} style={{ flex: 1, padding: "12px 6px", borderRadius: 10, border: `2px solid ${medio === k ? C.primary : C.border}`, background: medio === k ? "rgba(0,122,255,0.08)" : "#fff", color: C.text, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{v}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Cobrá la parte con tarjeta en el posnet como siempre. A la caja solo entra la parte en efectivo.</div>
      {error && <div style={{ marginTop: 10, color: C.red, fontSize: 14 }}>{error}</div>}
      <button disabled={enviando || !(e > 0 && resto > 0)} onClick={cobrar} style={btn(C.green, { width: "100%", marginTop: 14, opacity: e > 0 && resto > 0 ? 1 : 0.5 })}>
        {enviando ? "Cobrando…" : e > 0 && resto > 0 ? `Cobrar ${$(e)} + ${$(resto)}` : "Escribí la parte en efectivo"}
      </button>
    </Hoja>
  );
}

export function PanelVarios({ fetchT, API, onListo, onClose }: { fetchT: FetchT; API: string; onListo: () => void; onClose: () => void }) {
  const [precio, setPrecio] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  async function agregar() {
    setError("");
    try {
      const r = await fetchT(`${API}/api/scanner/carrito-varios`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precio: num(precio), descripcion: desc }) });
      const d = await r.json();
      if (!r.ok || d.error) { setError(d.error || "No se pudo agregar."); return; }
      onListo();
    } catch { setError("No hay internet o se cortó. Probá de nuevo."); }
  }
  return (
    <Hoja titulo="Algo sin código" onClose={onClose}>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>Para lo que no tiene código ni está cargado: pan suelto, una fotocopia, algo sin etiqueta.</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Precio</div>
      <input inputMode="numeric" placeholder="Ej: 1500" value={precio} onChange={(e) => setPrecio(e.target.value.replace(/[^\d.,]/g, ""))} style={input} autoFocus
        onKeyDown={(e) => { if (e.key === "Enter" && num(precio) > 0) agregar(); }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "12px 0 6px" }}>¿Qué es? <span style={{ fontWeight: 400, color: C.muted }}>(opcional)</span></div>
      <input placeholder="Ej: pan suelto" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...input, fontSize: 16, fontWeight: 500 }}
        onKeyDown={(e) => { if (e.key === "Enter" && num(precio) > 0) agregar(); }} />
      {error && <div style={{ marginTop: 10, color: C.red, fontSize: 14 }}>{error}</div>}
      <button disabled={!(num(precio) > 0)} onClick={agregar} style={btn(C.primary, { width: "100%", marginTop: 14, opacity: num(precio) > 0 ? 1 : 0.5 })}>Agregar al carrito</button>
    </Hoja>
  );
}

export function PanelDescuento({ total, fetchT, API, aut, onListo, onClose }: { total: number; fetchT: FetchT; API: string; aut: Aut; onListo: () => void; onClose: () => void }) {
  const [modo, setModo] = useState<"pct" | "monto">("pct");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const v = num(valor);
  const monto = modo === "pct" ? total * Math.min(v, 100) / 100 : Math.min(v, total);
  async function aplicar(autId?: number) {
    setError("");
    try {
      const r = await fetchT(`${API}/api/scanner/descuento`, { method: "POST",
        headers: { "Content-Type": "application/json", ...(autId ? { "x-autorizacion": String(autId) } : {}) },
        body: JSON.stringify({ modo, valor: v, motivo }) });
      const d = await r.json().catch(() => null);
      if (r.status === 403 && aut.requiere(d, (id) => aplicar(id))) return;
      if (!r.ok || !d || d.error) { setError((d && d.error) || "No se pudo aplicar."); return; }
      onListo();
    } catch { setError("No hay internet o se cortó. Probá de nuevo."); }
  }
  return (
    <Hoja titulo="Hacer un descuento" onClose={onClose}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {(["pct", "monto"] as const).map((m) => (
          <button key={m} onClick={() => { setModo(m); setValor(""); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${modo === m ? C.primary : C.border}`, background: modo === m ? "rgba(0,122,255,0.08)" : "#fff", color: C.text, fontWeight: 700, cursor: "pointer" }}>
            {m === "pct" ? "Porcentaje (%)" : "Pesos ($)"}
          </button>
        ))}
      </div>
      {modo === "pct" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[5, 10, 15].map((p) => (
            <button key={p} onClick={() => setValor(String(p))} style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${v === p ? C.primary : C.border}`, background: "#fff", color: C.text, fontWeight: 800, cursor: "pointer" }}>{p}%</button>
          ))}
        </div>
      )}
      <input inputMode="numeric" placeholder={modo === "pct" ? "Otro %" : "Cuántos pesos"} value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))} style={input} />
      <input placeholder="Motivo (opcional): cliente de siempre, producto golpeado…" value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ ...input, fontSize: 15, fontWeight: 500, marginTop: 10 }} />
      {v > 0 && <div style={{ margin: "12px 0 0", fontSize: 15, color: C.text }}>Descuento: <strong>{$(monto)}</strong> · Queda a pagar: <strong>{$(total - monto)}</strong></div>}
      <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>El descuento queda registrado. Si es grande, el dueño tiene que autorizarlo.</div>
      {error && <div style={{ marginTop: 10, color: C.red, fontSize: 14 }}>{error}</div>}
      <button disabled={!(v > 0)} onClick={() => aplicar()} style={btn(C.primary, { width: "100%", marginTop: 14, opacity: v > 0 ? 1 : 0.5 })}>Aplicar descuento</button>
    </Hoja>
  );
}
