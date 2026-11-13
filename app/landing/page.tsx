// LANDING_LUMOBI_V4
// Landing de LumoBi. Pensada para celular primero (el tráfico de los anuncios llega desde el celu):
// un solo objetivo (probar 5 días gratis), un solo botón repetido, sin datos inventados.
// Es una página de servidor: casi no manda JavaScript, así que carga rápido.
import type { Metadata } from "next";
import Link from "next/link";
import BarraCta from "./BarraCta";
import { PAGINAS, SITIO } from "../soluciones/datos";

export const metadata: Metadata = {
  title: { absolute: "LumoBi: control de caja y fugas de plata para pymes y comercios" },
  description:
    "Control de caja y detección de pérdidas de dinero para pymes, comercios y gastronomía de Argentina. Ventas, Mercado Pago y predicción en un solo lugar. 5 días gratis.",
  keywords: [
    "control de caja", "arqueo de caja", "faltante de caja", "pérdidas de dinero en negocios", "fugas de plata",
    "business intelligence para pymes", "inteligencia de negocios", "software para pymes", "comercio minorista",
    "comercio mayorista", "gastronomía", "restaurantes", "predicción de ventas", "Mercado Pago", "Argentina",
  ],
  alternates: { canonical: "/landing" },
  openGraph: {
    title: "LumoBi: control de caja y fugas de plata para pymes y comercios",
    description: "Juntamos tu caja, tus ventas y Mercado Pago. Te mostramos las fugas de plata, te avisamos a tiempo y anticipamos tus ventas.",
    url: "/landing",
    siteName: "LumoBi",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/og-lumobi.png", width: 1200, height: 630, alt: "LumoBi: tu negocio pierde plata todos los meses, LumoBi te dice dónde" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-lumobi.png"] },
};

// Si tenés un WhatsApp comercial, ponelo acá (solo números, con código de país: 5491123456789) y aparece el botón.
const WHATSAPP = "5491166959457";
const EMAIL = "lumobusinessintel@gmail.com";
const CTA = "/login?registro=1";

const C = {
  tinta: "#0A1628", suave: "#45546B", apagada: "#5F6E85", papel: "#EEF1F5", blanco: "#FFFFFF",
  linea: "#D5DCE6", azul: "#0A5BD3", cian: "#00C2FF", ok: "#0B7A53", critico: "#B3261E", atencion: "#8A5100",
};

