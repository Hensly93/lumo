// Marco común de las páginas legales públicas (privacidad y términos). Página de servidor: se lee sin iniciar sesión.
import Link from "next/link";
import type { ReactNode } from "react";

const C = { tinta: "#0A1628", suave: "#45546B", papel: "#EEF1F5", blanco: "#FFFFFF", linea: "#D5DCE6", azul: "#0A5BD3" };
export const EMAIL_LEGAL = "lumobusinessintel@gmail.com";

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.tinta }}>{titulo}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: C.suave, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}

export default function PaginaLegal({ titulo, actualizado, intro, children }: { titulo: string; actualizado: string; intro: string; children: ReactNode }) {
  return (
    <main style={{ background: C.papel, minHeight: "100vh", padding: "28px 16px 64px", fontFamily: "var(--font-instrument), system-ui, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/landing" style={{ fontSize: 14, color: C.azul, textDecoration: "none", fontWeight: 600 }}>← LumoBi</Link>
        <article style={{ background: C.blanco, border: `1px solid ${C.linea}`, borderRadius: 16, padding: "28px 22px", marginTop: 14 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.tinta, lineHeight: 1.2 }}>{titulo}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.suave }}>Última actualización: {actualizado}</p>
          <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.7, color: C.suave }}>{intro}</p>
          {children}
          <Seccion titulo="Contacto">
            <p style={{ margin: 0 }}>Para cualquier consulta sobre este documento escribinos a <a href={`mailto:${EMAIL_LEGAL}`} style={{ color: C.azul }}>{EMAIL_LEGAL}</a>.</p>
          </Seccion>
        </article>
        <p style={{ marginTop: 16, fontSize: 13, color: C.suave, textAlign: "center" }}>
          <Link href="/privacidad" style={{ color: C.suave }}>Privacidad</Link> · <Link href="/terminos" style={{ color: C.suave }}>Términos</Link>
        </p>
      </div>
    </main>
  );
}
