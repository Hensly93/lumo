"use client";
// RegistroSimple — registrarse en LumoBi con una pregunta por pantalla (14/11/2026)
// Regla: que lo pueda hacer cualquiera, sin dudar. Un dato por pantalla, botones grandes, nada opcional
// que distraiga. CUIT, zona y tamaño del negocio se piden después, cuando hacen falta.
// Al terminar entra directo a "Abrí tu caja".
import InstalarLumo from "../components/InstalarLumo";
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

// El core de LumoBi, contado en simple y agrupado por pilar. Solo lo que el producto ya hace.
type Pilar = { id: string; icono: string; titulo: string; resumen: string; items: string[] };
const PILARES: Pilar[] = [
  {
    id: "cobrar", icono: "🧾", titulo: "Cobrar",
    resumen: "LumoBi es la caja de tu local.",
    items: [
      "Cobrás con pistola lectora o buscando el producto",
      "Efectivo, QR, débito y crédito",
      "Cada venta guarda qué se vendió y quién la cobró",
      "Si un producto no está, se carga en el momento",
      "Funciona aunque se corte internet",
    ],
  },
  {
    id: "controlar", icono: "👥", titulo: "Controlar tu equipo y tu caja",
    resumen: "Sabés qué pasa en cada turno aunque no estés.",
    items: [
      "Cada empleado entra con su PIN",
      "Diferencias de caja de cada turno, en pesos",
      "Conteos sorpresa durante el turno",
      "Cuánto vende y qué ticket hace cada empleado",
      "Riesgo del equipo: detecta patrones que se repiten",
      "Quién cambió cada precio y cuándo",
    ],
  },
  {
    id: "predecir", icono: "📈", titulo: "Predecir",
    resumen: "Te dice qué va a pasar antes de que pase.",
    items: [
      "Cuánto vas a vender cada día de la semana",
      "Tus horas pico y tus horas flojas",
      "Tiene en cuenta clima, feriados y principio de mes",
      "Proyección de hoy: a este ritmo, cuánto cerrás",
    ],
  },
  {
    id: "recomendar", icono: "💡", titulo: "Recomendar",
    resumen: "No solo muestra números: te dice qué hacer.",
    items: [
      "Combos con lo que tus clientes ya compran juntos",
      "Qué reponer y qué producto se dejó de vender",
      "Qué productos te dejan más plata y cuáles menos",
      "Aumentos de tus proveedores y a cuánto subir el precio",
    ],
  },
  {
    id: "datos", icono: "📊", titulo: "Tus datos, claros",
    resumen: "Todo lo que pasa en tu negocio, en una pantalla.",
    items: [
      "Dónde se te va la plata, con el monto",
      "Comparás días, semanas y meses",
      "Productos más y menos vendidos",
      "Ganancia real y margen de cada producto",
      "Uno o varios locales, por separado y juntos",
    ],
  },
  {
    id: "avisos", icono: "🔔", titulo: "Avisos y NICOLE",
    resumen: "LumoBi te busca a vos, no al revés.",
    items: [
      "Informe de cada turno al celu, apenas cierra la caja",
      "Te avisa en el momento cuando algo se desvía",
      "Qué esperar mañana, todas las noches",
      "NICOLE: le preguntás lo que quieras de tu negocio",
    ],
  },
];
const PILAR = Object.fromEntries(PILARES.map((p) => [p.id, p]));

