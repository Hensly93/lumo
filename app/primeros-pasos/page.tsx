"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribePush, getMotivoPush } from "../hooks/usePush";
import SubirVentas from "../components/SubirVentas";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const CLAVE_CODIGO = "lumo_paso_codigo_compartido";
const FUENTE = "var(--font-instrument), sans-serif";
const TOTAL = 8;

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

function Tarjeta({ n, titulo, texto, hecho, children }: {
  n: number; titulo: string; texto: string; hecho: boolean; children?: React.ReactNode;
}) {
  return (
    <div style={{ flex: "0 0 100%", scrollSnapAlign: "center", boxSizing: "border-box", padding: "0 4px" }}>
      <div style={{
        background: "var(--card, #fff)", border: "1px solid var(--border, #E0E7F1)", borderRadius: 18,
        padding: "22px 20px", minHeight: 320, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted, #64748B)" }}>
            Paso {n} de {TOTAL}
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
  const [codigo, setCodigo] = useState<string | null>(null);
  const [codigoCompartido, setCodigoCompartido] = useState(false);
  const [hayProductos, setHayProductos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [indice, setIndice] = useState(0);
  const pista = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
    try { setCodigoCompartido(localStorage.getItem(CLAVE_CODIGO) === "1"); } catch { /* sin almacenamiento */ }
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
    fetch(API + "/api/multilocal/codigo-acceso", { headers: { Authorization: "Bearer " + token } })
      .then(r => r.json())
      .then((d: { codigo?: string }) => { if (d.codigo) setCodigo(d.codigo); })
      .catch(() => { /* el codigo se muestra vacio */ });
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

  function marcarCodigoCompartido() {
    setCodigoCompartido(true);
    try { localStorage.setItem(CLAVE_CODIGO, "1"); } catch { /* sin almacenamiento */ }
  }

  async function copiarCodigo() {
    if (!codigo) return;
    try { await navigator.clipboard.writeText(codigo); setMensaje("Código copiado"); marcarCodigoCompartido(); }
    catch { setMensaje("No se pudo copiar: anotalo a mano"); }
  }

  function mandarPorWhatsApp() {
    if (!codigo) return;
    const texto =
      "Para entrar a LumoBi como empleado: 1) Abrí " + window.location.origin + "/empleado " +
      "2) Poné el código del negocio: " + codigo + " 3) Elegí tu nombre y poné tu PIN.";
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
    marcarCodigoCompartido();
  }

  async function activarAvisos() {
    if (!token) return;
    const ok = await subscribePush(token);
    setMensaje(ok ? "Avisos activados" : (getMotivoPush() || "No se pudo activar. Revisá que Chrome tenga permiso para notificaciones."));
    if (ok) cargarEstado(token);
  }

  function conectarMercadoPago() {
    if (!token) return;
    window.location.href = API + "/api/mp/conectar?token=" + token;
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

  const hechos = [
    hayProductos, !!estado?.equipo, codigoCompartido, !!estado?.turno,
    !!estado?.avisos, !!estado?.ventas, !!estado?.negocio, !!estado?.locales,
  ];

  // Si llega desde el banner del inicio con ?paso=..., abre directo en esa tarjeta.
  const saltado = useRef(false);
  useEffect(() => {
    if (saltado.current || !estado) return;
    saltado.current = true;
    const ids = ["catalogo", "equipo", "codigo", "turno", "avisos", "ventas", "negocio", "locales"];
    const i = ids.indexOf(new URLSearchParams(window.location.search).get("paso") || "");
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
          <Tarjeta n={1} hecho={hechos[0]} titulo="Tus productos"
            texto="Cargá lo que vendés con su precio y su costo. Con eso la caja funciona y NICOLE calcula tu margen. Con tres o cuatro alcanza para empezar.">
            {hechos[0] && <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Ya tenés productos cargados.</div>}
            <button style={hechos[0] ? btnSecundario : btnPrimario} onClick={() => router.push("/catalogo")}>{hechos[0] ? "Ver mi catálogo" : "Cargar mis productos"}</button>
          </Tarjeta>

          <Tarjeta n={2} hecho={hechos[1]} titulo="Tu equipo"
            texto="Creá a cada empleado con su nombre y un PIN de 4 dígitos. El PIN es personal: con él abre y cierra su turno. Si atendés solo, igual creá tu usuario de caja.">
            <button style={hechos[1] ? btnSecundario : btnPrimario} onClick={() => router.push("/mi-local")}>{hechos[1] ? "Ver mi equipo" : "Crear mis empleados"}</button>
          </Tarjeta>

          <Tarjeta n={3} hecho={hechos[2]} titulo="Cómo entran tus empleados"
            texto="Tus empleados entran desde la compu o el celu del local con el código de tu negocio, su nombre y su PIN.">
            <div style={{
              fontFamily: "monospace", fontSize: 28, fontWeight: 800, letterSpacing: 4, textAlign: "center",
              padding: "14px 10px", borderRadius: 12, background: "var(--card2, #F1F5F9)", color: "var(--text, #0A1628)",
            }}>
              {codigo ?? "········"}
            </div>
            <button style={btnPrimario} disabled={!codigo} onClick={mandarPorWhatsApp}>Mandar por WhatsApp</button>
            <button style={btnSecundario} disabled={!codigo} onClick={copiarCodigo}>Copiar el código</button>
          </Tarjeta>

          <Tarjeta n={4} hecho={hechos[3]} titulo="Tu primer turno"
            texto="Entrá a Modo empleado, abrí un turno con un PIN, hacé una venta de prueba y cerrá. Es la forma más rápida de ver a NICOLE funcionando con tus propios números.">
            <button style={hechos[3] ? btnSecundario : btnPrimario} onClick={() => router.push("/empleado")}>Abrir Modo empleado</button>
          </Tarjeta>

          <Tarjeta n={5} hecho={hechos[4]} titulo="Avisos en tu celu"
            texto="Activá las notificaciones para enterarte en el momento si algo se desvía. Usá Chrome y, si podés, instalá LumoBi en la pantalla de inicio de tu celu.">
            {hechos[4]
              ? <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Los avisos están activados.</div>
              : <button style={btnPrimario} onClick={activarAvisos}>Activar avisos</button>}
            <button style={btnSecundario} onClick={() => router.push("/mas")}>Instalar la app en mi celu</button>
          </Tarjeta>

          <Tarjeta n={6} hecho={hechos[5]} titulo="Tus ventas anteriores (opcional)"
            texto="Si ya vendías antes, subí tus ventas (Excel, PDF o una foto del cuaderno) o conectá Mercado Pago y NICOLE arranca con historia. Si empezás de cero, saltealo: se llena solo con la caja.">
            {hechos[5] && <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Ya hay ventas cargadas.</div>}
            <SubirVentas token={token} onListo={() => cargarEstado(token)} />
            <button style={btnSecundario} onClick={conectarMercadoPago}>Conectar Mercado Pago</button>
          </Tarjeta>

          <Tarjeta n={7} hecho={hechos[6]} titulo="Tu negocio"
            texto="Rubro y zona de tu negocio. Con eso NICOLE lo compara con el patrón correcto y con negocios parecidos al tuyo.">
            {hechos[6]
              ? <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Rubro y zona cargados.</div>
              : <button style={btnPrimario} onClick={() => router.push("/onboarding?desde=pasos")}>Completar los datos</button>}
          </Tarjeta>

          <Tarjeta n={8} hecho={hechos[7]} titulo="Tus locales (opcional)"
            texto="Cargá la dirección de cada local para que NICOLE los compare con otros de tu zona. Si tenés uno solo y no te urge, podés dejarlo para después.">
            <button style={hechos[7] ? btnSecundario : btnPrimario} onClick={() => router.push("/red")}>{hechos[7] ? "Ver mis locales" : "Cargar mis locales"}</button>
          </Tarjeta>
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
