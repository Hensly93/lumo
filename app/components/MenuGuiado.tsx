"use client";
// MenuGuiado — menú de una sección, ordenado por la pregunta que se hace el dueño (15/11/2026).
// Cada grupo es una pregunta en criollo; cada ítem tiene su nombre y una frase que entiende cualquiera.
// Lo usan Plata, Equipo y Más para que toda la app se lea igual.
import Link from "next/link";
import type { ReactNode } from "react";

export type ItemMenu = { label: string; desc: string; href: string; icon?: ReactNode; nuevo?: boolean; estado?: string };
export type GrupoMenu = { pregunta: string; ayuda?: string; items: ItemMenu[] };

export default function MenuGuiado({ grupos }: { grupos: GrupoMenu[] }) {
  return (
    <div>
      {grupos.map((g, gi) => (
        <section key={g.pregunta} style={{ marginTop: gi === 0 ? 4 : 22 }}>
          <h2 style={{ margin: "0 4px 2px", fontSize: 17, fontWeight: 800, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif" }}>{g.pregunta}</h2>
          {g.ayuda && <div style={{ margin: "0 4px 10px", fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.45 }}>{g.ayuda}</div>}
          {!g.ayuda && <div style={{ height: 8 }} />}
          {g.items.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 14, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                {item.icon && <div style={{ flexShrink: 0 }}>{item.icon}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontFamily: "var(--font-instrument), sans-serif", fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{item.label}</span>
                    {item.nuevo && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--azul)", border: "1px solid var(--azul)", borderRadius: 8, padding: "1px 7px" }}>Nuevo</span>}
                    {item.estado && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tinta-apagada)", background: "var(--papel)", borderRadius: 8, padding: "2px 7px" }}>{item.estado}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.45 }}>{item.desc}</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" stroke="var(--tinta-apagada)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
