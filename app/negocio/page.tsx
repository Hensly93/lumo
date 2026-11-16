"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import MenuGuiado, { type GrupoMenu } from "../components/MenuGuiado";
import PeriodoMesCard from "../components/PeriodoMesCard";
import { useSucursal } from "../hooks/useSucursal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
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

  const [mp, setMp] = useState<string | undefined>(undefined);
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/mp/estado`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => setMp(d && d.conectado ? "Conectado" : "Sin conectar")).catch(() => {});
  }, []);

  const grupos: GrupoMenu[] = [
    { pregunta: "¿Qué hago para ganar más?", ayuda: "LumoBi encontró cosas concretas. Tocá una y hacé lo que dice.", items: [
      { label: "Precios que se te comieron", desc: "Tu proveedor te subió el precio y vos no. Te digo a cuánto poner cada producto.", href: "/costos", icon: icons.rentabilidad, nuevo: true },
      { label: "Fugas", desc: "¿Dónde se me va la plata? LumoBi lo busca solo y te dice cómo cerrarlo.", href: "/fugas", icon: icons.fugas },
      { label: "Oportunidades", desc: "¿Cómo gano más? Ideas con la plata concreta, que probás con un botón.", href: "/oportunidades", icon: icons.predicciones },
    ] },
    { pregunta: "¿Cómo me está yendo?", items: [
      { label: "Resumen del mes", desc: "Todo lo que LumoBi hizo por tu negocio este mes, en una sola pantalla.", href: "/resumen-mensual", icon: icons.periodos },
      { label: "Períodos", desc: "¿Vendo más o menos que antes? Este mes contra el anterior, comparado justo.", href: "/periodos", icon: icons.periodos },
      { label: "Rentabilidad", desc: "¿Cuánto me queda de verdad? Después de pagar mercadería y gastos.", href: "/rentabilidad", icon: icons.rentabilidad },
    ] },
    { pregunta: "¿Qué viene?", items: [
      { label: "Predicciones", desc: "¿Cuánto voy a vender los próximos días? LumoBi lo calcula con tu historia.", href: "/predicciones", icon: icons.predicciones },
    ] },
    { pregunta: "Para que LumoBi acierte más", ayuda: "Cuantos más datos tiene de tu negocio, mejores son sus avisos.", items: [
      { label: "Facturas de proveedores", desc: "Sacale una foto a la factura y LumoBi la lee. Así sabe cuánto te cuesta cada cosa.", href: "/compras", icon: iconoCompras },
      { label: "Mercado Pago", desc: "Traé tus cobros para encontrar plata que nadie anotó. Es opcional.", href: "/mercado-pago", icon: icons.red, estado: mp },
      { label: "Tus locales", desc: "Si tenés más de un local, cargalos para ver cómo te va en cada uno.", href: "/red", icon: icons.red },
    ] },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Plata" sub="Qué hacer para ganar más, cómo te va y qué viene" />

      <div style={{ padding: "0 12px" }}>
        <PeriodoMesCard sucursalId={sucursalId} />
        <MenuGuiado grupos={grupos} />
      </div>
      <Nav />
    </main>
  );
}
