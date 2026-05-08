"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Perfil = { negocio: string; nombre: string; logo?: string | null };

export default function Header() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    // Carga inmediata desde localStorage para evitar flash
    const raw = localStorage.getItem("lumo_usuario");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setPerfil({ negocio: u.negocio ?? "", nombre: u.nombre ?? "", logo: null });
      } catch { /* */ }
    }

    // Luego busca perfil completo (con logo)
    const token = localStorage.getItem("lumo_token");
    if (!token) return;
    fetch(`${API}/api/usuario/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.negocio) setPerfil({ negocio: d.negocio, nombre: d.nombre, logo: d.logo ?? null });
      })
      .catch(() => { /* silencioso */ });
  }, []);

  if (!perfil) return <div style={{ height: 68 }} />;

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      minHeight: 68,
      background: "rgba(255,255,255,0.97)",
      borderBottom: "1px solid #E8EDF5",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 20px",
    }}>
      {/* LEFT SIDE */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 16,
        alignItems: "center",
      }}>
        {/* 1. Full Lumo Logo */}
        <svg width="90" height="28" viewBox="0 0 180 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="180" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#007AFF"/>
              <stop offset="100%" stopColor="#00C2FF"/>
            </linearGradient>
            <linearGradient id="lg2" x1="0" y1="0" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#007AFF"/>
              <stop offset="100%" stopColor="#00C2FF"/>
            </linearGradient>
          </defs>
          <path d="M4 28 C4 28 14 16 28 16 C42 16 52 28 52 28 C52 28 42 40 28 40 C14 40 4 28 4 28Z" stroke="url(#lg2)" strokeWidth="1.8" fill="none"/>
          <circle cx="28" cy="28" r="7" fill="url(#lg2)" opacity="0.15"/>
          <circle cx="28" cy="28" r="7" stroke="url(#lg2)" strokeWidth="1.5" fill="none"/>
          <circle cx="28" cy="28" r="3" fill="url(#lg2)"/>
          <circle cx="26.5" cy="26.5" r="1" fill="white" opacity="0.9"/>
          <text x="64" y="36" fontFamily="'Syne', sans-serif" fontSize="28" fontWeight="800" fill="url(#lg1)" letterSpacing="-0.5">lumo</text>
          <line x1="64" y1="44" x2="174" y2="44" stroke="url(#lg1)" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="119" cy="44" r="2.5" fill="url(#lg1)"/>
        </svg>

        {/* 2. Vertical separator */}
        <div style={{
          width: 1,
          height: 28,
          background: "#E8EDF5",
        }}/>

        {/* 3. Business name column */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#0A1628",
            maxWidth: 150,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {perfil.negocio}
          </div>
          <div style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#9CA3AF",
            letterSpacing: 1,
          }}>
            LUMO · BETA
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 14,
        alignItems: "center",
      }}>
        {/* 1. Green dot */}
        <div style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "#00C48C",
        }}/>

        {/* 2. Gear icon */}
        <Link href="/configuracion" style={{
          fontSize: 20,
          color: "#9CA3AF",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
        }}>
          ⚙️
        </Link>
      </div>
    </header>
  );
}