function Tarjeta({ id }: { id: string }) {
  const f = PILAR[id];
  return (
    <div style={{ padding: "12px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{f.icono}</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TINTA }}>{f.titulo}</div>
          <div style={{ fontSize: 13, color: SUAVE }}>{f.resumen}</div>
        </div>
      </div>
      {f.items.map((it) => (
        <div key={it} style={{ display: "flex", gap: 8, fontSize: 14, color: "#334155", lineHeight: 1.45, marginTop: 4 }}>
          <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span><span>{it}</span>
        </div>
      ))}
    </div>
  );
}

// Un ejemplo concreto según el rubro elegido
const EJEMPLO: Record<string, string> = {
  kiosko: "Por ejemplo: si hoy los alfajores se venden el doble que siempre, LumoBi te avisa y te sugiere un combo con lo que tus clientes ya compran juntos.",
  almacen: "Por ejemplo: si un producto que se vendía todos los días dejó de venderse, LumoBi te avisa que probablemente te falta stock y cuánta plata perdés por día.",
  supermercado: "Por ejemplo: LumoBi te muestra qué cajera cierra con diferencias, qué productos te dejan poco margen y qué reponer antes del fin de semana.",
  cafeteria_bar: "Por ejemplo: si 6 de cada 10 que piden café se llevan una medialuna, LumoBi te arma el combo y te dice cuánto ganarías por mes.",
  restaurante: "Por ejemplo: LumoBi te avisa una hora antes de tu franja fuerte cuánto vas a vender y qué platos no pueden faltar.",
  panaderia: "Por ejemplo: LumoBi te dice cuánto vas a vender mañana para que no sobre ni falte, y en qué horario se te va la plata.",
  farmacia: "Por ejemplo: LumoBi te muestra qué productos te dejan más margen y te avisa si una caja cierra con diferencia.",
  retail_indumentaria: "Por ejemplo: LumoBi te dice qué días y horarios rinden más, quién del equipo vende mejor y qué se dejó de vender.",
};

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
      <InstalarLumo compacta />
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
          <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.55, padding: "12px 14px", background: "#EAF2FE", borderRadius: 12, marginBottom: 6 }}>
            <strong style={{ color: TINTA }}>LumoBi es la caja de tu negocio y el encargado que lo controla todo:</strong> cobra con pistola lectora, controla a tu equipo, te avisa dónde perdés plata, predice cuánto vas a vender y te dice qué hacer.
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {PILARES.map((p) => (
                <span key={p.id} style={{ fontSize: 13, fontWeight: 700, color: TINTA, background: "#FFFFFF", border: "1px solid #D6E4FB", borderRadius: 999, padding: "5px 10px" }}>
                  {p.icono} {p.titulo}
                </span>
              ))}
            </div>
          </div>
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
          <div style={{ fontSize: 13, fontWeight: 700, color: SUAVE, letterSpacing: 1, textTransform: "uppercase", marginTop: 10 }}>Qué vas a tener</div>
          <Tarjeta id="cobrar" />
          <Tarjeta id="controlar" />
        </form>
      )}

      {paso === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); if (d.celular.replace(/\D/g, "").length >= 8) siguiente(); else setError("Escribí tu celular con el código de área, ej: 11 2345 6789"); }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {titulo("¿Cuál es tu celular?", "Por si necesitás ayuda, te escribimos por WhatsApp.")}
          <input style={input} type="tel" inputMode="tel" value={d.celular} onChange={set("celular")} placeholder="11 2345 6789" aria-label="Celular" autoComplete="tel" autoFocus />
          {error && <div role="alert" style={{ color: "#B91C1C", fontSize: 15, lineHeight: 1.5 }}>{error}</div>}
          <button type="submit" style={btn(d.celular.replace(/\D/g, "").length >= 8)}>Seguir</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: SUAVE, letterSpacing: 1, textTransform: "uppercase", marginTop: 10 }}>Y además</div>
          <Tarjeta id="predecir" />
          <Tarjeta id="recomendar" />
          {EJEMPLO[d.rubro] && <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.55, fontStyle: "italic" }}>{EJEMPLO[d.rubro]}</div>}
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
          <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.5, padding: "12px 14px", background: "#EAF2FE", borderRadius: 12, marginTop: 4 }}>
            <strong style={{ color: TINTA }}>5 días gratis, sin tarjeta, con todo incluido.</strong> Después, desde $45.000 por mes + IVA. Si no te sirve, no pagás nada.
          </div>
          <Tarjeta id="datos" />
          <Tarjeta id="avisos" />
          <p style={{ margin: "2px 0 0", fontSize: 12, color: SUAVE, textAlign: "center", lineHeight: 1.6 }}>
             Al crear tu cuenta aceptás los <a href="/terminos" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>términos</a> y la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>privacidad</a>.
          </p>
        </form>
      )}
    </div>
  );
}
