"use client";
import Nav from "../components/Nav";

export default function Benchmark() {
  return (
    <main style={{ background: "#070B12", minHeight: "100vh", paddingBottom: 100 }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1C2E42" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 4, color: "#3A5270", textTransform: "uppercase", marginBottom: 6 }}>// Red de inteligencia</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#EDF2FF" }}>Benchmark</div>
        <div style={{ fontSize: 13, color: "#7090AA", marginTop: 4 }}>Comparaci√≥n con negocios similares</div>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 20, padding: "32px 24px", textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>Ì¥í</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#EDF2FF", marginBottom: 8 }}>Disponible en Plan Pro</div>
          <div style={{ fontSize: 14, color: "#7090AA", lineHeight: 1.6, marginBottom: 24 }}>Compar√° tu negocio con 47 negocios similares en tu zona. Descubr√≠ d√≥nde est√°s perdiendo m√°s que tus competidores.</div>
          <div style={{ padding: "14px 28px", background: "rgba(0,212,255,0.15)", border: "1px solid #00D4FF", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#00D4FF", cursor: "pointer", display: "inline-block" }}>Activar Plan Pro ‚Üí</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Ticket promedio vs zona", bloqueado: true },
            { label: "√çndice de merma por rubro", bloqueado: true },
            { label: "Ranking de eficiencia", bloqueado: true },
            { label: "Patrones de p√©rdida comunes", bloqueado: true },
          ].map((item, i) => (
            <div key={i} style={{ background: "#111827", border: "1px solid #1C2E42", borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.5 }}>
              <span style={{ fontSize: 14, color: "#7090AA" }}>{item.label}</span>
              <span style={{ fontSize: 18 }}>Ì¥í</span>
            </div>
          ))}
        </div>
      </div>
      <Nav />
    </main>
  );
}
