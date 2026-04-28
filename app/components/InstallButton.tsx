"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const T = {
  accent:     "#38BDF8",
  accentDim:  "rgba(56,189,248,0.10)",
  accentGlow: "rgba(56,189,248,0.20)",
  bgCard:     "#071428",
  border:     "#0E2340",
  borderBright: "#1A3A5C",
  textPrimary:  "#E8F4FF",
  textSecondary:"#4A7A9B",
  textMuted:  "#1E3A5F",
};

function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function esSafari() {
  return /safari/i.test(navigator.userAgent) && !/chrome|chromium|crios/i.test(navigator.userAgent);
}

function estaEnStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
}

export default function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [mostrarIOS, setMostrarIOS] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    if (estaEnStandalone()) { setInstalada(true); return; }

    if (esIOS() && esSafari()) {
      setMostrarIOS(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setInstalada(true); setPrompt(null); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalada(true);
    setPrompt(null);
  }

  if (instalada || cerrado) return null;

  // Banner iOS
  if (mostrarIOS) {
    return (
      <div style={{
        position: "fixed", bottom: "max(20px, env(safe-area-inset-bottom))", left: 16, right: 16, zIndex: 100,
        background: T.bgCard, border: `1px solid ${T.borderBright}`,
        borderRadius: 18, padding: "16px 18px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-start", gap: 14,
      }}>
        {/* Ícono compartir iOS */}
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v13M7 8l5-5 5 5" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 21h14" stroke={T.accent} strokeWidth="2" strokeLinecap="round"/>
            <rect x="3" y="11" width="18" height="10" rx="2" stroke={T.accent} strokeWidth="1.5" strokeDasharray="2 2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 5 }}>
            Instalá Lumo en tu iPhone
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
            Tocá el botón{" "}
            <span style={{ color: T.accent, fontWeight: 600 }}>Compartir</span>
            {" "}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: "inline", verticalAlign: "middle" }}>
              <path d="M12 3v13M7 8l5-5 5 5" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 20h14" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            {" "}y elegí{" "}
            <span style={{ color: T.accent, fontWeight: 600 }}>Agregar a pantalla de inicio</span>.
          </div>
        </div>
        <button
          onClick={() => setCerrado(true)}
          style={{ background: "transparent", border: "none", color: T.textMuted, fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>
          ×
        </button>
      </div>
    );
  }

  // Botón Android/Chrome — flotante como iOS para no afectar nav
  if (!prompt) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: 16, right: 16, zIndex: 100,
      background: T.bgCard, border: `1px solid ${T.borderBright}`,
      borderRadius: 18, padding: "14px 18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v13M7 11l5 5 5-5" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 21h14" stroke={T.accent} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 3 }}>
          Instalá Lumo en tu dispositivo
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary }}>
          Acceso rápido desde la pantalla de inicio
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => setCerrado(true)}
          style={{ background: "transparent", border: "none", color: T.textMuted, fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>
          ×
        </button>
        <button
          onClick={instalar}
          style={{ padding: "8px 14px", background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 10, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "system-ui, sans-serif" }}>
          Instalar
        </button>
      </div>
    </div>
  );
}
