"use client";
import Nav from "../components/Nav";

const todas = [
  { tipo: "CRÍTICA", color: "#FF4560", titulo: "Anulaciones inusuales", desc: "Carlos — 5 anulaciones en 2 horas", monto: "-$47.200", tiempo: "Hace 23 min", accion: "Ver detalle" },
  { tipo: "CRÍTICA", color: "#FF4560", titulo: "Diferencia de caja", desc: "Cierre turno mañana — $23.400 menos", monto: "-$23.400", tiempo: "Hace 1 hs", accion: "Investigar" },
  { tipo: "MEDIA", color: "#FFB800", titulo: "Ticket promedio bajo", desc: "Turno tarde — 3 días consecutivos", monto: "-$18.500", tiempo: "Hace 2 hs", accion: "Analizar" },
  { tipo: "MEDIA", color: "#FFB800", titulo: "Merma elevada", desc: "Bebidas — Sector A — 18% sobre normal", monto: "-$12.300", tiempo: "Hoy 09:15", accion: "Revisar" },
  { tipo: "BAJA", color: "#00D4FF", titulo: "Variación en margen", desc: "Productos lácteos — semana actual", monto: "-$4.200", tiempo: "Ayer", accion: "Monitorear" },
];

export default function Alertas() {
  return (
    <main style={{ background: "#070B12", minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1C2E42" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 4, color: "#3A5270", textTransform: "uppercase", marginBottom: 6 }}>// Centro de alertas</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#EDF2FF" }}>Alertas Activas</div>
        <div style={{ fontSize: 13, color: "#7090AA", marginTop: 4 }}>5 anomalías detectadas hoy</div>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["Todas", "Críticas", "Medias", "Bajas"].map(f => (
            <div key={f} style={{ padding: "6px 14px", borderRadius: 100, background: f === "Todas" ? "rgba(0,212,255,0.1)" : "#111827", border: `1px solid ${f === "Todas" ? "#00D4FF" : "#1C2E42"}`, fontSize: 12, color: f === "Todas" ? "#00D4FF" : "#7090AA", cursor: "pointer" }}>{f}</div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {todas.map((a, i) => (
            <div key={i} style={{ background: "#111827", border: `1px solid ${a.color}30`, borderLeft: `3px solid ${a.color}`, borderRadius: 16, padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, color: a.color, background: `${a.color}15`, padding: "3px 8px", borderRadius: 6 }}>{a.tipo}</div>
                <div style={{ fontSize: 11, color: "#3A5270" }}>{a.tiempo}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#EDF2FF", marginBottom: 4 }}>{a.titulo}</div>
              <div style={{ fontSize: 13, color: "#7090AA", marginBottom: 12 }}>{a.desc}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, color: a.color }}>{a.monto}</div>
                <div style={{ padding: "8px 16px", background: "rgba(0,212,255,0.1)", border: "1px solid #00D4FF40", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#00D4FF", cursor: "pointer" }}>{a.accion}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Nav />
    </main>
  );
}
