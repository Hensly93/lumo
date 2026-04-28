"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LumoEyeIcon from "./LumoEyeIcon";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Perfil = { negocio: string; nombre: string; logo?: string | null };

function BizAvatar({ negocio, logo }: { negocio: string; logo?: string | null }) {
  const letters = negocio.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "L";

  if (logo) {
    return (
      <img
        src={logo}
        alt={negocio}
        style={{
          width: 28, height: 28,
          borderRadius: 8,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: 28, height: 28,
      borderRadius: 8,
      background: "linear-gradient(135deg,#007AFF,#00C2FF)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 10,
      color: "#fff",
      flexShrink: 0,
      boxShadow: "0 3px 8px #007AFF25",
    }}>
      {letters}
    </div>
  );
}

export default function AppHeader() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("lumo_usuario");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setPerfil({ negocio: u.negocio ?? "", nombre: u.nombre ?? "", logo: null });
      } catch { /* */ }
    }
    const token = localStorage.getItem("lumo_token");
    if (!token) return;
    fetch(`${API}/api/usuario/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.negocio) setPerfil({ negocio: d.negocio, nombre: d.nombre, logo: d.logo ?? null }); })
      .catch(() => {});
  }, []);

  return (
    <header style={{
      background: "rgba(255,255,255,0.92)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 16px 12px",
    }}>

      {/* Izquierda: ojo + sep + avatar + nombre */}
      <button
        onClick={() => router.push("/configuracion")}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <LumoEyeIcon size={20} />

        {/* Separador */}
        <div style={{ width: 1, height: 12, background: "var(--border)", flexShrink: 0 }} />

        {perfil && (
          <>
            <BizAvatar negocio={perfil.negocio} logo={perfil.logo} />
            <div style={{ textAlign: "left" }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12,
                color: "var(--text)", lineHeight: 1.1,
              }}>
                {perfil.negocio}
              </div>
              <div style={{
                fontSize: 9, color: "var(--muted)",
                letterSpacing: "1px", textTransform: "uppercase",
              }}>
                Lumo · Beta
              </div>
            </div>
          </>
        )}
      </button>

      {/* Derecha: punto online */}
      <div style={{
        width: 7, height: 7,
        borderRadius: "50%",
        background: "var(--emerald)",
        flexShrink: 0,
        boxShadow: "0 0 8px #00C48C60",
      }} />
    </header>
  );
}
