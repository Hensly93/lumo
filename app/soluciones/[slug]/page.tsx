// Páginas públicas por tema (seo-lumobi). Páginas de servidor: Google las lee completas, sin iniciar sesión.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGINAS, SITIO, buscar } from "../datos";

export const dynamicParams = false;

export function generateStaticParams() {
  return PAGINAS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = buscar(slug);
  if (!p) return {};
  const url = `/soluciones/${p.slug}`;
  return {
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    alternates: { canonical: url },
    openGraph: { title: `${p.title} | LumoBi`, description: p.description, url, siteName: "LumoBi", locale: "es_AR", type: "website" },
  };
}

const C = { tinta: "#0A1628", suave: "#45546B", papel: "#EEF1F5", blanco: "#FFFFFF", linea: "#D5DCE6", azul: "#0A5BD3", cian: "#00C2FF" };
const CTA = "/login?registro=1";

const css = `
.lb{font-family:var(--font-instrument),system-ui,sans-serif;color:${C.tinta};background:${C.papel};-webkit-font-smoothing:antialiased;min-height:100vh}
.lb *{box-sizing:border-box}
.lb a{color:inherit}
.lb h1,.lb h2,.lb h3{margin:0;letter-spacing:-0.02em}
.lb p{margin:0}
.lb .wrap{max-width:820px;margin:0 auto;padding:0 20px}
.lb header{background:${C.tinta}}
.lb .btn{display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 28px;border-radius:12px;background:${C.cian};color:${C.tinta};font-weight:700;font-size:16px;text-decoration:none}
.lb .btn-azul{background:${C.azul};color:#fff}
.lb .btn:focus-visible,.lb a:focus-visible,.lb summary:focus-visible{outline:3px solid ${C.azul};outline-offset:3px}
.lb .hero{background:${C.tinta};color:#fff;padding:40px 0 56px}
.lb .hero h1{font-size:clamp(28px,7vw,44px);line-height:1.12;font-weight:800;margin-bottom:16px}
.lb .hero p{font-size:17px;line-height:1.6;color:#C7D2E3;margin-bottom:26px}
.lb .micro{margin-top:12px;font-size:13px;color:#9FB0C9}
.lb .migas{font-size:13px;color:#9FB0C9;margin-bottom:18px}
.lb .migas a{text-underline-offset:3px}
.lb section.s{padding:48px 0}
.lb h2{font-size:clamp(22px,5vw,28px);line-height:1.2;font-weight:800;margin-bottom:12px}
.lb .txt{font-size:17px;line-height:1.65;color:${C.suave}}
.lb ul.lista{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.lb ul.lista li{display:flex;gap:10px;font-size:16px;line-height:1.55;color:${C.tinta}}
.lb ul.lista li svg{flex:none;margin-top:3px;color:#0B7A53}
.lb .card{background:${C.blanco};border:1px solid ${C.linea};border-radius:16px;padding:20px;text-decoration:none;display:block}
.lb .card b{display:block;font-size:17px;margin-bottom:6px}
.lb .card span{font-size:15px;line-height:1.55;color:${C.suave}}
.lb .grid{display:grid;grid-template-columns:1fr;gap:14px;margin-top:20px}
.lb details{border-bottom:1px solid ${C.linea}}
.lb details:first-of-type{border-top:1px solid ${C.linea}}
.lb summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;padding:16px 0;font-size:17px;font-weight:600;line-height:1.35}
.lb summary::-webkit-details-marker{display:none}
.lb details p{padding:0 0 18px;font-size:15px;line-height:1.65;color:${C.suave}}
.lb footer{background:${C.tinta};color:#C7D2E3;padding:32px 0;font-size:14px;line-height:1.8}
@media (min-width:760px){.lb .grid{grid-template-columns:repeat(3,1fr)}}
`;

const Tilde = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = buscar(slug);
  if (!p) notFound();

  const relacionadas = p.relacionadas.map((s) => buscar(s)).filter((x): x is NonNullable<typeof x> => !!x);

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: p.title,
      description: p.description,
      url: `${SITIO}/soluciones/${p.slug}`,
      inLanguage: "es-AR",
      isPartOf: { "@type": "WebSite", name: "LumoBi", url: SITIO },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "LumoBi", item: `${SITIO}/landing` },
        { "@type": "ListItem", position: 2, name: p.corto, item: `${SITIO}/soluciones/${p.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <main className="lb">
      <style>{css}</style>
      {jsonld.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}

      <header>
        <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/landing" aria-label="LumoBi, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lumobi-logo-dark.svg" alt="LumoBi" width={128} height={33} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Link href="/login" style={{ color: "#C7D2E3", fontSize: 14, textDecoration: "none" }}>Entrar</Link>
            <Link href={CTA} className="btn" style={{ minHeight: 40, padding: "0 16px", fontSize: 14 }}>Probar gratis</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <nav className="migas" aria-label="Ruta"><Link href="/landing">LumoBi</Link> / {p.corto}</nav>
          <h1>{p.h1}</h1>
          <p>{p.intro}</p>
          <Link href={CTA} className="btn">Probar 5 días gratis</Link>
          <div className="micro">5 días gratis. Sin tarjeta. Cancelás cuando quieras.</div>
        </div>
      </section>

      {p.bloques.map((b) => (
        <section className="s" key={b.h} style={{ background: C.papel }}>
          <div className="wrap">
            <h2>{b.h}</h2>
            {b.p ? <p className="txt">{b.p}</p> : null}
            {b.items ? (
              <ul className="lista">
                {b.items.map((it) => (<li key={it}><Tilde />{it}</li>))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}

      <section className="s" style={{ background: C.blanco }}>
        <div className="wrap">
          <h2>Preguntas frecuentes</h2>
          <div>
            {p.faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}<span aria-hidden="true" style={{ color: C.azul, fontWeight: 400 }}>+</span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="s">
        <div className="wrap" style={{ textAlign: "center" }}>
          <h2>Empezá hoy y mirá qué encuentra en tus primeros días</h2>
          <p className="txt" style={{ marginBottom: 22 }}>5 días gratis. Desde $45.000 + IVA por mes. Cancelás cuando quieras.</p>
          <Link href={CTA} className="btn btn-azul">Probar 5 días gratis</Link>
        </div>
      </section>

      <section className="s" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2>Más sobre LumoBi</h2>
          <div className="grid">
            {relacionadas.map((r) => (
              <Link key={r.slug} href={`/soluciones/${r.slug}`} className="card"><b>{r.corto}</b><span>{r.resumen}</span></Link>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div>LumoBi · Control de caja y business intelligence para pymes de Argentina</div>
          <div>
            <Link href="/landing">Inicio</Link>
            {PAGINAS.map((x) => (<span key={x.slug}>{" · "}<Link href={`/soluciones/${x.slug}`}>{x.corto}</Link></span>))}
          </div>
        </div>
      </footer>
    </main>
  );
}
