"use client";
// Barra con el botón fijo abajo en el celular. Aparece después de pasar la primera pantalla y se oculta al llegar al cierre.
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BarraCta({ href }: { href: string }) {
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const f = () => {
      const y = window.scrollY;
      const fin = document.documentElement.scrollHeight - window.innerHeight - 700;
      setVer(y > 560 && y < fin);
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <div
      aria-hidden={!ver}
      className="barra"
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
        background: "rgba(10,22,40,.96)", borderTop: "1px solid rgba(255,255,255,.1)",
        transform: ver ? "translateY(0)" : "translateY(110%)", transition: "transform .2s", justifyContent: "center",
        pointerEvents: ver ? "auto" : "none",
      }}
    >
      <Link href={href} tabIndex={ver ? 0 : -1} className="btn" style={{ width: "100%", maxWidth: 420, display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 50, borderRadius: 12, background: "#00C2FF", color: "#0A1628", fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
        Probar 5 días gratis
      </Link>
    </div>
  );
}