const css = `
.lb{font-family:var(--font-instrument),system-ui,sans-serif;color:${C.tinta};background:${C.papel};-webkit-font-smoothing:antialiased}
.lb *{box-sizing:border-box}
.lb a{color:inherit}
.lb h1,.lb h2,.lb h3{margin:0;letter-spacing:-0.02em}
.lb p{margin:0}
.lb .wrap{max-width:1040px;margin:0 auto;padding:0 20px}
.lb .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 28px;border-radius:12px;background:${C.cian};color:${C.tinta};font-weight:700;font-size:16px;text-decoration:none;border:0;cursor:pointer}
.lb .btn:hover{filter:brightness(0.95)}
.lb .btn:focus-visible,.lb a:focus-visible,.lb summary:focus-visible{outline:3px solid ${C.azul};outline-offset:3px}
.lb .btn-azul{background:${C.azul};color:#fff}
.lb .hero{background:${C.tinta};color:#fff;padding:36px 0 56px}
.lb .hero-grid{display:grid;grid-template-columns:1fr;gap:40px;align-items:center}
.lb .eyebrow{font-size:13px;font-weight:600;letter-spacing:.04em;color:${C.cian};margin-bottom:14px}
.lb .hero h1{font-size:clamp(32px,8.4vw,52px);line-height:1.08;font-weight:800;margin-bottom:18px}
.lb .hero .sub{font-size:17px;line-height:1.55;color:#C7D2E3;max-width:520px;margin-bottom:28px}
.lb .micro{margin-top:14px;font-size:13px;color:#9FB0C9}
.lb .link-suave{color:#C7D2E3;font-size:14px;text-underline-offset:4px}
.lb section.s{padding:64px 0}
.lb .kicker{font-size:13px;font-weight:700;letter-spacing:.04em;color:${C.azul};margin-bottom:10px}
.lb h2.t{font-size:clamp(26px,6vw,36px);line-height:1.15;font-weight:800;margin-bottom:14px}
.lb .lead{font-size:17px;line-height:1.6;color:${C.suave};max-width:640px}
.lb .grid3{display:grid;grid-template-columns:1fr;gap:14px;margin-top:32px}
.lb .grid2{grid-template-columns:1fr}
.lb .card{background:${C.blanco};border:1px solid ${C.linea};border-radius:16px;padding:22px}
.lb .card h3{font-size:18px;font-weight:700;margin-bottom:8px}
.lb .card p{font-size:15px;line-height:1.6;color:${C.suave}}
.lb .ico{width:40px;height:40px;border-radius:10px;background:#E6EFFC;color:${C.azul};display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.lb .paso{display:grid;grid-template-columns:44px 1fr;gap:16px;padding:22px 0;border-top:1px solid ${C.linea}}
.lb .paso:last-child{border-bottom:1px solid ${C.linea}}
.lb .num{width:44px;height:44px;border-radius:12px;background:${C.tinta};color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
.lb .paso h3{font-size:19px;font-weight:700;margin-bottom:6px}
.lb .paso p{font-size:15px;line-height:1.6;color:${C.suave}}
.lb .oscuro{background:${C.tinta};color:#fff}
.lb .oscuro .lead{color:#C7D2E3}
.lb .precio{background:${C.blanco};border:1px solid ${C.linea};border-radius:20px;padding:28px 24px;max-width:520px}
.lb .precio .monto{font-size:clamp(38px,10vw,52px);font-weight:800;letter-spacing:-0.03em;line-height:1}
.lb .precio ul{list-style:none;padding:0;margin:20px 0 24px}
.lb .precio li{display:flex;gap:10px;font-size:15px;line-height:1.5;padding:7px 0;color:${C.tinta}}
.lb .precio li svg{flex:none;margin-top:3px;color:${C.ok}}
.lb details{border-bottom:1px solid ${C.linea}}
.lb details:first-of-type{border-top:1px solid ${C.linea}}
.lb summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 0;font-size:17px;font-weight:600;line-height:1.35}
.lb summary::-webkit-details-marker{display:none}
.lb summary .mas{flex:none;font-size:22px;font-weight:400;color:${C.azul};transition:transform .15s}
.lb details[open] summary .mas{transform:rotate(45deg)}
.lb details p{padding:0 0 20px;font-size:15px;line-height:1.65;color:${C.suave};max-width:680px}
.lb .movil{background:${C.blanco};color:${C.tinta};border-radius:28px;padding:18px;box-shadow:0 24px 60px rgba(0,0,0,.35);max-width:380px;margin:0 auto;width:100%}
.lb .fuga{display:grid;grid-template-columns:4px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid ${C.linea}}
.lb .fuga b{display:block;font-size:14px;font-weight:700;line-height:1.3}
.lb .fuga small{display:block;font-size:12px;color:${C.suave};margin-top:2px}
.lb .fuga .m{font-weight:800;font-size:15px;white-space:nowrap}
.lb .barra{display:flex}
.lb footer{background:${C.tinta};color:#C7D2E3;padding:40px 0 96px;font-size:14px}
@media (min-width:760px){
  .lb .wrap{padding:0 32px}
  .lb .hero{padding:56px 0 80px}
  .lb .hero-grid{grid-template-columns:1.1fr .9fr;gap:56px}
  .lb section.s{padding:92px 0}
  .lb .grid3{grid-template-columns:repeat(3,1fr)}
  .lb .grid3.grid2{grid-template-columns:repeat(2,1fr)}
  .lb .grid2x{grid-template-columns:repeat(2,1fr)}
  .lb footer{padding-bottom:40px}
  .lb .barra{display:none}
}
html{scroll-behavior:smooth}
`;

