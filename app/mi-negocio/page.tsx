"use client";
// Mi negocio: TODO lo operativo en un solo lugar (cobrar, caja, productos, stock, pedidos, facturas, equipo).
import { useEffect, useState } from "react";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import MenuGuiado, { type GrupoMenu } from "../components/MenuGuiado";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const c = "var(--azul)";
const ic = (d: React.ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);
const icons = {
  cobrar: ic(<><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.4a1 1 0 00.8.8h9.5a1 1 0 001-.8L21 7H6" /></>),
  caja: ic(<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>),
  productos: ic(<><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>),
  pedidos: ic(<><path d="M1 6h13v10H1zM14 10h4l3 3v3h-7z" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>),
  factura: ic(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6" /></>),
  precios: ic(<><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></>),
  equipo: ic(<><path d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" /></>),
  local: ic(<><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /></>),
};

export default function MiNegocioPage() {
  const [sinCosto, setSinCosto] = useState<number | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/negocio/data-quality-score`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.costo && typeof d.costo.productos_sin_costo === "number") setSinCosto(d.costo.productos_sin_costo); })
      .catch(() => {});
  }, []);

  const grupos: GrupoMenu[] = [
    { pregunta: "Vender y cobrar", items: [
      { label: "Cobrar", desc: "Abrí la caja de venta: cada uno entra con su nombre y su PIN.", href: "/empleado", icon: icons.cobrar },
      { label: "Caja en vivo", desc: "Cómo va el día hora por hora, quién atiende y qué se movió en la caja.", href: "/en-vivo", icon: icons.caja },
    ] },
    { pregunta: "Productos y proveedores", items: [
      { label: "Productos, precios y stock", desc: "Cargá productos, mirá márgenes, cambiá precios y controlá qué reponer.", href: "/catalogo", icon: icons.productos, estado: sinCosto ? `${sinCosto} sin costo` : undefined },
      { label: "Pedidos", desc: "Qué pedir esta semana y cuánto, por proveedor.", href: "/pedidos", icon: icons.pedidos },
      { label: "Facturas de proveedores", desc: "Sacale una foto a la factura y LumoBi carga lo que te cuesta cada cosa.", href: "/compras", icon: icons.factura },
      { label: "Precios que se te comieron", desc: "Tu proveedor subió y vos no: a cuánto poner cada producto.", href: "/costos", icon: icons.precios },
    ] },
    { pregunta: "Gente y locales", items: [
      { label: "Equipo", desc: "Quién atiende, su PIN, el link de la caja y cómo cierra cada uno.", href: "/equipo", icon: icons.equipo },
      { label: "Tus locales", desc: "Si tenés más de un local, cargalos para ver cómo te va en cada uno.", href: "/red", icon: icons.local },
    ] },
  ];

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 150 }}>
      <PageHeader title="Mi negocio" sub="Todo lo que usás para trabajar, en un solo lugar" />
      <div style={{ padding: "0 12px" }}>
        <MenuGuiado grupos={grupos} />
      </div>
      <Nav />
    </main>
  );
}
