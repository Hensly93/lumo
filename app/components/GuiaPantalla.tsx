"use client";
// GuiaPantalla — en cada pantalla, qué hace LumoBi, qué hacés vos y qué falta para que funcione (14/11/2026)
// La primera vez se muestra abierta. Con "Entendido" queda como una línea que se vuelve a abrir.
// Los requisitos son en vivo: ✓ si está listo, o qué falta con el botón para hacerlo.
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GUIAS, REQUISITO_NOMBRE } from "./guiaPantallas";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
type Req = { id: string; listo: boolean; falta: string | null; ir: string | null };

let cache: { at: number; data: Record<string, Req> } | null = null;

export default function GuiaPantalla() {
  const path = usePathname();
  const router = useRouter();
  // Las fichas (/ficha/producto/12) usan la guía de su tipo
  const clave = GUIAS[path] ? path : path.split('/').slice(0, 3).join('/');
  const guia = GUIAS[clave];
  const [abierta, setAbierta] = useState(false);
  const [reqs, setReqs] = useState<Record<string, Req> | null>(null);

  useEffect(() => {
    if (!guia) return;
    let vista = false;
    try { vista = localStorage.getItem("lumo_guia_vista:" + clave) === "1"; } catch { /* sin almacenamiento */ }
    setAbierta(!vista);
    const token = localStorage.getItem("lumo_token");
    if (!token) return;
    if (cache && Date.now() - cache.at < 60000) { setReqs(cache.data); return; }
    fetch(`${API}/api/guia/estado`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.requisitos) { cache = { at: Date.now(), data: d.requisitos }; setReqs(d.requisitos); } })
      .catch(() => {});
  }, [path, guia]);

  if (!guia) return null;
  const lista = guia.requisitos.map((id) => reqs?.[id]).filter(Boolean) as Req[];
  const pendientes = lista.filter((r) => !r.listo && r.id !== "mp");

  function cerrar() {
    setAbierta(false);
    try { localStorage.setItem("lumo_guia_vista:" + clave, "1"); } catch { /* sin almacenamiento */ }
  }

  if (!abierta) {
    return (
      <div style={{ padding: "8px 16px 0" }}>
        <button onClick={() => setAbierta(true)}
          style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)",
            fontSize: 13, color: "var(--tinta-apagada)", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>¿Qué es esta pantalla?</span>
          {pendientes.length > 0 && <span style={{ color: "var(--tinta)", fontWeight: 700 }}>Falta{pendientes.length === 1 ? "" : "n"} {pendientes.length} cosa{pendientes.length === 1 ? "" : "s"} para que funcione</span>}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 16px 0" }}>
      <div style={{ background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tinta)", marginBottom: 10 }}>{guia.titulo}</div>
        <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.55, marginBottom: 8 }}>
          <strong>Qué hace LumoBi acá:</strong> {guia.lumobi}
        </div>
        <div style={{ fontSize: 14, color: "var(--tinta)", lineHeight: 1.55 }}>
          <strong>Qué hacés vos:</strong> {guia.vos}
        </div>

        {lista.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--linea)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tinta-apagada)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Para que funcione
            </div>
            {lista.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, fontSize: 14, lineHeight: 1.45, color: "var(--tinta)" }}>
                  <span style={{ fontWeight: 800, color: r.listo ? "#16A34A" : "var(--tinta-apagada)" }}>{r.listo ? "✓" : "○"}</span>
                  <span style={{ color: r.listo ? "var(--tinta-apagada)" : "var(--tinta)" }}>
                    {r.listo ? REQUISITO_NOMBRE[r.id] : r.falta}
                  </span>
                </div>
                {!r.listo && r.ir && r.ir !== path && (
                  <button onClick={() => router.push(r.ir as string)}
                    style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 8, border: "none", background: "var(--tinta)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Hacerlo
                  </button>
                )}
              </div>
            ))}
            {pendientes.length === 0 && <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 600 }}>Todo listo: esta pantalla ya trabaja con tus datos.</div>}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {guia.accion && (
            <button onClick={() => router.push(guia.accion!.ir)}
              style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--linea)", background: "transparent", color: "var(--tinta)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {guia.accion.texto}
            </button>
          )}
          <button onClick={cerrar}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "var(--tinta)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
