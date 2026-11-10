"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Nav from "../components/Nav";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";

type Empleado = {
  id: number;
  nombre: string;
  sucursal_id: number | null;
  sucursal_nombre: string | null;
  puede_cargar_productos: boolean;
};

const card: React.CSSProperties = {
  background: "var(--card, #fff)", border: "1px solid var(--border, #E0E7F1)", borderRadius: 18,
  padding: "20px 18px", marginBottom: 16, boxSizing: "border-box",
};
const btnPrimario: React.CSSProperties = {
  width: "100%", padding: "14px", border: "none", borderRadius: 12,
  background: "linear-gradient(135deg, #0A5BD3, #00C2FF)", color: "#fff",
  fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE,
};
const btnSecundario: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12,
  border: "1px solid var(--border, #E0E7F1)", background: "transparent",
  color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE,
};
const campo: React.CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border, #E0E7F1)",
  background: "var(--bg, #fff)", color: "var(--text, #0A1628)", fontSize: 16, fontFamily: FUENTE,
  boxSizing: "border-box", outline: "none",
};
const etiqueta: React.CSSProperties = { fontSize: 12, color: "var(--muted, #64748B)", margin: "12px 0 6px" };

function Segmentado({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  const base: React.CSSProperties = {
    flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE,
  };
  const activo: React.CSSProperties = { ...base, border: "2px solid #0A5BD3", background: "#0A5BD3", color: "#fff" };
  const inactivo: React.CSSProperties = { ...base, border: "2px solid var(--border, #E0E7F1)", background: "transparent", color: "var(--text, #0A1628)" };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button type="button" style={valor ? inactivo : activo} onClick={() => onChange(false)}>No</button>
      <button type="button" style={valor ? activo : inactivo} onClick={() => onChange(true)}>Sí</button>
    </div>
  );
}

