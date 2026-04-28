"use client";
import Nav from "../components/Nav";

const empleados = [
  { nombre: "Carlos M.", turno: "Noche", riesgo: 87, color: "#FF4560", alertas: 5, ventas: "$89.200", anulaciones: 8 },
  { nombre: "Mar√≠a G.", turno: "Tarde", riesgo: 42, color: "#FFB800", alertas: 2, ventas: "$134.500", anulaciones: 2 },
  { nombre: "Juan P.", turno: "Ma√±ana", riesgo: 18, color: "#00E5A0", alertas: 0, ventas: "$98.700", anulaciones: 0 },
  { nombre: "Ana R.", turno: "Ma√±ana", riesgo: 12, color: "#00E5A0", alertas: 0, ventas: "$112.300", anulaciones: 1 },
];

export default function Empleados() {
  return (
    <main style={{ background: "#070B12", minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1C2E42" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 4, color: "#3A5270", textTransform: "uppercase", marginBottom: 6 }}>// Panel de riesgo</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#EDF2FF" }}>Empleados</div>
        <div style={{ fontSize: 13, color: "#7090AA", marginTop: 4 }}>1 empleado requiere atenci√≥n</div>
      </div>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {empleados.map((e, i) => (
          <div key={i} style={{ background: "#111827", border: `1px solid ${e.riesgo > 70 ? e.color + "40" : "#1C2E42"}`, borderRadius: 16, padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${e.color}20`, border: `2px solid ${e.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>Ì±§</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#EDF2FF" }}>{e.nombre}</div>
                  <div style={{ fontSize: 12, color: "#7090AA" }}>Turno {e.turno}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 22, fontWeight: 700, color: e.color }}>{e.riesgo}%</div>
                <div style={{ fontSize: 10, color: "#3A5270" }}>√çndice riesgo</div>
              </div>
            </div>
            <div style={{ background: "#0D1520", borderRadius: 8, height: 6, marginBottom: 14 }}>
              <div style={{ width: `${e.riesgo}%`, height: "100%", background: e.color, borderRadius: 8, transition: "width 0.5s" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Ventas", valor: e.ventas },
                { label: "Anulaciones", valor: e.anulaciones },
                { label: "Alertas", valor: e.alertas },
              ].map(s => (
                <div key={s.label} style={{ background: "#0D1520", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#3A5270", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700, color: "#EDF2FF" }}>{s.valor}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Nav />
    </main>
  );
}
