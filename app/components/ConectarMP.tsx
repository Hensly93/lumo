"use client";
// Tarjeta del Inicio: aparece cuando ya hay ventas y Mercado Pago todavía no está conectado.
// No está en el onboarding a propósito: se pide cuando el dueño ya vio valor.
// Todo lo que dice acá lo hace el código (ver /mercado-pago).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "../lib/track";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function ConectarMP({ token }: { token: string | null }) {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    fetch(`${API}/api/mp/estado`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d) return;
        if (d.conectado === false) { setMostrar(true); track("mp_card_inicio_vista"); }
      })
      .catch(() => { /* sin conexión: no se muestra */ });
    return () => { vivo = false; };
  }, [token]);

  if (!mostrar) return null;

  return (
    <div style={{ margin: "0 0 16px", padding: 16, borderRadius: 14, border: "2px solid var(--tinta)", background: "var(--blanco)" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--tinta)", marginBottom: 6 }}>Conectá Mercado Pago para ver toda tu plata</div>
      <div style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.55, marginBottom: 6 }}>
        Hoy LumoBi solo ve lo que se anota en la caja. Conectándolo, cruza lo que entró a tu cuenta con lo que anotó la caja y te avisa si entró plata que nadie registró. También ve la comisión real que te sacan en cada cobro.
      </div>
      <div style={{ fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5, marginBottom: 12 }}>
        No te saca plata ni tiene cómo moverla, y lo cortás cuando quieras. Son 30 segundos.
      </div>
      <button
        onClick={() => { track("mp_card_inicio_click"); router.push("/mercado-pago"); }}
        style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "var(--tinta)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        Ver cómo conectarlo
      </button>
    </div>
  );
}
