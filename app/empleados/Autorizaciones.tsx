"use client";
// Panel del dueño: aprobar o rechazar lo que la caja pide, ver el historial y configurar el PIN de autorización.
import { useCallback, useEffect, useState } from "react";
import { SectionTitle } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Aut = { id: number; empleado: string | null; tipo: string; producto_nombre: string | null; valor: number; motivo: string | null; estado: string; metodo: string | null; creado: string };

const QUE: Record<string, string> = { sacar_producto: "Sacar un producto del carrito", bajar_precio: "Bajar un precio", egreso: "Sacar plata de la caja" };
const ESTADO: Record<string, string> = { pendiente: "Esperando", aprobada: "Aprobada", rechazada: "Rechazada", vencida: "Venció", cancelada: "Cancelada" };
const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const hora = (iso: string) => new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Autorizaciones({ token }: { token: string | null }) {
  const [lista, setLista] = useState<Aut[]>([]);
  const [pinOk, setPinOk] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [editando, setEditando] = useState(false);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/autorizaciones`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return;
      const d = await r.json();
      setLista(Array.isArray(d.autorizaciones) ? d.autorizaciones : []);
      setPinOk(!!d.pin_configurado);
    } catch { /* sin señal */ }
  }, [token]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 10000);
    return () => clearInterval(t);
  }, [cargar]);

  async function resolver(id: number, decision: "aprobar" | "rechazar") {
    if (!token) return;
    setOcupado(id);
    try {
      const r = await fetch(`${API}/api/autorizaciones/${id}/resolver`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ decision }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setMsg(d.error || "No se pudo guardar"); }
      await cargar();
    } finally { setOcupado(null); }
  }

  async function guardarPin() {
    if (!token || pin.length !== 4) return;
    const r = await fetch(`${API}/api/autorizaciones/pin`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ pin }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setMsg("PIN guardado"); setPin(""); setEditando(false); setPinOk(true); } else setMsg(d.error || "No se pudo guardar el PIN");
  }

  const pendientes = lista.filter(a => a.estado === "pendiente");
  const historial = lista.filter(a => a.estado !== "pendiente").slice(0, 8);
  const card: React.CSSProperties = { margin: "0 12px 10px", background: "var(--card2)", borderRadius: 14, padding: 14, border: "1px solid var(--border)", boxShadow: "var(--sh)" };
  const boton = (fondo: string, color: string): React.CSSProperties => ({ flex: 1, padding: 11, borderRadius: 12, border: "none", background: fondo, color, fontWeight: 700, fontSize: 14, cursor: "pointer" });

  return (
    <>
      <SectionTitle>Autorizaciones de la caja</SectionTitle>
      <div style={{ fontSize: 10, color: "var(--muted)", padding: "0 14px 8px", lineHeight: 1.5 }}>
        La caja funciona normal. Solo cuando algo se sale de lo habitual en un turno, esa acción te pide autorización: con tu PIN en la caja o con un botón acá.
      </div>

      {pendientes.map(a => (
        <div key={a.id} style={{ ...card, borderColor: "var(--amber, #FF9500)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{QUE[a.tipo] || a.tipo}{a.producto_nombre ? `: ${a.producto_nombre}` : ""}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 10px", lineHeight: 1.5 }}>
            {a.empleado ? `${a.empleado} · ` : ""}{a.valor > 0 && a.tipo !== "bajar_precio" ? `${pesos(a.valor)} · ` : ""}{hora(a.creado)}<br />{a.motivo}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={ocupado === a.id} onClick={() => resolver(a.id, "rechazar")} style={boton("var(--border)", "var(--text)")}>Rechazar</button>
            <button disabled={ocupado === a.id} onClick={() => resolver(a.id, "aprobar")} style={boton("#007AFF", "#fff")}>Aprobar</button>
          </div>
        </div>
      ))}

      {pendientes.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", padding: "0 14px 10px" }}>No hay pedidos pendientes.</div>
      )}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Tu PIN de autorización</div>
        <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>
          {pinOk ? "Está configurado. Con este PIN autorizás en la propia caja, sin usar el celular." : "Todavía no lo configuraste. Sin PIN solo podés aprobar desde el celular."}
        </div>
        {(editando || pinOk === false) ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" inputMode="numeric" maxLength={4} placeholder="4 números" value={pin} autoComplete="off"
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              style={{ flex: 1, minWidth: 0, padding: 11, borderRadius: 12, border: "1px solid var(--border)", fontSize: 16, letterSpacing: 6, textAlign: "center" }} />
            <button disabled={pin.length !== 4} onClick={guardarPin} style={{ ...boton("#007AFF", "#fff"), flex: "none", padding: "11px 16px", opacity: pin.length === 4 ? 1 : 0.5 }}>Guardar</button>
          </div>
        ) : (
          <button onClick={() => { setEditando(true); setMsg(""); }} style={{ ...boton("var(--border)", "var(--text)"), flex: "none", padding: "9px 14px" }}>Cambiar PIN</button>
        )}
        {msg && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{msg}</div>}
      </div>

      {historial.length > 0 && (
        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>Últimos pedidos</div>
          {historial.map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, padding: "3px 0", color: "var(--text)" }}>
              <span>{hora(a.creado)} · {a.empleado || "—"} · {QUE[a.tipo] || a.tipo}</span>
              <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{ESTADO[a.estado] || a.estado}{a.estado === "aprobada" && a.metodo ? ` (${a.metodo === "pin" ? "PIN" : "celular"})` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
