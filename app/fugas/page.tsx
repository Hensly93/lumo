"use client";
// Fugas — LumoBi: dónde se va la plata, cuánto, por qué lo sabemos y cómo cerrarla.
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Estado = "activa" | "en_seguimiento" | "resuelta" | "descartada";
type Fuga = {
  id: string; categoria: string; categoria_label: string; donde: string; titulo: string; monto: number;
  monto_tipo: "medido" | "calculado"; periodo: string; evidencia: string[]; como_corregir: string[];
  recuperado: number; estado: Estado; nota: string | null; incluida_en?: string; url: string;
};
type Resp = {
  resumen: { en_fuga: number; cantidad: number; recuperado: number; periodo: string; nota: string };
  fugas: Fuga[]; avisos: string[]; pendientes_de_datos: { id: string; titulo: string; falta: string }[];
};

const fmt = (n: number) => "$" + Math.abs(Math.round(n)).toLocaleString("es-AR");
const ROJO = "var(--red, #E5484D)";
const tarjeta: CSSProperties = { margin: "8px 12px", background: "var(--card2)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--border)" };
const etiqueta: CSSProperties = { fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 };
const boton = (activo: boolean): CSSProperties => ({
  padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
  border: activo ? "1px solid var(--cyan, #007AFF)" : "1px solid var(--border)",
  background: activo ? "var(--cyan, #007AFF)" : "transparent", color: activo ? "white" : "var(--text)",
});
const ESTADO_TXT: Record<Estado, string> = { activa: "Activa", en_seguimiento: "En seguimiento", resuelta: "Resuelta", descartada: "Descartada" };

