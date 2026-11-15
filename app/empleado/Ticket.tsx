"use client";
// Ticket para el cliente: imprimirlo (impresora de tickets o común) o mandarlo por WhatsApp.
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

function html(tk: Tk) {
  const filas = tk.items.map((i) => i.tipo_linea === "descuento"
    ? `<tr><td colspan="2">${esc(i.nombre)}</td><td class="d">-${$(Math.abs(i.subtotal))}</td></tr>`
    : `<tr><td colspan="3">${esc(i.nombre)}</td></tr><tr><td>${cant(i.cantidad)} x ${$(i.precio)}</td><td></td><td class="d">${$(i.subtotal)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${tk.numero}</title><style>
    @page { size: 58mm auto; margin: 2mm; }
    body { font-family: monospace; font-size: 12px; width: 54mm; margin: 0 auto; color: #000; }
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
    <script>window.onload = function () { window.print(); setTimeout(function () { window.close(); }, 500); };</script>
  </body></html>`;
}

export default function BotonesTicket({ fetchT, API, transaccionId }: { fetchT: FetchT; API: string; transaccionId: number }) {
  const imprimir = async () => {
    const w = window.open("", "_blank", "width=320,height=600"); // se abre en el click para que el navegador no la bloquee
    const tk = await traer(fetchT, API, transaccionId);
    if (!w) return;
    if (!tk) { w.close(); alert("No se pudo armar el ticket. Probá de nuevo."); return; }
    w.document.open(); w.document.write(html(tk)); w.document.close();
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
