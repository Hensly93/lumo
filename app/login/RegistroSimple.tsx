"use client";
// RegistroSimple — registrarse en LumoBi en 3 pantallas + una de bienvenida (17/11/2026)
// Regla: que 9 de cada 10 lo terminen. Poco para escribir (rubro, tamaño con un toque, negocio + email + contraseña),
// cada dato con su "para qué" en una línea, el precio a la vista antes de crear la cuenta (se arma con el tamaño:
// locales, cajas y empleados) y, al terminar, una pantalla que muestra lo que LumoBi ya dejó hecho.
// Celular, CUIT y dirección se piden después, cuando hacen falta.
import InstalarLumo from "../components/InstalarLumo";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "../lib/track";
import { RUBROS } from "../lib/rubros";
import { leerRefPartner } from "../components/PartnerRef";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const TINTA = "#0A1628";
const AZUL = "#0A5BD3";
const SUAVE = "#64748B";
const BORDE = "#CBD5E1";
const FUENTE = "var(--font-instrument),-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

// El core de LumoBi, contado en simple y agrupado por pilar. Solo lo que el producto ya hace.
type Pilar = { id: string; icono: string; titulo: string; resumen: string; items: string[] };
const PILARES: Pilar[] = [
  {
    id: "cobrar", icono: "🧾", titulo: "Cobrar",
    resumen: "Una caja simple, hecha para que cada venta alimente el análisis.",
    items: [
      "Cada venta que cobrás es lo que LumoBi analiza para decirte dónde perdés plata",
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
      "Cuánto vende cada empleado y cuánto gasta cada cliente con él",
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
      "Cuánto ganás de verdad con cada producto",
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
  supermercado: "Por ejemplo: LumoBi te muestra qué cajera cierra con diferencias, qué productos te dejan poca ganancia y qué reponer antes del fin de semana.",
  farmacia: "Por ejemplo: LumoBi te muestra qué productos te dejan más ganancia y te avisa si una caja cierra con diferencia.",
  retail_indumentaria: "Por ejemplo: LumoBi te dice qué días y horarios rinden más, quién del equipo vende mejor y qué se dejó de vender.",
  retail_electronica: "Por ejemplo: LumoBi te muestra qué producto vendés mucho pero te deja poca ganancia, y cuál se vendía seguido y hace días no sale.",
  retail_hogar: "Por ejemplo: LumoBi te muestra qué productos te dejan más ganancia, cuáles se quedaron parados y qué horarios rinden más.",
  retail_otro: "Por ejemplo: LumoBi te muestra qué productos te dejan poca ganancia, quién del equipo vende mejor y qué se dejó de vender.",
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

// Tamaño del negocio: de esto sale el precio (precios.js). Se manda el tope de cada tramo, que es lo que define el escalón.
const LOCALES = [1, 2, 3, 4, 5];
const CAJAS = [1, 2, 3, 4, 5, 6];
const EMPLEADOS: { l: string; v: number }[] = [
  { l: "Hasta 5", v: 5 }, { l: "6 a 10", v: 10 }, { l: "11 a 20", v: 20 }, { l: "21 a 29", v: 29 }, { l: "30 o más", v: 30 },
];

type Plan = { plan: "normal" | "empresarial"; precio: number | null; desglose: { concepto: string; monto: number }[] };

const plata = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

// Nombre para la caja a partir del email (se puede cambiar después): "hens.castelly@gmail.com" → "Hens"
function nombreDeEmail(email: string): string {
  const base = (email.split("@")[0] || "").split(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]+/).filter(Boolean)[0] || "";
  return base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : "Dueño";
}

// PIN de 4 números al azar, sin repetidos ni escaleras fáciles
function pinAlAzar(): string {
  for (let i = 0; i < 30; i++) {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
    const p = String(n).padStart(4, "0");
    if (/^(\d)\1{3}$/.test(p) || "0123456789".includes(p) || "9876543210".includes(p)) continue;
    return p;
  }
  return "4827";
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={activo} onClick={onClick}
      style={{
        minWidth: 52, padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontFamily: FUENTE, fontSize: 16, fontWeight: 700,
        border: `1.5px solid ${activo ? AZUL : BORDE}`, background: activo ? "#EAF2FE" : "#FFFFFF", color: activo ? AZUL : TINTA,
      }}>
      {children}
    </button>
  );
}

export default function RegistroSimple() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [d, setD] = useState({ rubro: "", negocio: "", email: "", password: "" });
  const [tam, setTam] = useState({ locales: 1, cajas: 1, empleados: 5 });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planError, setPlanError] = useState(false);
  const [ver, setVer] = useState(false);
  const [comoFunciona, setComoFunciona] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [lista, setLista] = useState<{ nombre: string; pin: string | null }>({ nombre: "", pin: null });
  const TOTAL = 3;

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => { setD({ ...d, [k]: e.target.value }); setError(""); };
  const ir = (p: number) => { setError(""); setPaso(p); };

  // Qué pantalla ve cada persona: sirve para saber en cuál se cae la gente
  useEffect(() => { track("registro_paso", undefined, { paso }); }, [paso]);

  // El precio se arma en vivo con el tamaño (cálculo público del servidor: la misma fórmula que se cobra)
  useEffect(() => {
    if (paso !== 1 && paso !== 2 && paso !== 3) return;
    let vigente = true;
    setPlanError(false);
    fetch(`${API}/api/plan/calcular`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cajas: Array(tam.locales).fill(tam.cajas), empleados: tam.empleados }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("calc"))))
      .then((p: Plan) => { if (vigente) setPlan(p); })
      .catch(() => { if (vigente) { setPlan(null); setPlanError(true); } });
    return () => { vigente = false; };
  }, [tam, paso]);

  async function crear() {
    if (!d.negocio.trim()) { setError("Escribí cómo se llama tu negocio"); return; }
    if (!emailOk(d.email)) { setError("Revisá el email: tiene que ser como nombre@gmail.com"); return; }
    if (d.password.length < 6) { setError("La contraseña tiene que tener 6 letras o números como mínimo"); return; }
    setCargando(true); setError("");
    const nombre = nombreDeEmail(d.email);
    try {
      const r = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, negocio: d.negocio.trim(), tipo_negocio: d.rubro, email: d.email.trim(), password: d.password, partner_codigo: leerRefPartner() || undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "No se pudo crear la cuenta. Probá de nuevo.");
      localStorage.setItem("lumo_token", data.token);
      localStorage.setItem("lumo_usuario", JSON.stringify(data.usuario));
      try { sessionStorage.setItem("lumo_ya_uso_prueba", data.plan && data.plan.ya_uso_prueba ? "1" : "0"); } catch { /* sin acceso */ }

      // Lo que LumoBi deja hecho solo. Si algo falla, no frena nada: queda como paso en "Primeros pasos".
      const h = { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` };
      const pin = pinAlAzar();
      const [, caja] = await Promise.all([
        fetch(`${API}/api/plan/tamano`, { method: "PATCH", headers: h, body: JSON.stringify({ locales: tam.locales, cajas: tam.cajas, empleados: tam.empleados }) }).catch(() => null),
        fetch(`${API}/api/usuario/empleados`, { method: "POST", headers: h, body: JSON.stringify({ nombre, pin }) })
          .then(async (x) => (x.ok ? ((await x.json().catch(() => ({}))) as { id?: number }) : null)).catch(() => null),
      ]);
      if (caja && caja.id) {
        // Quien arma la caja puede dar de alta productos al escanearlos (si no, la primera venta se traba)
        await fetch(`${API}/api/usuario/empleados/${caja.id}`, { method: "PATCH", headers: h, body: JSON.stringify({ puede_cargar_productos: true }) }).catch(() => null);
      }
      setLista({ nombre, pin: caja ? pin : null });
      ir(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  const titulo = (t: string, sub?: string) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: TINTA, lineHeight: 1.25 }}>{t}</div>
      {sub && <div style={{ fontSize: 15, color: SUAVE, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
  const ayuda = (t: string) => <div style={{ fontSize: 13, color: SUAVE, marginTop: 5, lineHeight: 1.45 }}>{t}</div>;
  const etiqueta = (t: string, sub?: string) => (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: TINTA }}>{t}</div>
      {sub && <div style={{ fontSize: 13, color: SUAVE, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <InstalarLumo compacta />

      {/* Avance: solo en las 3 pantallas de datos */}
      {paso < 3 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          {paso > 0 && (
            <button type="button" onClick={() => ir(paso - 1)}
              style={{ background: "none", border: "none", color: SUAVE, fontSize: 15, cursor: "pointer", padding: 0, fontFamily: FUENTE }}>
              ← Atrás
            </button>
          )}
          <div style={{ flex: 1, display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: SUAVE, marginRight: 4 }}>Paso {paso + 1} de {TOTAL}</span>
            {Array.from({ length: TOTAL }, (_, i) => (
              <div key={i} style={{ width: i === paso ? 22 : 8, height: 8, borderRadius: 4, background: i <= paso ? AZUL : "#E2E8F0" }} />
            ))}
          </div>
        </div>
      )}

      {/* ── 1. Qué vendés ── */}
      {paso === 0 && (
        <>
          <div style={{ fontSize: 16, color: "#334155", lineHeight: 1.5, padding: "12px 14px", background: "#EAF2FE", borderRadius: 12 }}>
            <strong style={{ color: TINTA }}>LumoBi te muestra dónde perdés plata y qué hacer.</strong> 5 días gratis, sin tarjeta.
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10, fontSize: 14 }}>
              {["Cobrás con la caja de LumoBi", "LumoBi analiza cada venta", "Te avisa dónde perdés plata y qué hacer"].map((t, i) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden style={{ width: 22, height: 22, borderRadius: 11, background: AZUL, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          {titulo("¿Qué vendés?", "Tocá lo que más vendés. Si vendés de todo, elegí “Otro comercio”.")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {RUBROS.map((r) => (
              <button key={r.id} type="button" onClick={() => { setD({ ...d, rubro: r.id }); setError(""); }} aria-pressed={d.rubro === r.id}
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
          {EJEMPLO[d.rubro] && <div style={{ fontSize: 14, color: "#1E3A8A", lineHeight: 1.55, padding: "10px 12px", background: "#EAF2FE", borderRadius: 10 }}>{EJEMPLO[d.rubro]}</div>}
          <button type="button" style={btn(!!d.rubro)} onClick={() => { if (d.rubro) ir(1); else setError("Tocá el que más se parece a tu negocio"); }}>Seguir</button>
          {error && <div role="alert" style={{ color: "#B91C1C", fontSize: 15 }}>{error}</div>}
        </>
      )}

      {/* ── 2. Tamaño y plan ── */}
      {paso === 1 && (
        <>
          {titulo("¿De qué tamaño es tu negocio?", "Con esto armamos tu plan. Si tenés un solo local, dejá todo como está y seguí.")}
          {etiqueta("Locales")}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LOCALES.map((n) => <Chip key={n} activo={tam.locales === n} onClick={() => setTam({ ...tam, locales: n })}>{n === 5 ? "5 o más" : n}</Chip>)}
          </div>
          {etiqueta("Cajas en cada local", "Una caja es un lugar donde se cobra.")}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CAJAS.map((n) => <Chip key={n} activo={tam.cajas === n} onClick={() => setTam({ ...tam, cajas: n })}>{n === 6 ? "6 o más" : n}</Chip>)}
          </div>
          {etiqueta("Empleados", "Sin contarte a vos.")}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EMPLEADOS.map((o) => <Chip key={o.v} activo={tam.empleados === o.v} onClick={() => setTam({ ...tam, empleados: o.v })}>{o.l}</Chip>)}
          </div>

          <div style={{ padding: "12px 14px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, marginTop: 4 }}>
            {plan && plan.plan === "normal" && plan.precio != null ? (
              <>
                <div style={{ fontSize: 13, color: "#047857" }}>Tu plan</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#065F46" }}>{plata(plan.precio)} <span style={{ fontSize: 15, fontWeight: 600 }}>por mes + IVA</span></div>
                {plan.desglose.length > 1 && (
                  <div style={{ fontSize: 13, color: "#047857", marginTop: 4, lineHeight: 1.5 }}>
                    {plan.desglose.map((x) => <div key={x.concepto}>{x.concepto}: {plata(x.monto)}</div>)}
                  </div>
                )}
              </>
            ) : plan && plan.plan === "empresarial" ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#065F46" }}>Plan a medida</div>
                <div style={{ fontSize: 14, color: "#047857", marginTop: 2, lineHeight: 1.5 }}>Para un negocio de este tamaño armamos el precio con vos. Podés crear tu cuenta igual y probar 5 días gratis.</div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#047857" }}>{planError ? "Tu plan se calcula con este tamaño y lo ves antes de pagar." : "Calculando tu plan…"}</div>
            )}
            <div style={{ fontSize: 13, color: "#047857", marginTop: 6 }}>Pagás recién después de los 5 días gratis. Sin tarjeta.</div>
          </div>
          <button type="button" style={btn(true)} onClick={() => ir(2)}>Seguir</button>
        </>
      )}

      {/* ── 3. Cuenta ── */}
      {paso === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); crear(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {titulo("Creá tu cuenta", "Último paso: tres datos.")}
          <div>
            <input style={input} value={d.negocio} onChange={set("negocio")} placeholder="Ej: Kiosco Don Pepe" aria-label="Nombre del negocio" autoComplete="organization" autoFocus />
            {ayuda("Así se llama tu caja y tus informes.")}
          </div>
          <div>
            <input style={input} type="email" inputMode="email" value={d.email} onChange={set("email")} placeholder="Tu email" aria-label="Tu email" autoComplete="email" />
            {ayuda("Para entrar y recibir el resumen de cada turno.")}
          </div>
          <div>
            <div style={{ position: "relative" }}>
              <input style={{ ...input, paddingRight: 90 }} type={ver ? "text" : "password"} value={d.password} onChange={set("password")}
                placeholder="Elegí una contraseña" aria-label="Contraseña" autoComplete="new-password" />
              <button type="button" onClick={() => setVer(!ver)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: AZUL, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE, padding: "8px 10px" }}>
                {ver ? "Ocultar" : "Ver"}
              </button>
            </div>
            {ayuda("Mínimo 6 letras o números. Se guarda cifrada.")}
          </div>
          {error && <div role="alert" style={{ color: "#B91C1C", fontSize: 15, lineHeight: 1.5 }}>{error}</div>}
          <button type="submit" disabled={cargando} style={btn(!cargando && !!d.negocio.trim() && !!d.email && d.password.length >= 6)}>
            {cargando ? "Creando tu cuenta…" : "Crear mi cuenta gratis"}
          </button>
          <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.55, padding: "10px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12 }}>
            <div><strong style={{ color: TINTA }}>5 días gratis, sin tarjeta.</strong>{plan && plan.plan === "normal" && plan.precio != null ? <> Después, {plata(plan.precio)} por mes + IVA.</> : null}</div>
            <div style={{ marginTop: 4 }}>Nadie ve tus números. LumoBi aprende de todos los negocios del rubro, pero solo con promedios anónimos.</div>
          </div>
          <button type="button" onClick={() => setComoFunciona(!comoFunciona)} aria-expanded={comoFunciona}
            style={{ background: "none", border: "none", padding: 0, color: AZUL, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE, textAlign: "left" }}>
            {comoFunciona ? "Ocultar cómo funciona" : "¿Cómo funciona LumoBi? Mirá en 30 segundos"}
          </button>
          {comoFunciona && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Tarjeta id="cobrar" />
              <Tarjeta id="controlar" />
              <Tarjeta id="predecir" />
              <Tarjeta id="recomendar" />
            </div>
          )}
          <p style={{ margin: "2px 0 0", fontSize: 12, color: SUAVE, textAlign: "center", lineHeight: 1.6 }}>
            Al crear tu cuenta aceptás los <a href="/terminos" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>términos</a> y la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline" }}>privacidad</a>.
          </p>
        </form>
      )}

      {/* ── Cuenta lista ── */}
      {paso === 3 && (
        <>
          {titulo("Tu cuenta quedó lista", "Esto ya lo dejó hecho LumoBi por vos:")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              lista.pin ? `Caja creada a nombre de ${lista.nombre}` : null,
              lista.pin ? `PIN de la caja: ${lista.pin}. Anotalo: es la llave para abrirla. Lo cambiás en Mi local.` : null,
              plan && plan.plan === "normal" && plan.precio != null ? `Tu plan: ${plata(plan.precio)} por mes + IVA, recién después de los 5 días gratis.` : plan && plan.plan === "empresarial" ? "Tu plan: a medida. Lo armamos con vos." : "5 días de prueba gratis, sin tarjeta.",
            ].filter(Boolean).map((t) => (
              <div key={t as string} style={{ display: "flex", gap: 10, fontSize: 16, color: TINTA, lineHeight: 1.45 }}>
                <span aria-hidden style={{ width: 24, height: 24, borderRadius: 12, background: "#16A34A", color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          {!lista.pin && <div style={{ fontSize: 14, color: SUAVE, lineHeight: 1.5 }}>La caja la dejás lista en el primer paso de la próxima pantalla.</div>}
          <div style={{ padding: "12px 14px", background: "#EAF2FE", borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: TINTA }}>Siguiente: cargá tus productos más vendidos</div>
            <div style={{ fontSize: 14, color: "#334155", marginTop: 4, lineHeight: 1.5 }}>Con el costo de cada uno, LumoBi te dice cuáles te dejan plata y cuáles no. Podés empezar con los 20 que más vendés.</div>
          </div>
          <button type="button" style={btn(true)} onClick={() => router.replace("/primeros-pasos?paso=catalogo")}>Cargar mis productos</button>
          <button type="button" onClick={() => router.replace("/primeros-pasos")}
            style={{ background: "none", border: "none", color: SUAVE, fontSize: 15, cursor: "pointer", fontFamily: FUENTE, padding: 8 }}>
            Lo hago después
          </button>
        </>
      )}
    </div>
  );
}
