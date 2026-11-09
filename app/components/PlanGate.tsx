"use client";
// Aviso de prueba por vencer y vista resumida cuando la prueba terminó.
// Se muestra en toda la app (pantallas con sesión iniciada). Si el servidor responde "plan_vencido" en cualquier pantalla,
// se tapa con la vista resumida: ventas del último mes y cuánta plata se fuga, sin el detalle.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const SIN_PLAN = ["/landing", "/login", "/empleado", "/reset-password", "/scan", "/scan-dueno", "/salir"];
const ACTIVAR = "mailto:lumobusinessintel@gmail.com?subject=Activar%20mi%20plan%20de%20LumoBi";

type Estado = { estado: "trial" | "activa" | "vencida"; dias_restantes: number | null; sin_vencimiento?: boolean };
type Resumen = {
  ventas: { total: number; cantidad: number; ticket_promedio: number };
  fugas: { cantidad: number; monto: number } | null;
  bloqueado: string[];
};
const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function PlanGate() {
  const path = usePathname();
  const [est, setEst] = useState<Estado | null>(null);
  const [res, setRes] = useState<Resumen | null>(null);
  const [yaUso, setYaUso] = useState(false);
  const aplica = !SIN_PLAN.some(r => path === r || path.startsWith(r + "/"));

  // Si cualquier pantalla recibe "plan_vencido", se pasa a la vista resumida
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const r = await original(...args);
      if (r.status === 402) {
        try {
          const j = await r.clone().json();
          if (j && j.error === "plan_vencido") setEst({ estado: "vencida", dias_restantes: 0 });
        } catch { /* sin cuerpo: se ignora */ }
      }
      return r;
    };
    return () => { window.fetch = original; };
  }, []);

  useEffect(() => {
    if (!aplica) return;
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    try { setYaUso(sessionStorage.getItem("lumo_ya_uso_prueba") === "1"); } catch { /* sin acceso */ }
    let vigente = true;
    fetch(`${API}/api/plan/estado`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then((x: Estado | null) => { if (vigente && x && x.estado) setEst(x); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [path, aplica]);

  const vencida = est?.estado === "vencida";
  useEffect(() => {
    if (!vencida || !aplica) return;
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    let vigente = true;
    fetch(`${API}/api/plan/resumen`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then((x: Resumen | null) => { if (vigente && x && x.ventas) setRes(x); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [vencida, aplica]);

  if (!aplica || !est) return null;

  if (est.estado === "trial" && !est.sin_vencimiento && est.dias_restantes !== null && est.dias_restantes <= 3) {
    const d = est.dias_restantes;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 16px", background: "var(--card2, #fff)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text)" }}>
        <span>{d <= 1 ? "Hoy termina tu prueba de LumoBi." : `Te quedan ${d} días de prueba.`}</span>
        <a href={ACTIVAR} style={{ color: "var(--cyan)", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>Activar plan</a>
      </div>
    );
  }

  if (!vencida) return null;

  const caja = { background: "var(--card2, #fff)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" } as const;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--bg)", overflowY: "auto", padding: "28px 20px 40px" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          {yaUso ? "Este negocio ya usó la prueba gratis" : "Tu prueba terminó"}
        </div>
        <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 20 }}>
          {yaUso
            ? "Tu email, celular o CUIT ya tuvo una prueba de LumoBi. Activá tu plan para empezar a usarlo."
            : "Tus datos están guardados y no se perdió nada. Activá tu plan para volver a ver todo."}
        </div>

        {res && res.fugas && res.fugas.monto > 0 && (
          <div style={{ ...caja, borderLeft: "3px solid var(--red, #E5484D)", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Plata que se fuga ({`últimos 30 días`})</div>
            <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 26, fontWeight: 700, color: "var(--text)" }}>{pesos(res.fugas.monto)}</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, lineHeight: 1.5 }}>
              LumoBi detectó {res.fugas.cantidad} {res.fugas.cantidad === 1 ? "fuga" : "fugas"}. Con el plan activo ves dónde está cada una y cómo cerrarla.
            </div>
          </div>
        )}

        {res && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ ...caja, flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Ventas del mes</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{pesos(res.ventas.total)}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{res.ventas.cantidad} ventas</div>
            </div>
            <div style={{ ...caja, flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Ticket promedio</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{pesos(res.ventas.ticket_promedio)}</div>
            </div>
          </div>
        )}

        {res && res.bloqueado.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Con el plan activo desbloqueás</div>
            {res.bloqueado.map(b => (
              <div key={b} style={{ fontSize: 14, color: "var(--text)", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>{b}</div>
            ))}
          </div>
        )}

        <a href={ACTIVAR} style={{ display: "block", textAlign: "center", padding: "14px", background: "var(--cyan, #007AFF)", color: "#fff", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none", marginBottom: 12 }}>
          Activar mi plan
        </a>
        <a href="/salir" style={{ display: "block", textAlign: "center", padding: "10px", color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
          Cerrar sesión
        </a>
      </div>
    </div>
  );
}