const Ico = ({ d, extra }: { d: string; extra?: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />{extra ? <path d={extra} /> : null}
  </svg>
);
const Tilde = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

const PROBLEMAS = [
  { t: "Cerrás la caja y falta plata. Otra vez.", d: "Y no sabés si fue un error, un vuelto mal dado o algo peor. Lo único seguro es que la plata no está.", ico: "M3 7h18v12H3z", extra: "M3 11h18M7 15h4" },
  { t: "Tu proveedor subió y vos cobrás lo mismo", d: "El margen se achica de a poco y te enterás cuando ya lo perdiste.", ico: "M3 17l6-6 4 4 8-9", extra: "M15 6h6v6" },
  { t: "No sabés si el sábado vas a vender", d: "Comprás mercadería y armás los turnos a ojo. Si te pasás, se pierde. Si te quedás corto, vendés menos.", ico: "M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" },
  { t: "Tu información está en cuatro lugares", d: "La caja, Mercado Pago, un Excel y la cabeza de tu encargado. Nadie la junta, así que nadie ve el cuadro completo.", ico: "M4 9l1-5h14l1 5M5 9v10h14V9", extra: "M9 19v-5h6v5" },
];
const TIEMPOS = [
  { k: "LO QUE PASÓ", t: "Cada peso, cruzado", d: "Cada cierre de caja se cruza con tus ventas y tus cobros. Ves la diferencia en pesos, turno por turno." },
  { k: "LO QUE ESTÁ PASANDO", t: "Te avisa en el momento", d: "Si algo se sale de lo normal en tu negocio, te llega un aviso al celular en el momento, no a fin de mes." },
  { k: "LO QUE VIENE", t: "Cuánto vas a vender", d: "Los próximos días, según el clima, los feriados, la quincena y la historia de tu propio negocio." },
];
const ALIVIOS = [
  "Cerrás el turno y sabés si la caja da.",
  "Te enterás del problema antes de que se agrande.",
  "Comprás y armás los turnos sabiendo cuánto vas a vender.",
];
const PASOS = [
  { t: "Conectás tus datos", d: "Conectás Mercado Pago y subís tus ventas desde un Excel, un PDF o una foto. Tu equipo abre y cierra cada turno con su PIN." },
  { t: "LumoBi aprende cómo funciona tu negocio", d: "Estudia tus turnos, tus horarios y tus días fuertes para saber qué es normal en tu negocio y qué no." },
  { t: "Te avisa en el celular", d: "Cuando algo se desvía te llega el aviso: cuánta plata es, dónde está y cómo cerrarla." },
];
const BENEFICIOS = [
  { t: "Plata en fuga", d: "Cuánta plata se pierde, en qué turno o en qué costo, y los pasos concretos para cerrar cada fuga.", ico: "M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" },
  { t: "Caja que cierra", d: "Cada cierre se cruza con las ventas, los cobros digitales y los egresos. Ves la diferencia en pesos.", ico: "M3 7h18v12H3z", extra: "M3 11h18M7 15h4" },
  { t: "Avisos en el momento", d: "Te avisamos al celular cuando algo se sale de lo normal, no a fin de mes.", ico: "M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z", extra: "M10 20a2 2 0 0 0 4 0" },
  { t: "Predicción de ventas", d: "Cuánto vas a vender los próximos días, considerando clima, feriados, quincena y tu propio historial.", ico: "M3 17l6-6 4 4 8-9", extra: "M15 6h6v6" },
  { t: "Todos tus locales", d: "Cada local, cada turno y cada caja en una sola pantalla, cada uno con su propia referencia.", ico: "M4 9l1-5h14l1 5M5 9v10h14V9", extra: "M9 19v-5h6v5" },
  { t: "Preguntale a NICOLE", d: "La inteligencia de LumoBi responde con tus números: qué turno rinde menos, cómo viene el mes.", ico: "M4 5h16v11H9l-5 4z" },
];
const FAQS = [
  { q: "¿Tengo que cambiar mi sistema de ventas?", a: "No. LumoBi no reemplaza tu sistema: lo interpreta. Hoy cargás tus ventas desde un Excel, un PDF o una foto, o con Mercado Pago, y tu equipo cierra los turnos en LumoBi. Estamos trabajando para conectarnos directo con los sistemas de venta más usados." },
  { q: "¿Es una acusación a mis empleados?", a: "No. LumoBi habla de hechos: qué turno, qué día y cuánta diferencia hay. No dice quién tiene la culpa ni por qué. Lo que hacés con esa información lo decidís vos." },
  { q: "¿Cuánto tarda en funcionar?", a: "El control de caja funciona desde el primer turno. Cuantos más días de datos tiene LumoBi, más precisa es la referencia de lo que es normal en tu negocio y mejores son los avisos." },
  { q: "¿Cuánto cuesta?", a: "Desde $45.000 + IVA por mes, con 1 local y hasta 3 cajas. Si tenés más locales, cajas o empleados, el precio se ajusta y lo ves antes de pagar. Para grandes superficies o muchos locales, escribinos." },
  { q: "¿Qué pasa cuando termina la prueba?", a: "Tus datos quedan guardados. Ves un resumen del último mes y, cuando activás el plan, volvés a ver todo. Si no lo activás, no pasa nada más." },
  { q: "¿Mis datos están a salvo?", a: "Cada negocio ve únicamente su información. Los datos de un negocio nunca se mezclan con los de otro." },
  { q: "¿Sirve para restaurantes, bares y comercios minoristas o mayoristas?", a: "Sí. LumoBi está pensado para pymes de comercio y gastronomía de Argentina: kioscos, almacenes, tiendas, restaurantes, bares, cafeterías, distribuidoras y comercios mayoristas. Funciona con un local o con varios." },
  { q: "¿Qué es el arqueo de caja y cómo me ayuda LumoBi?", a: "El arqueo de caja es contar el efectivo al cerrar y compararlo con las ventas registradas. LumoBi hace esa comparación en cada cierre de turno, la cruza con tus cobros digitales y te muestra la diferencia en pesos." },
  { q: "¿LumoBi es un sistema de business intelligence?", a: "Sí. Es inteligencia de negocios pensada para pymes: junta tu caja, tus ventas y Mercado Pago, detecta fugas de plata y predice tus ventas, sin tableros complicados." },
];

const JSONLD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LumoBi",
    url: SITIO,
    logo: `${SITIO}/brand/lumobi-logo-email.png`,
    description: "Software argentino de control de caja y business intelligence para pymes, comercios y gastronomía.",
    areaServed: "AR",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LumoBi",
    url: SITIO,
    inLanguage: "es-AR",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LumoBi",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: "es-AR",
    url: `${SITIO}/landing`,
    description: "Control de caja, detección de pérdidas de dinero, análisis de ventas y cobros de Mercado Pago, y predicción de ventas para pymes, comercios minoristas y mayoristas, y gastronomía de Argentina.",
    featureList: [
      "Control de caja y cierre de turno",
      "Detección de fugas de plata",
      "Avisos en el celular",
      "Predicción de ventas",
      "Cobros de Mercado Pago junto con ventas y caja",
      "Varios locales en una sola pantalla",
    ],
    offers: {
      "@type": "Offer",
      price: "45000",
      priceCurrency: "ARS",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "45000", priceCurrency: "ARS", unitText: "MONTH", valueAddedTaxIncluded: false },
      availability: "https://schema.org/InStock",
      description: "Desde $45.000 + IVA por mes, 1 local y hasta 3 cajas. 5 días gratis.",
    },
    areaServed: "AR",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

