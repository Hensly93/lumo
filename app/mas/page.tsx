"use client";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";

export default function MasPage() {
  const router = useRouter();

  const items = [
    { label: "Equipo", desc: "Empleados y rendimiento", href: "/empleados", icon: "👥" },
    { label: "Catálogo", desc: "Productos y precios", href: "/catalogo", icon: "📦" },
    { label: "Ajustes", desc: "Configuración y cuenta", href: "/ajustes", icon: "⚙️" },
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
            <div style={{ fontSize: 28 }}>{item.icon}</div>
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
    </main>
  );
}
