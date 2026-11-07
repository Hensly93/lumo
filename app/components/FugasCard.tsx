"use client";
// Tarjeta de Inicio: plata en fuga y la fuga más grande. No se muestra si no hay nada que mostrar.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
type Resp = { resumen: { en_fuga: number; cantidad: number; recuperado: number }; fugas: { id: string; titulo: string; donde: string; monto: number; estado: string; incluida_en?: string }[] };
const fmt = (n: number) => "$" + Math.abs(Math.round(n)).toLocaleString("es-AR");

export default function FugasCard() {
  const router = useRouter();
  const [d, setD] = useState<Resp | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    let vigente = true;
    fetch(`${API}/api/fugas`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then((x: Resp) => { if (vigente && x?.fugas) setD(x); })
      .catch(() => {});
    return () => { vigente = false; };
  }, []);

  if (!d || d.resumen.cantidad === 0 || d.resumen.en_fuga <= 0) return null;
  const top = d.fugas.find(f => f.estado === "activa" && !f.incluida_en) ?? d.fugas.find(f => f.estado === "activa");

  return (
    <div onClick={() => router.push(top ? `/fugas?id=${encodeURIComponent(top.id)}` : "/fugas")}
      style={{ margin: "8px 0", background: "var(--card2, #fff)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--border)", borderLeft: "3px solid var(--red, #E5484D)", cursor: "pointer" }}>
      <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>Plata en fuga · últimos 30 días</div>
      <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 28, fontWeight: 800, color: "var(--red, #E5484D)", margin: "4px 0" }}>{fmt(d.resumen.en_fuga)}</div>
      {top && <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>La más grande: {top.titulo} ({top.donde}).</div>}
      <div style={{ fontSize: 12, color: "var(--cyan, #007AFF)", fontWeight: 600, marginTop: 6 }}>Ver dónde está y cómo cerrarla</div>
    </div>
  );
}
