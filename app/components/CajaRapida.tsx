"use client";
// CajaRapida — de cuenta nueva a primera venta en un solo paso (14/11/2026)
// Antes: cargar productos → crear empleado en otra pantalla → copiar link → entrar a Modo empleado.
// Ahora: nombre + PIN acá mismo → "Abrir la caja". Los productos se dan de alta en la caja al escanearlos.
import { useEffect, useState, type CSSProperties } from "react";
import LinkCaja from "./LinkCaja";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";

const input: CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border, #E0E7F1)",
  fontSize: 16, fontFamily: FUENTE, boxSizing: "border-box", background: "var(--card, #fff)", color: "var(--text, #0A1628)",
};
const btnP: CSSProperties = {
  width: "100%", padding: "14px", border: "none", borderRadius: 12, background: "linear-gradient(135deg, #007AFF, #00C2FF)",
  color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE,
};
const btnS: CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12, border: "1px solid var(--border, #E0E7F1)", background: "transparent",
  color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE,
};

type Empleado = { id: number; nombre: string };

export default function CajaRapida({ token, onListo }: { token: string; onListo?: () => void }) {
  const [empleados, setEmpleados] = useState<Empleado[] | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [compartir, setCompartir] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/api/usuario/empleados`, { headers: h }).then((r) => r.json())
      .then((d: unknown) => setEmpleados(Array.isArray(d) ? (d as Empleado[]) : []))
      .catch(() => setEmpleados([]));
    fetch(`${API}/api/multilocal/codigo-acceso`, { headers: h }).then((r) => r.json())
      .then((d: { codigo?: string }) => { if (d.codigo) setCodigo(d.codigo); }).catch(() => {});
    try {
      const u = JSON.parse(localStorage.getItem("lumo_usuario") || "{}");
      if (u && u.nombre) setNombre(String(u.nombre).split(" ")[0]);
    } catch { /* sin datos */ }
  }, [token]);

  function abrirCaja() { window.location.href = codigo ? `/empleado?c=${encodeURIComponent(codigo)}` : "/empleado"; }

  async function crear() {
    setError("");
    const n = nombre.trim();
    if (!n) { setError("Poné el nombre de quien atiende la caja."); return; }
    if (!/^\d{4}$/.test(pin)) { setError("El PIN tiene que ser de 4 números."); return; }
    setGuardando(true);
    try {
      const r = await fetch(`${API}/api/usuario/empleados`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: n, pin }),
      });
      const d: { error?: string; id?: number } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo guardar");
      // Quien arma la caja puede dar de alta productos al escanearlos (si no, la primera venta se traba)
      if (d.id) {
        await fetch(`${API}/api/usuario/empleados/${d.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ puede_cargar_productos: true }),
        }).catch(() => {});
      }
      setEmpleados([...(empleados || []), { id: d.id || 0, nombre: n }]);
      if (onListo) onListo();
      abrirCaja();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (empleados === null) return <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Cargando…</div>;

  // Todavía no hay nadie para la caja: se crea acá mismo
  if (!empleados.length) {
    return (
      <>
        <input style={input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Quién atiende (puede ser tu nombre)" />
        <input style={input} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="PIN de 4 números" inputMode="numeric" type="password" autoComplete="new-password" />
        {error && <div style={{ fontSize: 13, color: "#B3261E" }}>{error}</div>}
        <button style={btnP} onClick={crear} disabled={guardando}>{guardando ? "Guardando…" : "Crear y abrir la caja"}</button>
      </>
    );
  }

  return (
    <>
      <div style={{ fontSize: 13, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
        En la caja: {empleados.map((e) => e.nombre).join(", ")}. Entran con su nombre y su PIN.
      </div>
      <button style={btnP} onClick={abrirCaja}>Abrir la caja en este celu</button>
      {!compartir
        ? <button style={btnS} onClick={() => setCompartir(true)}>La caja está en otra compu o celu del local</button>
        : <LinkCaja />}
      <button style={btnS} onClick={() => { window.location.href = "/mi-local"; }}>Sumar a otra persona</button>
    </>
  );
}
