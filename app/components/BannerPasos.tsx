"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";
const CLAVE_OCULTO = "lumo_banner_pasos_oculto";
const MIN_PRODUCTOS = 3;

type Estado = {
  negocio: boolean;
  locales: boolean;
  equipo: boolean;
  ventas: boolean;
  avisos: boolean;
  turno: boolean;
};

type Paso = { id: string; hecho: boolean; titulo: string; porque: string; boton: string; ir: string };

function hoy(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function BannerPasos({ token }: { token: string | null }) {
  const router = useRouter();
  const [pasos, setPasos] = useState<Paso[] | null>(null);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(CLAVE_OCULTO) === hoy()) setOculto(true); } catch { /* sin almacenamiento */ }
  }, []);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    const h = { Authorization: "Bearer " + token };

    async function cargar() {
      try {
        const [re, rp] = await Promise.all([
          fetch(API + "/api/pasos/estado", { headers: h }),
          fetch(API + "/api/productos", { headers: h }).catch(() => null),
        ]);
        if (!re.ok) return;
        const e = (await re.json()) as Estado;

        let hayProductos: boolean | null = null;
        if (rp && rp.ok) {
          const d: unknown = await rp.json();
          const lista = Array.isArray(d) ? d : (d as { productos?: unknown }).productos;
          if (Array.isArray(lista)) hayProductos = lista.length >= MIN_PRODUCTOS;
        }

        const lista: Paso[] = [];
        if (hayProductos !== null) {
          lista.push({
            id: "catalogo", hecho: hayProductos, titulo: "Cargá tus productos",
            porque: "Con tus productos y sus costos, NICOLE calcula tu margen y te muestra dónde se te va la plata.",
            boton: "Cargar productos", ir: "/catalogo",
          });
        }
        lista.push(
          {
            id: "equipo", hecho: !!e.equipo, titulo: "Sumá a tu equipo",
            porque: "Cada persona vende con su PIN, y así sabés quién hizo cada venta y cada cambio de precio.",
            boton: "Armar mi equipo", ir: "/mi-local",
          },
          {
            id: "ventas", hecho: !!e.ventas, titulo: "Subí tus ventas",
            porque: "Con tus ventas NICOLE aprende cómo funciona tu negocio y empieza a predecir y a avisarte.",
            boton: "Subir ventas", ir: "/primeros-pasos",
          },
          {
            id: "avisos", hecho: !!e.avisos, titulo: "Activá los avisos en tu celu",
            porque: "Así te enterás en el momento si algo se desvía, sin tener que entrar a mirar.",
            boton: "Activar avisos", ir: "/primeros-pasos",
          },
          {
            id: "negocio", hecho: !!e.negocio, titulo: "Completá los datos de tu negocio",
            porque: "Con el rubro y la zona, NICOLE te compara con negocios parecidos al tuyo.",
            boton: "Completar datos", ir: "/onboarding?desde=pasos",
          },
          {
            id: "locales", hecho: !!e.locales, titulo: "Cargá tus locales",
            porque: "Así NICOLE analiza cada local por separado.",
            boton: "Cargar locales", ir: "/red",
          },
          {
            id: "turno", hecho: !!e.turno, titulo: "Hacé tu primer turno de prueba",
            porque: "Es la forma de ver a NICOLE funcionando con tus propios números.",
            boton: "Probar la caja", ir: "/empleado",
          },
        );
        if (vivo) setPasos(lista);
      } catch { /* sin conexion: no se muestra nada */ }
    }

    cargar();
    const refrescar = () => { if (document.visibilityState === "visible") cargar(); };
    document.addEventListener("visibilitychange", refrescar);
    return () => { vivo = false; document.removeEventListener("visibilitychange", refrescar); };
  }, [token]);

  if (!pasos || oculto) return null;
  const total = pasos.length;
  const hechos = pasos.filter(p => p.hecho).length;
  if (hechos >= total) return null;
  const siguiente = pasos.find(p => !p.hecho);
  if (!siguiente) return null;
  const pct = Math.round((hechos / total) * 100);

  function ahoraNo() {
    setOculto(true);
    try { localStorage.setItem(CLAVE_OCULTO, hoy()); } catch { /* sin almacenamiento */ }
  }

  return (
    <div style={{
      margin: "12px 0 16px", padding: "16px 16px 14px", borderRadius: 18, boxSizing: "border-box",
      background: "var(--card, #fff)", border: "1px solid #00C2FF", fontFamily: FUENTE,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0A5BD3" }}>Completá LumoBi al 100%</span>
        <span style={{ fontSize: 12, color: "var(--muted, #64748B)" }}>{hechos} de {total} · {pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--border, #E0E7F1)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, #0A5BD3, #00C2FF)", transition: "width 0.3s" }} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text, #0A1628)", marginBottom: 4 }}>{siguiente.titulo}</div>
      <div style={{ fontSize: 13, color: "var(--muted, #64748B)", lineHeight: 1.5, marginBottom: 12 }}>{siguiente.porque}</div>
      <button
        onClick={() => router.push(siguiente.ir)}
        style={{
          width: "100%", padding: "13px", border: "none", borderRadius: 12, cursor: "pointer",
          background: "linear-gradient(135deg, #0A5BD3, #00C2FF)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: FUENTE,
        }}
      >{siguiente.boton}</button>
      <button
        onClick={ahoraNo}
        style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--muted, #64748B)", fontFamily: FUENTE, textDecoration: "underline" }}
      >Ahora no</button>
    </div>
  );
}
