"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const C = "#0A5BD3"; // activo
const M = "#45546B"; // inactivo (contraste AA sobre blanco)

type NavItem = { href: string; label: string; icon: (active: boolean) => React.ReactNode };

const svg = (a: boolean, d: React.ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={a ? C : M} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);

// Cinco pestañas, con nombres que dicen qué hay adentro. NICOLE y Ajustes están siempre a mano (botón flotante y engranaje).
const links: NavItem[] = [
  { href: "/", label: "Hoy", icon: (a) => svg(a, <path d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />) },
  { href: "/que-hacer", label: "Qué hacer", icon: (a) => svg(a, <><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h9" /></>) },
  { href: "/mi-negocio", label: "Mi negocio", icon: (a) => svg(a, <><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>) },
  { href: "/negocio", label: "Plata", icon: (a) => svg(a, <><circle cx="12" cy="12" r="9" /><path d="M12 6v12M9 9h3.5a2 2 0 010 4H9" /></>) },
  { href: "/mas", label: "Más", icon: (a) => svg(a, <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>) },
];

// Cada pestaña queda marcada también en las pantallas de adentro.
const PANTALLAS: Record<string, string[]> = {
  "/que-hacer": ["/que-hacer", "/oportunidades", "/alertas"],
  "/mi-negocio": ["/mi-negocio", "/catalogo", "/pedidos", "/compras", "/costos", "/equipo", "/empleados", "/mi-local", "/en-vivo", "/red", "/comparar", "/ficha"],
  "/negocio": ["/negocio", "/periodos", "/rentabilidad", "/predicciones", "/resumen-mensual", "/fugas", "/benchmark"],
  "/mas": ["/mas", "/ajustes", "/guia", "/mercado-pago"],
};

export default function Nav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : (PANTALLAS[href] ?? [href]).some(p => path === p || path.startsWith(p + "/")));

  return (
    <nav aria-label="Menú principal" style={{
      display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", alignItems: "stretch",
      padding: "6px 4px calc(10px + env(safe-area-inset-bottom))",
      borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
    }}>
      {links.map(l => {
        const active = isActive(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            minHeight: 52, borderRadius: 10, textDecoration: "none",
            background: active ? "var(--azul-claro)" : "transparent",
          }}>
            {l.icon(active)}
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 600, fontFamily: "var(--font-instrument), sans-serif", color: active ? C : M, lineHeight: 1 }}>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
