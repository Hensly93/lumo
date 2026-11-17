"use client";
// GrillaRapida — botones grandes con los productos que el dueño marcó en el catálogo (acceso rápido).
// Es para lo que se vende sin código de barras: pan, facturas, fiambre, verdura, productos sueltos.
// Un toque suma 1; si se vende por kilo o litro, pide cuánto con un teclado grande.
import { useEffect, useState } from "react";

const C = { text: "#0A1628", muted: "#6B8099", cardBorder: "#E8EDF5", primary: "#007AFF", red: "#FF3B30" };
const FUENTE = "var(--font-instrument), sans-serif";

export type Rapido = { id: number; nombre: string; precio_venta: number | string | null; unidad?: string | null };

const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

// kg, kilo, litro...: se vende en cantidades con decimales, no de a una
export function esFraccionable(unidad: string | null | undefined): boolean {
  const u = String(unidad || "").trim().toLowerCase();
  return /^(kg|kgs|kilo|kilos|kilogramo|kilogramos|lt|lts|l|litro|litros)$/.test(u);
}
export function esLitro(unidad: string | null | undefined): boolean {
  return /^(lt|lts|l|litro|litros)$/i.test(String(unidad || "").trim());
}
function nombreUnidad(unidad: string | null | undefined): string {
  return /^(lt|lts|l|litro|litros)$/i.test(String(unidad || "").trim()) ? "litros" : "kilos";
}

function CantidadModal({ p, onCerrar, onConfirmar }: {
  p: Rapido; onCerrar: () => void; onConfirmar: (cantidad: number) => void;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const precio = Number(p.precio_venta) || 0;
  const n = Number(texto.replace(",", "."));
  const valido = Number.isFinite(n) && n > 0 && n <= 999;
  const u = nombreUnidad(p.unidad);

  useEffect(() => {
    const t = setTimeout(() => document.getElementById("grilla-cantidad")?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  function aceptar() {
    if (!valido) { setError(`Escribí cuántos ${u} (por ejemplo 0,5).`); return; }
    onConfirmar(Math.round(n * 1000) / 1000);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.6)", zIndex: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div role="dialog" aria-modal="true" aria-label={`Cantidad de ${p.nombre}`} style={{ background: "#FFFFFF", borderRadius: 20, padding: 22, width: "100%", maxWidth: 380, fontFamily: FUENTE }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>{p.nombre}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>{money(precio)} el {u === "litros" ? "litro" : "kilo"}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>¿Cuántos {u}?</div>
        <input
          id="grilla-cantidad" inputMode="decimal" value={texto} placeholder="0,5" autoComplete="off"
          onChange={(e) => { setTexto(e.target.value.replace(/[^\d.,]/g, "")); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aceptar(); } if (e.key === "Escape") onCerrar(); }}
          style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 14, border: `2px solid ${C.cardBorder}`, fontSize: 24, fontWeight: 700, fontFamily: FUENTE, color: C.text, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[["¼", "0,25"], ["½", "0,5"], ["1", "1"], ["2", "2"]].map(([lbl, val]) => (
            <button key={lbl} type="button" onClick={() => { setTexto(val); setError(""); }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `2px solid ${C.cardBorder}`, background: "#FFFFFF", color: C.text, fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: FUENTE }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 15, color: C.text, minHeight: 22 }}>
          {valido ? <>Son <b>{money(precio * n)}</b></> : <span style={{ color: C.muted }}>Escribí la cantidad para ver el total</span>}
        </div>
        {error && <div role="alert" style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: C.red }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onCerrar}
            style={{ flex: 1, padding: 14, borderRadius: 14, border: `2px solid ${C.cardBorder}`, background: "transparent", color: C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE }}>
            Cancelar
          </button>
          <button type="button" onClick={aceptar}
            style={{ flex: 2, padding: 14, borderRadius: 14, border: "none", background: C.primary, color: "#FFFFFF", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE }}>
            Sumar a la venta
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GrillaRapida({ rapidos, onAgregar }: {
  rapidos: Rapido[]; onAgregar: (productoId: number, cantidad: number) => Promise<void> | void;
}) {
  const [elegido, setElegido] = useState<Rapido | null>(null);
  if (!rapidos.length) return null;

  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 10 }}>Acceso rápido</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 8 }}>
        {rapidos.map((p) => {
          const frac = esFraccionable(p.unidad);
          return (
            <button key={p.id} type="button" aria-label={`Agregar ${p.nombre}`}
              onClick={() => { if (frac) setElegido(p); else void onAgregar(p.id, 1); }}
              style={{ minHeight: 76, padding: "8px 6px", borderRadius: 14, border: `2px solid ${C.cardBorder}`, background: "#F7F9FC", cursor: "pointer", fontFamily: FUENTE,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.15, textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.nombre}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{money(Number(p.precio_venta) || 0)}{frac ? (nombreUnidad(p.unidad) === "litros" ? " / litro" : " / kg") : ""}</span>
            </button>
          );
        })}
      </div>
      {elegido && (
        <CantidadModal p={elegido} onCerrar={() => setElegido(null)}
          onConfirmar={(c) => { const id = elegido.id; setElegido(null); void onAgregar(id, c); }} />
      )}
    </div>
  );
}
