"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

// Código de acceso del Modo empleado: se carga una vez en la compu o tablet del local.
export default function CodigoAcceso({ token }: { token: string | null }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/multilocal/codigo-acceso`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.codigo) setCodigo(d.codigo); else setEstado(d.error || "No se pudo cargar el código"); })
      .catch(() => setEstado("Sin conexión"));
  }, [token]);

  async function copiar() {
    if (!codigo) return;
    try { await navigator.clipboard.writeText(codigo); setEstado("Copiado"); }
    catch { setEstado("No se pudo copiar: anotalo a mano"); }
  }

  async function regenerar() {
    if (!token) return;
    if (!window.confirm("¿Generar un código nuevo? Las compus del local van a pedir el código nuevo la próxima vez que se ingrese a Modo empleado.")) return;
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/multilocal/codigo-acceso/regenerar`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.codigo) { setCodigo(d.codigo); setEstado("Código nuevo generado"); }
      else setEstado(d.error || "No se pudo generar");
    } catch { setEstado("Sin conexión"); }
    finally { setCargando(false); }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginTop: 0 }}>
        Ingresá este código una sola vez en la compu o tablet del local, en <strong>Modo empleado</strong>.
        Con él, tus empleados entran con su nombre y su PIN.
      </p>
      <div style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 800, letterSpacing: 4, textAlign: "center", padding: "18px 12px", borderRadius: 14, background: "var(--card2, #F1F5F9)", color: "var(--text, #0A1628)", margin: "12px 0" }}>
        {codigo ?? "········"}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={copiar} disabled={!codigo} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#007AFF", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Copiar
        </button>
        <button onClick={regenerar} disabled={cargando} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E0E7F1", background: "white", color: "#0A1628", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {cargando ? "Generando…" : "Generar uno nuevo"}
        </button>
      </div>
      {estado && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{estado}</div>}
      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 0 }}>
        Si creés que alguien que no corresponde conoce el código, generá uno nuevo.
      </p>
    </div>
  );
}
