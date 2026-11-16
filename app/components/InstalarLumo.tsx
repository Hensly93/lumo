"use client";
// InstalarLumo — "Bajá LumoBi en tu celu" (15/11/2026). Va en todo el registro y en Primeros pasos.
// Resuelve los casos reales:
//   · Android/Chrome con instalación directa  → un botón que abre el cartel de instalación del navegador.
//   · Android/Chrome sin ese cartel           → pasos con el menú (⋮).
//   · iPhone                                  → pasos con Compartir (solo se instala así).
//   · Dentro de Instagram/Facebook/TikTok…    → desde ahí NO se puede instalar: se explica cómo abrirla en el navegador.
//   · Ya instalada (abierta como app)         → no se muestra.
import { useEffect, useState } from "react";
import { track } from "../lib/track";

type Evento = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type VentanaLumo = Window & { __lumoInstalar?: Event | null };
type Modo = "cargando" | "oculto" | "directo" | "android" | "ios" | "inapp";

const AZUL = "#0A5BD3";
const TINTA = "#0A1628";
const SUAVE = "#475569";

// Navegadores que viven dentro de otra app: ahí el navegador no deja instalar nada
const EN_APP = /FBAN|FBAV|FB_IAB|Instagram|Messenger|TikTok|musical_ly|Snapchat|Line\/|Twitter|LinkedInApp|; wv\)/i;

function paso(n: number, t: React.ReactNode) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 8 }}>
      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: AZUL, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span style={{ fontSize: 14, color: TINTA, lineHeight: 1.45 }}>{t}</span>
    </div>
  );
}

export default function InstalarLumo({ compacta = false, enlace = "/login?registro=1" }: { compacta?: boolean; enlace?: string }) {
  const [modo, setModo] = useState<Modo>("cargando");
  const [evento, setEvento] = useState<Evento | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const w = window as VentanaLumo;
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) { setModo("oculto"); return; }
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const movil = ios || /android/i.test(ua);
    const leer = () => {
      const ev = (w.__lumoInstalar as Evento) || null;
      setEvento(ev);
      if (EN_APP.test(ua)) setModo("inapp");
      else if (ev) setModo("directo");
      else if (ios) setModo("ios");
      else if (movil) setModo("android");
      else setModo("oculto"); // en la compu solo se ofrece si el navegador trae el cartel
    };
    leer();
    window.addEventListener("lumo-instalar-listo", leer);
    const alInstalar = () => { setListo(true); track("pwa_instalada"); };
    window.addEventListener("appinstalled", alInstalar);
    return () => { window.removeEventListener("lumo-instalar-listo", leer); window.removeEventListener("appinstalled", alInstalar); };
  }, []);

  useEffect(() => {
    if (modo !== "cargando" && modo !== "oculto") track("pwa_oferta", undefined, { modo });
  }, [modo]);

  async function instalar() {
    track("pwa_click", undefined, { modo });
    if (modo === "directo" && evento) {
      await evento.prompt();
      const { outcome } = await evento.userChoice;
      if (outcome === "accepted") { setListo(true); track("pwa_instalada"); }
      (window as VentanaLumo).__lumoInstalar = null;
      setEvento(null);
      return;
    }
    setAbierto(a => !a);
  }

  async function copiar() {
    track("pwa_click", undefined, { modo: "copiar" });
    try { await navigator.clipboard.writeText(window.location.origin + enlace); setCopiado(true); setTimeout(() => setCopiado(false), 3000); }
    catch { setAbierto(true); }
  }

  if (modo === "cargando" || modo === "oculto") return null;

  const caja: React.CSSProperties = {
    background: "#EAF2FE", border: "1px solid #D6E4FB", borderRadius: 12, padding: compacta ? "10px 12px" : "14px 16px",
    fontFamily: "var(--font-instrument),-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  };
  const boton: React.CSSProperties = {
    border: "none", background: AZUL, color: "#fff", fontWeight: 700, borderRadius: 22, cursor: "pointer",
    fontSize: compacta ? 14 : 15, padding: compacta ? "9px 16px" : "12px 20px", whiteSpace: "nowrap",
  };

  if (listo) {
    return (
      <div style={caja}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TINTA }}>Listo, LumoBi quedó instalada</div>
        <div style={{ fontSize: 14, color: SUAVE, marginTop: 4, lineHeight: 1.45 }}>Buscá el ícono de LumoBi en la pantalla de inicio de tu celu y abrila desde ahí.</div>
      </div>
    );
  }

  return (
    <div style={caja}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: compacta ? 15 : 16, fontWeight: 800, color: TINTA }}>
            {modo === "inapp" ? "Para bajar la app, abrila en tu navegador" : "Bajá LumoBi en tu celu"}
          </div>
          <div style={{ fontSize: 13, color: SUAVE, marginTop: 3, lineHeight: 1.4 }}>
            {modo === "inapp"
              ? "Desde Instagram o Facebook no se puede instalar."
              : "Gratis, sin Play Store ni App Store. Queda con su ícono y abre más rápido."}
          </div>
        </div>
        {modo === "inapp"
          ? <button type="button" onClick={copiar} style={boton}>{copiado ? "Copiado" : "Copiar enlace"}</button>
          : <button type="button" onClick={instalar} style={boton}>{modo === "directo" ? "Instalar" : abierto ? "Cerrar" : "Cómo"}</button>}
      </div>

      {modo === "inapp" && (
        <div style={{ marginTop: 6 }}>
          {paso(1, <>Tocá los <strong>tres puntos</strong> (arriba a la derecha) y elegí <strong>Abrir en el navegador</strong>.</>)}
          {paso(2, <>O tocá <strong>Copiar enlace</strong>, abrí {/iphone|ipad|ipod/i.test(typeof navigator === "undefined" ? "" : navigator.userAgent) ? "Safari" : "Chrome"} y pegalo.</>)}
          {paso(3, <>Ya en el navegador, volvé a esta tarjeta y tocá el botón para instalarla.</>)}
        </div>
      )}

      {abierto && modo === "ios" && (
        <div style={{ marginTop: 6 }}>
          {paso(1, <>Tocá el botón <strong>Compartir</strong> (el cuadradito con la flecha hacia arriba, abajo en Safari).</>)}
          {paso(2, <>Deslizá y elegí <strong>Agregar a pantalla de inicio</strong>.</>)}
          {paso(3, <>Tocá <strong>Agregar</strong>. Al abrirla por primera vez, entrá con tu email y contraseña.</>)}
          <div style={{ fontSize: 12, color: SUAVE, marginTop: 8, lineHeight: 1.4 }}>Si no ves la opción, abrí LumoBi en Safari.</div>
        </div>
      )}

      {abierto && modo === "android" && (
        <div style={{ marginTop: 6 }}>
          {paso(1, <>Tocá los <strong>tres puntos</strong> (⋮) arriba a la derecha del navegador.</>)}
          {paso(2, <>Elegí <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla de inicio</strong>.</>)}
          {paso(3, <>Confirmá. LumoBi aparece como una app más en tu celu.</>)}
        </div>
      )}
    </div>
  );
}
