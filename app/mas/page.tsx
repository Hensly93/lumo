"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import InstalarLumo from "../components/InstalarLumo";
import MenuGuiado, { type GrupoMenu } from "../components/MenuGuiado";
import ValorCard from "../components/ValorCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
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
  const [mp, setMp] = useState<string | undefined>(undefined);
  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/mp/estado`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(d => setMp(d && d.conectado ? "Conectado" : "Sin conectar")).catch(() => {});
  }, []);

  const grupos: GrupoMenu[] = [
    { pregunta: "Conectá y cargá tus datos", ayuda: "Cuantos más datos tiene LumoBi, más preciso es.", items: [
      { label: "Mercado Pago", desc: "Traé tus cobros para encontrar plata que nadie anotó. Es opcional y lo cortás cuando quieras.", href: "/mercado-pago", icon: icons.catalogo, estado: mp },
      { label: "Facturas de proveedores", desc: "Sacale una foto a la factura y LumoBi la lee.", href: "/compras", icon: icons.catalogo },
    ] },
    { pregunta: "¿Necesitás ayuda?", items: [
      { label: "Guía", desc: "¿Cómo hago tal cosa? Paso a paso, con ejemplos.", href: "/guia", icon: icons.catalogo },
    ] },
    { pregunta: "Tu cuenta", items: [
      { label: "Ajustes", desc: "Tu negocio, tu plan, los avisos y tu cuenta.", href: "/ajustes", icon: icons.ajustes },
    ] },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Más" sub="Lo que LumoBi sabe de tu negocio, tus conexiones y tu cuenta" />

      <div style={{ padding: "0 12px" }}>
        <ValorCard />
        <InstalarLumo enlace="/login" />
        <MenuGuiado grupos={grupos} />
      </div>
      <Nav />
    </main>
  );
}
