"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "â¬¡" },
  { href: "/alertas", label: "Alertas", icon: "âš " },
  { href: "/empleados", label: "Empleados", icon: "í±¤" },
  { href: "/dashboard", label: "Negocio", icon: "í³Š" },
  { href: "/benchmark", label: "Benchmark", icon: "í´’" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#0D1520", borderTop: "1px solid #1C2E42",
      display: "flex", justifyContent: "space-around",
      padding: "12px 0 20px", zIndex: 50
    }}>
      {links.map(l => (
        <Link key={l.href} href={l.href} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          textDecoration: "none",
          color: path === l.href ? "#00D4FF" : "#3A5270",
          fontSize: 11, fontWeight: 600,
          transition: "color 0.2s"
        }}>
          <span style={{ fontSize: 20 }}>{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
