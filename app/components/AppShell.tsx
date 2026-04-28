"use client";
import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";

// Rutas donde NO aparece el header (auth, landing, vista empleado)
const SIN_HEADER = ["/landing", "/login", "/empleado", "/reset-password", "/onboarding"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const showHeader = !SIN_HEADER.some(r => path === r || path.startsWith(r + "/"));

  return (
    <>
      {showHeader && <AppHeader />}
      {children}
    </>
  );
}
