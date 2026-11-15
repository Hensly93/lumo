"use client";
// Qué tan bien acierta LumoBi en tu negocio: predicciones, avisos y consejos medidos con datos reales (Palantir: la precisión se muestra).
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
type P = {
  prediccion: { medido: boolean; frase: string; acertados?: number; dias?: number };
  avisos: { respondidos: number; frase: string };
  consejos: { medidos: number; frase: string };
  ajustes: string[]; hay_algo: boolean;
};

export default function PrecisionCard() {
  const [p, setP] = useState<P | null>(null);
  useEffect(() => {
    fetch(`${API}/api/precision`, { headers: { Authorization: `Bearer ${localStorage.getItem("lumo_token")}` } })
      .then(r => (r.ok ? r.json() : null)).then(d => d && d.prediccion && setP(d)).catch(() => {});
  }, []);
  if (!p) return null;
  const fila = (t: string, frase: string, ok: boolean) => (
    <div style={{ padding: "8px 0", borderTop: "1px solid var(--linea)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tinta-apagada)" }}>{t}</div>
      <div style={{ fontSize: 14, color: ok ? "var(--tinta)" : "var(--tinta-apagada)", lineHeight: 1.5, marginTop: 2 }}>{frase}</div>
    </div>
  );
  return (
    <div style={{ margin: "0 0 16px", padding: 16, borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)", marginBottom: 4 }}>Qué tan bien acierta LumoBi en tu negocio</div>
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginBottom: 6, lineHeight: 1.5 }}>Se mide solo, con tus ventas y con lo que le respondés. No es un número de otro negocio.</div>
      {fila("Predicciones", p.prediccion.frase, p.prediccion.medido)}
      {fila("Avisos", p.avisos.frase, p.avisos.respondidos >= 3)}
      {fila("Consejos que probaste", p.consejos.frase, p.consejos.medidos > 0)}
      {p.ajustes.length > 0 && (
        <div style={{ padding: "8px 0", borderTop: "1px solid var(--linea)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tinta-apagada)" }}>Lo que LumoBi se ajustó solo</div>
          {p.ajustes.map((a, i) => <div key={i} style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.5, marginTop: 2 }}>· {a}</div>)}
        </div>
      )}
    </div>
  );
}
