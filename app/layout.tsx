import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import SwRegistrar from "./components/SwRegistrar";
import AppShell from "./components/AppShell";
import MetaPixel from "./components/MetaPixel";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lumobi.com.ar"),
  title: {
    default: "LumoBi: control de caja y fugas de plata para pymes y comercios",
    template: "%s | LumoBi",
  },
  description:
    "Control de caja y detección de pérdidas de dinero para pymes, comercios y gastronomía de Argentina. Ventas, Mercado Pago y predicción en un solo lugar. 5 días gratis.",
  applicationName: "LumoBi",
  openGraph: {
    siteName: "LumoBi", locale: "es_AR", type: "website",
    images: [{ url: "/og-lumobi.png", width: 1200, height: 630, alt: "LumoBi: tu negocio pierde plata todos los meses, LumoBi te dice dónde" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-lumobi.png"] },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LumoBi",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#EEF3FC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={instrumentSans.variable}>
      <head>
        <link rel="apple-touch-icon" href="/api/pwa-icon?size=192" />
      </head>
      <body>
        <SwRegistrar />
        <MetaPixel />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
