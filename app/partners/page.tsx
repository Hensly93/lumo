import type { Metadata } from "next";
import PaginaPartners from "./PaginaPartners";

export const metadata: Metadata = {
  title: { absolute: "Trabajá con LumoBi: ganá plata extra todos los meses buscando negocios" },
  description: "$22.500 por cada negocio que sumás y $10.000 por mes por cada uno que siga. Formación gratis en 10 minutos, cobrás por transferencia y manejás tus horarios.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Ganá plata extra todos los meses buscando negocios para LumoBi",
    description: "$22.500 por cada negocio que sumás + $10.000 por mes por cada uno que siga. Con 10 negocios: $100.000 todos los meses.",
    url: "/partners", siteName: "LumoBi", locale: "es_AR", type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <PaginaPartners />;
}
