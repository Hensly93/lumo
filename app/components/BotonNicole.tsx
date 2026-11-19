"use client";
// NICOLE siempre a un toque: botón flotante en todas las pantallas de la app (arriba del menú de abajo).
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIN_BOTON = ["/nicole", "/empleado", "/scan", "/scan-dueno", "/salir", "/login", "/onboarding", "/landing", "/soluciones", "/reset-password", "/admin", "/privacidad", "/terminos", "/primeros-pasos"];

export default function BotonNicole() {
  const path = usePathname();
  if (SIN_BOTON.some(r => path === r || path.startsWith(r + "/"))) return null;
  return (
    <Link href="/nicole" aria-label="Preguntarle a NICOLE" style={{
      position: "fixed", right: 16, bottom: "calc(86px + env(safe-area-inset-bottom))", zIndex: 40,
      height: 48, padding: "0 16px 0 12px", borderRadius: 99, background: "var(--tinta)", color: "#fff",
      display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, textDecoration: "none",
      fontFamily: "var(--font-instrument), sans-serif", boxShadow: "0 6px 20px #0A162833",
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7z" /></svg>
      Preguntale a NICOLE
    </Link>
  );
}
