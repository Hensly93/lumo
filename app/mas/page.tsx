"use client";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";

const iconColor = "var(--azul)";

const icons = {
  equipo: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke={iconColor} strokeWidth="1.5" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  catalogo: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke={iconColor} strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke={iconColor} strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke={iconColor} strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke={iconColor} strokeWidth="1.5" />
    </svg>
  ),
  ajustes: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={iconColor} strokeWidth="1.5" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function MasPage() {
  const router = useRouter();

  const items = [
    { label: "Equipo", desc: "Empleados y rendimiento", href: "/empleados", icon: icons.equipo },
    { label: "Catálogo", desc: "Productos y precios", href: "/catalogo", icon: icons.catalogo },
    { label: "Ajustes", desc: "Configuración y cuenta", href: "/ajustes", icon: icons.ajustes },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Más" sub="Otras herramientas y configuración" />

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
