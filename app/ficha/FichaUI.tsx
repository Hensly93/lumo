"use client";
// Piezas comunes de las fichas (producto y persona)
export const $ = (n: number | null | undefined) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("es-AR"));
export const caja = { padding: 16, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", marginBottom: 12 } as const;
export const titulo = { fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--tinta-apagada)", textTransform: "uppercase" as const, margin: "18px 0 8px" };

export function Frases({ frases, senales }: { frases: string[]; senales?: string[] }) {
  return (
    <div style={caja}>
      {(senales || []).map((s, i) => (
        <div key={"s" + i} style={{ fontSize: 15, fontWeight: 700, color: "#B45309", lineHeight: 1.5, marginBottom: 6 }}>⚠ {s}</div>
      ))}
      {frases.map((f, i) => <div key={i} style={{ fontSize: 15, color: "var(--tinta)", lineHeight: 1.6, marginBottom: 4 }}>{f}</div>)}
    </div>
  );
}

export function Datos({ filas }: { filas: [string, string][] }) {
  return (
    <div style={{ ...caja, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {filas.map(([k, v]) => (
        <div key={k} style={{ background: "var(--papel)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)" }}>{k}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--tinta)" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export function Lista({ items, vacio }: { items: { izq: string; der?: string; sub?: string }[]; vacio: string }) {
  return (
    <div style={caja}>
      {items.length === 0 ? <div style={{ fontSize: 14, color: "var(--tinta-apagada)" }}>{vacio}</div>
        : items.map((x, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: i ? "1px solid var(--linea)" : "none" }}>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--tinta)" }}>{x.izq}</div>{x.sub && <div style={{ fontSize: 12, color: "var(--tinta-apagada)" }}>{x.sub}</div>}</div>
            {x.der && <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", whiteSpace: "nowrap" }}>{x.der}</div>}
          </div>
        ))}
    </div>
  );
}
