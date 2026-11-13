"use client";
// Ventana de autorización de la caja: aparece SOLO cuando LumoBi ve algo fuera de lo habitual en el turno.
// El dueño puede aprobar con su PIN (acá mismo) o desde su celular. Al aprobarse, la acción se repite sola.
import { useEffect, useRef, useState } from "react";

type FetchT = (url: string, opts?: RequestInit) => Promise<Response>;
type Pedido = { id: number; motivo: string; puedePin: boolean; reintentar: (autorizacionId: number) => unknown };

const C = { primary: "#007AFF", text: "#0A1628", muted: "#6B8099", border: "#E8EDF5", red: "#FF3B30", amber: "#FF9500" };

export function useAutorizacion(fetchT: FetchT, API: string) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  // Si la respuesta del servidor pide autorización, abre la ventana y devuelve true (quien llamó no sigue).
  function requiere(d: any, reintentar: Pedido["reintentar"]): boolean {
    if (!d || !d.requiere_autorizacion) return false;
    setPedido({ id: Number(d.autorizacion_id), motivo: d.motivo || "Esta acción necesita autorización del dueño.", puedePin: !!d.puede_pin, reintentar });
    return true;
  }
  const modal = pedido ? <AutorizacionModal key={pedido.id} pedido={pedido} fetchT={fetchT} API={API} onCerrar={() => setPedido(null)} /> : null;
  return { requiere, modal };
}

function AutorizacionModal({ pedido, fetchT, API, onCerrar }: { pedido: Pedido; fetchT: FetchT; API: string; onCerrar: () => void }) {
  const [pin, setPin] = useState("");
  const [estado, setEstado] = useState<"pendiente" | "rechazada" | "vencida" | "cancelada">("pendiente");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const hecho = useRef(false);

  function aprobada() {
    if (hecho.current) return;
    hecho.current = true;
    onCerrar();
    pedido.reintentar(pedido.id);
  }

  useEffect(() => {
    if (estado !== "pendiente") return;
    const t = setInterval(async () => {
      try {
        const r = await fetchT(`${API}/api/autorizaciones/estado/${pedido.id}`);
        const d = await r.json();
        if (!r.ok) return;
        if (d.estado === "aprobada") aprobada();
        else if (d.estado !== "pendiente") setEstado(d.estado);
      } catch { /* sin señal: se vuelve a intentar */ }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  async function conPin() {
    if (pin.length !== 4 || enviando) return;
    setEnviando(true);
    setError("");
    try {
      const r = await fetchT(`${API}/api/autorizaciones/${pedido.id}/pin`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }),
      });
      const d = await r.json();
      if (r.ok) { aprobada(); return; }
      setError(d.error + (d.restantes ? ` (te quedan ${d.restantes} intentos)` : ""));
      setPin("");
    } catch { setError("Sin conexión. Probá de nuevo."); }
    finally { setEnviando(false); }
  }

  async function cancelar() {
    try { await fetchT(`${API}/api/autorizaciones/${pedido.id}/cancelar`, { method: "POST" }); } catch { /* da igual */ }
    onCerrar();
  }

  const cerrado = estado !== "pendiente";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400, fontFamily: "var(--font-instrument), sans-serif" }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 6 }}>
          {estado === "rechazada" ? "El dueño no lo autorizó" : estado === "vencida" ? "El pedido venció" : "Necesita autorización"}
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>
          {estado === "rechazada" ? "La acción no se hizo. Si fue un error, avisale al dueño."
            : estado === "vencida" ? "Nadie respondió a tiempo. Podés intentarlo de nuevo."
            : estado === "cancelada" ? "Pedido cancelado."
            : pedido.motivo + " Ya le avisamos al dueño: puede aprobarlo desde su celular" + (pedido.puedePin ? ", o ponés su PIN acá." : ".")}
        </div>

        {!cerrado && pedido.puedePin && (
          <>
            <input
              type="password" inputMode="numeric" maxLength={4} placeholder="PIN del dueño" value={pin} autoComplete="off"
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={e => { if (e.key === "Enter") conPin(); }}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: `2px solid ${C.border}`, fontSize: 22, letterSpacing: 10, textAlign: "center", boxSizing: "border-box", outline: "none" }}
            />
            {error && <div style={{ color: C.red, fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button onClick={conPin} disabled={pin.length !== 4 || enviando}
              style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 14, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: pin.length !== 4 || enviando ? 0.5 : 1 }}>
              {enviando ? "..." : "Autorizar con PIN"}
            </button>
          </>
        )}

        {!cerrado && (
          <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 14 }}>Esperando la respuesta del dueño…</div>
        )}

        <button onClick={cerrado ? onCerrar : cancelar}
          style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 14, border: `2px solid ${C.border}`, background: "#fff", color: C.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {cerrado ? "Cerrar" : "Cancelar"}
        </button>
      </div>
    </div>
  );
}
