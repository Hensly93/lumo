"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { subscribePush } from "../hooks/usePush";
import ConfirmCancelSubscriptionModal from "../components/ConfirmCancelSubscriptionModal";
import ConfirmDeleteAccountModal from "../components/ConfirmDeleteAccountModal";
import CodigoAcceso from "../components/CodigoAcceso";

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
type Empleado = { id: number; nombre: string; sucursal_id: number | null; sucursal_nombre: string | null; puede_cargar_productos: boolean };

// ── Helpers ───────────────────────────────────────────────────────
function inp(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    width: "100%", padding: "11px 14px",
    background: "var(--card2)", border: "1px solid var(--border)",
    borderRadius: 10, color: "var(--text)", fontSize: 14,
    fontFamily: "var(--font-instrument),sans-serif", outline: "none", boxSizing: "border-box",
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
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--cyan)", fontFamily: "var(--font-instrument),sans-serif" }}>{initials}</span>
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

// ── SecEmpleados ─────────────────────────────────
// El equipo (altas, PINs y permisos) se maneja en un solo lugar: Caja del local.
function SecEmpleados({ token }: { token: string }) {
  void token;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
        Tus empleados, sus PIN y quién puede cambiar precios se manejan desde <strong style={{ color: "var(--text)" }}>Caja del local</strong>, junto con el link y el QR para abrir la caja.
      </div>
      <a href="/mi-local" style={{ display: "block", textAlign: "center", padding: "13px 16px", borderRadius: 12, background: "var(--azul, #0A5BD3)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
        Ir a Caja del local
      </a>
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
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cyan)", fontFamily: "var(--font-instrument),sans-serif" }}>Beta gratuita</div>
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
type EstadoPlan = {
  suscripcion?: "trial" | "activa" | "cancelada" | "vencida" | "interna";
  dias_restantes: number | null;
  fin?: string | null;
};

function fechaLarga(s: string | null | undefined) {
  if (!s) return null;
  return new Date(String(s).slice(0, 10) + "T12:00:00").toLocaleDateString("es-AR");
}

function SecSuscripcion({ perfil, token, recarga, onCancelSubscription }: { perfil: Perfil; token: string; recarga: number; onCancelSubscription: () => void }) {
  const [est, setEst] = useState<EstadoPlan | null>(null);
  const [emailMP, setEmailMP] = useState(perfil.email || "");
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState("");

  useEffect(() => {
    let vigente = true;
    fetch(`${API}/api/plan/estado`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(x => { if (vigente && x) setEst(x); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [token, recarga]);

  async function activar() {
    if (pagando) return;
    setPagando(true);
    setErrorPago("");
    try {
      const r = await fetch(`${API}/api/plan/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ origen: window.location.origin, email: emailMP.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (j && j.init_point) { window.location.href = j.init_point; return; }
      if (j && j.error === "empresarial") { window.location.href = "mailto:lumobusinessintel@gmail.com?subject=LumoBi%20para%20mi%20empresa"; return; }
      if (j && j.error === "ya_activa") { window.location.reload(); return; }
      setErrorPago((j && j.error) || "No pudimos abrir Mercado Pago. Probá de nuevo.");
    } catch {
      setErrorPago("No pudimos conectar. Revisá tu internet y probá de nuevo.");
    }
    setPagando(false);
  }

  if (!est || !est.suscripcion) {
    return <div style={{ fontSize: 13, color: "var(--muted)" }}>Cargando tu suscripción...</div>;
  }

  const s = est.suscripcion;
  const fin = fechaLarga(est.fin);
  const ROT: Record<string, { texto: string; color: string; fondo: string }> = {
    trial:     { texto: "Prueba gratuita", color: "#0A5BD3", fondo: "rgba(10, 91, 211, 0.12)" },
    activa:    { texto: "Activa",          color: "#00C48C", fondo: "rgba(0, 196, 140, 0.15)" },
    cancelada: { texto: "Cancelada",       color: "#D97706", fondo: "rgba(245, 158, 11, 0.15)" },
    vencida:   { texto: "Vencida",         color: "#EF4444", fondo: "rgba(239, 68, 68, 0.15)" },
    interna:   { texto: "Cuenta interna",  color: "#64748B", fondo: "rgba(100, 116, 139, 0.15)" },
  };
  const r = ROT[s] || ROT.activa;
  const dias = est.dias_restantes;
  let detalle = "";
  if (s === "trial") detalle = dias !== null ? `Te ${dias === 1 ? "queda 1 día" : "quedan " + dias + " días"} de prueba.` : "Estás en la prueba gratuita.";
  else if (s === "activa") detalle = fin ? `Próximo cobro: ${fin}.` : "Tu plan está activo.";
  else if (s === "cancelada") detalle = fin ? `No se te va a cobrar más. Seguís usando LumoBi hasta el ${fin}${dias !== null && dias >= 0 ? " (" + (dias === 0 ? "hoy es el último día" : dias === 1 ? "queda 1 día" : "quedan " + dias + " días") + ")" : ""}.` : "No se te va a cobrar más.";
  else if (s === "vencida") detalle = "Tu plan venció. Tus datos están guardados y vuelven a estar completos cuando lo actives.";
  else detalle = "Las cuentas internas no se cobran.";

  const puedeActivar = s === "trial" || s === "cancelada" || s === "vencida";
  const textoBoton = s === "cancelada" ? "Reactivar mi suscripción" : "Activar mi plan";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Estado</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{r.texto}</div>
        </div>
        <div style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: r.fondo, color: r.color, textTransform: "uppercase" }}>
          {r.texto}
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{detalle}</div>

      {puedeActivar && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            Se paga con débito automático de Mercado Pago. Escribí el email de tu cuenta de Mercado Pago, el mismo con el que vas a pagar.
          </div>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={emailMP}
            onChange={e => setEmailMP(e.target.value)}
            placeholder="email de tu cuenta de Mercado Pago"
            style={inp()}
          />
          {errorPago && <div style={{ fontSize: 12, color: "#EF4444", lineHeight: 1.5 }}>{errorPago}</div>}
          <button
            onClick={activar}
            disabled={pagando}
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#0A5BD3", color: "#fff", fontSize: 13, fontWeight: 700, cursor: pagando ? "default" : "pointer", opacity: pagando ? 0.7 : 1 }}
          >
            {pagando ? "Abriendo Mercado Pago..." : textoBoton}
          </button>
        </div>
      )}

      {s === "activa" && (
        <button
          onClick={onCancelSubscription}
          style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Cancelar suscripción
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

  useEffect(() => {
    fetch(`${API}/api/usuario/notificaciones`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setToggles(t => ({ ...t, ...d }))).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      setPushStatus("denied");
      return;
    }

    const perm = Notification.permission;

    if (perm === "granted") {
      // Verificar si existe suscripción real
      if ("serviceWorker" in navigator && "PushManager" in window) {
        navigator.serviceWorker.ready.then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setPushStatus("granted"); // Permission granted Y suscripción existe
          } else {
            setPushStatus("default"); // Permission granted PERO sin suscripción
          }
        }).catch(() => {
          setPushStatus("default");
        });
      } else {
        setPushStatus("default");
      }
    } else {
      // "denied" o "default" se asignan directamente
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

  const shouldShowBanner = pushStatus === "default";

  return (
    <div>
      {msg && <Toast msg={msg.text} ok={msg.ok} />}

      {shouldShowBanner ? (
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
        ) : null}

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
      {saving && (
        <div style={{ marginTop: 12, fontSize: 11, color: "var(--cyan)" }}>
          Guardando...
        </div>
      )}
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
  const [planKey, setPlanKey] = useState(0);
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
    { id: "acceso",         tag: "02", label: "Código de empleados", content: <CodigoAcceso token={token} /> },
    { id: "mp",             tag: "03", label: "Mercado Pago",   content: <SecMP token={token} /> },
    { id: "facturacion",    tag: "04", label: "Facturación",    content: <SecFacturacion token={token} perfil={perfil} onSave={p => setPerfil(p)} /> },
    { id: "suscripcion",    tag: "05", label: "Mi Suscripción", content: <SecSuscripcion perfil={perfil} token={token} recarga={planKey} onCancelSubscription={() => setShowCancelModal(true)} /> },
    { id: "notificaciones", tag: "06", label: "Notificaciones", content: <SecNotificaciones token={token} /> },
    { id: "cuenta",         tag: "07", label: "Mi Cuenta",      content: <SecCuenta perfil={perfil} onDeleteAccount={() => setShowDeleteModal(true)} /> },
    { id: "soporte",        tag: "08", label: "Soporte",        content: <SecSoporte /> },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-instrument),sans-serif", color: "var(--text)", marginBottom: 8 }}>
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
            setPlanKey(k => k + 1);
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
