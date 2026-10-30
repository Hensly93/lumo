import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import SwRegistrar from "./components/SwRegistrar";
import AppShell from "./components/AppShell";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Lumo — Detección operativa",
  description: "Detectá inconsistencias en tu caja antes de que se acumulen.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lumo",
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
    <html lang="es" className={instrumentSans.variable}>
      <head>
        <link rel="apple-touch-icon" href="/api/pwa-icon?size=192" />
      </head>
      <body>
        <SwRegistrar />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
