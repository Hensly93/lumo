"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { subscribePush } from "../hooks/usePush";
import ConfirmCancelSubscriptionModal from "../components/ConfirmCancelSubscriptionModal";
import ConfirmDeleteAccountModal from "../components/ConfirmDeleteAccountModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

const TIPOS = ["kiosko","almacen","cafeteria","restaurante","parrilla","panaderia","farmacia","retail"];
const POS_OPTIONS = ["Ninguno","Maxirest","iZettle","Aloha","Lightspeed","Otro"];

type Perfil = {
  id: number; nombre: string; email: string; negocio: string;
  tipo_negocio: string | null; provincia: string | null;
  ciudad: string | null; zona: string | null;
  pos: string | null; logo: string | null;
  cuit: string | null; razon_social: string | null;
  subscription_status: string | null;
  subscription_end_date: string | null;
  plan_id: string | null;
};
type Empleado = { id: number; nombre: string; sucursal_id: number | null; sucursal_nombre: string | null };

// ── Helpers ───────────────────────────────────────────────────────
function inp(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px",
    background: "var(--card2)", border: "1px solid var(--border)",
    borderRadius: 10, color: "var(--text)", fontSize: 14,
    fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box",
    ...extra,
  };
}

function Btn({ label, onClick, outline = false, disabled = false, danger = false }: {
  label: string; onClick: () => void;
  outline?: boolean; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "12px 14px", borderRadius: 11, fontSize: 14, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      background: danger ? "#EF444410" : outline ? "transparent" : "linear-gradient(135deg,#007AFF12,#00C2FF08)",
      border: danger ? "1px solid #EF444430" : outline ? "1px solid var(--border)" : "1px solid #007AFF20",
      color: danger ? "var(--red)" : outline ? "var(--muted)" : "var(--cyan)",
    }}>
      {label}
    </button>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: ok ? "#00C48C12" : "#EF444412", border: `1px solid ${ok ? "#00C48C40" : "#EF444440"}`,
      borderRadius: 12, padding: "10px 20px", zIndex: 200, whiteSpace: "nowrap",
      color: ok ? "var(--emerald)" : "var(--red)", fontSize: 13, fontWeight: 600, boxShadow: "var(--sh2)",
    }}>
      {msg}
    </div>
  );
}

function ToggleRow({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? "linear-gradient(135deg,#007AFF,#00C2FF)" : "#D8E4F5", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.2s" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: on ? 18 : 2, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
}

function PINInput({ value, onChange, placeholder = "PIN (4 dígitos)" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="password" inputMode="numeric" maxLength={4} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      style={inp({ letterSpacing: 8, fontSize: 20, textAlign: "center" })} />
  );
}

function Section({ open, toggle, label, tag, children }: { open: boolean; toggle: () => void; label: string; tag: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <button
        onClick={toggle}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: 16,
          padding: 0
        }}
      >
        <h2 style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text)",
          textTransform: "uppercase",
          letterSpacing: 1.5,
        }}>
          {tag} {label}
        </h2>
        <div style={{
          color: "var(--muted)",
          fontSize: 18,
          transform: open ? "rotate(90deg)" : "none",
          transition: "transform 0.2s"
        }}>›</div>
      </button>

      {open && (
        <div style={{
          background: "var(--card)",
          borderRadius: 14,
          padding: 20,
          border: "1px solid var(--border)",
          boxShadow: "var(--sh)"
        }}>
          {children}
        </div>
      )}
    </section>
  );
}

