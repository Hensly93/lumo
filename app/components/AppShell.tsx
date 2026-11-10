"use client";
import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import PushRegistrar from "./PushRegistrar";
import PlanGate from "./PlanGate";
import Tracker from "./Tracker";

const SIN_HEADER = ["/landing", "/soluciones", "/login", "/empleado", "/reset-password", "/onboarding", "/admin"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const showHeader = !SIN_HEADER.some(r => path === r || path.startsWith(r + "/"));

  return (
    <>
      {showHeader && <AppHeader />}
      <PushRegistrar />
      <Tracker />
      <PlanGate />
      {children}
    </>
  );
}
