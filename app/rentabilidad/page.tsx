"use client";
// Rentabilidad — LumoBi (29/10/2026): gastos mensuales → ganancia operativa antes de impuestos
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { useSucursal } from "../hooks/useSucursal";
import { PageHeader } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Categoria = { id: string; label: string; variable: boolean };
type Mes = {
  mes: string; en_curso: boolean; gastos_cargados: boolean; ventas: number; gastos: number | null; egresos_caja: number;
  por_categoria: Record<string, number>; ganancia_operativa: number | null; margen: number | null;
  impuestos_declarados: number | null; ganancia_despues_impuestos: number | null;
};
type Equilibrio = {
  meses_usados: string[]; gastos_fijos_mes: number; costo_variable_pct: number; ventas_necesarias_mes: number; ventas_necesarias_dia: number;
  mes_en_curso: { vendido: number; necesario_a_la_fecha: number; diferencia: number; avance_pct: number | null };
} | null;
type Rentab = {
  categorias: Categoria[]; meses: Mes[]; mes_en_curso: Mes & { avance_mes_pct: number }; ultimo_mes_cerrado: Mes | null;
  equilibrio: Equilibrio; en_que_se_va: { categoria: string; label: string; total: number; pct: number }[];
  impuestos: Impuestos; hay_gastos: boolean; error?: string;
};
type Impuestos = { modo: "ninguno" | "porcentaje" | "monto"; base: "ventas" | "ganancia"; valor: number };
type Gasto = { sucursal_id: number | null; categoria: string; monto: number };
type GastosResp = {
  mes: string; mes_anterior: string; categorias: Categoria[]; sucursales: { id: number; nombre: string }[];
  gastos: Gasto[]; gastos_mes_anterior: Gasto[]; impuestos: Impuestos; error?: string;
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const nombreMes = (m: string) => { const [y, mm] = m.split("-"); return `${MESES[Number(mm) - 1]} ${y}`; };
const corto = (m: string) => MESES[Number(m.split("-")[1]) - 1].slice(0, 3);
const fmt = (n: number | null | undefined) => (n == null ? "—" : (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("es-AR"));
const colorGan = (n: number | null | undefined) => (n == null ? "var(--muted)" : n >= 0 ? "var(--emerald)" : "var(--red, #E5484D)");

const tarjeta: CSSProperties = { margin: "8px 12px", background: "var(--card2)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--border)" };
const titulo: CSSProperties = { fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 };
const grande: CSSProperties = { fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, lineHeight: 1.1 };
const fila: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text)", padding: "3px 0" };
const input: CSSProperties = { width: 130, padding: "9px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "white", fontSize: 14, textAlign: "right", color: "#0A1628" };
const boton = (primario: boolean): CSSProperties => ({
  padding: "11px 14px", borderRadius: 12, border: primario ? "none" : "1px solid var(--border)", cursor: "pointer", fontSize: 14, fontWeight: 600,
  background: primario ? "var(--cyan, #007AFF)" : "transparent", color: primario ? "white" : "var(--text)",
});

function headers() {
  const t = localStorage.getItem("lumo_token");
  return { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
}

export default function RentabilidadPage() {
  const router = useRouter();
  const { sucursalId } = useSucursal();
  const [r, setR] = useState<Rentab | null>(null);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [editor, setEditor] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("lumo_token")) { router.replace("/login"); return; }
    let vigente = true;
    const ctrl = new AbortController();
    fetch(`${API}/api/rentabilidad${sucursalId ? `?sucursal_id=${sucursalId}` : ""}`, { headers: headers(), signal: ctrl.signal })
      .then(x => x.json())
      .then((d: Rentab) => { if (!vigente) return; if (d?.meses) { setR(d); setError(""); } else setError(d?.error || "No se pudo calcular"); })
      .catch(() => { if (vigente) setError("Sin conexión"); });
    return () => { vigente = false; ctrl.abort(); };
  }, [sucursalId, recarga, router]);

  const act = r?.mes_en_curso;
  const ult = r?.ultimo_mes_cerrado;
  const eq = r?.equilibrio;
  const maxAbs = Math.max(1, ...(r?.meses ?? []).map(m => Math.abs(m.ganancia_operativa ?? 0)));

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Rentabilidad" sub="Ganancia operativa antes de impuestos" />

      {error && <div style={{ ...tarjeta, color: "var(--red, #E5484D)", fontSize: 13 }}>{error}</div>}
      {!r && !error && <div style={{ textAlign: "center", padding: 40, fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Calculando...</div>}

      {r && !r.hay_gastos && !editor && (
        <div style={tarjeta}>
          <div style={titulo}>Empezá acá</div>
          <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>
            Cargá los gastos del mes (alquiler, sueldos, mercadería…) como <strong>totales</strong>, sin facturas. En un minuto ves cuánto ganás de verdad y cuánto necesitás vender por día para cubrir todo.
          </div>
          <button style={{ ...boton(true), width: "100%" }} onClick={() => setEditor(true)}>Cargar gastos</button>
        </div>
      )}

      {r && r.hay_gastos && !editor && act && (
        <>
          {/* Último mes cerrado */}
          {ult && (
            <div style={tarjeta}>
              <div style={titulo}>Ganancia de {nombreMes(ult.mes)}</div>
              <div style={{ ...grande, color: colorGan(ult.ganancia_operativa) }}>{fmt(ult.ganancia_operativa)}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                margen {ult.margen != null ? `${ult.margen.toLocaleString("es-AR")}%` : "—"} · antes de impuestos
              </div>
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 10, paddingTop: 8 }}>
                <div style={fila}><span>Ventas</span><strong>{fmt(ult.ventas)}</strong></div>
                <div style={fila}><span>Gastos cargados</span><span>−{fmt(ult.gastos)}</span></div>
                {ult.egresos_caja > 0 && <div style={fila}><span>Gastos de caja (turnos)</span><span>−{fmt(ult.egresos_caja)}</span></div>}
                {ult.impuestos_declarados != null && (
                  <>
                    <div style={fila}><span>Tus impuestos declarados</span><span>−{fmt(ult.impuestos_declarados)}</span></div>
                    <div style={{ ...fila, fontWeight: 700 }}><span>Te queda</span><span style={{ color: colorGan(ult.ganancia_despues_impuestos) }}>{fmt(ult.ganancia_despues_impuestos)}</span></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Punto de equilibrio */}
          {eq && (
            <div style={tarjeta}>
              <div style={titulo}>Punto de equilibrio</div>
              <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>
                Para cubrir tus gastos necesitás vender <strong>{fmt(eq.ventas_necesarias_mes)} por mes</strong>, o sea <strong>{fmt(eq.ventas_necesarias_dia)} por día</strong>.
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--border)", marginTop: 12, position: "relative" }}>
                <div style={{ width: `${Math.min(100, eq.mes_en_curso.avance_pct ?? 0)}%`, height: "100%", borderRadius: 4, background: (eq.mes_en_curso.diferencia ?? 0) >= 0 ? "var(--emerald)" : "var(--yellow, #F5A524)" }} />
                <div title="Dónde deberías estar hoy" style={{ position: "absolute", left: `${Math.min(100, act.avance_mes_pct)}%`, top: -3, width: 2, height: 14, background: "var(--text)", opacity: 0.4 }} />
              </div>
              <div style={{ fontSize: 13, color: "var(--text)", marginTop: 8, lineHeight: 1.5 }}>
                Este mes llevás {fmt(eq.mes_en_curso.vendido)}: {eq.mes_en_curso.diferencia >= 0
                  ? <span style={{ color: "var(--emerald)", fontWeight: 700 }}>{fmt(eq.mes_en_curso.diferencia)} arriba de lo necesario a hoy</span>
                  : <span style={{ color: "var(--red, #E5484D)", fontWeight: 700 }}>{fmt(-eq.mes_en_curso.diferencia)} abajo de lo necesario a hoy</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                Calculado con {eq.meses_usados.map(nombreMes).join(", ")}: gastos fijos {fmt(eq.gastos_fijos_mes)}/mes y costo variable {eq.costo_variable_pct.toLocaleString("es-AR")}% de lo que vendés.
              </div>
            </div>
          )}

          {/* Mes en curso */}
          <div style={tarjeta}>
            <div style={titulo}>{nombreMes(act.mes)} · en curso</div>
            {act.gastos_cargados ? (
              <>
                <div style={{ ...grande, fontSize: 22, color: colorGan(act.ganancia_operativa) }}>{fmt(act.ganancia_operativa)}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
                  Ventas {fmt(act.ventas)} − gastos {fmt(act.gastos)}{act.egresos_caja > 0 ? ` − caja ${fmt(act.egresos_caja)}` : ""}. Los gastos del mes se toman proporcionales a los días que pasaron ({act.avance_mes_pct.toLocaleString("es-AR")}% del mes).
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Todavía no cargaste los gastos de este mes.</div>
            )}
          </div>

          {/* 12 meses */}
          <div style={tarjeta}>
            <div style={titulo}>Ganancia por mes</div>
            {r.meses.filter(m => m.ventas > 0 || m.gastos_cargados).map(m => (
              <div key={m.mes} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{ width: 34, color: "var(--muted)" }}>{corto(m.mes)}</span>
                <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 4, position: "relative" }}>
                  {m.ganancia_operativa != null && (
                    <div style={{ width: `${(Math.abs(m.ganancia_operativa) / maxAbs) * 100}%`, height: "100%", borderRadius: 4, background: colorGan(m.ganancia_operativa), opacity: m.en_curso ? 0.5 : 1 }} />
                  )}
                </div>
                <span style={{ width: 110, textAlign: "right", color: colorGan(m.ganancia_operativa), fontWeight: 600 }}>
                  {m.gastos_cargados ? fmt(m.ganancia_operativa) : "sin gastos"}
                </span>
              </div>
            ))}
          </div>

          {/* En qué se va la plata */}
          {r.en_que_se_va.length > 0 && (
            <div style={tarjeta}>
              <div style={titulo}>En qué se va la plata · últimos 12 meses</div>
              {r.en_que_se_va.map(c => (
                <div key={c.categoria} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text)", marginBottom: 3 }}>
                    <span>{c.label}</span><span>{fmt(c.total)} · {c.pct.toLocaleString("es-AR")}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--border)" }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", borderRadius: 3, background: "var(--cyan, #007AFF)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ margin: "8px 12px" }}>
            <button style={{ ...boton(true), width: "100%" }} onClick={() => setEditor(true)}>Cargar o editar gastos</button>
          </div>
          <div style={{ margin: "4px 16px 8px", fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            Ganancia operativa antes de impuestos. LumoBi no calcula impuestos: si querés, declarás los tuyos en el editor.
            {sucursalId ? " Los gastos de todo el negocio se reparten entre locales según lo que vende cada uno." : ""}
          </div>
        </>
      )}

      {editor && r && <EditorGastos onCerrar={(cambio) => { setEditor(false); if (cambio) setRecarga(x => x + 1); }} />}
      <Nav />
    </main>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────
function mesesRecientes(): string[] {
  const d = new Date(Date.now() - 3 * 3600000);
  return Array.from({ length: 13 }, (_, i) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    return x.toISOString().slice(0, 7);
  });
}

function EditorGastos({ onCerrar }: { onCerrar: (cambio: boolean) => void }) {
  const opciones = mesesRecientes();
  const [mes, setMes] = useState(opciones[1]);              // por defecto, el último mes cerrado
  const [donde, setDonde] = useState<number | null>(null);  // null = todo el negocio
  const [data, setData] = useState<GastosResp | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [imp, setImp] = useState<Impuestos>({ modo: "ninguno", base: "ventas", valor: 0 });
  const [estado, setEstado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cambio, setCambio] = useState(false);

  useEffect(() => {
    let vigente = true;
    setEstado("");
    fetch(`${API}/api/gastos?mes=${mes}`, { headers: headers() })
      .then(x => x.json())
      .then((d: GastosResp) => { if (!vigente) return; if (d?.categorias) { setData(d); setImp(d.impuestos); } else setEstado(d?.error || "No se pudo cargar"); })
      .catch(() => { if (vigente) setEstado("Sin conexión"); });
    return () => { vigente = false; };
  }, [mes]);

  useEffect(() => {
    if (!data) return;
    const v: Record<string, string> = {};
    for (const c of data.categorias) {
      const g = data.gastos.find(x => x.categoria === c.id && x.sucursal_id === donde);
      v[c.id] = g ? String(Math.round(g.monto)) : "";
    }
    setValores(v);
  }, [data, donde]);

  function copiarAnterior() {
    if (!data) return;
    const v: Record<string, string> = {};
    for (const c of data.categorias) {
      const g = data.gastos_mes_anterior.find(x => x.categoria === c.id && x.sucursal_id === donde);
      v[c.id] = g ? String(Math.round(g.monto)) : "";
    }
    setValores(v);
    setEstado(`Copiado de ${nombreMes(data.mes_anterior)}. Revisá y guardá.`);
  }

  async function guardar() {
    if (!data) return;
    setGuardando(true); setEstado("");
    try {
      const items = data.categorias.map(c => ({ sucursal_id: donde, categoria: c.id, monto: Number((valores[c.id] || "0").replace(/\D/g, "")) || 0 }));
      const r1 = await fetch(`${API}/api/gastos`, { method: "POST", headers: headers(), body: JSON.stringify({ mes, items }) });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1?.error || "No se pudo guardar");
      const r2 = await fetch(`${API}/api/impuestos`, { method: "POST", headers: headers(), body: JSON.stringify(imp) });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2?.error || "No se pudieron guardar los impuestos");
      setData(d1); setCambio(true);
      setEstado("Guardado ✔");
    } catch (e) {
      setEstado(e instanceof Error ? e.message : "No se pudo guardar");
    } finally { setGuardando(false); }
  }

  const total = Object.values(valores).reduce((s, v) => s + (Number(v.replace(/\D/g, "")) || 0), 0);

  return (
    <div style={tarjeta}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={titulo}>Gastos del mes</div>
        <button style={{ ...boton(false), padding: "6px 10px", fontSize: 12 }} onClick={() => onCerrar(cambio)}>Cerrar</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...input, width: "auto", textAlign: "left", flex: 1 }}>
          {opciones.map(m => <option key={m} value={m}>{nombreMes(m)}</option>)}
        </select>
        <select value={donde ?? ""} onChange={e => setDonde(e.target.value ? Number(e.target.value) : null)} style={{ ...input, width: "auto", textAlign: "left", flex: 1 }}>
          <option value="">Todo el negocio</option>
          {data?.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 10 }}>
        Totales del mes, sin facturas. Los <strong>gastos de caja</strong> que registran tus empleados en los turnos ya se suman solos: no los cargues de nuevo.
        {donde == null && data && data.sucursales.length > 1 && " Lo que cargues en “Todo el negocio” se reparte entre locales según lo que vende cada uno."}
      </div>

      {data?.categorias.map(c => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
          <span style={{ fontSize: 13, color: "var(--text)" }}>{c.label}</span>
          <input inputMode="numeric" placeholder="$0" value={valores[c.id] ? Number(valores[c.id]).toLocaleString("es-AR") : ""}
            onChange={e => setValores(v => ({ ...v, [c.id]: e.target.value.replace(/\D/g, "") }))} style={input} />
        </div>
      ))}
      <div style={{ ...fila, fontWeight: 700, borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 8 }}>
        <span>Total</span><span>{fmt(total)}</span>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 10 }}>
        <div style={titulo}>Tus impuestos (opcional)</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>
          LumoBi no calcula impuestos. Si querés ver lo que te queda, declará lo tuyo: un monto fijo por mes (por ejemplo, el monotributo) o tu propio porcentaje.
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {(["ninguno", "monto", "porcentaje"] as const).map(m => (
            <button key={m} onClick={() => setImp(i => ({ ...i, modo: m }))}
              style={{ ...boton(imp.modo === m), flex: 1, padding: "8px 4px", fontSize: 12 }}>
              {m === "ninguno" ? "No cargar" : m === "monto" ? "Monto fijo" : "Porcentaje"}
            </button>
          ))}
        </div>
        {imp.modo !== "ninguno" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input inputMode="decimal" value={imp.valor || ""} placeholder={imp.modo === "monto" ? "$ por mes" : "%"}
              onChange={e => setImp(i => ({ ...i, valor: Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, "")) || 0 }))} style={input} />
            {imp.modo === "porcentaje" && (
              <select value={imp.base} onChange={e => setImp(i => ({ ...i, base: e.target.value as Impuestos["base"] }))} style={{ ...input, width: "auto", textAlign: "left" }}>
                <option value="ventas">sobre las ventas</option>
                <option value="ganancia">sobre la ganancia</option>
              </select>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={{ ...boton(false), flex: 1 }} onClick={copiarAnterior} disabled={!data}>Copiar del mes pasado</button>
        <button style={{ ...boton(true), flex: 1 }} onClick={guardar} disabled={guardando || !data}>{guardando ? "Guardando…" : "Guardar"}</button>
      </div>
      {estado && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{estado}</div>}
    </div>
  );
}
