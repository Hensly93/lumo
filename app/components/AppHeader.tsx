"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import LumoEyeIcon from "./LumoEyeIcon";
import ConfirmDeleteAccountModal from "./ConfirmDeleteAccountModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Perfil = { negocio: string; nombre: string; email?: string; logo?: string | null };

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
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("lumo_usuario");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setPerfil({
          negocio: u.negocio ?? "",
          nombre: u.nombre ?? "",
          email: u.email ?? "",
          logo: null,
        });
      } catch { /* */ }
    }
    if (!token) return;
    fetch(`${API}/api/usuario/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.negocio)
          setPerfil({
            negocio: d.negocio,
            nombre: d.nombre,
            email: d.email,
            logo: d.logo ?? null,
          });
      })
      .catch(() => {});
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  return (
    <>
    <header
      style={{
        background: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 16px 12px",
      }}
    >
      {/* Izquierda: ojo + sep + avatar + nombre */}
      <button
        onClick={() => router.push("/configuracion")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <LumoEyeIcon size={20} />

        {/* Separador */}
        <div
          style={{
            width: 1,
            height: 12,
            background: "var(--border)",
            flexShrink: 0,
          }}
        />

        {perfil && (
          <>
            <BizAvatar negocio={perfil.negocio} logo={perfil.logo} />
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "var(--text)",
                  lineHeight: 1.1,
                }}
              >
                {perfil.negocio}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--muted)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Lumo · Beta
              </div>
            </div>
          </>
        )}
      </button>

      {/* Derecha: Avatar dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            transition: "background 0.2s",
            backgroundColor: showDropdown ? "var(--border)" : "transparent",
          }}
          onMouseOver={(e) =>
            !showDropdown &&
            (e.currentTarget.style.backgroundColor = "var(--border)")
          }
          onMouseOut={(e) =>
            !showDropdown &&
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--emerald)",
              boxShadow: "0 0 8px #00C48C60",
            }}
          />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 0,
              background: "var(--card2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              zIndex: 1000,
              minWidth: 260,
              overflow: "hidden",
              animation: "slideDown 0.2s ease-out",
            }}
          >
            <style>{`
              @keyframes slideDown {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {/* Header: Email */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Email
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  wordBreak: "break-all",
                }}
              >
                {perfil?.email || "—"}
              </div>
            </div>

            {/* Links */}
            <div style={{ padding: "8px 0" }}>
              <button
                onClick={() => {
                  router.push("/ajustes");
                  setShowDropdown(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--border)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                ⚙️ Ajustes
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setShowDropdown(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "#3B82F6",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--border)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                🚪 Salir
              </button>

              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setShowDropdown(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  color: "#EF4444",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--border)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                🗑️ Borrar cuenta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
          }}
        />
      )}
    </header>

    {/* Delete Account Modal */}
    {showDeleteModal && (
      <ConfirmDeleteAccountModal
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => {
          localStorage.clear();
          router.replace("/login");
        }}
      />
    )}
  </>
);
}
