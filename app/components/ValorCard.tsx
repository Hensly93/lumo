"use client";
// Lo que LumoBi ya sabe de tu negocio: hace visible lo que se junta con el tiempo (historia, costos, caja, aprendizaje, consejos medidos).
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
type Item = { clave: string; titulo: string; hecho: boolean; dato: string; sirve: string; sumar: string | null };
type V = { frase: string; hechos: number; total: number; items: Item[]; aviso: string };

const ARCHIVOS: [string, string][] = [["ventas", "Ventas"], ["productos", "Productos"], ["compras", "Compras"], ["turnos", "Turnos de caja"]];

export default function ValorCard() {
  const [v, setV] = useState<V | null>(null);
  const [bajando, setBajando] = useState("");
  const [errorDesc, setErrorDesc] = useState("");
  async function descargar(tipo: string) {
    setBajando(tipo); setErrorDesc("");
    try {
      const r = await fetch(`${API}/api/exportar/${tipo}`, { headers: { Authorization: `Bearer ${localStorage.getItem("lumo_token")}` } });
      if (!r.ok) throw new Error();
      const nombre = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "")?.[1] || `lumobi_${tipo}.csv`;
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { setErrorDesc("No pude armar el archivo. Probá de nuevo."); }
    setBajando("");
  }
  const [abierto, setAbierto] = useState<string | null>(null);
  useEffect(() => {
    fetch(`${API}/api/valor-acumulado`, { headers: { Authorization: `Bearer ${localStorage.getItem("lumo_token")}` } })
      .then(r => (r.ok ? r.json() : null)).then(d => d && d.items && setV(d)).catch(() => {});
  }, []);
  if (!v) return null;
  return (
    <div style={{ margin: "0 0 12px", padding: 16, borderRadius: 14, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>Lo que LumoBi ya sabe de tu negocio</div>
      <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.5, marginTop: 4 }}>{v.frase}</div>
      <div style={{ display: "flex", gap: 4, margin: "10px 0 4px" }}>
        {v.items.map(i => <div key={i.clave} style={{ flex: 1, height: 6, borderRadius: 3, background: i.hecho ? "var(--azul)" : "var(--linea)" }} />)}
      </div>
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginBottom: 6 }}>{v.hechos} de {v.total} cosas que ya aprendió</div>
      {v.items.map(i => (
        <div key={i.clave} onClick={() => setAbierto(abierto === i.clave ? null : i.clave)} style={{ padding: "10px 0", borderTop: "1px solid var(--linea)", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: i.hecho ? "var(--tinta)" : "var(--tinta-apagada)" }}>{i.titulo}</div>
            <span style={{ color: "var(--tinta-apagada)", fontSize: 14 }}>{abierto === i.clave ? "–" : "+"}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--tinta-apagada)", marginTop: 2, lineHeight: 1.4 }}>{i.dato}</div>
          {abierto === i.clave && (
            <div style={{ fontSize: 13, color: "var(--tinta)", marginTop: 6, lineHeight: 1.5 }}>
              {i.sirve}
              {i.sumar && <div style={{ marginTop: 4, fontWeight: 600 }}>Para sumar: {i.sumar}</div>}
            </div>
          )}
        </div>
      ))}
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--linea)", lineHeight: 1.5 }}>{v.aviso}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {ARCHIVOS.map(([t, n]) => (
          <button key={t} disabled={!!bajando} onClick={() => descargar(t)} style={{ fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 16, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)", cursor: "pointer" }}>{bajando === t ? "Armando…" : n}</button>
        ))}
      </div>
      {errorDesc && <div style={{ fontSize: 12, color: "var(--critico)", marginTop: 6 }}>{errorDesc}</div>}
    </div>
  );
}