function headers() {
  const t = localStorage.getItem("lumo_token");
  return { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
}

export default function FugasPage() {
  const router = useRouter();
  const [d, setD] = useState<Resp | null>(null);
  const [error, setError] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback((primera: boolean) => {
    if (!localStorage.getItem("lumo_token")) { router.replace("/login"); return; }
    fetch(`${API}/api/fugas`, { headers: headers() })
      .then(r => r.json())
      .then((x: Resp & { error?: string }) => {
        if (!x?.fugas) { setError(x?.error || "No se pudieron calcular las fugas"); return; }
        setD(x); setError("");
        if (primera) {
          const q = new URLSearchParams(window.location.search).get("id");
          setAbierta(q && x.fugas.some(f => f.id === q) ? q : (x.fugas.find(f => f.estado === "activa")?.id ?? null));
        }
      })
      .catch(() => setError("Sin conexión"));
  }, [router]);

  useEffect(() => { cargar(true); }, [cargar]);

  async function marcar(f: Fuga, estado: Estado) {
    setGuardando(f.id);
    try {
      const r = await fetch(`${API}/api/fugas/estado`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ id: f.id, estado: f.estado === estado ? "activa" : estado, monto: f.monto }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j?.error || "No se pudo guardar"); }
      else cargar(false);
    } catch { setError("Sin conexión"); }
    setGuardando(null);
  }

  const activas = d?.fugas.filter(f => f.estado === "activa" || f.estado === "en_seguimiento") ?? [];
  const cerradas = d?.fugas.filter(f => f.estado === "resuelta" || f.estado === "descartada") ?? [];

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Fugas" sub="Dónde se te va la plata y cómo cerrarla" />

      {error && <div style={{ ...tarjeta, color: ROJO, fontSize: 13 }}>{error}</div>}
      {!d && !error && <div style={{ textAlign: "center", padding: 40, fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Calculando...</div>}

      {d && (
        <>
          <div style={tarjeta}>
            <div style={etiqueta}>Plata en fuga · {d.resumen.periodo}</div>
            <div style={{ fontFamily: "var(--font-instrument),sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.1, margin: "6px 0 4px", color: d.resumen.en_fuga > 0 ? ROJO : "var(--emerald)" }}>
              {fmt(d.resumen.en_fuga)}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              {d.resumen.cantidad > 0
                ? `${d.resumen.cantidad} ${d.resumen.cantidad === 1 ? "fuga activa" : "fugas activas"}. No se suma dos veces lo mismo.`
                : "Con los datos que tenemos hoy no detectamos fugas activas."}
            </div>
            {d.resumen.recuperado > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <div style={etiqueta}>Plata recuperada</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--emerald)" }}>{fmt(d.resumen.recuperado)}</div>
              </div>
            )}
          </div>

          {activas.map(f => {
            const open = abierta === f.id;
            return (
              <div key={f.id} style={{ ...tarjeta, borderLeft: `3px solid ${f.estado === "en_seguimiento" ? "var(--yellow, #F5A524)" : ROJO}` }}>
                <div onClick={() => setAbierta(open ? null : f.id)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <span style={etiqueta}>{f.categoria_label} · {f.donde}</span>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{ESTADO_TXT[f.estado]}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>{f.titulo}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: f.incluida_en ? "var(--muted)" : ROJO, whiteSpace: "nowrap" }}>{fmt(f.monto)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {f.monto_tipo === "medido" ? "Monto medido en tus cierres de caja" : "Monto calculado con tus gastos y la inflación"} · {f.periodo}
                    {f.incluida_en ? " · ya está incluida en otra fuga, no se suma" : ""}
                  </div>
                </div>

                {open && (
                  <div style={{ marginTop: 12 }}>
                    <div style={etiqueta}>Por qué lo sabemos</div>
                    {f.evidencia.map((e, i) => <div key={i} style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: "4px 0" }}>{e}</div>)}
                    <div style={{ ...etiqueta, marginTop: 12 }}>Cómo cerrarla</div>
                    {f.como_corregir.map((c, i) => (
                      <div key={i} style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: "4px 0", display: "flex", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "var(--muted)" }}>{i + 1}.</span><span>{c}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      <button style={boton(f.estado === "en_seguimiento")} disabled={guardando === f.id} onClick={() => marcar(f, "en_seguimiento")}>En seguimiento</button>
                      <button style={boton(false)} disabled={guardando === f.id} onClick={() => marcar(f, "resuelta")}>La resolví</button>
                      <button style={boton(false)} disabled={guardando === f.id} onClick={() => marcar(f, "descartada")}>No es una fuga</button>
                      <button style={boton(false)} onClick={() => router.push(f.url)}>Ver el detalle</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {d.fugas.length === 0 && (
            <div style={tarjeta}>
              <div style={etiqueta}>Todavía sin fugas detectadas</div>
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginTop: 6 }}>
                Para detectar fugas necesitamos cierres de caja de varios turnos y los gastos del mes cargados. Cuanto más completos estén tus datos, más fugas podemos encontrar.
              </div>
            </div>
          )}

          {cerradas.length > 0 && (
            <div style={tarjeta}>
              <div style={etiqueta}>Cerradas</div>
              {cerradas.map(f => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, color: "var(--muted)", padding: "6px 0" }}>
                  <span>{f.titulo}</span>
                  <button style={{ ...boton(false), padding: "4px 8px" }} onClick={() => marcar(f, f.estado)}>Reabrir</button>
                </div>
              ))}
            </div>
          )}

          {d.pendientes_de_datos.length > 0 && (
            <div style={tarjeta}>
              <div style={etiqueta}>Para encontrar más fugas</div>
              {d.pendientes_de_datos.map(p => (
                <div key={p.id} style={{ margin: "8px 0" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.titulo}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{p.falta}</div>
                </div>
              ))}
            </div>
          )}
          {d.avisos.length > 0 && <div style={{ ...tarjeta, fontSize: 11, color: "var(--muted)" }}>Alguna fuente no se pudo calcular ahora. Probá de nuevo en unos minutos.</div>}
        </>
      )}
    </main>
  );
}
