"use client";
// Admin de LumoBi Partners: partners, cuánto hay que pagarle a cada uno, liquidaciones y negocios nuevos sin partner.
// Entra con la cuenta de LumoBi cuyo mail está en ADMIN_EMAILS (la misma sesión de la app).
import { useCallback, useEffect, useState } from "react";
import { API, C, FUENTE, pesos, fecha, tarjeta, input, Copiar } from "../../partners/comun";

type Partner = { id: number; nombre: string; email: string; celular: string | null; zona: string | null; codigo: string; estado: string; creado: string; ultimo_ingreso: string | null; cuit: string | null; alias_cbu: string | null; titular: string | null; referido_por: string | null; clientes: number; pagaron: number; pendiente: number; disponible: number; pagado: number };
type Liq = { id: number; partner_id: number; nombre: string; total: number; alias_cbu: string | null; estado: string; creado: string; pagada_en: string | null };
type Datos = { partners: Partner[]; liquidaciones: Liq[]; negocios_sin_partner: { id: number; nombre: string; created_at: string }[] };

const th: React.CSSProperties = { textAlign: "left", fontSize: 12, color: C.apagada, fontWeight: 600, padding: "6px 8px", borderBottom: `1px solid ${C.linea}`, whiteSpace: "nowrap" };
const td: React.CSSProperties = { fontSize: 13, padding: "8px", borderBottom: "1px solid #EEF1F5", verticalAlign: "top" };
const btn: React.CSSProperties = { padding: "6px 10px", fontSize: 13, borderRadius: 8, border: `1px solid ${C.azul}`, background: C.blanco, color: C.azul, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE };

