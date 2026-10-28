"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Fila = {
  sucursal_id: number;
  nombre: string;
  ventas: number;
  tickets: number;
  estado: "por_encima" | "en_linea" | "por_debajo" | "temprano" | "antes_de_abrir" | "cerrado" | "sin_prediccion";
  esperado_hasta_ahora?: number;
  esperado_dia?: number;
  dif_pct?: number | null;
  ultima_hora?: { hora: number; real: number; esperado: number } | null;
  turno_activo?: { tipo: string; desde: number } | null;
  horario?: { desde: number; hasta: number };
};
type Respuesta = {
  ahora: { fecha: string; hora: number; minuto: number };
  sucursales: Fila[];
  total: { ventas: number; tickets: number; esperado_hasta_ahora: number | null; esperado_dia: number | null } | null;
};

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

const ESTADO: Record<Fila["estado"], { texto: string; color: string; fondo: string }> = {
  por_encima:     { texto: "Por encima",    color: "#00A676", fondo: "#00C48C18" },
  en_linea:       { texto: "En línea",      color: "#007AFF", fondo: "#007AFF14" },
  por_debajo:     { texto: "Por debajo",    color: "#E5484D", fondo: "#EF444418" },
  temprano:       { texto: "Recién empieza", color: "#64748B", fondo: "#94A3B818" },
  antes_de_abrir: { texto: "Todavía no abre", color: "#64748B", fondo: "#94A3B818" },
  cerrado:        { texto: "Cerrado",       color: "#64748B", fondo: "#94A3B818" },
  sin_prediccion: { texto: "Aprendiendo",   color: "#64748B", fondo: "#94A3B818" },
};

function badge(f: Fila) {
  const e = ESTADO[f.estado];
  const conPct = (f.estado === "por_encima" || f.estado === "por_debajo" || f.estado === "cerrado") && f.dif_pct != null;
  const pct = conPct ? ` ${f.dif_pct! > 0 ? "+" : ""}${f.dif_pct}%` : "";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: e.color, background: e.fondo, borderRadius: 8, padding: "3px 8px", whiteSpace: "nowrap" }}>
      {e.texto}{pct}
    </span>
  );
}

// Tu Negocio en Vivo: cuánto llevás vendido hoy en cada local contra lo que NICOLE
// esperaba a esta hora. Se actualiza solo cada minuto.
export default function EnVivoCard() {
  const [data, setData] = useState<Respuesta | null>(null);

  useEffect(() => {
    let vivo = true;
    const cargar = () => {
      const t = localStorage.getItem("lumo_token");
      if (!t) return;
      fetch(`${API}/api/multilocal/en-vivo`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (vivo && d) setData(d); })
        .catch(() => {});
    };
    cargar();
    const id = setInterval(cargar, 60_000);
    return () => { vivo = false; clearInterval(id); };
  }, []);

  if (!data || !data.sucursales.length) return null;
  const { ahora, sucursales, total } = data;
  const hora = `${ahora.hora}:${String(ahora.minuto).padStart(2, "0")}`;
  const varias = sucursales.length > 1;

  return (
    <div style={{ background: "white", borderRadius: 20, padding: 18, margin: "16px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "#00C48C", display: "inline-block", boxShadow: "0 0 0 4px #00C48C25" }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#0A1628" }}>EN VIVO</span>
        </div>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{hora} · se actualiza solo</span>
      </div>

      {varias && total && total.esperado_dia != null && (
        <div style={{ fontSize: 13, color: "#0A1628", marginBottom: 14, lineHeight: 1.5 }}>
          {sucursales.every(f => f.estado === "cerrado" || f.estado === "sin_prediccion") && total.ventas > 0 ? (
            <>Hoy cerraste con <strong>{fmt(total.ventas)}</strong> en {total.tickets} ventas, contra <strong>{fmt(total.esperado_dia)}</strong> esperados.</>
          ) : !total.esperado_hasta_ahora && !total.ventas ? (
            <>Todavía no empezó el día de ventas. Hoy se esperan <strong>{fmt(total.esperado_dia)}</strong>.</>
          ) : (
            <>Hoy llevás <strong>{fmt(total.ventas)}</strong> en {total.tickets} ventas. A esta hora lo normal es{" "}
            <strong>{fmt(total.esperado_hasta_ahora ?? 0)}</strong> (día completo: {fmt(total.esperado_dia)}).</>
          )}
        </div>
      )}

      {sucursales.map((f, i) => {
        const avance = f.esperado_dia ? Math.min(100, Math.round((f.ventas / f.esperado_dia) * 100)) : null;
        const marca = f.esperado_dia && f.esperado_hasta_ahora != null ? Math.min(100, Math.round((f.esperado_hasta_ahora / f.esperado_dia) * 100)) : null;
        const color = ESTADO[f.estado].color;
        return (
          <div key={f.sucursal_id} style={{ padding: "12px 0", borderTop: i ? "1px solid #EEF2F7" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</div>
              {badge(f)}
            </div>
            <div style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>
              <strong>{fmt(f.ventas)}</strong>
              {f.esperado_hasta_ahora != null && f.estado !== "antes_de_abrir" && (
                <span style={{ color: "#64748B" }}>
                  {f.estado === "cerrado" ? ` de ${fmt(f.esperado_dia ?? 0)} esperados en el día` : ` · lo normal a esta hora: ${fmt(f.esperado_hasta_ahora)}`}
                </span>
              )}
            </div>
            {avance != null && (
              <div style={{ position: "relative", height: 6, background: "#EEF2F7", borderRadius: 3, marginTop: 8 }}>
                <div style={{ width: `${avance}%`, height: 6, background: color, borderRadius: 3 }} />
                {marca != null && f.estado !== "cerrado" && (
                  <div title="Lo normal a esta hora" style={{ position: "absolute", left: `${marca}%`, top: -3, width: 2, height: 12, background: "#0A1628", opacity: 0.35 }} />
                )}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, lineHeight: 1.6 }}>
              {f.ultima_hora && f.estado !== "cerrado" && f.estado !== "antes_de_abrir" && (
                <div>Última hora ({f.ultima_hora.hora} a {f.ultima_hora.hora + 1} h): {fmt(f.ultima_hora.real)} · lo normal {fmt(f.ultima_hora.esperado)}</div>
              )}
              {f.turno_activo && <div>Turno {f.turno_activo.tipo} abierto desde las {f.turno_activo.desde} h</div>}
              {f.estado === "antes_de_abrir" && f.horario && <div>Suele empezar a vender a las {f.horario.desde} h</div>}
              {f.estado === "sin_prediccion" && <div>NICOLE todavía no tiene historia suficiente de este local para comparar.</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
