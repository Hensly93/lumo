"use client";
import { PageHeader } from "../components/ui";
import MenuGuiado, { type GrupoMenu } from "../components/MenuGuiado";
import Nav from "../components/Nav";
import LinkCaja from "../components/LinkCaja";

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

  const grupos: GrupoMenu[] = [
    { pregunta: "¿Cómo trabaja mi gente?", items: [
      { label: "Control del equipo", desc: "¿Cuánto vende cada uno y cierra bien la caja? Lo ves por persona, turno por turno.", href: "/empleados", icon: icons.control },
    ] },
    { pregunta: "¿Cómo se cobra en mi local?", items: [
      { label: "Caja del local", desc: "Quién atiende, su clave y el link para cobrar desde el celu.", href: "/mi-local", icon: icons.caja },
    ] },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Equipo" sub="Tu gente y cómo se maneja la caja" />

      <div style={{ padding: "0 12px" }}>
        <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-instrument), sans-serif", fontSize: 15, fontWeight: 700, color: "var(--tinta)", marginBottom: 4 }}>Que tu equipo entre a la caja</div>
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)", marginBottom: 12, lineHeight: 1.5 }}>Mandales este link: cada uno elige su nombre y pone su PIN. No hay que escribir ningún código.</div>
          <LinkCaja />
        </div>
        <MenuGuiado grupos={grupos} />
      </div>
      <Nav />
    </main>
  );
}