// ── SecNegocio ────────────────────────────────────────────────────
function SecNegocio({ token, perfil, onSave }: { token: string; perfil: Perfil; onSave: (p: Perfil) => void }) {
  const [form, setForm] = useState({
    nombre: perfil.nombre, negocio: perfil.negocio,
    tipo_negocio: perfil.tipo_negocio ?? "", provincia: perfil.provincia ?? "",
    ciudad: perfil.ciudad ?? "", zona: perfil.zona ?? "", pos: perfil.pos ?? "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(perfil.logo ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value })); }
  function toast(text: string, ok: boolean) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast("Máximo 2MB", false); return; }
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function guardar() {
    setLoading(true);
    try {
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        const r = await fetch(`${API}/api/usuario/logo`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (!r.ok) throw new Error((await r.json()).error);
      }
      const r = await fetch(`${API}/api/usuario/perfil`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      try {
        const uRaw = localStorage.getItem("lumo_usuario");
        if (uRaw) {
          const u = JSON.parse(uRaw);
          localStorage.setItem("lumo_usuario", JSON.stringify({ ...u, nombre: data.nombre, negocio: data.negocio }));
        }
      } catch (e) {
        // Silent fail si localStorage bloqueado en mobile/PWA
      }
      onSave(data); setLogoFile(null); toast("Guardado ✓", true);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Error", false);
    } finally { setLoading(false); }
  }

  async function eliminarLogo() {
    await fetch(`${API}/api/usuario/logo`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setLogoPreview(null); setLogoFile(null); onSave({ ...perfil, logo: null });
  }

  const initials = form.negocio.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "L";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {msg && <Toast msg={msg.text} ok={msg.ok} />}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
        <div style={{ position: "relative" }}>
          {logoPreview ? (
            <img src={logoPreview} alt="logo" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#007AFF15,#007AFF08)", border: "2px solid #007AFF30", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--cyan)", fontFamily: "'Syne',sans-serif" }}>{initials}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => fileRef.current?.click()} style={{ padding: "7px 14px", background: "linear-gradient(135deg,#007AFF12,#00C2FF08)", border: "1px solid #007AFF25", borderRadius: 8, color: "var(--cyan)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {logoPreview ? "Cambiar logo" : "Subir logo"}
          </button>
          {logoPreview && (
            <button onClick={eliminarLogo} style={{ padding: "5px 14px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>Eliminar</button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onLogoChange} style={{ display: "none" }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: -8 }}>JPG, PNG o WebP · Máx 2MB</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input style={inp()} placeholder="Tu nombre" value={form.nombre} onChange={set("nombre")} />
        <input style={inp()} placeholder="Nombre del negocio" value={form.negocio} onChange={set("negocio")} />
        <select style={inp()} value={form.tipo_negocio} onChange={set("tipo_negocio")}>
          <option value="">Tipo de negocio</option>
          {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <input style={inp()} placeholder="Provincia" value={form.provincia} onChange={set("provincia")} />
        <input style={inp()} placeholder="Ciudad" value={form.ciudad} onChange={set("ciudad")} />
        <input style={inp()} placeholder="Zona / barrio (opcional)" value={form.zona} onChange={set("zona")} />
        <select style={inp()} value={form.pos} onChange={set("pos")}>
          <option value="">POS / software de gestión</option>
          {POS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <Btn label={loading ? "Guardando..." : "Guardar cambios"} onClick={guardar} disabled={loading} />
    </div>
  );
}

// ── SecEmpleados ──────────────────────────────────────────────────
function SecEmpleados({ token }: { token: string }) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", pin: "", pinConfirm: "" });
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", pin: "", pinConfirm: "" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function toast(text: string, ok: boolean) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); }

  const cargar = async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/usuario/empleados`, { headers: { Authorization: `Bearer ${token}` } });
    setEmpleados(await r.json());
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function agregar() {
    if (!form.nombre.trim()) { toast("El nombre es obligatorio", false); return; }
    if (form.pin.length !== 4) { toast("PIN debe tener 4 dígitos", false); return; }
    if (form.pin !== form.pinConfirm) { toast("Los PINs no coinciden", false); return; }
    setGuardando(true);
    try {
      const r = await fetch(`${API}/api/usuario/empleados`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: form.nombre.trim(), pin: form.pin }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setForm({ nombre: "", pin: "", pinConfirm: "" });
      await cargar();
      toast("Empleado agregado ✓", true);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Error", false);
    } finally { setGuardando(false); }
  }

  async function guardarEdicion() {
    if (!editando) return;
    if (editForm.pin && editForm.pin !== editForm.pinConfirm) { toast("Los PINs no coinciden", false); return; }
    if (editForm.pin && editForm.pin.length !== 4) { toast("PIN debe tener 4 dígitos", false); return; }
    setGuardando(true);
    try {
      const body: Record<string, string> = {};
      if (editForm.nombre.trim()) body.nombre = editForm.nombre.trim();
      if (editForm.pin) body.pin = editForm.pin;
      await fetch(`${API}/api/usuario/empleados/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setEditando(null); await cargar(); toast("Actualizado ✓", true);
    } catch { toast("Error al guardar", false); }
    finally { setGuardando(false); }
  }

  async function eliminar(id: number, nombre: string) {
    if (!confirm(`¿Desactivar a ${nombre}?`)) return;
    await fetch(`${API}/api/usuario/empleados/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await cargar(); toast("Empleado eliminado", true);
  }

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {msg && <Toast msg={msg.text} ok={msg.ok} />}
      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando...</div>
      ) : empleados.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "12px 0" }}>No hay empleados registrados todavía.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {empleados.map(e => (
            <div key={e.id}>
              {editando?.id === e.id ? (
                <div style={{ background: "var(--card2)", border: "1px solid #007AFF25", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input style={inp()} placeholder={`Nuevo nombre (actual: ${e.nombre})`} value={editForm.nombre} onChange={ev => setEditForm(f => ({ ...f, nombre: ev.target.value }))} />
                  <PINInput value={editForm.pin} onChange={v => setEditForm(f => ({ ...f, pin: v }))} placeholder="Nuevo PIN (vacío = no cambiar)" />
                  {editForm.pin.length > 0 && <PINInput value={editForm.pinConfirm} onChange={v => setEditForm(f => ({ ...f, pinConfirm: v }))} placeholder="Confirmar PIN" />}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditando(null)} style={{ flex: 1, padding: "10px", background: "none", border: "1px solid var(--border)", borderRadius: 10, color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                    <button onClick={guardarEdicion} disabled={guardando} style={{ flex: 2, padding: "10px", background: "linear-gradient(135deg,#007AFF12,#00C2FF08)", border: "1px solid #007AFF25", borderRadius: 10, color: "var(--cyan)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {guardando ? "..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={rowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{e.nombre}</div>
                    {e.sucursal_nombre && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{e.sucursal_nombre}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditando(e); setEditForm({ nombre: "", pin: "", pinConfirm: "" }); }} style={{ padding: "6px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>Editar</button>
                    <button onClick={() => eliminar(e.id, e.nombre)} style={{ padding: "6px 10px", background: "none", border: "1px solid #EF444430", borderRadius: 8, color: "var(--red)", fontSize: 12, cursor: "pointer" }}>×</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>// Agregar empleado</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inp()} placeholder="Nombre del empleado" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <PINInput value={form.pin} onChange={v => setForm(f => ({ ...f, pin: v }))} />
          {form.pin.length === 4 && <PINInput value={form.pinConfirm} onChange={v => setForm(f => ({ ...f, pinConfirm: v }))} placeholder="Confirmar PIN" />}
        </div>
        <div style={{ marginTop: 12 }}>
          <Btn label={guardando ? "Guardando..." : "Agregar"} onClick={agregar} disabled={guardando} />
        </div>
      </div>
    </div>
  );
}

// ── SecMP ─────────────────────────────────────────────────────────
function SecMP({ token }: { token: string }) {
  const [mp, setMp] = useState<{ conectado: boolean; mp_email?: string; fecha_expiracion?: string } | null>(null);
  const [importando, setImportando] = useState(false);
  const [result, setResult] = useState<{ importados: number; omitidos: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/mp/estado`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setMp).catch(() => setMp({ conectado: false }));
  }, [token]);

  async function importar() {
    setImportando(true); setResult(null); setError("");
    try {
      const r = await fetch(`${API}/api/mp/importar`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setImportando(false); }
  }

  function conectar() {
    if (typeof window === "undefined") return;
    window.location.href = `${API}/api/mp/conectar?token=${token}`;
  }

  if (!mp) return <div style={{ color: "var(--muted)", fontSize: 13 }}>Verificando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: mp.conectado ? "var(--emerald)" : "var(--muted)" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: mp.conectado ? "var(--emerald)" : "var(--muted)" }}>
          {mp.conectado ? "Conectado" : "No conectado"}
        </span>
      </div>
      {mp.mp_email && <div style={{ fontSize: 13, color: "var(--muted)" }}>Cuenta: <span style={{ color: "var(--text)" }}>{mp.mp_email}</span></div>}
      {mp.fecha_expiracion && <div style={{ fontSize: 11, color: "var(--muted)" }}>Expira: {new Date(mp.fecha_expiracion).toLocaleDateString("es-AR")}</div>}
      {result && (
        <div style={{ background: "#00C48C10", border: "1px solid #00C48C30", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--emerald)" }}>{result.importados} transacciones importadas</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{result.omitidos} omitidas</div>
        </div>
      )}
      {error && <div style={{ color: "var(--red)", fontSize: 13 }}>{error}</div>}
      {mp.conectado ? (
        <>
          <Btn label={importando ? "Importando..." : "Importar pagos de MP"} onClick={importar} disabled={importando} />
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>Importa los últimos 18 meses</div>
          <Btn label="Reconectar cuenta" onClick={conectar} outline />
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>Conectá tu Mercado Pago para que Lumo importe ventas automáticamente y detecte inconsistencias con datos reales.</div>
          <Btn label="Conectar Mercado Pago" onClick={conectar} />
        </>
      )}
    </div>
  );
}

// ── SecFacturacion ────────────────────────────────────────────────
function SecFacturacion({ token, perfil, onSave }: { token: string; perfil: Perfil; onSave: (p: Perfil) => void }) {
  const [form, setForm] = useState({ cuit: perfil.cuit ?? "", razon_social: perfil.razon_social ?? "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function toast(text: string, ok: boolean) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); }

  async function guardar() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/usuario/perfil`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onSave(data); toast("Guardado ✓", true);
    } catch (e: unknown) { toast(e instanceof Error ? e.message : "Error", false); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {msg && <Toast msg={msg.text} ok={msg.ok} />}
      <div style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Plan actual</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cyan)", fontFamily: "'Syne',sans-serif" }}>Beta gratuita</div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, lineHeight: 1.5 }}>Acceso completo durante el período de piloto. Sin compromiso.</div>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase" }}>// Datos fiscales</div>
      <input style={inp()} placeholder="CUIT / CUIL (ej: 20-12345678-9)" value={form.cuit} maxLength={13} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} />
      <input style={inp()} placeholder="Razón social (opcional)" value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} />
      <div style={{ fontSize: 11, color: "var(--muted)" }}>Se usarán para la facturación cuando los planes pagos estén disponibles.</div>
      <Btn label={loading ? "Guardando..." : "Guardar"} onClick={guardar} disabled={loading} />
    </div>
  );
}

// ── SecSuscripcion ────────────────────────────────────────────────
function SecSuscripcion({ perfil, onCancelSubscription }: { perfil: Perfil; onCancelSubscription: () => void }) {
  const diasRestantes = perfil.subscription_end_date
    ? Math.ceil((new Date(perfil.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Estado</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
            {perfil.subscription_status === "activa" ? "🟢 Activa" : "🔴 Cancelada"}
          </div>
        </div>
        <div
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: perfil.subscription_status === "activa" ? "rgba(0, 196, 140, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: perfil.subscription_status === "activa" ? "#00C48C" : "#EF4444",
          }}
        >
          {perfil.subscription_status === "activa" ? "ACTIVA" : "CANCELADA"}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Plan</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
          {perfil.plan_id || "Básico"}
        </div>
      </div>

      {perfil.subscription_end_date && (
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Vencimiento</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            {new Date(perfil.subscription_end_date).toLocaleDateString("es-AR")}
          </div>
          {diasRestantes !== null && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {diasRestantes > 0
                ? `${diasRestantes} días restantes`
                : diasRestantes === 0
                  ? "Vence hoy"
                  : "Vencida"}
            </div>
          )}
        </div>
      )}

      {perfil.subscription_status === "activa" && (
        <button
          onClick={onCancelSubscription}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "none",
            background: "#F59E0B",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#D97706")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#F59E0B")}
        >
          ⚠️ Cancelar suscripción
        </button>
      )}
    </div>
  );
}

// ── SecNotificaciones ─────────────────────────────────────────────
function SecNotificaciones({ token }: { token: string }) {
  const [toggles, setToggles] = useState({ alertas_criticas: true, alertas_medias: true, resumen_diario: false, conteos_perdidos: true });
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<"unknown" | "granted" | "denied" | "default">("unknown");
  const [subscribing, setSubscribing] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  console.log("🔍 [SecNotificaciones] Render - pushStatus actual:", pushStatus);

  useEffect(() => {
    fetch(`${API}/api/usuario/notificaciones`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setToggles(t => ({ ...t, ...d }))).catch(() => {});
  }, [token]);

  useEffect(() => {
    console.log("🔍 [useEffect pushStatus] INICIO");

    if (typeof window === "undefined") {
      console.log("🔍 [useEffect] window undefined - saliendo");
      return;
    }

    if (!("Notification" in window)) {
      console.log("🔍 [useEffect] Notification API no disponible → denied");
      setPushStatus("denied");
      return;
    }

    const perm = Notification.permission;
    console.log("🔍 [useEffect] Notification.permission =", perm);

    if (perm === "granted") {
      console.log("🔍 [useEffect] perm === granted, verificando suscripción...");
      // Verificar si existe suscripción real
      if ("serviceWorker" in navigator && "PushManager" in window) {
        console.log("🔍 [useEffect] SW y PushManager disponibles, esperando ready...");
        navigator.serviceWorker.ready.then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          console.log("🔍 [useEffect] Suscripción existente:", !!sub);
          if (sub) {
            console.log("🔍 [useEffect] → setPushStatus('granted')");
            setPushStatus("granted"); // Permission granted Y suscripción existe
          } else {
            console.log("🔍 [useEffect] → setPushStatus('default') - granted sin sub");
            setPushStatus("default"); // Permission granted PERO sin suscripción
          }
        }).catch((err) => {
          console.log("🔍 [useEffect] Error verificando suscripción:", err);
          console.log("🔍 [useEffect] → setPushStatus('default') - error");
          setPushStatus("default");
        });
      } else {
        console.log("🔍 [useEffect] SW o PushManager NO disponibles → setPushStatus('default')");
        setPushStatus("default");
      }
    } else {
      // "denied" o "default" se asignan directamente
      console.log("🔍 [useEffect] perm !== granted → setPushStatus('" + perm + "')");
      setPushStatus(perm);
    }
  }, []);

  async function guardar(key: string, value: boolean) {
    setToggles(t => ({ ...t, [key]: value })); setSaving(true);
    try {
      await fetch(`${API}/api/usuario/notificaciones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
    } catch { /* silent */ } finally { setSaving(false); }
  }

  async function activarNotificaciones() {
    setSubscribing(true);
    try {
      const success = await subscribePush(token);
      if (success) {
        setPushStatus("granted");
        setMsg({ text: "Notificaciones activadas ✓", ok: true });
      } else {
        setMsg({ text: "No se pudo activar", ok: false });
      }
    } catch (e) {
      setMsg({ text: "Error al activar", ok: false });
    } finally {
      setSubscribing(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  function set(k: string) { return (v: boolean) => guardar(k, v); }

  console.log("🔍 [SecNotificaciones] Pre-return - pushStatus:", pushStatus);
  console.log("🔍 [SecNotificaciones] ¿Mostrar banner? (pushStatus === 'default'):", pushStatus === "default");

  return (
    <div>
      {msg && <Toast msg={msg.text} ok={msg.ok} />}

      {(() => {
        const shouldShow = pushStatus === "default";
        console.log("🔍 [JSX Banner] pushStatus:", pushStatus, "| shouldShow:", shouldShow);
        return shouldShow ? (
          <div style={{
            background: "linear-gradient(135deg,#007AFF12,#00C2FF08)",
            border: "1px solid #007AFF25",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 16
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>
              Activá las notificaciones push para recibir alertas en tiempo real
            </div>
            <button
              onClick={activarNotificaciones}
              disabled={subscribing}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg,#007AFF,#00C2FF)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: subscribing ? "not-allowed" : "pointer",
                opacity: subscribing ? 0.6 : 1
              }}
            >
              {subscribing ? "Activando..." : "🔔 Activar notificaciones"}
            </button>
          </div>
        ) : null;
      })()}

      {pushStatus === "granted" && (
        <div style={{
          background: "#00C48C12",
          border: "1px solid #00C48C30",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          fontSize: 13,
          color: "var(--emerald)"
        }}>
          ✓ Notificaciones push activadas
        </div>
      )}

      {pushStatus === "denied" && (
        <div style={{
          background: "#EF444412",
          border: "1px solid #EF444430",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          fontSize: 12,
          color: "var(--red)",
          lineHeight: 1.5
        }}>
          ⚠️ Permisos de notificaciones denegados. Para activarlas, andá a Settings → Site settings → lumo-psi.vercel.app → Notifications → Allow
        </div>
      )}

      <ToggleRow on={toggles.alertas_criticas} onChange={set("alertas_criticas")} label="Alertas críticas" sub="Inconsistencias con z-score > 3.0" />
      <ToggleRow on={toggles.alertas_medias} onChange={set("alertas_medias")} label="Alertas de atención" sub="Patrones repetidos y brechas moderadas" />
      <ToggleRow on={toggles.conteos_perdidos} onChange={set("conteos_perdidos")} label="Conteos no respondidos" sub="Cuando un empleado no responde en 15 min" />
      <ToggleRow on={toggles.resumen_diario} onChange={set("resumen_diario")} label="Resumen diario" sub="Un resumen cada noche con lo del día" />
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
        Las notificaciones push requieren que la app esté instalada como PWA.
        {saving && <span style={{ color: "var(--cyan)", marginLeft: 8 }}>Guardando...</span>}
      </div>
    </div>
  );
}

// ── SecCuenta ─────────────────────────────────────────────────────
function SecCuenta({ perfil, onDeleteAccount }: { perfil: Perfil; onDeleteAccount: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Email</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", wordBreak: "break-all" }}>
          {perfil.email}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Nombre</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
          {perfil.nombre || "—"}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Negocio</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
          {perfil.negocio || "—"}
        </div>
      </div>

      <button
        onClick={onDeleteAccount}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 8,
          border: "none",
          background: "#EF4444",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#DC2626")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#EF4444")}
      >
        🗑️ Borrar cuenta permanentemente
      </button>
    </div>
  );
}

// ── SecSoporte ────────────────────────────────────────────────────
function SecSoporte() {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button
        onClick={() => router.push("/nicole?msg=Hola+NICOLE%2C+necesito+ayuda+con+Lumo")}
        style={{
          padding: "12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "#3B82F6",
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        💬 Hablar con NICOLE
      </button>

      <a
        href="https://docs.lumo.io"
        target="_blank"
        rel="noopener"
        style={{
          padding: "12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "#3B82F6",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        📚 Documentación
      </a>

      <a
        href="mailto:soporte@lumo.io"
        style={{
          padding: "12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "#3B82F6",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        ✉️ Contactar soporte
      </a>

      <div style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginTop: 4 }}>
        También podés respondernos directamente por mail a cualquier correo que hayas recibido de Lumo.
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────
export default function AjustesPage() {
  const { token: authToken, ready } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string>("negocio");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!authToken) {
      router.replace("/login");
      return;
    }
    setToken(authToken);
    fetch(`${API}/api/usuario/perfil`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json())
      .then(data => {
        setPerfil(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authToken, ready, router]);

  const handleLogout = () => {
    try {
      localStorage.clear();
    } catch (e) {
      // Silent fail si localStorage bloqueado en mobile/PWA
    }
    router.replace("/login");
  };

  function toggle(id: string) { setOpen(o => o === id ? "" : id); }

  if (loading || !token || !perfil) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Cargando ajustes...</div>
        </div>
      </main>
    );
  }

  const sections = [
    { id: "negocio",        tag: "01", label: "Mi negocio",     content: <SecNegocio token={token} perfil={perfil} onSave={p => setPerfil(p)} /> },
    { id: "empleados",      tag: "02", label: "Empleados",      content: <SecEmpleados token={token} /> },
    { id: "mp",             tag: "03", label: "Mercado Pago",   content: <SecMP token={token} /> },
    { id: "facturacion",    tag: "04", label: "Facturación",    content: <SecFacturacion token={token} perfil={perfil} onSave={p => setPerfil(p)} /> },
    { id: "suscripcion",    tag: "05", label: "Mi Suscripción", content: <SecSuscripcion perfil={perfil} onCancelSubscription={() => setShowCancelModal(true)} /> },
    { id: "notificaciones", tag: "06", label: "Notificaciones", content: <SecNotificaciones token={token} /> },
    { id: "cuenta",         tag: "07", label: "Mi Cuenta",      content: <SecCuenta perfil={perfil} onDeleteAccount={() => setShowDeleteModal(true)} /> },
    { id: "soporte",        tag: "08", label: "Soporte",        content: <SecSoporte /> },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "var(--text)", marginBottom: 8 }}>
            Ajustes
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Administrá tu cuenta y configuración
          </p>
        </div>

        {/* Secciones con accordion */}
        {sections.map(s => (
          <Section key={s.id} open={open === s.id} toggle={() => toggle(s.id)} label={s.label} tag={s.tag}>
            {s.content}
          </Section>
        ))}

        {/* Botones finales */}
        <button
          onClick={() => router.push("/catalogo")}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "13px",
            background: "linear-gradient(135deg,#007AFF12,#00C2FF08)",
            border: "1px solid #007AFF20",
            borderRadius: 12,
            color: "var(--cyan)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Catálogo de productos →
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "13px",
            background: "transparent",
            border: "1px solid #EF444425",
            borderRadius: 12,
            color: "var(--red)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Modales */}
      {showCancelModal && (
        <ConfirmCancelSubscriptionModal
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            fetch(`${API}/api/usuario/perfil`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.json())
              .then(data => setPerfil(data))
              .catch(() => {});
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            try {
              localStorage.clear();
            } catch (e) {
              // Silent fail si localStorage bloqueado en mobile/PWA
            }
            router.replace("/login");
          }}
        />
      )}
    </main>
  );
}
