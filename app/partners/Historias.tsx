"use client";
// Historias: un "video" hecho de pantallas que pasan solas (como las historias de Instagram).
// Pasa sola cada pocos segundos; también se puede tocar Siguiente / Atrás, o mantener apretado para pausar.
import { useEffect, useRef, useState } from "react";
import { C, FUENTE } from "./comun";
import type { Pantalla } from "./lecciones";

const MS = 5500;

export default function Historias({ pantallas, titulo, onFin, onCerrar, textoFin = "Seguir" }: {
  pantallas: Pantalla[]; titulo: string; onFin: () => void; onCerrar: () => void; textoFin?: string;
}) {
  const [i, setI] = useState(0);
  const [avance, setAvance] = useState(0);   // 0..1 de la pantalla actual
  const [pausa, setPausa] = useState(false);
  const iRef = useRef(0), avRef = useRef(0), pausaRef = useRef(false), total = useRef(pantallas.length);
  const esUltima = i === pantallas.length - 1;

  useEffect(() => { pausaRef.current = pausa; }, [pausa]);
  useEffect(() => { total.current = pantallas.length; }, [pantallas.length]);

  useEffect(() => {
    let raf = 0;
    let antes: number | null = null;
    const paso = (t: number) => {
      const dt = antes == null ? 0 : t - antes;
      antes = t;
      if (!pausaRef.current) {
        avRef.current += dt / MS;
        if (avRef.current >= 1) {
          if (iRef.current < total.current - 1) { iRef.current += 1; avRef.current = 0; setI(iRef.current); }
          else avRef.current = 1;   // en la última se queda quieta esperando "Seguir"
        }
        setAvance(avRef.current);
      }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ir = (n: number) => {
    if (n < 0) return;
    if (n >= pantallas.length) { onFin(); return; }
    iRef.current = n; avRef.current = 0; setI(n); setAvance(0);
  };
  const p = pantallas[i];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: C.tinta, color: C.blanco, fontFamily: FUENTE, display: "flex", flexDirection: "column", userSelect: "none" }}>
      <div style={{ display: "flex", gap: 4, padding: "14px 14px 0" }}>
        {pantallas.map((_, k) => (
          <div key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: C.blanco, width: `${k < i ? 100 : k === i ? avance * 100 : 0}%` }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
        <span style={{ fontSize: 14, opacity: 0.8, fontWeight: 600 }}>{titulo}</span>
        <button onClick={onCerrar} aria-label="Cerrar" style={{ background: "none", border: "none", color: C.blanco, fontSize: 26, lineHeight: 1, cursor: "pointer", padding: 4 }}>×</button>
      </div>

      <div
        onPointerDown={() => setPausa(true)} onPointerUp={() => setPausa(false)} onPointerLeave={() => setPausa(false)}
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", textAlign: "center" }}
      >
        <div key={i} style={{ animation: "lpEntra .45s ease-out" }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, background: "rgba(0,194,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 62, margin: "0 auto 26px" }}>{p.icono}</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 14, maxWidth: 420 }}>{p.titulo}</div>
          {p.texto && <div style={{ fontSize: 19, lineHeight: 1.5, opacity: 0.85, maxWidth: 420, margin: "0 auto" }}>{p.texto}</div>}
        </div>
        {pausa && <div style={{ position: "absolute", top: 90, fontSize: 13, opacity: 0.7 }}>En pausa</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, padding: "16px 16px 28px" }}>
        <button onClick={() => ir(i - 1)} disabled={i === 0} style={{ padding: "16px", fontSize: 17, fontWeight: 700, borderRadius: 14, border: "1px solid rgba(255,255,255,0.35)", background: "transparent", color: C.blanco, opacity: i === 0 ? 0.35 : 1, fontFamily: FUENTE, cursor: "pointer" }}>Atrás</button>
        <button onClick={() => ir(i + 1)} style={{ padding: "16px", fontSize: 17, fontWeight: 800, borderRadius: 14, border: "none", background: C.cian, color: C.tinta, fontFamily: FUENTE, cursor: "pointer" }}>{esUltima ? textoFin : "Siguiente"}</button>
      </div>
      <style>{`@keyframes lpEntra { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
