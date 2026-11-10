// sitemap.xml de LumoBi (seo-lumobi): las páginas públicas que Google tiene que conocer.
import type { MetadataRoute } from "next";
import { PAGINAS, SITIO } from "./soluciones/datos";

export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();
  return [
    { url: `${SITIO}/landing`, lastModified: hoy, changeFrequency: "weekly", priority: 1 },
    ...PAGINAS.map((p) => ({ url: `${SITIO}/soluciones/${p.slug}`, lastModified: hoy, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${SITIO}/login`, lastModified: hoy, changeFrequency: "yearly", priority: 0.3 },
  ];
}
