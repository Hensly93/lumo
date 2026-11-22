import type { Metadata } from "next";
import PaginaPartners from "./PaginaPartners";

export const metadata: Metadata = {
  title: { absolute: "LumoBi Partners: ganá todos los meses recomendando LumoBi a comercios" },
  description: "Recomendá LumoBi a los comercios que conocés y cobrá una comisión por cada negocio que se suma y todos los meses mientras siga. Sin inversión y sin cupo.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "LumoBi Partners",
    description: "Cobrá por cada comercio que traés a LumoBi y todos los meses mientras siga.",
    url: "/partners", siteName: "LumoBi", locale: "es_AR", type: "website",
    images: [{ url: "/og-lumobi.png", width: 1200, height: 630, alt: "LumoBi Partners" }],
  },
};

export default function Page() {
  return <PaginaPartners />;
}
