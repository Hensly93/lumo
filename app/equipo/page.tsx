"use client";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";

const iconColor = "var(--azul)";

const icons = {
  control: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z" stroke={iconColor} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  caja: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke={iconColor} strokeWidth="1.5" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function EquipoPage() {
  const router = useRouter();

  const items = [
    { label: "Control del equipo", desc: "Rendimiento, autorizaciones y actividad de la caja", href: "/empleados", icon: icons.control },
    { label: "Caja del local", desc: "Tu equipo, sus PINs y el link para vender", href: "/mi-local", icon: icons.caja },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Equipo" sub="Tu gente y cómo se maneja la caja" />

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
