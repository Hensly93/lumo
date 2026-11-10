// robots.txt de LumoBi (seo-lumobi): se puede leer lo público y no las pantallas privadas del negocio.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/soluciones/", "/login"],
        disallow: [
          "/api/", "/admin", "/scan", "/scan-dueno", "/empleado", "/empleados", "/onboarding", "/reset-password",
          "/ajustes", "/alertas", "/benchmark", "/catalogo", "/dashboard", "/fugas", "/mas", "/mi-local", "/negocio",
          "/nicole", "/periodos", "/predicciones", "/primeros-pasos", "/red", "/rentabilidad", "/salir",
        ],
      },
    ],
    sitemap: "https://lumobi.com.ar/sitemap.xml",
  };
}
