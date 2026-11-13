"use client";
// Tarjeta "Instalar la app" (en Más): botón directo si el navegador lo permite, y pasos claros si no.
import { useEffect, useState } from "react";

type Evento = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type VentanaLumo = Window & { __lumoInstalar?: Event | null };

export default function InstalarApp() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const w = window as VentanaLumo;
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) { setInstalada(true); return; }
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const leer = () => setEvento((w.__lumoInstalar as Evento) || null);
    leer();
    window.addEventListener("lumo-instalar-listo", leer);
    return () => window.removeEventListener("lumo-instalar-listo", leer);
  }, []);

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") setInstalada(true);
    (window as VentanaLumo).__lumoInstalar = null;
    setEvento(null);
  }

  if (instalada) return null;

  return (
    <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ fontFamily: "var(--font-instrument), sans-serif", fontSize: 15, fontWeight: 600, color: "var(--tinta)", marginBottom: 4 }}>
        Instalar LumoBi en tu celular
      </div>
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.6, marginBottom: evento ? 12 : 0 }}>
        {evento
          ? "Queda como una app más en tu pantalla de inicio, con su ícono, y abre más rápido."
          : ios
            ? "En el iPhone, abrí esta página en Safari, tocá el botón Compartir y elegí \"Agregar a pantalla de inicio\"."
            : "Abrí el menú del navegador (los tres puntos) y elegí \"Instalar aplicación\" o \"Agregar a pantalla de inicio\"."}
      </div>
      {evento && (
        <button onClick={instalar}
          style={{ width: "100%", padding: 13, border: "none", borderRadius: 12, background: "linear-gradient(135deg, #0A5BD3, #00C2FF)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-instrument), sans-serif" }}>
          Instalar la app
        </button>
      )}
    </div>
  );
}
