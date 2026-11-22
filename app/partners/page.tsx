import type { Metadata } from "next";
import PaginaPartners from "./PaginaPartners";

export const metadata: Metadata = {
  title: { absolute: "Trabajá con LumoBi: cobrá $22.500 por cada comercio que recomendás (no necesitás tener negocio)" },
  description: "No necesitás tener un negocio. Recomendás LumoBi a comercios y cobrás $22.500 por cada uno que se suma y $10.000 todos los meses mientras siga. Sin invertir, desde tu celular.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Trabajá con LumoBi: cobrá $22.500 por cada comercio que recomendás",
    description: "Y $10.000 más todos los meses mientras siga. No necesitás tener un negocio ni invertir nada: lo hacés desde tu celular.",
    url: "/partners", siteName: "LumoBi", locale: "es_AR", type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <PaginaPartners />;
}
