"use client";
// LumoBi Partners — página pública. Pensada para que la entienda cualquiera, desde el celular:
// frases cortas, una idea por bloque, montos en pesos, un "video" de 1 minuto y el alta en 2 pasos.
// Sin testimonios ni cifras inventadas: la cuenta dice qué supone.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API, C, FUENTE, REGLAS_BASE, Reglas, boton, botonSec, input, pedir, pesos, tarjeta, guardarToken, tokenPartner } from "./comun";
import { lecciones } from "./lecciones";
import Historias from "./Historias";
import { DOLOR, QUE_HACE } from "./guia";

const WHATSAPP = "5491166959457";

export default function PaginaPartners() {
  const router = useRouter();
  const [R, setR] = useState<Reglas>(REGLAS_BASE);
  const [n, setN] = useState(10);
  const [ref, setRef] = useState<string | null>(null);
  const [refNombre, setRefNombre] = useState<string | null>(null);
  const [video, setVideo] = useState(false);
  const [paso, setPaso] = useState<1 | 2>(1);
  const [f, setF] = useState({ nombre: "", celular: "", zona: "", email: "", password: "", acepto: false });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [yaPartner, setYaPartner] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/partners/reglas`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) setR(j); }).catch(() => {});
    const q = new URLSearchParams(window.location.search).get("ref");
    const ya = !!tokenPartner();
    Promise.resolve().then(() => { setYaPartner(ya); if (q) setRef(q); });
    if (q) fetch(`${API}/api/partners/codigo/${encodeURIComponent(q)}`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && j.valido) setRefNombre(j.nombre); }).catch(() => {});
  }, []);

  const alta = R.alta_monto;
  const mes = R.cartera_monto;
  // Mes M sumando N comercios por mes (todos siguen pagando): los nuevos del mes dejan su alta y TODOS los anteriores dejan su mensualidad.
  const cuenta = (m: number) => { const nuevos = n, cartera = n * (m - 1); return { nuevos, cartera, deNuevos: nuevos * alta, deCartera: cartera * mes, total: nuevos * alta + cartera * mes }; };
  const video1 = lecciones(R)[1];

  function seguir(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (f.nombre.trim().length < 2) return setError("Escribí tu nombre y apellido.");
    if (f.celular.replace(/\D/g, "").length < 8) return setError("Escribí tu celular con WhatsApp.");
    setPaso(2);
  }
  async function registrar(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!f.acepto) return setError("Marcá la casilla para aceptar las reglas.");
    setCargando(true);
    try {
      const j = await pedir<{ token: string }>("/api/partners/registro", { cuerpo: { ...f, ref } });
      guardarToken(j.token);
      router.push("/partners/formacion");
    } catch (er) { setError((er as Error).message); } finally { setCargando(false); }
  }

  const h2: React.CSSProperties = { fontSize: 24, lineHeight: 1.2, margin: "0 0 14px", color: C.tinta };
  const grande: React.CSSProperties = { fontSize: 18, lineHeight: 1.5, color: C.suave, margin: 0 };

  return (
    <main style={{ background: C.papel, minHeight: "100vh", fontFamily: FUENTE, color: C.tinta }}>
      {video && <Historias pantallas={video1.pantallas} titulo="Cómo funciona · 1 minuto" textoFin="Quiero ser partner"
        onCerrar={() => setVideo(false)} onFin={() => { setVideo(false); document.getElementById("alta")?.scrollIntoView({ behavior: "smooth" }); }} />}

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 16px 60px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <Link href="/landing" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lumobi-logo-light.svg" alt="LumoBi" width={104} height={27} />
            <span style={{ fontWeight: 800, color: C.azul, fontSize: 15 }}>Partners</span>
          </Link>
          <Link href={yaPartner ? "/partners/panel" : "/partners/ingresar"} style={{ color: C.azul, fontWeight: 700, textDecoration: "none", fontSize: 16, padding: "8px 4px" }}>
            {yaPartner ? "Mi panel →" : "Ya soy partner"}
          </Link>
        </header>

        {refNombre && (
          <div style={{ ...tarjeta, background: C.okFondo, borderColor: "#B7DFCB", fontSize: 16 }}>👋 Te invitó <b>{refNombre}</b>.</div>
        )}

        {/* 1. La promesa */}
        <section style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.azul, letterSpacing: 0.5, marginBottom: 8 }}>LUMOBI PARTNERS · VENDEDORES A COMISIÓN</div>
          <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: "0 0 10px" }}>Cobrá {pesos(alta)} por cada comercio que recomendás.</h1>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.azul, lineHeight: 1.25, margin: "0 0 8px" }}>Y {pesos(mes)} por mes por CADA comercio que siga.</div>
          <div style={{ fontSize: 17, color: C.suave, margin: "0 0 14px" }}>Ejemplo: con 10 comercios cobrás <b style={{ color: C.tinta }}>{pesos(mes * 10)} todos los meses</b>. Con 50, <b style={{ color: C.tinta }}>{pesos(mes * 50)}</b>.</div>
          <div style={{ background: C.okFondo, border: "1px solid #B7DFCB", borderRadius: 12, padding: "12px 14px", fontSize: 17, fontWeight: 700, marginBottom: 12 }}>💼 Buscamos vendedores a comisión. Vos le presentás LumoBi a comercios; nosotros les damos el sistema y te pagamos por cada uno.</div>
          <p style={{ ...grande, marginBottom: 18 }}>Manejás tus horarios. Te damos la formación, los mensajes y tu panel para seguir a tus clientes. Cobrás por transferencia.</p>
          <div style={{ display: "grid", gap: 10 }}>
            <a href="#alta" style={{ ...boton, display: "block", textAlign: "center", textDecoration: "none", fontSize: 18, padding: 17 }}>Quiero ser partner</a>
            <button style={{ ...botonSec, fontSize: 17 }} onClick={() => setVideo(true)}>▶ Mirá cómo funciona (1 minuto)</button>
          </div>
        </section>

        {/* 2. Cuánto gano, en dos números */}
        <section style={tarjeta}>
          <h2 style={h2}>Cuánto ganás por cada comercio</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <Numero icono="🎉" monto={pesos(alta)} texto="cuando paga su primer mes" />
            <Numero icono="🔁" monto={pesos(mes)} texto="por mes, por cada comercio que sigue pagando" />
          </div>
          <p style={{ fontSize: 15, color: C.apagada, margin: "12px 0 0", lineHeight: 1.5 }}>Es por comercio, no por local: si tiene 1 local o 10, cobrás lo mismo.</p>
        </section>

        {/* 3. Calculadora con botones grandes */}
        <section style={tarjeta}>
          <h2 style={h2}>Hacé la cuenta</h2>
          <div style={{ fontSize: 17, color: C.suave, marginBottom: 12 }}>¿Cuántos comercios vas a sumar por mes? Poné tu número.</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12 }}>
            <BotonRedondo onClick={() => setN(Math.max(1, n - 1))}>−</BotonRedondo>
            <input type="number" inputMode="numeric" min={1} max={999} value={n}
              onChange={(e) => setN(Math.max(1, Math.min(999, Math.floor(Number(e.target.value) || 1))))}
              style={{ width: 110, fontSize: 44, fontWeight: 800, textAlign: "center", border: `2px solid ${C.linea}`, borderRadius: 14, padding: "4px 0", color: C.tinta, fontFamily: FUENTE, background: C.blanco }} />
            <BotonRedondo onClick={() => setN(Math.min(999, n + 1))}>+</BotonRedondo>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            {[5, 10, 20, 30, 50].map((x) => (
              <button key={x} onClick={() => setN(x)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${n === x ? C.azul : C.linea}`, background: n === x ? C.azul : C.blanco, color: n === x ? C.blanco : C.tinta, fontWeight: 700, fontSize: 15, fontFamily: FUENTE, cursor: "pointer" }}>{x}</button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[3, 6, 12].map((m) => { const c = cuenta(m); return (
              <div key={m} style={{ background: C.papel, borderRadius: 14, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>En el mes {m} cobrás</span>
                  <b style={{ fontSize: 24 }}>{pesos(c.total)}</b>
                </div>
                <div style={{ fontSize: 14, color: C.suave, marginTop: 6, lineHeight: 1.5 }}>
                  🎉 {c.nuevos} {c.nuevos === 1 ? "comercio nuevo" : "comercios nuevos"}: {pesos(c.deNuevos)}<br />
                  🔁 {c.cartera} que ya tenés en tu cartera: {pesos(c.deCartera)}
                </div>
              </div>
            ); })}
          </div>
          <p style={{ fontSize: 14, color: C.apagada, margin: "12px 0 0", lineHeight: 1.5 }}>Tu cartera crece cada mes: los comercios que ya tenés siguen pagando y se suman los nuevos. No hay tope: cuantos más sumás, más cobrás. La cuenta supone que tus comercios siguen pagando.</p>
        </section>

        {/* 4. Cómo funciona, 3 pasos con dibujo */}
        <section style={tarjeta}>
          <h2 style={h2}>Así de simple</h2>
          {[
            ["📲", "Mandás tu link", "Por WhatsApp. El mensaje ya está escrito."],
            ["🆓", "El comercio prueba gratis", "5 días, sin tarjeta."],
            ["💸", "Si se queda, cobrás", "El primer mes y todos los meses que siga."],
          ].map(([ic, t, d]) => (
            <div key={t} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: C.papel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{ic}</div>
              <div><div style={{ fontWeight: 800, fontSize: 18 }}>{t}</div><div style={{ fontSize: 16, color: C.suave }}>{d}</div></div>
            </div>
          ))}
          <div style={{ ...tarjeta, background: "#E8F0FC", borderColor: "#C9DAF6", margin: "4px 0 0", fontSize: 16, lineHeight: 1.5 }}>
            🎓 Apenas te registrás, hacés una <b>formación corta</b> (7 lecciones de 1 o 2 minutos) que te explica todo: el problema que resuelve LumoBi, a quién buscar, cómo encontrar clientes en la calle y por internet, y qué decir.
          </div>
        </section>

        {/* El dolor y la solución: lo que el partner va a vender */}
        <section style={{ ...tarjeta, background: C.tinta, borderColor: C.tinta, color: C.blanco }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.cian, letterSpacing: 0.5, marginBottom: 8 }}>EL PROBLEMA</div>
          <h2 style={{ ...h2, color: C.blanco }}>Los comercios pierden plata todos los meses y no se enteran</h2>
          {DOLOR.map((x) => (
            <div key={x.titulo} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 24, width: 32, textAlign: "center", flexShrink: 0 }}>{x.icono}</span>
              <div><div style={{ fontWeight: 800, fontSize: 17 }}>{x.titulo}</div><div style={{ fontSize: 15, opacity: 0.8, lineHeight: 1.45 }}>{x.texto}</div></div>
            </div>
          ))}
        </section>
        <section style={tarjeta}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.azul, letterSpacing: 0.5, marginBottom: 8 }}>LA SOLUCIÓN</div>
          <h2 style={h2}>LumoBi cuida la plata del comercio</h2>
          <p style={{ ...grande, fontSize: 16, marginBottom: 14 }}>No es una caja más: es la inteligencia del negocio. Aprende cómo funciona, detecta cuándo se desvía de lo normal y avisa antes de que sea tarde.</p>
          {QUE_HACE.map((x) => (
            <div key={x.titulo} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: C.papel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>{x.icono}</div>
              <div><div style={{ fontWeight: 800, fontSize: 17 }}>{x.titulo}</div><div style={{ fontSize: 15, color: C.suave, lineHeight: 1.45 }}>{x.texto}</div></div>
            </div>
          ))}
        </section>

        {/* 5. A quién */}
        <section style={tarjeta}>
          <h2 style={h2}>A quién se lo ofrecés</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {["🏪 Kioscos medianos y grandes", "🛒 Autoservicios", "🧺 Minimercados", "🏬 Supermercados", "📦 Mayoristas"].map((x) => (
              <span key={x} style={{ background: C.papel, borderRadius: 20, padding: "8px 12px", fontSize: 15, fontWeight: 600 }}>{x}</span>
            ))}
          </div>
          <p style={{ ...grande, fontSize: 16 }}><b>Desde 3 empleados en adelante</b>, sin techo: 3, 10, 50 o más, con uno o varios locales. No es para el kiosco chico que atiende el dueño solo, ni para restaurantes, bares o cafés.</p>
        </section>

        {/* 6. Reglas en criollo */}
        <section style={tarjeta}>
          <h2 style={h2}>Las reglas</h2>
          {[
            ["✅", "Todos cobran lo mismo por comercio. Gana más el que trae más comercios."],
            ["🔗", "El comercio es tuyo solo si se registra con tu link."],
            ["💳", "Cobrás cuando el comercio paga. Si solo prueba y no paga, no hay comisión."],
            ["⏳", `La plata queda ${R.retencion_dias} días en espera y después te la transferimos a tu alias o CBU.`],
            ["🏦", "Para cobrar solo necesitás un CBU, CVU o alias. No hace falta ser monotributista."],
            ["🤝", `Si invitás a alguien a ser partner, cobrás ${pesos(R.bono_por_negocio)} por cada comercio que él traiga y pague, hasta ${R.bono_tope} comercios (${pesos(R.bono_por_negocio * R.bono_tope)} por cada partner que invites). No cobrás de los que invite él: no es una pirámide.`],
            ["⭐", `Con ${R.elite_clientes} comercios pagando pasás a Elite: los nuevos te dejan ${pesos(R.elite_cartera_monto)} por mes.`],
            ["🚫", "Prohibido prometer ahorros, mandar spam o hacerte pasar por empleado de LumoBi."],
          ].map(([ic, t]) => (
            <div key={t} style={{ display: "flex", gap: 12, fontSize: 16, lineHeight: 1.45, color: C.suave, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{ic}</span><span>{t}</span>
            </div>
          ))}
        </section>

        {/* 7. Alta en 2 pasos */}
        <section id="alta" style={{ ...tarjeta, border: `2px solid ${C.azul}`, scrollMarginTop: 16 }}>
          <div style={{ fontSize: 14, color: C.apagada, fontWeight: 700, marginBottom: 4 }}>Paso {paso} de 2</div>
          <h2 style={{ ...h2, marginBottom: 16 }}>{paso === 1 ? "Sumate como partner" : "Tu cuenta"}</h2>
          {paso === 1 ? (
            <form onSubmit={seguir} style={{ display: "grid", gap: 12 }}>
              <Campo etiqueta="Tu nombre y apellido"><input style={input} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoComplete="name" /></Campo>
              <Campo etiqueta="Tu celular con WhatsApp"><input style={input} type="tel" inputMode="tel" placeholder="11 5555 1234" value={f.celular} onChange={(e) => setF({ ...f, celular: e.target.value })} autoComplete="tel" /></Campo>
              <Campo etiqueta="¿En qué zona vas a trabajar? (opcional)"><input style={input} placeholder="Ej.: Morón, Haedo" value={f.zona} onChange={(e) => setF({ ...f, zona: e.target.value })} /></Campo>
              {error && <div style={{ color: C.critico, fontSize: 15 }}>{error}</div>}
              <button type="submit" style={{ ...boton, fontSize: 18 }}>Seguir</button>
            </form>
          ) : (
            <form onSubmit={registrar} style={{ display: "grid", gap: 12 }}>
              <Campo etiqueta="Tu email"><input style={input} type="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Campo>
              <Campo etiqueta="Inventá una contraseña (8 letras o números)"><input style={input} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /></Campo>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, color: C.suave, lineHeight: 1.45, background: C.papel, padding: 12, borderRadius: 12 }}>
                <input type="checkbox" checked={f.acepto} onChange={(e) => setF({ ...f, acepto: e.target.checked })} style={{ marginTop: 2, width: 22, height: 22, flexShrink: 0 }} />
                <span>Acepto las reglas. Sé que no es un empleo y que cobro por los comercios que paguen.</span>
              </label>
              {error && <div style={{ color: C.critico, fontSize: 15 }}>{error}</div>}
              <button type="submit" style={{ ...boton, fontSize: 18, opacity: cargando ? 0.6 : 1 }} disabled={cargando}>{cargando ? "Creando tu cuenta…" : "Crear mi cuenta"}</button>
              <button type="button" onClick={() => { setPaso(1); setError(""); }} style={{ background: "none", border: "none", color: C.azul, fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: FUENTE }}>← Volver</button>
            </form>
          )}
        </section>

        <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola, quiero saber más de LumoBi Partners")}`}
          style={{ ...botonSec, display: "block", textAlign: "center", textDecoration: "none", borderColor: "#1FA855", color: "#13803F" }}>💬 ¿Dudas? Escribinos por WhatsApp</a>
      </div>
    </main>
  );
}

function Numero({ icono, monto, texto }: { icono: string; monto: string; texto: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.papel, borderRadius: 14, padding: 14 }}>
      <span style={{ fontSize: 30 }}>{icono}</span>
      <div><div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>{monto}</div><div style={{ fontSize: 16, color: C.suave }}>{texto}</div></div>
    </div>
  );
}
function BotonRedondo({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ width: 60, height: 60, borderRadius: 30, border: `2px solid ${C.azul}`, background: C.blanco, color: C.azul, fontSize: 32, fontWeight: 700, cursor: "pointer", lineHeight: 1, fontFamily: FUENTE }}>{children}</button>;
}
function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 16, fontWeight: 700 }}>{etiqueta}</span>{children}</label>;
}
