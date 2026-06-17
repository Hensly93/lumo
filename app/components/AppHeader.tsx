"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import LumoEyeIcon from "./LumoEyeIcon";
import ConfirmDeleteAccountModal from "./ConfirmDeleteAccountModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Perfil = { negocio: string; nombre: string; email?: string; logo?: string | null };

export default function AppHeader() {
  const router = useRouter();
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  const initials = perfil?.negocio
    ? perfil.negocio.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
    : "L";

  return (
    <>
      <header style={{
        background: "linear-gradient(135deg, #007AFF 0%, #00C2FF 100%)",
        padding: "20px 20px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 160, height: 160, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -20,
          width: 100, height: 100, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              background: "rgba(255,255,255,0.3)",
              borderRadius: 16, padding: 10,
              backdropFilter: "blur(8px)",
              border: "2px solid rgba(255,255,255,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LumoEyeIcon size={36} />
            </div>
            <div>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.75)",
                letterSpacing: "0.5px", marginBottom: 2,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Hola 👋
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800, fontSize: 20,
                color: "#FFFFFF", lineHeight: 1.1, letterSpacing: "-0.3px",
              }}>
                {perfil?.negocio || "Lumo"}
              </div>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 14, width: 44, height: 44,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontFamily: "'Syne', sans-serif",
                fontWeight: 800, fontSize: 14, color: "#FFFFFF",
                backdropFilter: "blur(8px)",
              }}
            >
              {initials}
            </button>
            {showDropdown && (
              <div style={{
                position: "absolute", top: 52, right: 0,
                background: "#FFFFFF", border: "1px solid #E8EDF5",
                borderRadius: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                zIndex: 1000, minWidth: 260, overflow: "hidden",
              }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #E8EDF5" }}>
                  <div style={{ fontSize: 10, color: "#6B8099", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Cuenta</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0A1628", wordBreak: "break-all" }}>{perfil?.email || "—"}</div>
                </div>
                <div style={{ padding: "8px 0" }}>
                  <button
                    onClick={() => { router.push("/configuracion"); setShowDropdown(false); }}
                    style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", color: "#0A1628", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                  >⚙️ Configuración</button>
                  <button
                    onClick={() => { router.push("/ajustes"); setShowDropdown(false); }}
                    style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", color: "#0A1628", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                  >📋 Ajustes</button>
                  <button
                    onClick={() => { handleLogout(); setShowDropdown(false); }}
                    style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                  >🚪 Cerrar sesión</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{
          marginTop: 16, display: "flex", alignItems: "center", gap: 8,
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#00C48C", boxShadow: "0 0 8px #00C48C", flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif" }}>
            Motor activo · NICOLE monitoreando
          </span>
        </div>
      </header>
      {showDropdown && (
        <div onClick={() => setShowDropdown(false)} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
      )}
      {showDeleteModal && (
        <ConfirmDeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => { localStorage.clear(); router.replace("/login"); }}
        />
      )}
    </>
  );
}
