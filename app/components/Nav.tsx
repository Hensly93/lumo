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
    label: "Home",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={a ? C : M} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/alertas",
    label: "Alertas",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={a ? C : M} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/predicciones",
    label: "Predic.",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={a ? C : M} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/nicole",
    label: "NICOLE",
    icon: (a) => <NicoleStarIcon size={20} state="idle" />,
  },
  {
    href: "/empleados",
    label: "Equipo",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={a ? C : M} strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke={a ? C : M} strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/red",
    label: "Red",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2.5" stroke={a ? C : M} strokeWidth="1.8" />
        <circle cx="4"  cy="6"  r="2"   stroke={a ? C : M} strokeWidth="1.6" />
        <circle cx="20" cy="6"  r="2"   stroke={a ? C : M} strokeWidth="1.6" />
        <circle cx="4"  cy="18" r="2"   stroke={a ? C : M} strokeWidth="1.6" />
        <circle cx="20" cy="18" r="2"   stroke={a ? C : M} strokeWidth="1.6" />
        <line x1="9.7"  y1="10.7" x2="5.8"  y2="7.5"  stroke={a ? C : M} strokeWidth="1.4" />
        <line x1="14.3" y1="10.7" x2="18.2" y2="7.5"  stroke={a ? C : M} strokeWidth="1.4" />
        <line x1="9.7"  y1="13.3" x2="5.8"  y2="16.5" stroke={a ? C : M} strokeWidth="1.4" />
        <line x1="14.3" y1="13.3" x2="18.2" y2="16.5" stroke={a ? C : M} strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    href: "/configuracion",
    label: "Ajustes",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={a ? C : M} strokeWidth="2" />
        <path d="M19.07 4.93l-1.41 1.41M22 12h-2M4 12H2M5.34 5.34L3.93 3.93" stroke={a ? C : M} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Nav() {
  const path = usePathname();

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
    }}>
      {links.map(l => {
        const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "4px 6px", borderRadius: 10, textDecoration: "none",
              background: active ? "linear-gradient(135deg,#007AFF12,#00C2FF08)" : "transparent",
              minWidth: 40,
            }}
          >
            {l.icon(active)}
            <span style={{
              fontSize: 8,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
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
