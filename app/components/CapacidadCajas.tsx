"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Sucursal = { id: number; nombre: string; capacidad_caja_hora: number | null };
type Respuesta = { rubro: string; referencia: number; sucursales: Sucursal[] };

function limpiar(n: string) {
  return (n || "").replace(/["']/g, "").trim();
}

// Capacidad de una caja (clientes por hora) por local.
// NICOLE la usa para recomendar cuándo abrir otra caja o cuándo alcanza con una.
export default function CapacidadCajas() {
  const [data, setData] = useState<Respuesta | null>(null);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [estado, setEstado] = useState<Record<number, string>>({});

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/multilocal/capacidad`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then((d: Respuesta | null) => {
        if (!d) return;
        setData(d);
        setValores(Object.fromEntries(d.sucursales.map(s => [s.id, s.capacidad_caja_hora != null ? String(s.capacidad_caja_hora) : ""])));
      })
      .catch(() => {});
  }, []);

  async function guardar(id: number) {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    const v = (valores[id] ?? "").trim();
    setEstado(e => ({ ...e, [id]: "Guardando…" }));
    try {
      const r = await fetch(`${API}/api/multilocal/sucursal/${id}/capacidad`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ capacidad_caja_hora: v === "" ? null : Number(v) }),
      });
      const j = await r.json().catch(() => ({}));
      setEstado(e => ({ ...e, [id]: r.ok ? (v === "" ? "Usando la referencia" : "Guardado") : (j.error || "No se pudo guardar") }));
    } catch {
      setEstado(e => ({ ...e, [id]: "Sin conexión" }));
    }
  }

  if (!data || !data.sucursales.length) return null;

  return (
    <div style={{ margin: "8px 12px", background: "var(--card2)", borderRadius: 14, padding: "14px", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Capacidad de caja</div>
      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>
        ¿Cuántos clientes por hora puede atender una persona en caja? NICOLE lo usa para avisarte cuándo conviene abrir otra caja.
        Si lo dejás vacío, usa una referencia de {data.rubro || "tu rubro"} ({data.referencia} por hora) y la ajusta con tus datos.
      </div>
      {data.sucursales.map(s => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, fontSize: 13, color: "var(--text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {limpiar(s.nombre)}
            {estado[s.id] && <div style={{ fontSize: 10, color: "var(--muted)" }}>{estado[s.id]}</div>}
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            placeholder={String(data.referencia)}
            value={valores[s.id] ?? ""}
            onChange={e => setValores(v => ({ ...v, [s.id]: e.target.value }))}
            style={{ width: 72, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 14, background: "white", color: "#0A1628" }}
          />
          <button
            onClick={() => guardar(s.id)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: "#007AFF", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Guardar
          </button>
        </div>
      ))}
    </div>
  );
}
