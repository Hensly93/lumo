"use client";
// RegistroSimple — registrarse en LumoBi con una pregunta por pantalla (14/11/2026)
// Regla: que lo pueda hacer cualquiera, sin dudar. Un dato por pantalla, botones grandes, nada opcional
// que distraiga. CUIT, zona y tamaño del negocio se piden después, cuando hacen falta.
// Al terminar entra directo a "Abrí tu caja".
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const TINTA = "#0A1628";
const AZUL = "#0A5BD3";
const SUAVE = "#64748B";
const BORDE = "#CBD5E1";
const FUENTE = "var(--font-instrument),-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

const RUBROS: { id: string; nombre: string; icono: string }[] = [
  { id: "kiosko", nombre: "Kiosco", icono: "🍫" },
  { id: "almacen", nombre: "Almacén", icono: "🥫" },
  { id: "supermercado", nombre: "Supermercado", icono: "🛒" },
  { id: "cafeteria_bar", nombre: "Café o bar", icono: "☕" },
  { id: "restaurante", nombre: "Restaurante o parrilla", icono: "🍽️" },
  { id: "panaderia", nombre: "Panadería", icono: "🥐" },
  { id: "farmacia", nombre: "Farmacia", icono: "💊" },
  { id: "retail_indumentaria", nombre: "Ropa u otro comercio", icono: "🛍️" },
];

const input: React.CSSProperties = {
  width: "100%", padding: "16px", background: "#FFFFFF", border: `1.5px solid ${BORDE}`, borderRadius: 12,
  color: TINTA, fontSize: 18, fontFamily: FUENTE, outline: "none", boxSizing: "border-box",
};
const btn = (activo: boolean): React.CSSProperties => ({
  width: "100%", padding: "17px", background: activo ? AZUL : "#E2E8F0", border: "none", borderRadius: 12,
  color: activo ? "#FFFFFF" : SUAVE, fontSize: 18, fontWeight: 700, cursor: activo ? "pointer" : "default", fontFamily: FUENTE,
});

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export default function RegistroSimple() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [d, setD] = useState({ rubro: "", negocio: "", nombre: "", celular: "", email: "", password: "" });
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const TOTAL = 4;

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => { setD({ ...d, [k]: e.target.value }); setError(""); };
  const siguiente = () => { setError(""); setPaso((p) => p + 1); };

  async function crear() {
    if (!emailOk(d.email)) { setError("Revisá el email: tiene que ser como nombre@gmail.com"); return; }
    if (d.password.length < 6) { setError("La contraseña tiene que tener 6 letras o números como mínimo"); return; }
    setCargando(true); setError("");
    try {
      const r = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: d.nombre.trim(), negocio: d.negocio.trim(), tipo_negocio: d.rubro,
          celular: d.celular, email: d.email.trim(), password: d.password,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "No se pudo crear la cuenta. Probá de nuevo.");
      localStorage.setItem("lumo_token", data.token);
      localStorage.setItem("lumo_usuario", JSON.stringify(data.usuario));
      try { sessionStorage.setItem("lumo_ya_uso_prueba", data.plan && data.plan.ya_uso_prueba ? "1" : "0"); } catch { /* sin acceso */ }
      router.replace("/primeros-pasos?paso=caja");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  const titulo = (t: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 23, fontWeight: 800, color: TINTA, lineHeight: 1.25 }}>{t}</div>
      {sub && <div style={{ fontSize: 15, color: SUAVE, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Avance */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        {paso > 0 && (
          <button type="button" onClick={() => { setPaso(paso - 1); setError(""); }}
            style={{ background: "none", border: "none", color: SUAVE, fontSize: 15, cursor: "pointer", padding: 0, fontFamily: FUENTE }}>
            ← Atrás
          </button>
        )}
        <div style={{ flex: 1, display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} style={{ width: i === paso ? 22 : 8, height: 8, borderRadius: 4, background: i <= paso ? AZUL : "#E2E8F0" }} />
          ))}
        </div>
      </div>

      {paso === 0 && (
        <>
          {titulo("¿Qué negocio tenés?", "Tocá el que más se parece.")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {RUBROS.map((r) => (
              <button key={r.id} type="button" onClick={() => { setD({ ...d, rubro: r.id }); setPaso(1); }}
                style={{
                  padding: "16px 10px", borderRadius: 14, cursor: "pointer", fontFamily: FUENTE,
                  border: `1.5px solid ${d.rubro === r.id ? AZUL : BORDE}`, background: d.rubro === r.id ? "#EAF2FE" : "#FFFFFF",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}>
                <span style={{ fontSize: 30 }}>{r.icono}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: TINTA, textAlign: "center", lineHeight: 1.2 }}>{r.nombre}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {paso === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); if (d.negocio.trim() && d.nombre.trim()) siguiente(); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {titulo("¿Cómo se llama tu negocio?")}
          <input style={input} value={d.negocio} onChange={set("negocio")} placeholder="Ej: Kiosco Don Pepe" aria-label="Nombre del negocio" autoFocus />
          <div style={{ fontSize: 17, fontWeight: 700, color: TINTA, marginTop: 6 }}>¿Y vos cómo te llamás?</div>
          <input style={input} value={d.nombre} onChange={set("nombre")} placeholder="Tu nombre" aria-label="Tu nombre" autoComplete="given-name" />
          <button type="submit" style={btn(!!(d.negocio.trim() && d.nombre.trim()))}>Seguir</button>
        </form>
      )}

      {paso === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); if (d.celular.replace(/\D/g, "").length >= 8) siguiente(); else setError("Escribí tu celular con el código de área, ej: 11 2345 6789"); }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {titulo("¿Cuál es tu celular?", "Por si necesitás ayuda, te escribimos por WhatsApp.")}
          <input style={input} type="tel" inputMode="tel" value={d.celular} onChange={set("celular")} placeholder="11 2345 6789" aria-label="Celular" autoComplete="tel" autoFocus />
          {error && <div role="alert" style={{ color: "#B91C1C", fontSize: 15, lineHeight: 1.5 }}>{error}</div>}
          <button type="submit" style={btn(d.celular.replace(/\D/g, "").length >= 8)}>Seguir</button>
        </form>
      )}

      {paso === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); crear(); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {titulo("Último paso", "Con esto entrás a LumoBi desde cualquier celu o compu.")}
          <input style={input} type="email" inputMode="email" value={d.email} onChange={set("email")} placeholder="Tu email" aria-label="Tu email" autoComplete="email" autoFocus />
          <div style={{ position: "relative" }}>
            <input style={{ ...input, paddingRight: 90 }} type={ver ? "text" : "password"} value={d.password} onChange={set("password")}
              placeholder="Inventá una contraseña" aria-label="Contraseña" autoComplete="new-password" />
            <button type="button" onClick={() => setVer(!ver)}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: AZUL, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE }}>
              {ver ? "Ocultar" : "Ver"}
            </button>
          </div>
          <div style={{ fontSize: 13, color: SUAVE }}>Mínimo 6 letras o números.</div>
          {error && <div role="alert" style={{ color: "#B91C1C", fontSize: 15, lineHeight: 1.5 }}>{error}</div>}
          <button type="submit" disabled={cargando} style={btn(!cargando && !!d.email && d.password.length >= 6)}>
            {cargando ? "Creando tu cuenta…" : "Crear mi cuenta gratis"}
          </button>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: SUAVE, textAlign: "center", lineHeight: 1.6 }}>
            5 días gratis, sin tarjeta. Al crear tu cuenta aceptás los <a href="/terminos" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>términos</a> y la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>privacidad</a>.
          </p>
        </form>
      )}
    </div>
  );
}
