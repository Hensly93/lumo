"use client";
// ¿Funcionó el cambio de precio? Compara 2 semanas antes y 2 después, contra el resto del catálogo.
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("es-AR");

type Cambio = { id: number; producto: string; desde: string; de: number; a: number; unidades_antes: number; unidades_despues: number; resultado: "mejoro" | "empeoro" | "sin_efecto_claro" | "pocos_datos"; mensual?: number; unidades_pct?: number | null; sobre?: string; motivo?: string };
type D = { cambios: Cambio[]; resumen: { medidos: number; mejoraron: number; empeoraron: number; mensual: number }; aviso: string };

export default function EfectoCambios() {
  const [d, setD] = useState<D | null>(null);
  useEffect(() => {
    fetch(`${API}/api/efectos`, { headers: { Authorization: `Bearer ${localStorage.getItem("lumo_token")}` } })
      .then(r => (r.ok ? r.json() : null)).then(x => x && Array.isArray(x.cambios) && setD(x)).catch(() => {});
  }, []);
  if (!d || d.cambios.length === 0) return null;
  const color = (r: Cambio["resultado"]) => (r === "mejoro" ? "var(--ok, #16A34A)" : r === "empeoro" ? "var(--critico, #DC2626)" : "var(--tinta-apagada)");
  return (
    <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 18, margin: "16px 0" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--tinta)" }}>¿Funcionaron tus cambios de precio?</div>
      {d.cambios.map(c => (
        <div key={c.id} style={{ padding: "10px 0", borderTop: "1px solid var(--linea)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>{c.producto}: de {fmt(c.de)} a {fmt(c.a)}</div>
          {c.resultado === "pocos_datos" ? (
            <div style={{ fontSize: 13, color: "var(--tinta-apagada)", marginTop: 2 }}>{c.motivo}</div>
          ) : (
            <div style={{ fontSize: 13, marginTop: 2, color: color(c.resultado), fontWeight: 600, lineHeight: 1.45 }}>
              {c.resultado === "mejoro" ? `Te dejó ${fmt(c.mensual ?? 0)} más por mes` : c.resultado === "empeoro" ? `Te dejó ${fmt(c.mensual ?? 0)} menos por mes` : "No se nota un efecto claro"}
              <span style={{ fontWeight: 400, color: "var(--tinta-apagada)" }}> ({c.sobre === "ganancia" ? "ganancia" : "ventas"}). Se vendieron {c.unidades_despues} unidades en las 2 semanas de después, contra {c.unidades_antes} antes{c.unidades_pct != null ? `; ${c.unidades_pct >= 0 ? "+" : ""}${c.unidades_pct}% frente a lo que vendió el resto` : ""}.</span>
            </div>
          )}
        </div>
      ))}
      <div style={{ fontSize: 11, color: "var(--tinta-apagada)", marginTop: 8, lineHeight: 1.5 }}>{d.aviso}</div>
    </div>
  );
}
