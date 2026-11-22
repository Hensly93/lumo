import type { Metadata } from "next";
import PaginaPartners from "./PaginaPartners";

export const metadata: Metadata = {
  title: { absolute: "LumoBi busca vendedores a comisión: $22.500 por cada comercio" },
  description: "Vendé LumoBi, un sistema para kioscos grandes, autoservicios y supermercados. Cobrás $22.500 por cada comercio que se suma y $10.000 por mes por cada comercio que siga. Formación incluida.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "LumoBi busca vendedores a comisión: $22.500 por cada comercio",
    description: "Y $10.000 por mes por CADA comercio que siga (con 10 comercios, $100.000 todos los meses). Formación incluida y cobro por transferencia.",
    url: "/partners", siteName: "LumoBi", locale: "es_AR", type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <PaginaPartners />;
}
