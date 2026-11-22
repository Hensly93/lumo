"use client";
// Página pública de LumoBi Partners: qué es, cuánto se gana (con los números reales del backend), reglas claras y alta.
// Sin testimonios ni cifras inventadas: la calculadora dice exactamente qué supone.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API, C, FUENTE, REGLAS_BASE, Reglas, boton, input, pedir, pesos, tarjeta, guardarToken, tokenPartner } from "./comun";

const WHATSAPP = "5491166959457";

export default function PaginaPartners() {
  const router = useRouter();
  const [R, setR] = useState<Reglas>(REGLAS_BASE);
  const [porMes, setPorMes] = useState(3);
  const [ref, setRef] = useState<string | null>(null);
  const [refNombre, setRefNombre] = useState<string | null>(null);
  const [f, setF] = useState({ nombre: "", email: "", celular: "", zona: "", password: "", acepto: false });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [yaPartner, setYaPartner] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/partners/reglas`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) setR(j); }).catch(() => {});
    const q = new URLSearchParams(window.location.search).get("ref");
    if (q) {
      setRef(q);
      fetch(`${API}/api/partners/codigo/${encodeURIComponent(q)}`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && j.valido) setRefNombre(j.nombre); }).catch(() => {});
    }
    setYaPartner(!!tokenPartner());
  }, []);

  const precio = R.precio_base || 45000;
  const alta = precio * R.alta_pct;
  const cartera = precio * R.cartera_pct;
  // Cartera al mes N si suma "porMes" negocios por mes y todos siguen pagando (los del mes recién pagan su alta)
  const mensualAl = (n: number) => porMes * (n - 1) * cartera + porMes * alta;

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!f.acepto) { setError("Tenés que aceptar las condiciones del programa."); return; }
    setCargando(true);
    try {
      const j = await pedir<{ token: string }>("/api/partners/registro", { cuerpo: { ...f, ref } });
      guardarToken(j.token);
      router.push("/partners/panel?nuevo=1");
    } catch (er) {
      setError((er as Error).message);
    } finally { setCargando(false); }
  }

  const h2: React.CSSProperties = { fontSize: 22, lineHeight: 1.25, margin: "0 0 12px", color: C.tinta };
  const p: React.CSSProperties = { fontSize: 16, lineHeight: 1.6, color: C.suave, margin: "0 0 10px" };

  return (
    <main style={{ background: C.papel, minHeight: "100vh", fontFamily: FUENTE, color: C.tinta }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 60px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <Link href="/landing" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/brand/lumobi-logo-dark.svg" alt="LumoBi" width={112} height={29} />
            <span style={{ fontWeight: 700, color: C.tinta }}>Partners</span>
          </Link>
          <Link href={yaPartner ? "/partners/panel" : "/partners/ingresar"} style={{ color: C.azul, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
            {yaPartner ? "Mi panel" : "Ingresar"}
          </Link>
        </header>

        {refNombre && (
          <div style={{ ...tarjeta, background: C.okFondo, borderColor: "#B7DFCB", padding: 14, fontSize: 15 }}>
            Te invitó <b>{refNombre}</b>. Registrate con este link y queda anotado que vino de su parte.
          </div>
        )}

        <section style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.15, margin: "0 0 14px" }}>
            Ganá plata todos los meses recomendando LumoBi a los comercios que conocés
          </h1>
          <p style={{ ...p, fontSize: 17 }}>
            Por cada negocio que se suma con tu link cobrás <b>{pesos(alta)} cuando paga su primer mes</b>, y después{" "}
            <b>{pesos(cartera)} todos los meses</b> mientras siga usando LumoBi. Sin inversión, sin horarios y sin cupo.
          </p>
          <a href="#alta" style={{ ...boton, display: "block", textAlign: "center", textDecoration: "none", marginTop: 16 }}>Quiero ser partner</a>
        </section>

        <section style={tarjeta}>
          <h2 style={h2}>Cuánto podés ganar</h2>
          <p style={p}>Se cobra por negocio, no por local: tenga 1 local o 10, cada negocio te deja lo mismo (calculado sobre el abono base de {pesos(precio)} sin IVA).</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "12px 0 18px" }}>
            <div style={{ background: C.papel, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, color: C.apagada }}>Cuando paga su primer mes</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{pesos(alta)}</div>
            </div>
            <div style={{ background: C.papel, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, color: C.apagada }}>Cada mes que sigue</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{pesos(cartera)}</div>
            </div>
          </div>
          <label style={{ fontSize: 15, fontWeight: 600, display: "block", marginBottom: 8 }}>
            Si sumás <b style={{ color: C.azul }}>{porMes}</b> {porMes === 1 ? "negocio" : "negocios"} por mes:
          </label>
          <input type="range" min={1} max={10} value={porMes} onChange={(e) => setPorMes(Number(e.target.value))} style={{ width: "100%", accentColor: C.azul }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[3, 6, 12].map((m) => (
              <div key={m} style={{ border: `1px solid ${C.linea}`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: C.apagada }}>En el mes {m}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{pesos(mensualAl(m))}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: C.apagada, margin: "12px 0 0", lineHeight: 1.5 }}>
            Es una cuenta, no una promesa: supone que todos los negocios siguen pagando. En la realidad algunos se dan de baja.
            Lo que ganás depende de los negocios que traés y de que se queden.
          </p>
        </section>

        <section style={tarjeta}>
          <h2 style={h2}>Cómo funciona</h2>
          {[
            ["Te registrás", "En 1 minuto tenés tu link y tu código personal."],
            ["Le pasás tu link a un comercio", "Te damos los mensajes listos para mandar por WhatsApp. El comercio prueba LumoBi 5 días gratis, sin tarjeta."],
            ["Cuando paga, cobrás", `Su primer mes te deja ${pesos(alta)}. Cada mes que sigue, ${pesos(cartera)}. Lo ves todo en tu panel.`],
          ].map(([t, d], i) => (
            <div key={t} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 15, background: C.azul, color: C.blanco, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div><div style={{ fontWeight: 700, fontSize: 16 }}>{t}</div><div style={{ ...p, margin: 0, fontSize: 15 }}>{d}</div></div>
            </div>
          ))}
        </section>

        <section style={tarjeta}>
          <h2 style={h2}>Qué le vas a recomendar</h2>
          <p style={p}>
            LumoBi es un sistema para comercios que venden productos: kioscos, almacenes, autoservicios, indumentaria, electrónica, hogar. Funciona
            como caja y, con cada venta, aprende cómo es el negocio y avisa cuando algo se sale de lo normal: diferencias de caja por turno,
            productos vendidos por debajo del costo, horarios flojos, qué pedir y cuándo.
          </p>
          <p style={{ ...p, margin: 0 }}>Le sirve sobre todo al dueño que no puede estar en el local todo el día: tiene empleados, varios turnos o más de un local.</p>
        </section>

        <section style={tarjeta}>
          <h2 style={h2}>Las reglas, claras</h2>
          <ul style={{ ...p, paddingLeft: 20, margin: 0 }}>
            <li>La comisión es igual para todos los partners. Gana más el que tiene una cartera más grande, no el que entró antes.</li>
            <li>Se cobra por negocio, no por local: un negocio con varios locales cuenta como uno.</li>
            <li>Un negocio queda en tu cartera solo si se registra con tu link o tu código.</li>
            <li>La comisión se genera cuando el negocio paga (registrarse o estar en la prueba no genera comisión).</li>
            <li>Cada comisión queda en espera {R.retencion_dias} días por si el pago se cae, y después se puede cobrar. Se liquida por transferencia a tu alias o CBU.</li>
            <li>Para cobrar tenés que cargar tu CUIT o CUIL y emitir la factura correspondiente (por ejemplo, como monotributista).</li>
            <li>Si invitás a otra persona a ser partner y llega a {R.bono_meta} negocios pagando, cobrás un bono de {pesos(R.bono_referido)}, una sola vez. No cobrás nada de lo que venda después: no es una pirámide.</li>
            <li>Con {R.elite_clientes} negocios pagando pasás a Elite: los negocios que sumes desde ahí te dejan {pesos(precio * R.elite_cartera_pct)} por mes.</li>
            <li>No se permite prometer ahorros, mandar spam ni hacerse pasar por LumoBi. Si pasa, la cuenta se suspende.</li>
          </ul>
        </section>

        <section id="alta" style={{ ...tarjeta, borderColor: C.azul, borderWidth: 2 }}>
          <h2 style={h2}>Sumate como partner</h2>
          <form onSubmit={registrar} style={{ display: "grid", gap: 10 }}>
            <input style={input} placeholder="Nombre y apellido" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoComplete="name" />
            <input style={input} placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
            <input style={input} placeholder="Celular con WhatsApp" type="tel" value={f.celular} onChange={(e) => setF({ ...f, celular: e.target.value })} autoComplete="tel" />
            <input style={input} placeholder="Zona donde vas a trabajar (ej. Morón, Haedo)" value={f.zona} onChange={(e) => setF({ ...f, zona: e.target.value })} />
            <input style={input} placeholder="Contraseña (8 caracteres o más)" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: C.suave, lineHeight: 1.5 }}>
              <input type="checkbox" checked={f.acepto} onChange={(e) => setF({ ...f, acepto: e.target.checked })} style={{ marginTop: 3, width: 18, height: 18 }} />
              <span>Leí y acepto las reglas del programa de arriba. Entiendo que no es un empleo y que cobro según los negocios que paguen.</span>
            </label>
            {error && <div style={{ color: C.critico, fontSize: 14 }}>{error}</div>}
            <button type="submit" style={{ ...boton, opacity: cargando ? 0.6 : 1 }} disabled={cargando}>{cargando ? "Creando tu cuenta…" : "Crear mi cuenta de partner"}</button>
          </form>
          <p style={{ fontSize: 14, color: C.apagada, margin: "14px 0 0", textAlign: "center" }}>
            ¿Dudas? <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola, quiero saber más de LumoBi Partners")}`} style={{ color: C.azul, fontWeight: 700 }}>Escribinos por WhatsApp</a>
          </p>
        </section>
      </div>
    </main>
  );
}
