"use client";
// Comparar con otros negocios (efecto red). Antes era un cartel viejo que prometía "47 negocios similares"
// y un "Plan Pro" que no existe: ahora dice la verdad.
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";

export default function Benchmark() {
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Comparar con otros negocios" sub="Próximamente" />
      <div style={{ padding: "0 16px" }}>
        <div style={{ padding: 18, borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", fontSize: 15, color: "var(--tinta)", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 10px" }}>
            Cuando haya al menos <strong>5 negocios de tu mismo rubro y tu zona</strong> usando LumoBi, acá vas a ver cómo te va comparado con ellos:
            si vendés más o menos, a qué hora se mueve la zona y qué productos salen más.
          </p>
          <p style={{ margin: 0, color: "var(--tinta-apagada)", fontSize: 14 }}>
            Nadie ve tus datos ni vos ves los de nadie: solo se comparan promedios. Te avisamos cuando esté listo.
          </p>
        </div>
      </div>
      <Nav />
    </main>
  );
}
