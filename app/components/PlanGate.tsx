"use client";
// Aviso de prueba por vencer y vista resumida cuando la prueba terminó.
// Se muestra en toda la app (pantallas con sesión iniciada). Si el servidor responde "plan_vencido" en cualquier pantalla,
// se tapa con la vista resumida: ventas del último mes y cuánta plata se fuga, sin el detalle.
// "Activar mi plan" abre el débito automático de Mercado Pago (la tarjeta se carga en Mercado Pago, no en LumoBi).
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const SIN_PLAN = ["/landing", "/login", "/empleado", "/reset-password", "/scan", "/scan-dueno", "/salir"];
const HABLEMOS = "mailto:lumobusinessintel@gmail.com?subject=LumoBi%20para%20mi%20empresa";

type Estado = { estado: "trial" | "activa" | "vencida"; dias_restantes: number | null; sin_vencimiento?: boolean };
type Resumen = {
  ventas: { total: number; cantidad: number; ticket_promedio: number };
  fugas: { cantidad: number; monto: number } | null;
  bloqueado: string[];
};
type Cobro = { plan: "normal" | "empresarial"; neto: number | null; iva: number | null; total: number | null };
const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function PlanGate() {
  const path = usePathname();
  const [est, setEst] = useState<Estado | null>(null);
  const [res, setRes] = useState<Resumen | null>(null);
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [yaUso, setYaUso] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const [confirmando, setConfirmando] = useState(false);
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
    fetch(`${API}/api/plan/cobro`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => (r.ok ? r.json() : null))
      .then((x: Cobro | null) => { if (vigente && x && x.plan) setCobro(x); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [vencida, aplica]);

  // Al volver de Mercado Pago (?pago=ok) se espera la confirmación del pago y se recarga la app
  useEffect(() => {
    if (!aplica) return;
    if (new URLSearchParams(window.location.search).get("pago") !== "ok") return;
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    setConfirmando(true);
    let intentos = 0;
    let vigente = true;
    const lim = () => { try { window.history.replaceState(null, "", window.location.pathname); } catch { /* ok */ } };
    const iv = setInterval(async () => {
      intentos += 1;
      try {
        const r = await fetch(`${API}/api/plan/estado`, { headers: { Authorization: `Bearer ${t}` } });
        const x: Estado | null = r.ok ? await r.json() : null;
        if (vigente && x && x.estado === "activa") { clearInterval(iv); lim(); window.location.reload(); return; }
      } catch { /* se reintenta */ }
      if (intentos >= 20) { clearInterval(iv); lim(); if (vigente) setConfirmando(false); }
    }, 3000);
    return () => { vigente = false; clearInterval(iv); };
  }, [aplica]);

  async function activar() {
    const t = localStorage.getItem("lumo_token");
    if (!t || pagando) return;
    setPagando(true);
    setErrorPago("");
    try {
      const r = await fetch(`${API}/api/plan/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ origen: window.location.origin }),
      });
      const j = await r.json().catch(() => ({}));
      if (j && j.init_point) { window.location.href = j.init_point; return; }
      if (j && j.error === "empresarial") { window.location.href = HABLEMOS; return; }
      if (j && j.error === "ya_activa") { window.location.reload(); return; }
      setErrorPago((j && j.error) || "No pudimos abrir Mercado Pago. Probá de nuevo.");
    } catch {
      setErrorPago("No pudimos conectar. Revisá tu internet y probá de nuevo.");
    }
    setPagando(false);
  }

  if (!aplica || !est) return null;

  if (est.estado === "trial" && !est.sin_vencimiento && est.dias_restantes !== null && est.dias_restantes <= 3) {
    const d = est.dias_restantes;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 16px", background: "var(--card2, #fff)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text)" }}>
        <span>{d <= 1 ? "Hoy termina tu prueba de LumoBi." : `Te quedan ${d} días de prueba.`}</span>
        <button onClick={activar} disabled={pagando} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--cyan)", fontWeight: 700, whiteSpace: "nowrap" }}>
          {pagando ? "Abriendo…" : "Activar plan"}
        </button>
      </div>
    );
  }

  if (!vencida) return null;

  const caja = { background: "var(--card2, #fff)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" } as const;
  const empresarial = cobro?.plan === "empresarial";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--bg)", overflowY: "auto", padding: "28px 20px 40px" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          {confirmando ? "Confirmando tu pago…" : yaUso ? "Este negocio ya usó la prueba gratis" : "Tu prueba terminó"}
        </div>
        <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 20 }}>
          {confirmando
            ? "Mercado Pago nos está avisando. En unos segundos se abre todo."
            : yaUso
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

        {cobro && cobro.total !== null && !empresarial && (
          <div style={{ ...caja, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Tu abono mensual</div>
            <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 26, fontWeight: 700, color: "var(--text)" }}>{pesos(cobro.total)}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
              {pesos(cobro.neto ?? 0)} + IVA. Débito automático con Mercado Pago, lo cancelás cuando quieras.
            </div>
          </div>
        )}

        {errorPago && (
          <div style={{ fontSize: 13, color: "var(--red, #E5484D)", textAlign: "center", marginBottom: 10, lineHeight: 1.5 }}>{errorPago}</div>
        )}

        {empresarial ? (
          <a href={HABLEMOS} style={{ display: "block", textAlign: "center", padding: "14px", background: "var(--cyan, #007AFF)", color: "#fff", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none", marginBottom: 12 }}>
            Hablemos: armamos tu plan a medida
          </a>
        ) : (
          <button onClick={activar} disabled={pagando || confirmando} style={{ display: "block", width: "100%", textAlign: "center", padding: "14px", background: "var(--cyan, #007AFF)", color: "#fff", border: "none", cursor: pagando || confirmando ? "default" : "pointer", opacity: pagando || confirmando ? 0.7 : 1, borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "inherit", marginBottom: 12 }}>
            {pagando ? "Abriendo Mercado Pago…" : "Activar mi plan"}
          </button>
        )}
        <a href="/salir" style={{ display: "block", textAlign: "center", padding: "10px", color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
          Cerrar sesión
        </a>
      </div>
    </div>
  );
}
