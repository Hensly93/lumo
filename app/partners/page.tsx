import type { Metadata } from "next";
import PaginaPartners from "./PaginaPartners";

export const metadata: Metadata = {
  title: { absolute: "Trabajá con LumoBi: ganá plata recomendando a comercios (no necesitás tener negocio)" },
  description: "No necesitás tener un negocio. Recomendás LumoBi a comercios y cobrás $22.500 por cada uno que se suma y $10.000 todos los meses mientras siga. Sin invertir, desde tu celular.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Trabajá con LumoBi: ganá plata recomendando a comercios",
    description: "No necesitás tener un negocio. Sin invertir, desde tu celular. Cobrás por cada comercio que se suma y todos los meses mientras siga.",
    url: "/partners", siteName: "LumoBi", locale: "es_AR", type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <PaginaPartners />;
}