export default function Landing() {
  return (
    <main className="lb">
      <style>{css}</style>
      {JSONLD.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}

      {/* Navegación mínima: logo, entrar y un solo botón */}
      <header style={{ background: C.tinta, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lumobi-logo-dark.svg" alt="LumoBi" width={128} height={33} />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Link href="/login" style={{ color: "#C7D2E3", fontSize: 14, textDecoration: "none" }}>Entrar</Link>
            <Link href={CTA} className="btn" style={{ minHeight: 40, padding: "0 16px", fontSize: 14 }}>Probar gratis</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">Control de caja y business intelligence para pymes, comercios y gastronomía de Argentina</div>
            <h1>Tu negocio pierde plata todos los meses. LumoBi te dice dónde, cuánto y qué va a pasar.</h1>
            <p className="sub">
              Juntamos tu caja, tus ventas y Mercado Pago en un solo lugar. Detectamos las pérdidas de dinero de tu negocio, te avisamos antes de que crezcan y te decimos cuánto vas a vender los próximos días.
            </p>
            <Link href={CTA} className="btn">Probar 5 días gratis</Link>
            <div className="micro">5 días gratis. Sin tarjeta. Cancelás cuando quieras.</div>
            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
              <a href="#como" className="link-suave">Ver cómo funciona</a>
              {WHATSAPP ? (
                <a className="link-suave" href={`https://wa.me/${WHATSAPP}?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20LumoBi`}>Escribinos por WhatsApp</a>
              ) : null}
            </div>
          </div>

          {/* Pantalla de ejemplo: así se ve una fuga en LumoBi */}
          <div>
            <div className="movil" role="img" aria-label="Ejemplo de la pantalla de fugas de LumoBi con datos de muestra">
              <div style={{ fontSize: 12, fontWeight: 600, color: C.suave, marginBottom: 6 }}>Plata en fuga · últimos 30 días</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>$48.300</div>
              <div style={{ fontSize: 13, color: C.suave, margin: "6px 0 12px" }}>3 fugas activas</div>
              <div className="fuga">
                <span style={{ background: C.critico, borderRadius: 4, alignSelf: "stretch" }} />
                <div><b>Faltaron $7.850 en la caja del turno tarde</b><small>3 de 20 cierres terminaron con plata de menos</small></div>
                <span className="m" style={{ color: C.critico }}>$7.850</span>
              </div>
              <div className="fuga">
                <span style={{ background: C.atencion, borderRadius: 4, alignSelf: "stretch" }} />
                <div><b>Precios atrasados frente a tus costos</b><small>El margen bajó respecto del mes anterior</small></div>
                <span className="m" style={{ color: C.atencion }}>$31.200</span>
              </div>
              <div className="fuga">
                <span style={{ background: C.atencion, borderRadius: 4, alignSelf: "stretch" }} />
                <div><b>Subió la mercadería y el precio no</b><small>Aumento de costos sin trasladar</small></div>
                <span className="m" style={{ color: C.atencion }}>$9.250</span>
              </div>
              <div style={{ marginTop: 6, background: C.papel, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Cómo cerrarla</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: C.suave }}>Cerrar el turno con dos personas presentes, quien entrega y quien recibe, y firmar el conteo.</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#9FB0C9" }}>Ejemplo con datos de muestra</div>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="s">
        <div className="wrap">
          <div className="kicker">SI TE PASA ESTO, NO ESTÁS SOLO</div>
          <h2 className="t">Trabajás todo el día y a fin de mes la plata no da</h2>
          <p className="lead">
            Las pérdidas grandes se notan. Las chicas no aparecen en ningún reporte, pero se repiten todos los meses y juntas pesan mucho.
          </p>
          <div className="grid3 grid2">
            {PROBLEMAS.map((p) => (
              <div className="card" key={p.t}>
                <div className="ico"><Ico d={p.ico} extra={p.extra} /></div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
          <p className="lead" style={{ marginTop: 28, color: C.tinta, fontWeight: 600 }}>
            No es que vendas poco. Es que no ves todo junto.
          </p>
        </div>
      </section>

      {/* Lo que pasó / pasa / viene */}
      <section className="s oscuro">
        <div className="wrap">
          <div className="kicker" style={{ color: C.cian }}>LUMOBI LO JUNTA TODO</div>
          <h2 className="t">Lo que pasó. Lo que está pasando. Lo que viene.</h2>
          <p className="lead">Es como tener un analista mirando tu negocio todo el día, que solo te escribe cuando hay algo para hacer.</p>
          <div className="grid3" style={{ marginTop: 28 }}>
            {TIEMPOS.map((x) => (
              <div key={x.k} style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.cian, marginBottom: 10 }}>{x.k}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{x.t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "#C7D2E3" }}>{x.d}</p>
              </div>
            ))}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "32px 0 0", display: "grid", gap: 12 }}>
            {ALIVIOS.map((a) => (
              <li key={a} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 17, fontWeight: 600 }}>
                <span style={{ color: C.cian, flex: "none", marginTop: 2 }}><Tilde /></span>{a}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 28 }}><Link href={CTA} className="btn">Probar 5 días gratis</Link></div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="s" id="como" style={{ background: C.blanco }}>
        <div className="wrap">
          <div className="kicker">CÓMO FUNCIONA</div>
          <h2 className="t">Empezás en un día</h2>
          <div style={{ marginTop: 28, maxWidth: 720 }}>
            {PASOS.map((p, i) => (
              <div className="paso" key={p.t}>
                <div className="num">{i + 1}</div>
                <div><h3>{p.t}</h3><p>{p.d}</p></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}><Link href={CTA} className="btn btn-azul">Probar 5 días gratis</Link></div>
        </div>
      </section>

      {/* Qué ves */}
      <section className="s">
        <div className="wrap">
          <div className="kicker">QUÉ VES EN LUMOBI</div>
          <h2 className="t">Cada pantalla sirve para decidir</h2>
          <p className="lead">No es un tablero lleno de gráficos. Es lo que necesitás saber hoy para frenar una pérdida o aprovechar un buen día.</p>
          <div className="grid3">
            {BENEFICIOS.map((b) => (
              <div className="card" key={b.t}>
                <div className="ico"><Ico d={b.ico} extra={b.extra} /></div>
                <h3>{b.t}</h3>
                <p>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="s oscuro">
        <div className="wrap">
          <div className="kicker" style={{ color: C.cian }}>CÓMO CUIDAMOS TU NEGOCIO</div>
          <h2 className="t">Tu información es tuya</h2>
          <div className="grid3" style={{ marginTop: 28 }}>
            {[
              { t: "Solo vos ves tus datos", d: "Cada negocio ve únicamente su información. Nunca se mezcla con la de otro negocio." },
              { t: "Hechos, no acusaciones", d: "LumoBi muestra diferencias y patrones por turno. No dice quién tiene la culpa: eso lo decidís vos." },
              { t: "No toca tu plata", d: "LumoBi no mueve dinero ni emite facturas. Interpreta lo que pasa en tu negocio y te anticipa lo que viene." },
            ].map((x) => (
              <div key={x.t} style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: 22 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{x.t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "#C7D2E3" }}>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para qué negocios */}
      <section className="s" style={{ background: C.blanco }}>
        <div className="wrap">
          <div className="kicker">PARA QUÉ NEGOCIOS</div>
          <h2 className="t">LumoBi para pymes, comercios y gastronomía</h2>
          <p className="lead">Control de caja, pérdidas de dinero, cobros de Mercado Pago e inteligencia de negocios para comercios minoristas y mayoristas, restaurantes, bares y cafeterías.</p>
          <div className="grid3">
            {PAGINAS.map((p) => (
              <Link href={`/soluciones/${p.slug}`} className="card" key={p.slug} style={{ textDecoration: "none" }}>
                <h3>{p.corto}</h3>
                <p>{p.resumen}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Precio */}
      <section className="s" id="precio">
        <div className="wrap">
          <div className="kicker">PRECIO</div>
          <h2 className="t">Un precio simple, en pesos</h2>
          <p className="lead" style={{ marginBottom: 28 }}>
            Si LumoBi te detecta una fuga mayor a lo que cuesta, el plan ya se pagó.
          </p>
          <div className="precio">
            <div style={{ fontSize: 14, color: C.suave, marginBottom: 6 }}>Desde</div>
            <div className="monto">$45.000<span style={{ fontSize: 18, fontWeight: 600, color: C.suave, letterSpacing: 0 }}> + IVA / mes</span></div>
            <div style={{ fontSize: 14, color: C.suave, marginTop: 8 }}>Para 1 local y hasta 3 cajas</div>
            <ul>
              {["Fugas de plata con pasos para cerrarlas", "Control de caja y turnos", "Avisos en el celular", "Predicción de ventas", "NICOLE, la inteligencia de LumoBi"].map((x) => (
                <li key={x}><Tilde />{x}</li>
              ))}
            </ul>
            <Link href={CTA} className="btn btn-azul" style={{ width: "100%" }}>Probar 5 días gratis</Link>
            <p style={{ fontSize: 13, color: C.suave, marginTop: 14, lineHeight: 1.55 }}>
              Si tenés más locales, cajas o empleados, el precio se ajusta y lo ves antes de pagar. Cancelás cuando quieras.
            </p>
          </div>
          <p style={{ marginTop: 20, fontSize: 15, color: C.suave, maxWidth: 520, lineHeight: 1.6 }}>
            ¿Grandes superficies o muchos locales?{" "}
            <a href={`mailto:${EMAIL}?subject=LumoBi%20para%20mi%20empresa`} style={{ color: C.azul, fontWeight: 600 }}>Hablemos</a>.
          </p>
        </div>
      </section>

      {/* Preguntas */}
      <section className="s" style={{ background: C.blanco }}>
        <div className="wrap">
          <div className="kicker">PREGUNTAS</div>
          <h2 className="t" style={{ marginBottom: 24 }}>Lo que más nos preguntan</h2>
          <div style={{ maxWidth: 760 }}>
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}<span className="mas" aria-hidden="true">+</span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="s oscuro" style={{ textAlign: "center" }}>
        <div className="wrap">
          <h2 className="t" style={{ maxWidth: 640, margin: "0 auto 14px" }}>Empezá hoy y mirá qué encuentra en tus primeros días</h2>
          <p className="lead" style={{ margin: "0 auto 28px" }}>5 días gratis. Sin tarjeta. Cancelás cuando quieras.</p>
          <Link href={CTA} className="btn">Probar 5 días gratis</Link>
          {WHATSAPP ? (
            <div style={{ marginTop: 18 }}>
              <a className="link-suave" href={`https://wa.me/${WHATSAPP}?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20LumoBi`}>¿Dudas? Escribinos por WhatsApp</a>
            </div>
          ) : null}
        </div>
      </section>

      <footer>
        <div className="wrap" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lumobi-logo-dark.svg" alt="LumoBi" width={112} height={29} />
          <div style={{ lineHeight: 1.7 }}>
            <a href={`mailto:${EMAIL}`} style={{ textDecoration: "none" }}>{EMAIL}</a><br />
            Hecho en Argentina · Versión beta · {new Date().getFullYear()}
          </div>
        </div>
        <div className="wrap" style={{ marginTop: 20, lineHeight: 1.9, fontSize: 13 }}>
          {PAGINAS.map((p, i) => (
            <span key={p.slug}>{i ? " · " : ""}<Link href={`/soluciones/${p.slug}`}>{p.corto}</Link></span>
          ))}
          <div style={{ marginTop: 6 }}><Link href="/terminos">Términos</Link> · <Link href="/privacidad">Privacidad</Link></div>
        </div>
      </footer>

      <BarraCta href={CTA} />
    </main>
  );
}
