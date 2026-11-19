"use client";
// Oportunidades: lo más importante que encontró LumoBi, con plata y evidencia (antes "Radiografía", en el Inicio)
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import RadiografiaCard from "../components/RadiografiaCard";
import RecuperadoCard from "../components/RecuperadoCard";
import PrecisionCard from "../components/PrecisionCard";
import EfectoCambios from "../components/EfectoCambios";

export default function Oportunidades() {
  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Oportunidades" sub="Dónde ganar más y perder menos" negocioEntero />
      <div style={{ padding: "0 16px" }}>
        <RecuperadoCard />
        <EfectoCambios />
        <RadiografiaCard />
        <PrecisionCard />
      </div>
      <Nav />
    </main>
  );
}
