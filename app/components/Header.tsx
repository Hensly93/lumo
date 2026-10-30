"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const APP_STATUS = "BETA";

type Perfil = { negocio: string; nombre: string; logo?: string | null };

export default function Header() {
  const router = useRouter();
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
        <Logo height={28} variant="light" />

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
            fontFamily: "var(--font-instrument), sans-serif",
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
            LumoBi · {APP_STATUS}
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
        <button
          onClick={() => router.push("/ajustes")}
          style={{
            fontSize: 20,
            color: "#9CA3AF",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
