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
      height: 68,
      background: "rgba(255,255,255,0.97)",
      borderBottom: "1px solid #E8EDF5",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
    }}>
      {/* LEFT SIDE */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 16,
        alignItems: "center",
      }}>
        {/* 1. Full Lumo Logo */}
        <svg width="110" height="34" viewBox="0 0 180 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lumoGradient" x1="0" y1="0" x2="180" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#007AFF"/>
              <stop offset="100%" stopColor="#00C2FF"/>
            </linearGradient>
          </defs>

          {/* Eye shape */}
          <path d="M4 28 C4 28 14 16 28 16 C42 16 52 28 52 28 C52 28 42 40 28 40 C14 40 4 28 4 28Z" stroke="url(#lumoGradient)" strokeWidth="1.8" fill="none"/>

          {/* Iris circle */}
          <circle cx="28" cy="28" r="7" fill="url(#lumoGradient)" opacity="0.15"/>
          <circle cx="28" cy="28" r="7" stroke="url(#lumoGradient)" strokeWidth="1.5" fill="none"/>

          {/* Pupil */}
          <circle cx="28" cy="28" r="3" fill="url(#lumoGradient)"/>

          {/* Highlight */}
          <circle cx="26.5" cy="26.5" r="1" fill="white"/>

          {/* Light rays - cardinal directions (opacity 0.7) */}
          <line x1="28" y1="6" x2="28" y2="11" stroke="url(#lumoGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="28" y1="45" x2="28" y2="50" stroke="url(#lumoGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="6" y1="28" x2="11" y2="28" stroke="url(#lumoGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="45" y1="28" x2="50" y2="28" stroke="url(#lumoGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>

          {/* Light rays - diagonals (opacity 0.4) */}
          <line x1="10" y1="12" x2="13.5" y2="15.5" stroke="url(#lumoGradient)" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
          <line x1="46" y1="12" x2="42.5" y2="15.5" stroke="url(#lumoGradient)" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
          <line x1="10" y1="44" x2="13.5" y2="40.5" stroke="url(#lumoGradient)" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
          <line x1="46" y1="44" x2="42.5" y2="40.5" stroke="url(#lumoGradient)" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>

          {/* Text "lumo" */}
          <text x="64" y="36" fontFamily="'Syne', sans-serif" fontSize="28" fontWeight="800" fill="url(#lumoGradient)" letterSpacing="-0.5">lumo</text>

          {/* Underline */}
          <line x1="64" y1="44" x2="174" y2="44" stroke="url(#lumoGradient)" strokeWidth="1.5" strokeLinecap="round"/>

          {/* Dot on underline */}
          <circle cx="119" cy="44" r="2.5" fill="url(#lumoGradient)"/>
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