export default function MiLocal() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; ok: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [alta, setAlta] = useState(false);
  const [form, setForm] = useState({ nombre: "", pin: "", precios: false });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", pin: "", precios: false });
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  function avisar(texto: string, ok: boolean) {
    setAviso({ texto, ok });
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(null), 3500);
  }

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
  }, [router]);

  const cargar = useCallback(async (t: string) => {
    try {
      const r = await fetch(`${API}/api/usuario/empleados`, { headers: { Authorization: `Bearer ${t}` } });
      const d: unknown = await r.json();
      if (Array.isArray(d)) setEmpleados(d as Empleado[]);
    } catch { /* sin conexion: queda como esta */ }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    if (!token) return;
    cargar(token);
    fetch(`${API}/api/multilocal/codigo-acceso`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((d: { codigo?: string }) => { if (d.codigo) setCodigo(d.codigo); })
      .catch(() => { /* el link queda vacio */ });
  }, [token, cargar]);

  async function agregar() {
    if (!token) return;
    const nombre = form.nombre.trim();
    if (!nombre) { avisar("Escribí el nombre", false); return; }
    if (!/^\d{4}$/.test(form.pin)) { avisar("El PIN son 4 números", false); return; }
    setGuardando(true);
    try {
      const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const r = await fetch(`${API}/api/usuario/empleados`, { method: "POST", headers: h, body: JSON.stringify({ nombre, pin: form.pin }) });
      const d: { error?: string } = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo guardar");
      if (form.precios) {
        const lr = await fetch(`${API}/api/usuario/empleados`, { headers: { Authorization: `Bearer ${token}` } });
        const lista: unknown = await lr.json();
        const nuevo = Array.isArray(lista)
          ? (lista as Empleado[]).find(e => e.nombre.toLowerCase() === nombre.toLowerCase())
          : undefined;
        if (nuevo) {
          await fetch(`${API}/api/usuario/empleados/${nuevo.id}`, { method: "PATCH", headers: h, body: JSON.stringify({ puede_cargar_productos: true }) });
        }
      }
      setForm({ nombre: "", pin: "", precios: false });
      setAlta(false);
      await cargar(token);
      avisar(`${nombre} ya puede entrar con su PIN`, true);
    } catch (e: unknown) {
      avisar(e instanceof Error ? e.message : "Error", false);
    } finally { setGuardando(false); }
  }

  function empezarEdicion(e: Empleado) {
    setEditandoId(e.id);
    setEditForm({ nombre: "", pin: "", precios: e.puede_cargar_productos });
  }

  async function guardarEdicion() {
    if (!token || editandoId == null) return;
    if (editForm.pin && !/^\d{4}$/.test(editForm.pin)) { avisar("El PIN son 4 números", false); return; }
    setGuardando(true);
    try {
      const body: Record<string, string | boolean> = { puede_cargar_productos: editForm.precios };
      if (editForm.nombre.trim()) body.nombre = editForm.nombre.trim();
      if (editForm.pin) body.pin = editForm.pin;
      const r = await fetch(`${API}/api/usuario/empleados/${editandoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("No se pudo guardar");
      setEditandoId(null);
      await cargar(token);
      avisar("Guardado", true);
    } catch (e: unknown) {
      avisar(e instanceof Error ? e.message : "Error", false);
    } finally { setGuardando(false); }
  }

  async function desactivar(e: Empleado) {
    if (!token) return;
    if (!confirm(`¿Sacar a ${e.nombre}? Ya no va a poder abrir turnos.`)) return;
    try {
      await fetch(`${API}/api/usuario/empleados/${e.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setEditandoId(null);
      await cargar(token);
      avisar(`${e.nombre} ya no tiene acceso`, true);
    } catch { avisar("No se pudo sacar", false); }
  }

  async function regenerar() {
    if (!token) return;
    if (!confirm("¿Cambiar el link? El link viejo deja de funcionar y tendrás que abrir el nuevo en cada compu o celu del local.")) return;
    try {
      const r = await fetch(`${API}/api/multilocal/codigo-acceso/regenerar`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d: { codigo?: string; error?: string } = await r.json();
      if (d.codigo) { setCodigo(d.codigo); avisar("Link nuevo listo", true); }
      else avisar(d.error || "No se pudo cambiar", false);
    } catch { avisar("No se pudo cambiar", false); }
  }

  if (!token) {
    return <main style={{ background: "var(--bg)", minHeight: "100vh" }} />;
  }

  const link = codigo ? `${window.location.origin}/empleado?c=${encodeURIComponent(codigo)}` : "";

  async function copiar() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); avisar("Link copiado", true); }
    catch { avisar("No se pudo copiar", false); }
  }

  function mandarPorWhatsApp() {
    if (!link) return;
    const texto = `Para entrar a la caja de LumoBi abrí este link: ${link}\nElegí tu nombre y poné tu PIN.`;
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
  }

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", padding: "24px 16px 120px", fontFamily: FUENTE, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "var(--text, #0A1628)" }}>Caja del local</h1>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
          Sumá a tu equipo y conectá la compu o el celu del local. Son dos pasos.
        </p>

        {aviso && (
          <div style={{
            position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, maxWidth: "90%",
            padding: "12px 18px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff",
            background: aviso.ok ? "#16A34A" : "#DC2626", boxShadow: "0 6px 20px rgba(10,22,40,0.25)",
          }}>{aviso.texto}</div>
        )}

        {/* PASO 1: equipo */}
        <div style={card}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted, #64748B)", marginBottom: 6 }}>Paso 1</div>
          <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "var(--text, #0A1628)" }}>Tu equipo</h2>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
            Cada persona tiene su PIN de 4 números. Con el PIN abre y cierra su turno.
          </p>

          {cargando ? (
            <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Cargando...</div>
          ) : empleados.length === 0 ? (
            <div style={{ fontSize: 14, color: "var(--muted, #64748B)", padding: "6px 0 12px" }}>Todavía no sumaste a nadie.</div>
          ) : (
            empleados.map(e => (
              <div key={e.id} style={{ borderTop: "1px solid var(--border, #E0E7F1)", padding: "12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text, #0A1628)" }}>{e.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--muted, #64748B)" }}>
                      {e.puede_cargar_productos ? "Puede cambiar precios" : "No cambia precios"}
                      {e.sucursal_nombre ? ` · ${e.sucursal_nombre}` : ""}
                    </div>
                  </div>
                  {editandoId !== e.id && (
                    <button onClick={() => empezarEdicion(e)} style={{ ...btnSecundario, width: "auto", padding: "8px 16px" }}>Editar</button>
                  )}
                </div>

                {editandoId === e.id && (
                  <div style={{ marginTop: 10 }}>
                    <div style={etiqueta}>PIN nuevo (si no lo querés cambiar, dejalo vacío)</div>
                    <input style={campo} type="tel" inputMode="numeric" maxLength={4} placeholder="4 números" value={editForm.pin}
                      onChange={ev => setEditForm(f => ({ ...f, pin: ev.target.value.replace(/\D/g, "").slice(0, 4) }))} />
                    <div style={etiqueta}>¿Puede cambiar precios y cargar productos?</div>
                    <Segmentado valor={editForm.precios} onChange={v => setEditForm(f => ({ ...f, precios: v }))} />
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button style={{ ...btnSecundario, flex: 1 }} onClick={() => setEditandoId(null)}>Cancelar</button>
                      <button style={{ ...btnPrimario, flex: 2, opacity: guardando ? 0.6 : 1 }} disabled={guardando} onClick={guardarEdicion}>Guardar</button>
                    </div>
                    <button onClick={() => desactivar(e)} style={{ marginTop: 12, background: "none", border: "none", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE, padding: 0 }}>
                      Sacar a {e.nombre}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {!alta ? (
            <button style={{ ...btnPrimario, marginTop: 8 }} onClick={() => setAlta(true)}>Sumar a una persona</button>
          ) : (
            <div style={{ borderTop: "1px solid var(--border, #E0E7F1)", marginTop: 8, paddingTop: 6 }}>
              <div style={etiqueta}>Nombre</div>
              <input style={campo} placeholder="Por ejemplo: Lucía" value={form.nombre} onChange={ev => setForm(f => ({ ...f, nombre: ev.target.value }))} />
              <div style={etiqueta}>PIN (4 números). Anotalo: después no se puede ver, solo cambiar.</div>
              <input style={campo} type="tel" inputMode="numeric" maxLength={4} placeholder="4 números" value={form.pin}
                onChange={ev => setForm(f => ({ ...f, pin: ev.target.value.replace(/\D/g, "").slice(0, 4) }))} />
              <div style={etiqueta}>¿Puede cambiar precios y cargar productos?</div>
              <Segmentado valor={form.precios} onChange={v => setForm(f => ({ ...f, precios: v }))} />
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button style={{ ...btnSecundario, flex: 1 }} onClick={() => { setAlta(false); setForm({ nombre: "", pin: "", precios: false }); }}>Cancelar</button>
                <button style={{ ...btnPrimario, flex: 2, opacity: guardando ? 0.6 : 1 }} disabled={guardando} onClick={agregar}>Guardar</button>
              </div>
            </div>
          )}
        </div>

        {/* PASO 2: conectar la compu o el celu del local */}
        <div style={card}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted, #64748B)", marginBottom: 6 }}>Paso 2</div>
          <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "var(--text, #0A1628)" }}>Conectá la compu o el celu del local</h2>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
            Abrí este link en el aparato donde se vende. No hay que escribir ningún código: cada persona elige su nombre y pone su PIN.
            Sirve para todo tu equipo y también si cambiás de compu.
          </p>

          {link ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", padding: 14, background: "#fff", borderRadius: 14, border: "1px solid var(--border, #E0E7F1)", marginBottom: 12 }}>
                <QRCodeSVG value={link} size={168} />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted, #64748B)", wordBreak: "break-all", textAlign: "center", marginBottom: 12 }}>{link}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={btnPrimario} onClick={mandarPorWhatsApp}>Mandar por WhatsApp</button>
                <button style={btnSecundario} onClick={copiar}>Copiar el link</button>
              </div>
              <button onClick={regenerar} style={{ marginTop: 14, background: "none", border: "none", color: "var(--muted, #64748B)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE, padding: 0, textDecoration: "underline" }}>
                Se lo di a alguien que no corresponde: cambiar el link
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>Preparando tu link...</div>
          )}
        </div>
      </div>
      <Nav />
    </main>
  );
}
