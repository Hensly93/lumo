"use client";

import InstalarLumo from "../components/InstalarLumo";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { subscribePush, getMotivoPush } from "../hooks/usePush";
import SubirVentas from "../components/SubirVentas";
import CajaRapida from "../components/CajaRapida";
import GuiaCaja from "../components/GuiaCaja";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";


type Estado = {
  negocio: boolean;
  locales: boolean;
  equipo: boolean;
  ventas: boolean;
  avisos: boolean;
  turno: boolean;
};

const btnPrimario: React.CSSProperties = {
  width: "100%", padding: "14px", border: "none", borderRadius: 12,
  background: "#0A5BD3", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE,
};

const btnSecundario: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12,
  border: "1px solid var(--border, #E0E7F1)", background: "transparent",
  color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE,
};

type PasoDef = {
  id: string; titulo: string; porque: string; etiqueta: "Necesario" | "Recomendado" | "Opcional"; hecho: boolean; contenido: ReactNode;
};

export default function PrimerosPasos() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [hayProductos, setHayProductos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);
  const decidido = useRef(false);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
  }, [router]);

  const cargarEstado = useCallback(async (t: string) => {
    try {
      const r = await fetch(API + "/api/pasos/estado", { headers: { Authorization: "Bearer " + t } });
      if (r.ok) setEstado((await r.json()) as Estado);
    } catch { /* sin conexion: se queda como esta */ }
    try {
      const rp = await fetch(API + "/api/productos", { headers: { Authorization: "Bearer " + t } });
      if (rp.ok) { const d: unknown = await rp.json(); setHayProductos(Array.isArray(d) && d.length >= 3); }
    } catch { /* sin conexion */ }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    cargarEstado(token);
    const refrescar = () => { if (document.visibilityState === "visible") cargarEstado(token); };
    document.addEventListener("visibilitychange", refrescar);
    window.addEventListener("focus", refrescar);
    return () => {
      document.removeEventListener("visibilitychange", refrescar);
      window.removeEventListener("focus", refrescar);
    };
  }, [token, cargarEstado]);

  async function activarAvisos() {
    if (!token) return;
    const ok = await subscribePush(token);
    setMensaje(ok ? "Avisos activados" : (getMotivoPush() || "No se pudo activar. Revisá que Chrome tenga permiso para notificaciones."));
    if (ok) cargarEstado(token);
  }

  async function irAlInicio() {
    try {
      if (token) {
        await fetch(API + "/api/perfil", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ onboarding_done: true }),
        });
      }
      const u = localStorage.getItem("lumo_usuario");
      if (u) {
        const obj = JSON.parse(u);
        obj.onboarding_done = true;
        localStorage.setItem("lumo_usuario", JSON.stringify(obj));
      }
    } catch { /* si falla, igual lo llevamos al inicio */ }
    router.replace("/");
  }

  // Lo único imprescindible es la caja. El resto suma, pero no frena la primera venta.
  const pasos: PasoDef[] = token ? [
    {
      id: "caja", titulo: "Dejá lista tu caja", etiqueta: "Necesario", hecho: !!estado?.equipo,
      porque: "Escribí quién atiende la caja (puede ser tu nombre) y elegí un PIN de 4 números. Solo se guarda: la caja se abre más adelante, cuando estés en el local para cobrar. LumoBi es una caja simple: cada venta que cobrás es lo que después analiza para decirte dónde perdés plata y qué hacer.",
      contenido: <CajaRapida token={token} modo="crear" onListo={() => cargarEstado(token)} />,
    },
    {
      id: "catalogo", titulo: "Cargá tus productos con su costo", etiqueta: "Recomendado", hecho: hayProductos,
      porque: "Con el costo de lo que vendés, LumoBi te dice qué te deja plata y qué no. Podés hacerlo de a poco: con la pistola lectora, a mano o con la foto de la factura del proveedor.",
      contenido: <button style={hayProductos ? btnSecundario : btnPrimario} onClick={() => router.push("/catalogo")}>{hayProductos ? "Ver mis productos" : "Cargar mis productos"}</button>,
    },
    {
      id: "cobrar", titulo: "Empezá a cobrar", etiqueta: "Recomendado", hecho: !!estado?.turno,
      porque: "Hacelo cuando estés en el local y listo para vender. Acá abrís la caja, conectás la pistola y cobrás la primera venta. Los productos los vas cargando mientras vendés.",
      contenido: (<>
        <CajaRapida token={token} modo="abrir" />
        <GuiaCaja />
      </>),
    },
    {
      id: "avisos", titulo: "Activá los avisos en tu celu", etiqueta: "Recomendado", hecho: !!estado?.avisos,
      porque: "Al cerrar cada turno te llega cuánto vendiste, si la caja cerró bien y qué hacer. Usá Chrome; y si podés, bajá LumoBi con el botón de arriba.",
      contenido: estado?.avisos
        ? <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Los avisos están activados.</div>
        : <button style={btnPrimario} onClick={activarAvisos}>Activar avisos</button>,
    },
    ...(estado && !estado.negocio ? [{
      id: "negocio", titulo: "Contanos de tu negocio", etiqueta: "Recomendado" as const, hecho: false,
      porque: "Rubro y zona. Así LumoBi compara tu negocio con el patrón correcto.",
      contenido: <button style={btnPrimario} onClick={() => router.push("/onboarding?desde=pasos")}>Completar los datos</button>,
    }] : []),
    {
      id: "ventas", titulo: "Traé tus ventas anteriores", etiqueta: "Opcional", hecho: !!estado?.ventas,
      porque: "Si ya vendías antes, subí tus ventas (Excel, PDF o una foto del cuaderno) y LumoBi arranca con historia. Si empezás de cero, saltealo: se llena solo con la caja.",
      contenido: (<>
        {estado?.ventas && <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Ya hay ventas cargadas.</div>}
        <SubirVentas token={token} onListo={() => cargarEstado(token)} />
      </>),
    },
    {
      id: "locales", titulo: "Cargá tus locales", etiqueta: "Opcional", hecho: !!estado?.locales,
      porque: "Si tenés más de un local, cargalos para ver cada uno por separado. Con uno solo, dejalo para después.",
      contenido: <button style={estado?.locales ? btnSecundario : btnPrimario} onClick={() => router.push("/red")}>{estado?.locales ? "Ver mis locales" : "Cargar mis locales"}</button>,
    },
  ] : [];

  const total = pasos.length;
  const hechos = pasos.filter(p => p.hecho).length;
  // El que sigue: el primer paso necesario o recomendado que todavía falta
  const siguiente = pasos.find(p => !p.hecho && p.etiqueta !== "Opcional")?.id ?? null;

  // Abre el paso que corresponde: el que pide el link (?paso=) o, si no, el que sigue
  useEffect(() => {
    if (decidido.current || !estado || !cargado) return;
    decidido.current = true;
    const ids: Record<string, string> = { equipo: "caja", codigo: "cobrar", turno: "cobrar", cobrar: "cobrar", caja: "caja", avisos: "avisos", catalogo: "catalogo", ventas: "ventas", locales: "locales", negocio: "negocio" };
    const pedido = ids[new URLSearchParams(window.location.search).get("paso") || ""];
    setAbierto(pedido ?? siguiente);
  }, [estado, cargado, siguiente]);

  if (!token) {
    return <main style={{ background: "var(--bg)", minHeight: "100vh" }} />;
  }

  const etiquetaColor = (e: PasoDef["etiqueta"]) => e === "Necesario" ? "#B45309" : e === "Recomendado" ? "#0A5BD3" : "var(--muted, #64748B)";

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", padding: "28px 16px 40px", fontFamily: FUENTE, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text, #0A1628)" }}>Dejá tu cuenta lista</h1>
        <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
          {siguiente
            ? <>Son pocos pasos. Hacé primero el que dice <strong>Seguí por acá</strong>; el resto lo podés hacer cuando quieras.</>
            : <>Ya hiciste lo importante. Lo que queda es opcional y lo podés hacer cuando quieras.</>}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--border, #E0E7F1)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total ? Math.round((hechos / total) * 100) : 0}%`, background: "#16A34A", transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text, #0A1628)" }}>{hechos} de {total}</span>
        </div>

        <div style={{ marginBottom: 14 }}><InstalarLumo enlace="/login" /></div>

        {pasos.map((p, i) => {
          const abiertoAhora = abierto === p.id;
          const esSiguiente = siguiente === p.id;
          return (
            <div key={p.id} style={{
              background: "var(--card, #fff)", border: `${esSiguiente ? 2 : 1}px solid ${esSiguiente ? "#0A5BD3" : "var(--border, #E0E7F1)"}`,
              borderRadius: 14, marginBottom: 10, overflow: "hidden",
            }}>
              <button type="button" onClick={() => setAbierto(abiertoAhora ? null : p.id)} aria-expanded={abiertoAhora}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: FUENTE }}>
                <span aria-hidden style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800,
                  background: p.hecho ? "#16A34A" : "transparent", color: p.hecho ? "#fff" : "var(--text, #0A1628)", border: p.hecho ? "none" : "2px solid var(--border, #CBD5E1)",
                }}>{p.hecho ? "✓" : i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "var(--text, #0A1628)", lineHeight: 1.3 }}>{p.titulo}</span>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 700, marginTop: 2, color: p.hecho ? "#16A34A" : etiquetaColor(p.etiqueta) }}>
                    {p.hecho ? "Listo" : esSiguiente ? "Seguí por acá" : p.etiqueta}
                  </span>
                </span>
                <span aria-hidden style={{ color: "var(--muted, #64748B)", fontSize: 18, transform: abiertoAhora ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
              </button>
              {abiertoAhora && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--muted, #475569)", lineHeight: 1.6 }}>{p.porque}</p>
                  {p.contenido}
                </div>
              )}
            </div>
          );
        })}

        {mensaje && <div style={{ fontSize: 12, color: "var(--muted, #64748B)", margin: "4px 0 10px", textAlign: "center" }}>{mensaje}</div>}

        <button style={{ ...btnPrimario, marginTop: 6 }} onClick={irAlInicio}>
          {estado?.turno ? "Listo, ir a mi inicio" : "Lo termino después, ir a mi inicio"}
        </button>
      </div>
    </main>
  );
}
