"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribePush, getMotivoPush } from "../hooks/usePush";
import SubirVentas from "../components/SubirVentas";
import CajaRapida from "../components/CajaRapida";

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
  background: "linear-gradient(135deg, #007AFF, #00C2FF)", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE,
};

const btnSecundario: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12,
  border: "1px solid var(--border, #E0E7F1)", background: "transparent",
  color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE,
};

function Tarjeta({ n, total, titulo, texto, hecho, children }: {
  n: number; total: number; titulo: string; texto: string; hecho: boolean; children?: React.ReactNode;
}) {
  return (
    <div style={{ flex: "0 0 100%", scrollSnapAlign: "center", boxSizing: "border-box", padding: "0 4px" }}>
      <div style={{
        background: "var(--card, #fff)", border: "1px solid var(--border, #E0E7F1)", borderRadius: 18,
        padding: "22px 20px", minHeight: 320, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted, #64748B)" }}>
            Paso {n} de {total}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: hecho ? "#16A34A" : "var(--muted, #64748B)" }}>
            {hecho ? "Listo" : "Pendiente"}
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text, #0A1628)", lineHeight: 1.25 }}>{titulo}</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted, #64748B)", lineHeight: 1.6 }}>{texto}</p>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
      </div>
    </div>
  );
}

export default function PrimerosPasos() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [hayProductos, setHayProductos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [indice, setIndice] = useState(0);
  const pista = useRef<HTMLDivElement | null>(null);

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

  function irA(i: number) {
    const el = pista.current;
    if (!el) return;
    const destino = Math.max(0, Math.min(TOTAL - 1, i));
    el.scrollTo({ left: destino * el.clientWidth, behavior: "smooth" });
  }

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

  // Lo único imprescindible es la caja (paso 1). El resto suma, pero no frena la primera venta.
  const hechos = [
    !!estado?.turno, !!estado?.avisos, hayProductos, !!estado?.ventas, !!estado?.locales,
    ...(estado && !estado.negocio ? [false] : []),
  ];
  const TOTAL = hechos.length;

  // Si llega desde el banner del inicio con ?paso=..., abre directo en esa tarjeta.
  const saltado = useRef(false);
  useEffect(() => {
    if (saltado.current || !estado) return;
    saltado.current = true;
    const ids: Record<string, number> = { equipo: 0, codigo: 0, turno: 0, caja: 0, avisos: 1, catalogo: 2, ventas: 3, locales: 4, negocio: 5 };
    const i = ids[new URLSearchParams(window.location.search).get("paso") || ""] ?? -1;
    if (i > 0) setTimeout(() => irA(i), 150);
  }, [estado]);
  const cantidadHechos = hechos.filter(Boolean).length;

  if (!token) {
    return <main style={{ background: "var(--bg)", minHeight: "100vh" }} />;
  }

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", padding: "28px 16px 40px", fontFamily: FUENTE, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text, #0A1628)" }}>Dejá tu cuenta lista</h1>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--muted, #64748B)" }}>
          {cantidadHechos} de {TOTAL} pasos hechos. Deslizá para ver cada uno.
        </p>

        <div
          ref={pista}
          onScroll={e => setIndice(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
          style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", gap: 0 }}
        >
          <Tarjeta n={1} total={TOTAL} hecho={!!estado?.turno} titulo="Tu caja en 1 minuto"
            texto="Escribí quién atiende la caja (puede ser tu nombre) y elegí un PIN de 4 números. Los productos los cargás mientras vendés.">
            <CajaRapida token={token} onListo={() => cargarEstado(token)} />
          </Tarjeta>

          <Tarjeta n={2} total={TOTAL} hecho={!!estado?.avisos} titulo="Avisos en tu celu"
            texto="Activá las notificaciones: al cerrar cada turno te llega cuánto vendiste, la diferencia de caja y qué hacer. Usá Chrome y, si podés, instalá LumoBi en la pantalla de inicio.">
            {estado?.avisos
              ? <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Los avisos están activados.</div>
              : <button style={btnPrimario} onClick={activarAvisos}>Activar avisos</button>}
            <button style={btnSecundario} onClick={() => router.push("/mas")}>Instalar la app en mi celu</button>
          </Tarjeta>

          <Tarjeta n={3} total={TOTAL} hecho={hayProductos} titulo="Tus productos con su costo (recomendado)"
            texto="Si cargás el costo de lo que vendés, NICOLE te dice qué te deja plata y qué no. Podés hacerlo de a poco, con la pistola lectora o la foto de la factura del proveedor.">
            <button style={hayProductos ? btnSecundario : btnPrimario} onClick={() => router.push("/catalogo")}>{hayProductos ? "Ver mi catálogo" : "Cargar mis productos"}</button>
          </Tarjeta>

          <Tarjeta n={4} total={TOTAL} hecho={!!estado?.ventas} titulo="Tus ventas anteriores (opcional)"
            texto="Si ya vendías antes, subí tus ventas (Excel, PDF o una foto del cuaderno) y NICOLE arranca con historia. Si empezás de cero, saltealo: se llena solo con la caja.">
            {estado?.ventas && <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Ya hay ventas cargadas.</div>}
            <SubirVentas token={token} onListo={() => cargarEstado(token)} />
            <button style={btnSecundario} onClick={() => router.push("/mercado-pago")}>Traer mis cobros de Mercado Pago</button>
          </Tarjeta>

          <Tarjeta n={5} total={TOTAL} hecho={!!estado?.locales} titulo="Tus locales (opcional)"
            texto="Si tenés más de un local, cargalos para ver cada uno por separado. Con uno solo, podés dejarlo para después.">
            <button style={estado?.locales ? btnSecundario : btnPrimario} onClick={() => router.push("/red")}>{estado?.locales ? "Ver mis locales" : "Cargar mis locales"}</button>
          </Tarjeta>

          {!estado?.negocio && (
            <Tarjeta n={6} total={TOTAL} hecho={false} titulo="Tu negocio"
              texto="Rubro y zona de tu negocio. Con eso NICOLE lo compara con el patrón correcto.">
              <button style={btnPrimario} onClick={() => router.push("/onboarding?desde=pasos")}>Completar los datos</button>
            </Tarjeta>
          )}
        </div>

        {mensaje && <div style={{ fontSize: 12, color: "var(--muted, #64748B)", marginTop: 10, textAlign: "center" }}>{mensaje}</div>}

        <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "18px 0" }}>
          {hechos.map((h, i) => (
            <div key={i} style={{
              width: i === indice ? 22 : 8, height: 8, borderRadius: 4, transition: "width 0.2s",
              background: i === indice ? "#007AFF" : h ? "#16A34A" : "var(--border, #E0E7F1)",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button style={btnSecundario} onClick={() => irA(indice - 1)} disabled={indice === 0}>Atrás</button>
          <button style={btnSecundario} onClick={() => irA(indice + 1)} disabled={indice === TOTAL - 1}>Siguiente</button>
        </div>

        <button style={btnPrimario} onClick={irAlInicio}>Ir a mi inicio</button>
      </div>
    </main>
  );
}
