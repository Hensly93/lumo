"use client";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";

const iconColor = "var(--azul)";

const icons = {
  periodos: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="14" width="4" height="7" rx="1" stroke={iconColor} strokeWidth="1.5" />
      <rect x="10" y="8" width="4" height="13" rx="1" stroke={iconColor} strokeWidth="1.5" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke={iconColor} strokeWidth="1.5" />
    </svg>
  ),
  rentabilidad: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="1.5" />
      <path d="M12 6v12M9 9h3.5a2 2 0 010 4H9" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  predicciones: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <polyline points="3 17 9 11 13 15 21 7" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 7 21 7 21 12" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  red: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2.5" stroke={iconColor} strokeWidth="1.5" />
      <circle cx="5" cy="7" r="2" stroke={iconColor} strokeWidth="1.5" />
      <circle cx="19" cy="7" r="2" stroke={iconColor} strokeWidth="1.5" />
      <circle cx="5" cy="17" r="2" stroke={iconColor} strokeWidth="1.5" />
      <circle cx="19" cy="17" r="2" stroke={iconColor} strokeWidth="1.5" />
      <line x1="9.7" y1="10.7" x2="6.8" y2="8.5" stroke={iconColor} strokeWidth="1.5" />
      <line x1="14.3" y1="10.7" x2="17.2" y2="8.5" stroke={iconColor} strokeWidth="1.5" />
      <line x1="9.7" y1="13.3" x2="6.8" y2="15.5" stroke={iconColor} strokeWidth="1.5" />
      <line x1="14.3" y1="13.3" x2="17.2" y2="15.5" stroke={iconColor} strokeWidth="1.5" />
    </svg>
  ),
};

export default function NegocioPage() {
  const router = useRouter();

  const items = [
    { label: "Períodos", desc: "Comparar períodos y ver evolución", href: "/periodos", icon: icons.periodos },
    { label: "Rentabilidad", desc: "Análisis de ganancias y costos", href: "/rentabilidad", icon: icons.rentabilidad },
    { label: "Predicciones", desc: "Proyecciones de NICOLE", href: "/predicciones", icon: icons.predicciones },
    { label: "Red", desc: "Comparar con otros locales", href: "/red", icon: icons.red },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Negocio" sub="Análisis y datos de tu negocio" />

      <div style={{ padding: "0 12px" }}>
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => router.push(item.href)}
            style={{
              background: "var(--blanco)",
              border: "1px solid var(--linea)",
              borderRadius: 14,
              padding: "16px 18px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-instrument), sans-serif", fontSize: 15, fontWeight: 600, color: "var(--tinta)", marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--tinta-apagada)" }}>
                {item.desc}
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="var(--tinta-apagada)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
      <Nav />
    </main>
  );
}
