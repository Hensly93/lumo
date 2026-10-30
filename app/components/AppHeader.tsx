"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo";
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
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 2 }}>
        <span style={{ fontSize: 13, color: "var(--tinta-suave)", fontFamily: "var(--font-instrument), sans-serif" }}>
          {perfil?.negocio || "LumoBi"}
        </span>
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "var(--ok)", boxShadow: "0 0 6px var(--ok)", flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, color: "var(--tinta-apagada)", fontFamily: "var(--font-instrument), sans-serif" }}>
          NICOLE monitoreando
        </span>
      </div>
    </header>
  );
}