export default function AdminPartners() {
  const [d, setD] = useState<Datos | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [asig, setAsig] = useState<Record<number, string>>({});

  const tok = () => { try { return localStorage.getItem("lumo_token") || ""; } catch { return ""; } };
  const llamar = useCallback(async (ruta: string, cuerpo?: unknown) => {
    const r = await fetch(API + "/api/partners/admin" + ruta, {
      method: cuerpo !== undefined ? "POST" : "GET",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok() },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Error " + r.status);
    return j;
  }, []);
  const cargar = useCallback(() => { llamar("/lista").then(setD).catch((e) => setError(e.message)); }, [llamar]);
  useEffect(() => { cargar(); }, [cargar]);

  async function accion(f: () => Promise<unknown>, ok: string) {
    setAviso("");
    try { await f(); setAviso(ok); cargar(); } catch (e) { setAviso("⚠️ " + (e as Error).message); }
  }

  if (error) return <Marco><div style={tarjeta}>{error}. Entrá a LumoBi con tu cuenta de admin y volvé a esta página.</div></Marco>;
  if (!d) return <Marco><p style={{ color: C.apagada }}>Cargando…</p></Marco>;

  const aPagar = d.partners.reduce((a, p) => a + p.disponible, 0);
  const pendientes = d.liquidaciones.filter((l) => l.estado === "pendiente");

  return (
    <Marco>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
        {[["Partners", String(d.partners.length)], ["Activos con clientes", String(d.partners.filter((p) => p.clientes > 0).length)], ["Negocios traídos", String(d.partners.reduce((a, p) => a + p.clientes, 0))], ["Para pagar ya", pesos(aPagar)]].map(([t, v]) => (
          <div key={t} style={{ ...tarjeta, marginBottom: 0 }}><div style={{ fontSize: 12, color: C.apagada }}>{t}</div><div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div></div>
        ))}
      </div>
      {aviso && <div style={{ ...tarjeta, background: aviso.startsWith("⚠️") ? C.atencionFondo : C.okFondo }}>{aviso}</div>}

      {pendientes.length > 0 && (
        <div style={tarjeta}>
          <h2 style={{ fontSize: 17, margin: "0 0 10px" }}>Transferencias por hacer</h2>
          {pendientes.map((l) => (
            <div key={l.id} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${C.linea}` }}>
              <div><b>{l.nombre}</b> · {pesos(l.total)} · alias/CBU: <b>{l.alias_cbu}</b></div>
              <div style={{ display: "flex", gap: 6 }}>
                {l.alias_cbu && <Copiar texto={l.alias_cbu} etiqueta="Copiar alias" chico />}
                <button style={btn} onClick={() => accion(() => llamar(`/liquidacion/${l.id}/pagada`, {}), "Marcada como pagada. Le avisamos por mail.")}>Ya transferí</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={tarjeta}>
        <h2 style={{ fontSize: 17, margin: "0 0 10px" }}>Partners</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Partner", "Código", "Negocios", "Pagaron", "En espera", "Para pagar", "Pagado", "Cobro", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {d.partners.map((p) => (
                <tr key={p.id} style={{ opacity: p.estado === "suspendido" ? 0.5 : 1 }}>
                  <td style={td}><b>{p.nombre}</b><div style={{ color: C.apagada }}>{p.zona || ""} · {p.celular || ""}</div><div style={{ color: C.apagada }}>{p.email} · desde {fecha(p.creado)}{p.referido_por ? ` · lo trajo ${p.referido_por}` : ""}</div></td>
                  <td style={td}>{p.codigo}</td>
                  <td style={td}>{p.clientes}</td>
                  <td style={td}>{p.pagaron}</td>
                  <td style={td}>{pesos(p.pendiente)}</td>
                  <td style={{ ...td, fontWeight: 700, color: p.disponible > 0 ? C.ok : C.tinta }}>{pesos(p.disponible)}</td>
                  <td style={td}>{pesos(p.pagado)}</td>
                  <td style={td}>{p.alias_cbu ? <>{p.alias_cbu}<div style={{ color: C.apagada }}>{p.cuit} · {p.titular}</div></> : <span style={{ color: C.atencion }}>Falta cargar</span>}</td>
                  <td style={td}>
                    <div style={{ display: "grid", gap: 6 }}>
                      {p.disponible > 0 && <button style={btn} onClick={() => accion(() => llamar(`/${p.id}/liquidar`, {}), `Liquidación creada para ${p.nombre}: transferí y marcala como pagada arriba.`)}>Liquidar</button>}
                      <button style={{ ...btn, borderColor: C.linea, color: C.suave }} onClick={() => accion(() => llamar(`/${p.id}/estado`, { estado: p.estado === "activo" ? "suspendido" : "activo" }), "Listo.")}>{p.estado === "activo" ? "Suspender" : "Reactivar"}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!d.partners.length && <tr><td style={td} colSpan={9}>Todavía no hay partners. Compartí lumobi.com.ar/partners.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={tarjeta}>
        <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>Negocios nuevos sin partner (últimos 7 días)</h2>
        <p style={{ fontSize: 13, color: C.apagada, margin: "0 0 10px" }}>Si un partner trajo un negocio que se registró sin su link, lo podés asignar con su código.</p>
        {d.negocios_sin_partner.map((n) => (
          <div key={n.id} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "8px 0", borderTop: `1px solid ${C.linea}` }}>
            <div style={{ flex: "1 1 180px" }}><b>{n.nombre}</b> <span style={{ color: C.apagada }}>· {fecha(n.created_at)}</span></div>
            <input style={{ ...input, width: 150, padding: "8px 10px", fontSize: 14 }} placeholder="Código" value={asig[n.id] || ""} onChange={(e) => setAsig({ ...asig, [n.id]: e.target.value })} />
            <button style={btn} onClick={() => accion(() => llamar("/asignar", { negocio_id: n.id, codigo: asig[n.id] }), "Asignado.")}>Asignar</button>
          </div>
        ))}
        {!d.negocios_sin_partner.length && <div style={{ fontSize: 14, color: C.apagada }}>No hay.</div>}
      </div>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ background: C.papel, minHeight: "100vh", fontFamily: FUENTE, color: C.tinta }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>LumoBi Partners · admin</h1>
          <a href="/admin/embudo" style={{ color: C.azul, fontWeight: 700, fontSize: 14 }}>Embudo</a>
        </div>
        {children}
      </div>
    </main>
  );
}
