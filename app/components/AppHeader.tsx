"use client";

import { useEffect, useState, useRef } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

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
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 26 C4 26 14 14 26 14 C38 14 48 26 48 26 C48 26 38 38 26 38 C14 38 4 26 4 26Z" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="26" cy="26" r="7" stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="26" cy="26" r="3" fill="white"/>
                <circle cx="24.5" cy="24.5" r="1" fill="rgba(255,255,255,0.6)"/>
                <line x1="26" y1="4" x2="26" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                <line x1="26" y1="42" x2="26" y2="48" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                <line x1="4" y1="26" x2="10" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                <line x1="42" y1="26" x2="48" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
              </svg>
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
              <div ref={dropdownRef} style={{
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
      {showDeleteModal && (
        <ConfirmDeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => { localStorage.clear(); router.replace("/login"); }}
        />
      )}
    </>
  );
}
