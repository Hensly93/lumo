"use client";
import Nav from "../components/Nav";

const dias = [
  { dia: "Lun", ventas: 280, normal: 320 },
  { dia: "Mar", ventas: 340, normal: 320 },
  { dia: "Mié", ventas: 290, normal: 320 },
  { dia: "Jue", ventas: 380, normal: 320 },
  { dia: "Vie", ventas: 420, normal: 320 },
  { dia: "Sáb", ventas: 510, normal: 320 },
  { dia: "Hoy", ventas: 342, normal: 320 },
];

const max = Math.max(...dias.map(d => d.ventas));

export default function Dashboard() {
  return (
    <main style={{ background: "#070B12", minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1C2E42" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 4, color: "#3A5270", textTransform: "uppercase", marginBottom: 6 }}>// Vista del negocio</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#EDF2FF" }}>Kiosko Central</div>
        <div style={{ fontSize: 13, color: "#7090AA", marginTop: 4 }}>Últimos 7 días</div>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Ventas semana", valor: "$2.562.000", color: "#00E5A0", delta: "+8% vs semana anterior" },
            { label: "Pérdidas detectadas", valor: "$78.000", color: "#FF4560", delta: "1.2% de ventas totales" },
            { label: "Mejor día", valor: "Sábado", color: "#00D4FF", delta: "$510.000 en ventas" },
            { label: "Ticket promedio", valor: "$2.850", color: "#FFB800", delta: "-8% vs promedio normal" },
          ].map(k => (
            <div key={k.label} style={{ background: "#111827", border: "1px solid #1C2E42", borderRadius: 14, padding: "16px" }}>
              <div style={{ fontSize: 11, color: "#3A5270", marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, color: k.color, marginBottom: 4 }}>{k.valor}</div>
              <div style={{ fontSize: 11, color: "#7090AA" }}>{k.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111827", border: "1px solid #1C2E42", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3, color: "#3A5270", textTransform: "uppercase", marginBottom: 16 }}>// Ventas 7 días</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {dias.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", background: i === 6 ? "#00D4FF" : "rgba(0,212,255,0.3)", borderRadius: "4px 4px 0 0", height: `${(d.ventas / max) * 100}%`, transition: "height 0.5s" }} />
                <div style={{ fontSize: 10, color: i === 6 ? "#00D4FF" : "#3A5270" }}>{d.dia}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#111827", border: "1px solid #1C2E42", borderRadius: 16, padding: "20px" }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3, color: "#3A5270", textTransform: "uppercase", marginBottom: 14 }}>// Rendimiento por turno</div>
          {[
            { turno: "Mañana", ventas: "$134.200", eficiencia: 94, color: "#00E5A0" },
            { turno: "Tarde", ventas: "$112.800", eficiencia: 71, color: "#FFB800" },
            { turno: "Noche", ventas: "$95.500", eficiencia: 48, color: "#FF4560" },
          ].map(t => (
            <div key={t.turno} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#EDF2FF", fontWeight: 600 }}>{t.turno}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: "#7090AA" }}>{t.ventas}</span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: t.color, fontWeight: 700 }}>{t.eficiencia}%</span>
                </div>
              </div>
              <div style={{ background: "#0D1520", borderRadius: 4, height: 6 }}>
                <div style={{ width: `${t.eficiencia}%`, height: "100%", background: t.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Nav />
    </main>
  );
}
