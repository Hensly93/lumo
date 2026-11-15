"use client";
import { useState } from "react";
// PrimerosDias — lo que LumoBi ya puede decir mientras junta historia (14/11/2026)
// · Tu último turno: informe del último cierre de caja (desde el primer turno)
// · A este ritmo: proyección de hoy con la curva horaria propia (desde el 2do día)
// · Lo que LumoBi ya sabe: progreso de cada función del motor

export type Etapa = { id: string; nombre: string; que_da: string; listo: boolean; progreso: number; falta: string | null };
export type Aprendizaje = { etapas: Etapa[]; listas: number; total: number; completo: boolean; ventas_total: number };
export type Hecho = { id: string; texto: string; accion: string; impacto_pesos: number };
export type InformeTurno = {
  turno_id: number; titulo: string; total: number; ventas: number; ticket_promedio: number; efectivo_pct: number;
  hora_pico: { hora: number; total: number } | null; productos: { nombre: string; unidades: number; total: number }[];
  diferencia_caja: number | null; hechos: Hecho[]; accion: string;
};
export type Proyeccion = { proyectado: number; hasta_ahora: number; dia_tipico: number; vs_tipico_pct: number; texto: string };

const fmt = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("es-AR");

const card = {
  margin: "0 0 16px",
  padding: 16,
  borderRadius: 10,
  border: "1px solid var(--linea)",
  background: "var(--blanco)",
} as const;
const etiqueta = { fontSize: 12, fontWeight: 600, color: "var(--tinta-apagada)", marginBottom: 6 } as const;

// compacto: título + la primera cosa importante + "Ver más" (Inicio); completo: todo el informe
export function UltimoTurnoCard({ informe, compacto }: { informe: InformeTurno; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(!compacto);
  if (!abierto) {
    const primero = informe.hechos.find((h) => h.id !== "caja_ok") || informe.hechos[0];
    return (
      <div style={card}>
        <div style={etiqueta}>Tu último turno</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)", lineHeight: 1.35 }}>{informe.titulo}</div>
        {primero && <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.5, marginTop: 4 }}>{primero.texto}</div>}
        <button onClick={() => setAbierto(true)} style={{ marginTop: 8, padding: 0, border: "none", background: "transparent", color: "#007AFF", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Ver el informe completo</button>
      </div>
    );
  }
  const datos: [string, string][] = [
    ["Ventas", String(informe.ventas)],
    ["Gasto promedio por cliente", fmt(informe.ticket_promedio)],
    ["En efectivo", `${informe.efectivo_pct}%`],
  ];
  if (informe.hora_pico) datos.push(["Hora pico", `${informe.hora_pico.hora} a ${(informe.hora_pico.hora + 1) % 24} h`]);
  return (
    <div style={card}>
      <div style={etiqueta}>Tu último turno</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tinta)", marginBottom: 10, lineHeight: 1.35 }}>{informe.titulo}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {datos.map(([k, v]) => (
          <div key={k} style={{ background: "var(--papel)", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 11, color: "var(--tinta-apagada)" }}>{k}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tinta)" }}>{v}</div>
          </div>
        ))}
      </div>
      {informe.hechos.slice(0, 3).map((h) => (
        <div key={h.id} style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.5, marginBottom: 6 }}>· {h.texto}</div>
      ))}
      {informe.accion && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--linea)", fontSize: 13, fontWeight: 600, color: "var(--tinta)", lineHeight: 1.5 }}>
          Qué hacer: <span style={{ fontWeight: 400 }}>{informe.accion}</span>
        </div>
      )}
      {informe.productos.length > 1 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 }}>
          Más vendidos: {informe.productos.slice(0, 3).map((p) => `${p.nombre} (${p.unidades})`).join(" · ")}
        </div>
      )}
    </div>
  );
}

export function ProyeccionCard({ p }: { p: Proyeccion }) {
  return (
    <div style={card}>
      <div style={etiqueta}>Hoy, a este ritmo</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif" }}>{fmt(p.proyectado)}</div>
      <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.5, marginTop: 4 }}>
        Llevás {fmt(p.hasta_ahora)}. {p.texto}
      </div>
    </div>
  );
}

export function AprendizajeCard({ a }: { a: Aprendizaje }) {
  if (a.completo) return null;
  return (
    <div style={card}>
      <div style={etiqueta}>Lo que LumoBi ya sabe de tu negocio · {a.listas} de {a.total}</div>
      {a.etapas.map((e) => (
        <div key={e.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--tinta)", marginBottom: 4 }}>
            <span style={{ fontWeight: e.listo ? 600 : 400 }}>{e.listo ? "✓ " : ""}{e.nombre}</span>
            <span style={{ color: "var(--tinta-apagada)", fontSize: 12 }}>{e.listo ? "Listo" : e.falta}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--papel)", overflow: "hidden" }}>
            <div style={{ width: `${Math.round(e.progreso * 100)}%`, height: "100%", background: "var(--tinta)" }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 }}>
        {a.ventas_total === 0
          ? "Todo arranca con la primera venta en la caja del local."
          : "Cada turno que cerrás le enseña a LumoBi cómo vende tu negocio. No tenés que hacer nada más."}
      </div>
    </div>
  );
}
