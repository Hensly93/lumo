"use client";
// Ticket para el cliente: imprimirlo (impresora de tickets o común) o mandarlo por WhatsApp.
import { useState } from "react";
// Aparece después de cada venta. Dice "Comprobante no válido como factura": LumoBi no hace facturación electrónica.
type FetchT = (url: string, opts?: RequestInit) => Promise<Response>;
type Tk = {
  numero: number; fecha: string; negocio: string; sucursal: string | null; direccion: string | null; atendio: string | null;
  items: { nombre: string; cantidad: number; precio: number; subtotal: number; tipo_linea: string }[];
  total: number; pagos: { medio: string; monto: number }[]; leyenda: string; texto: string;
};

const $ = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const cant = (c: number) => (Number.isInteger(c) ? String(c) : c.toLocaleString("es-AR", { maximumFractionDigits: 3 }) + " kg");

async function traer(fetchT: FetchT, API: string, id: number): Promise<Tk | null> {
  try { const r = await fetchT(`${API}/api/scanner/ticket/${id}`); return r.ok ? await r.json() : null; } catch { return null; }
}

// Configuración de la impresora de ESTA compu (cada caja tiene la suya): ancho del papel e imprimir solo
export type ConfImpresora = { auto: boolean; ancho: 58 | 80 };
const CLAVE = "lumo_impresora";
export function leerImpresora(): ConfImpresora {
  try { const c = JSON.parse(localStorage.getItem(CLAVE) || "{}"); return { auto: !!c.auto, ancho: c.ancho === 80 ? 80 : 58 }; } catch { return { auto: false, ancho: 58 }; }
}
export function guardarImpresora(c: ConfImpresora) { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch { /* sin almacenamiento */ } }

function html(tk: Tk, ancho: 58 | 80 = 58) {
  const filas = tk.items.map((i) => i.tipo_linea === "descuento"
    ? `<tr><td colspan="2">${esc(i.nombre)}</td><td class="d">-${$(Math.abs(i.subtotal))}</td></tr>`
    : `<tr><td colspan="3">${esc(i.nombre)}</td></tr><tr><td>${cant(i.cantidad)} x ${$(i.precio)}</td><td></td><td class="d">${$(i.subtotal)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${tk.numero}</title><style>
    @page { size: ${ancho}mm auto; margin: 2mm; }
    body { font-family: monospace; font-size: ${ancho === 80 ? 13 : 12}px; width: ${ancho - 4}mm; margin: 0 auto; color: #000; }
    h1 { font-size: 15px; text-align: center; margin: 0 0 2px; } .c { text-align: center; } .d { text-align: right; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; } td { padding: 1px 0; vertical-align: top; }
    hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; } .t { font-size: 15px; font-weight: bold; }
  </style></head><body>
    <h1>${esc(tk.negocio)}</h1>
    ${tk.sucursal ? `<div class="c">${esc(tk.sucursal)}</div>` : ""}${tk.direccion ? `<div class="c">${esc(tk.direccion)}</div>` : ""}
    <div class="c">${esc(tk.fecha)} · N° ${tk.numero}</div>${tk.atendio ? `<div class="c">Te atendió ${esc(tk.atendio)}</div>` : ""}
    <hr><table>${filas}</table><hr>
    <table><tr><td class="t">TOTAL</td><td class="d t">${$(tk.total)}</td></tr>
    ${tk.pagos.map((p) => `<tr><td>${esc(p.medio)}</td><td class="d">${$(p.monto)}</td></tr>`).join("")}</table>
    <hr><div class="c">${esc(tk.leyenda)}</div><div class="c">¡Gracias por tu compra!</div>
  </body></html>`;
}

export async function imprimirTicket(fetchT: FetchT, API: string, id: number): Promise<boolean> {
  const tk = await traer(fetchT, API, id);
  if (!tk) return false;
  const f = document.createElement("iframe");
  f.setAttribute("aria-hidden", "true");
  Object.assign(f.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(f);
  const d = f.contentWindow!.document;
  d.open(); d.write(html(tk, leerImpresora().ancho)); d.close();
  setTimeout(() => {
    try { f.contentWindow!.focus(); f.contentWindow!.print(); } catch { /* sin impresora */ }
    setTimeout(() => f.remove(), 60000);
  }, 300);
  return true;
}

export default function BotonesTicket({ fetchT, API, transaccionId }: { fetchT: FetchT; API: string; transaccionId: number }) {
  const imprimir = async () => {
    if (!(await imprimirTicket(fetchT, API, transaccionId))) alert("No se pudo armar el ticket. Probá de nuevo.");
  };
  const whatsapp = async () => {
    const tel = (window.prompt("Celular del cliente (con código de área, sin 0 ni 15). Dejalo vacío para elegir el contacto en WhatsApp:") || "").replace(/\D/g, "");
    const w = window.open("", "_blank");
    const tk = await traer(fetchT, API, transaccionId);
    if (!w) return;
    if (!tk) { w.close(); alert("No se pudo armar el ticket. Probá de nuevo."); return; }
    w.location.href = `https://wa.me/${tel ? "549" + tel : ""}?text=${encodeURIComponent(tk.texto)}`;
  };
  const b: React.CSSProperties = { flex: 1, padding: "10px 8px", borderRadius: 10, border: "1px solid #E8EDF5", background: "#fff", color: "#0A1628", fontWeight: 700, fontSize: 14, cursor: "pointer" };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <button onClick={imprimir} style={b}>🧾 Imprimir ticket</button>
      <button onClick={whatsapp} style={b}>💬 Ticket por WhatsApp</button>
    </div>
  );
}

// Configuración de la impresora de esta caja
export function ConfigImpresora({ onClose }: { onClose: () => void }) {
  const [c, setC] = useState<ConfImpresora>(leerImpresora());
  const cambiar = (n: ConfImpresora) => { setC(n); guardarImpresora(n); };
  const op = (activo: boolean, texto: string, onClick: () => void) => (
    <button onClick={onClick} style={{ flex: 1, padding: 12, borderRadius: 10, border: `2px solid ${activo ? "#007AFF" : "#E8EDF5"}`, background: activo ? "rgba(0,122,255,0.08)" : "#fff", color: "#0A1628", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{texto}</button>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 520, borderRadius: "18px 18px 0 0", padding: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>Impresora de tickets</div>
        <div style={{ fontSize: 14, color: "#6B8099", marginBottom: 14, lineHeight: 1.5 }}>Esto se guarda en esta compu (cada caja tiene su impresora).</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>Ancho del papel</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {op(c.ancho === 58, "58 mm (chico)", () => cambiar({ ...c, ancho: 58 }))}
          {op(c.ancho === 80, "80 mm (grande)", () => cambiar({ ...c, ancho: 80 }))}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>¿Imprimir solo después de cada venta?</div>
        <div style={{ display: "flex", gap: 8 }}>
          {op(c.auto, "Sí, siempre", () => cambiar({ ...c, auto: true }))}
          {op(!c.auto, "No, cuando lo pida", () => cambiar({ ...c, auto: false }))}
        </div>
        <div style={{ fontSize: 13, color: "#6B8099", marginTop: 14, lineHeight: 1.5 }}>
          Para que salga directo sin el cuadro de &quot;Imprimir&quot;: dejá la impresora de tickets como predeterminada en Windows y abrí la caja con el acceso directo de LumoBi (te lo explica el dueño).
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: 14, padding: 14, borderRadius: 12, border: "none", background: "#007AFF", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Listo</button>
      </div>
    </div>
  );
}
