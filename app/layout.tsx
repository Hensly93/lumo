import type { Metadata, Viewport } from "next";
import "./globals.css";
import SwRegistrar from "./components/SwRegistrar";
import AppShell from "./components/AppShell";

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
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/api/pwa-icon?size=192" />
      </head>
      <body>
        <SwRegistrar />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
