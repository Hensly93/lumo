"use client";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import MenuGuiado, { type GrupoMenu } from "../components/MenuGuiado";
import PeriodoMesCard from "../components/PeriodoMesCard";
import { useSucursal } from "../hooks/useSucursal";

const iconColor = "var(--azul)";

const icons = {
  fugas: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3c3 4 6 7 6 11a6 6 0 01-12 0c0-4 3-7 6-11z" stroke={iconColor} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 14.5a2.5 2.5 0 002.5 2.5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
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

const iconoCompras = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" stroke={iconColor} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 8h6M9 12h6" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function NegocioPage() {
  const { sucursalId } = useSucursal();

  const grupos: GrupoMenu[] = [
    { pregunta: "¿Cuánto gané?", items: [
      { label: "Ganancia real", desc: "Lo que te queda de verdad: ventas menos el costo de lo que vendiste y tus gastos. Acá también cargás los gastos del mes.", href: "/rentabilidad", icon: icons.rentabilidad },
      { label: "Resumen del mes", desc: "Todo lo que LumoBi detectó y recuperó para tu negocio este mes.", href: "/resumen-mensual", icon: icons.periodos },
    ] },
    { pregunta: "¿Cuánto vendí?", items: [
      { label: "Ventas por período", desc: "¿Vendo más o menos que antes? Este mes contra el anterior, comparado justo.", href: "/periodos", icon: icons.periodos },
      { label: "Predicciones", desc: "¿Cuánto voy a vender los próximos días? LumoBi lo calcula con tu historia.", href: "/predicciones", icon: icons.predicciones },
    ] },
    { pregunta: "¿Dónde se me va la plata?", ayuda: "Todo lo que hay para hacer, ordenado, está en la pestaña Qué hacer.", items: [
      { label: "Fugas de plata", desc: "Caja, precios y costos: dónde se te escapa y cómo cerrarlo.", href: "/fugas", icon: icons.fugas },
      { label: "Oportunidades", desc: "Ideas con la plata concreta, que probás con un botón.", href: "/oportunidades", icon: icons.predicciones },
    ] },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 150 }}>
      <PageHeader title="Plata" sub="Cuánto vendiste, cuánto ganás de verdad y qué se te escapa" />

      <div style={{ padding: "0 12px" }}>
        <PeriodoMesCard sucursalId={sucursalId} />
        <MenuGuiado grupos={grupos} />
      </div>
      <Nav />
    </main>
  );
}
