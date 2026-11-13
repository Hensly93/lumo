"use client";
// Tu PIN de autorización, dentro de "Caja del local": con este PIN autorizás en la caja las acciones fuera de lo habitual.
import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";

export default function PinDueno({ token }: { token: string | null }) {
  const [configurado, setConfigurado] = useState<boolean | null>(null);
  const [editando, setEditando] = useState(false);
  const [pin, setPin] = useState("");
  const [aviso, setAviso] = useState<{ texto: string; ok: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/autorizaciones`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setConfigurado(!!d.pin_configurado); }
    } catch { /* sin señal */ }
  }, [token]);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardar() {
    if (!token || pin.length !== 4 || guardando) return;
    setGuardando(true);
    try {
      const r = await fetch(`${API}/api/autorizaciones/pin`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ pin }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setConfigurado(true); setEditando(false); setPin(""); setAviso({ texto: "PIN guardado", ok: true }); }
      else setAviso({ texto: d.error || "No se pudo guardar el PIN", ok: false });
    } catch { setAviso({ texto: "No se pudo guardar el PIN", ok: false }); }
    finally { setGuardando(false); }
  }

  const mostrarCampo = editando || configurado === false;
  return (
    <div style={{ background: "var(--card, #fff)", border: "1px solid var(--border, #E0E7F1)", borderRadius: 18, padding: "20px 18px", marginBottom: 16, boxSizing: "border-box", fontFamily: FUENTE }}>
      <div style={{ fontSize: 12, letterSpacing: 2, color: "var(--muted, #64748B)", marginBottom: 6 }}>PASO 3</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text, #0A1628)", marginBottom: 6 }}>Tu PIN de autorización</div>
      <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
        La caja funciona normal. Solo si un turno hace algo fuera de lo habitual (sacar muchos productos, bajar un precio, sacar plata), esa acción te pide autorización: con este PIN en la caja, o desde tu celular en Rendimiento.
      </p>
      {configurado && !editando && (
        <div style={{ fontSize: 13, color: "var(--text, #0A1628)", marginBottom: 10 }}>Tu PIN está configurado.</div>
      )}
      {mostrarCampo ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input type="password" inputMode="numeric" maxLength={4} placeholder="4 números" value={pin} autoComplete="off"
            onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            style={{ flex: 1, minWidth: 0, padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border, #E0E7F1)", background: "var(--bg, #fff)", color: "var(--text, #0A1628)", fontSize: 18, letterSpacing: 8, textAlign: "center", fontFamily: FUENTE, boxSizing: "border-box" }} />
          <button onClick={guardar} disabled={pin.length !== 4 || guardando}
            style={{ padding: "13px 20px", border: "none", borderRadius: 12, background: "linear-gradient(135deg, #0A5BD3, #00C2FF)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE, opacity: pin.length === 4 && !guardando ? 1 : 0.5 }}>
            Guardar
          </button>
        </div>
      ) : configurado ? (
        <button onClick={() => { setEditando(true); setAviso(null); }}
          style={{ width: "100%", padding: 13, borderRadius: 12, border: "1px solid var(--border, #E0E7F1)", background: "transparent", color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE }}>
          Cambiar mi PIN
        </button>
      ) : null}
      {aviso && <div style={{ marginTop: 10, fontSize: 13, color: aviso.ok ? "#16A34A" : "#DC2626" }}>{aviso.texto}</div>}
    </div>
  );
}
