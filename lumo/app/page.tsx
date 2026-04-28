"use client";
import Nav from "./components/Nav";
import { useEffect, useState } from "react";

const alertas = [
  { tipo: "CRITICA", color: "#FF4560", bg: "rgba(255,69,96,0.1)", titulo: "Anulaciones inusuales", desc: "Carlos - Turno noche", monto: "-$47.200", tiempo: "Hace 23 min" },
  { tipo: "MEDIA", color: "#FFB800", bg: "rgba(255,184,0,0.1)", titulo: "Ticket promedio bajo", desc: "Turno tarde - 3 dias seguidos", monto: "-$18.500", tiempo: "Hace 2 hs" },
  { tipo: "MEDIA", color: "#FFB800", bg: "rgba(255,184,0,0.1)", titulo: "Merma elevada", desc: "Bebidas - Sector A", monto: "-$12.300", tiempo: "Hoy 09:15" },
];

export default function Home() {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const tick = () => setHora(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ background: "#070B12", minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1C2E42" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 4, color: "#3A5270", textTransform: "uppercase", marginBottom: 4 }}>// Estado del negocio</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 28, fontWeight: 700, color: "#EDF2FF", letterSpacing: -1 }}>LU<span style={{ color: "#00D4FF" }}>M</span>O</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 18, color: "#00D4FF" }}>{hora}</div>
            <div style={{ fontSize: 11, color: "#3A5270", marginTop: 2 }}>Kiosko Central</div>
          </div>
        </div>
      </div>

      <div style={{ margin: "20px 20px 0", background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.3)", borderRadius: 16, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3, color: "#FF4560", textTransform: "uppercase", marginBottom: 6 }}>// Alerta activa</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#EDF2FF" }}>Perdida estimada hoy</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 32, fontWeight: 700, color: "#FF4560", marginTop: 4 }}>-$78.000</div>
          </div>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,69,96,0.15)", border: "2px solid #FF4560", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#FF4560", fontWeight: 700 }}>!</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "16px 20px 0" }}>
        {[
          { label: "Ventas hoy", valor: "$342.500", color: "#00E5A0", delta: "+12%" },
          { label: "Ticket prom.", valor: "$2.850", color: "#00D4FF", delta: "-8%" },
          { label: "Empleados", valor: "4 activos", color: "#FFB800", delta: "1 alerta" },
        ].map(k => (
          <div key={k.label} style={{ background: "#111827", border: "1px solid #1C2E42", borderRadius: 14, padding: "14px 12px" }}>
            <div style={{ fontSize: 10, color: "#3A5270", marginBottom: 6, fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700, color: k.color }}>{k.valor}</div>
            <div style={{ fontSize: 10, color: "#7090AA", marginTop: 4 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: "20px 20px 0" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3, color: "#3A5270", textTransform: "uppercase", marginBottom: 12 }}>// Alertas activas - 3</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alertas.map((a, i) => (
            <div key={i} style={{ background: a.bg, border: `1px solid ${a.color}40`, borderLeft: `3px solid ${a.color}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, color: a.color, marginBottom: 4 }}>{a.tipo}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#EDF2FF" }}>{a.titulo}</div>
                  <div style={{ fontSize: 12, color: "#7090AA", marginTop: 2 }}>{a.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700, color: a.color }}>{a.monto}</div>
                  <div style={{ fontSize: 10, color: "#3A5270", marginTop: 4 }}>{a.tiempo}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Nav />
    </main>
  );
}