"use client";
// Estado de una pantalla que carga datos: cargando / error con "Probar de nuevo" / vacío.
// Misma cara en toda la app, para que una pantalla que falla nunca se vea como una pantalla vacía.
const caja: React.CSSProperties = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 16, margin: "0 0 12px" };

export default function Estado({ cargando, error, vacio, onReintentar }: {
  cargando?: boolean; error?: string | null; vacio?: string | null; onReintentar?: () => void;
}) {
  if (cargando) return <div style={{ ...caja, fontSize: 13, color: "var(--tinta-apagada)" }}>Cargando…</div>;
  if (error) {
    return (
      <div style={caja}>
        <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.5 }}>{error}</div>
        <button onClick={onReintentar ?? (() => window.location.reload())}
          style={{ marginTop: 10, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8, border: "none", background: "var(--tinta)", color: "var(--blanco)", cursor: "pointer" }}>
          Probar de nuevo
        </button>
      </div>
    );
  }
  if (vacio) return <div style={{ ...caja, fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.6 }}>{vacio}</div>;
  return null;
}
