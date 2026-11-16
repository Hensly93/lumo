"use client";
// Botón "poner esto en mi catálogo" con deshacer — lo usan las promos y los precios que se comió el costo.
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function BotonAplicar({ p }: { p: { aplicar?: { boton: string } & Record<string, unknown> } }) {
  const [estado, setEstado] = useState<"" | "haciendo" | "hecho" | "deshecho">("");
  const [res, setRes] = useState<{ texto: string; tipo: string; hechos: unknown[] } | null>(null);
  const [error, setError] = useState("");
  const llamar = (ruta: string, body: unknown) => fetch(`${API}/api/hallazgos/${ruta}`, {
    method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("lumo_token")}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "No pude hacerlo."); return d; });
  function aplicar() {
    setEstado("haciendo"); setError("");
    llamar("aplicar", { aplicar: p.aplicar }).then(d => { setRes(d); setEstado("hecho"); }).catch(e => { setError(e.message); setEstado(""); });
  }
  function deshacer() {
    if (!res) return;
    setEstado("haciendo");
    llamar("deshacer", { tipo: res.tipo, hechos: res.hechos }).then(d => { setRes({ ...res, texto: d.texto }); setEstado("deshecho"); }).catch(e => { setError(e.message); setEstado("hecho"); });
  }
  const boton = { fontSize: 13, fontWeight: 700, padding: "9px 16px", borderRadius: 18, cursor: "pointer" } as const;
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--linea)" }}>
      {estado === "" || (estado === "haciendo" && !res) ? (
        <button disabled={estado === "haciendo"} onClick={aplicar} style={{ ...boton, border: "1px solid var(--azul)", background: "var(--azul)", color: "var(--blanco)" }}>{estado === "haciendo" ? "Haciéndolo…" : p.aplicar!.boton}</button>
      ) : (
        <div style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.5 }}>
          <strong>{res?.texto}</strong>
          {estado === "hecho" && (res?.hechos.length ?? 0) > 0 && <button onClick={deshacer} style={{ ...boton, marginLeft: 10, padding: "4px 12px", border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)" }}>Deshacer</button>}
        </div>
      )}
      {error && <div style={{ fontSize: 12, color: "var(--critico)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
