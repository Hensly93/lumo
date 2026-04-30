"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

const T = {
  bg:      "rgba(7,11,18,0.96)",
  border:  "#1C2E42",
  accent:  "#00D4FF",
  text:    "#EDF2FF",
  textSec: "#7090AA",
  textMuted: "#3A5270",
};

type Perfil = { negocio: string; nombre: string; logo?: string | null };

function Initials({ negocio }: { negocio: string }) {
  const letters = negocio
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      background: `rgba(0,212,255,0.15)`,
      border: `1.5px solid ${T.accent}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: 0.5 }}>
        {letters || "L"}
      </span>
    </div>
  );
}

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

  if (!perfil) return <div style={{ height: 56 }} />;

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      height: 56,
      background: T.bg,
      borderBottom: `1px solid ${T.border}`,
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center",
      padding: "0 18px",
      gap: 12,
    }}>
      {/* Logo o iniciales */}
      <button
        onClick={() => router.push("/configuracion")}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", flexShrink: 0 }}
      >
        {perfil.logo ? (
          <img
            src={perfil.logo}
            alt={perfil.negocio}
            style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${T.border}` }}
          />
        ) : (
          <Initials negocio={perfil.negocio} />
        )}
      </button>

      {/* Nombre del negocio */}
      <button
        onClick={() => router.push("/configuracion")}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", flex: 1, minWidth: 0 }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {perfil.negocio}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "monospace", letterSpacing: 1 }}>
          LUMO · BETA
        </div>
      </button>

      {/* Punto de estado — verde siempre (online) */}
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00E5A0", flexShrink: 0, boxShadow: "0 0 6px rgba(0,229,160,0.5)" }} />

      {/* Ícono de ajustes */}
      <Link href="/ajustes" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        flexShrink: 0,
        textDecoration: "none",
        cursor: "pointer",
        transition: "opacity 0.2s"
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
        <span style={{ fontSize: 18, color: T.accent }}>⚙️</span>
      </Link>
    </header>
  );
}
