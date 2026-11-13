"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NicoleStarIcon from "./NicoleStarIcon";

const C  = "#007AFF"; // activo
const M  = "#6B8099"; // inactivo

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const links: NavItem[] = [
  {
    href: "/",
    label: "Inicio",
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={a ? C : M} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/negocio",
    label: "Plata",
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={a ? C : M} strokeWidth="1.5" />
        <path d="M12 6v12M9 9h3.5a2 2 0 010 4H9" stroke={a ? C : M} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/nicole",
    label: "NICOLE",
    icon: () => <NicoleStarIcon size={20} state="idle" />,
  },
  {
    href: "/catalogo",
    label: "Productos",
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" stroke={a ? C : M} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3 8l9 5 9-5M12 13v8" stroke={a ? C : M} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/equipo",
    label: "Equipo",
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={a ? C : M} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke={a ? C : M} strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={a ? C : M} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Nav() {
  const path = usePathname();

  // Cada pestaña es un tema del negocio; las pantallas de adentro la dejan marcada.
  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    if (href === "/negocio") {
      return ["/negocio", "/fugas", "/periodos", "/rentabilidad", "/compras", "/predicciones", "/red"].some(p => path.startsWith(p));
    }
    if (href === "/equipo") {
      return ["/equipo", "/empleados", "/mi-local"].some(p => path.startsWith(p));
    }
    return path.startsWith(href);
  };

  return (
    <nav style={{
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "10px 6px calc(20px + env(safe-area-inset-bottom))",
      borderTop: "1px solid var(--border)",
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      position: "fixed", bottom: 0, left: 0, right: 0,
      zIndex: 50,
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
    }}>
      {links.map(l => {
        const active = isActive(l.href);
        const isNicole = l.href === "/nicole";

        if (isNicole) {
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                textDecoration: "none",
                position: "relative",
              }}
            >
              <div style={{
                background: "linear-gradient(135deg, #007AFF, #00C2FF)",
                borderRadius: "50%",
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: -24,
                boxShadow: "0 4px 16px rgba(0,122,255,0.5)",
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="5" y1="22" x2="5" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
                  <line x1="5" y1="6" x2="23" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
                  <line x1="23" y1="6" x2="23" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
                  <circle cx="5" cy="6" r="2" fill="white"/>
                  <circle cx="5" cy="22" r="2" fill="white"/>
                  <circle cx="23" cy="6" r="2" fill="white"/>
                  <circle cx="23" cy="22" r="2" fill="white"/>
                  <circle cx="5" cy="14" r="1.5" fill="white" opacity="0.7"/>
                  <circle cx="23" cy="14" r="1.5" fill="white" opacity="0.7"/>
                  <circle cx="9" cy="10" r="1.5" fill="white" opacity="0.9"/>
                  <circle cx="13" cy="14" r="1.5" fill="white" opacity="0.6"/>
                  <circle cx="17" cy="18" r="1.5" fill="white" opacity="0.9"/>
                  <circle cx="11" cy="7" r="1" fill="white" opacity="0.5"/>
                  <circle cx="17" cy="11" r="1" fill="white" opacity="0.5"/>
                  <circle cx="21" cy="19" r="1" fill="white" opacity="0.5"/>
                </svg>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#007AFF",
                marginTop: 4,
              }}>
                {l.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "4px 3px", borderRadius: 10, textDecoration: "none",
              background: active ? "linear-gradient(135deg,#007AFF12,#00C2FF08)" : "transparent",
              minWidth: 34,
            }}
          >
            {l.icon(active)}
            <span style={{
              fontSize: 8,
              fontWeight: 600,
              fontFamily: "var(--font-instrument), sans-serif",
              color: active ? "var(--cyan)" : "var(--muted)",
              letterSpacing: 0.2,
              lineHeight: 1,
            }}>
              {l.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
