"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo";
import Link from "next/link";
import SucursalSelector from "./SucursalSelector";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Perfil = { negocio: string; nombre: string; email?: string; logo?: string | null };

export default function AppHeader() {
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("lumo_usuario");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setPerfil({ negocio: u.negocio ?? "", nombre: u.nombre ?? "", email: u.email ?? "", logo: null });
      } catch {}
    }
    if (!token) return;
    fetch(`${API}/api/usuario/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.negocio) setPerfil({ negocio: d.negocio, nombre: d.nombre, email: d.email, logo: d.logo ?? null });
      })
      .catch(() => {});
  }, [token]);

  return (
    <header style={{
      background: "var(--blanco)",
      borderBottom: "1px solid var(--linea)",
      padding: "8px 16px 6px",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 12 }}>
        <Logo height={28} variant="light" />
        <SucursalSelector />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, paddingLeft: 2 }}>
        <span style={{ fontSize: 13, color: "var(--tinta-suave)", fontFamily: "var(--font-instrument), sans-serif", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {perfil?.negocio || "LumoBi"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <Link href="/guia" aria-label="Guía: cómo hacer cada cosa" style={{ width: 36, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#6B8099" strokeWidth="1.5" />
              <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" stroke="#6B8099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/alertas" aria-label="Alertas" style={{ width: 36, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#6B8099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/mas" aria-label="Cuenta y ajustes" style={{ width: 36, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#6B8099" strokeWidth="1.5" />
              <path d="M4 21a8 8 0 0116 0" stroke="#6B8099" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
