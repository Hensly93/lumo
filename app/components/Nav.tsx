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
    href: "/alertas",
    label: "Alertas",
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={a ? C : M} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/nicole",
    label: "NICOLE",
    icon: (a) => <NicoleStarIcon size={20} state="idle" />,
  },
  {
    href: "/negocio",
    label: "Negocio",
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke={a ? C : M} strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke={a ? C : M} strokeWidth="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke={a ? C : M} strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke={a ? C : M} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/mas",
    label: "Más",
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="6" r="1.5" fill={a ? C : M} />
        <circle cx="12" cy="12" r="1.5" fill={a ? C : M} />
        <circle cx="12" cy="18" r="1.5" fill={a ? C : M} />
      </svg>
    ),
  },
];

export default function Nav() {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    if (href === "/negocio") {
      return ["/negocio", "/periodos", "/rentabilidad", "/predicciones", "/red"].some(p => path.startsWith(p));
    }
    if (href === "/mas") {
      return ["/mas", "/empleados", "/catalogo", "/ajustes"].some(p => path.startsWith(p));
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
