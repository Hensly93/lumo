import type { Metadata } from "next";
import PaginaPartners from "./PaginaPartners";

export const metadata: Metadata = {
  title: { absolute: "LumoBi Partners: cada comercio que traés te paga $22.500 (y te sigue pagando todos los meses)" },
  description: "$22.500 por cada negocio que sumás y $10.000 por mes por cada uno que siga. Formación gratis en 10 minutos, cobrás por transferencia y manejás tus horarios.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Cada comercio que traés te paga $22.500",
    description: "Y después te sigue pagando $10.000 todos los meses. 10 comercios = $100.000 por mes, sin volver a venderles. Formación gratis en 10 minutos.",
    url: "/partners", siteName: "LumoBi", locale: "es_AR", type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <PaginaPartners />;
}
