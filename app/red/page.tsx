"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { useAuth } from "../hooks/useAuth";
import { PageHeader, HeroCard, SectionTitle, StatRow, StatCard, AlertCard } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Sucursal = {
  id: number;
  nombre: string;
  direccion: string | null;
  ventas_mes: number;
  tx_mes: number;
  brecha_promedio: number;
  n_turnos_analizados: number;
  turno_activo: { nombre_empleado: string; tipo_turno: string } | null;
  semaforo: "verde" | "amarillo" | "rojo" | "sin_datos";
  sin_datos: boolean;
};

type Resumen = {
  total_sucursales: number;
  ventas_red_mes: number;
  sucursales_en_rojo: number;
  local_mas_ventas: string | null;
};

const SEM_VARIANT: Record<string, "ok" | "warn" | "crit"> = {
  verde: "ok", amarillo: "warn", rojo: "crit", sin_datos: "ok",
};
const SEM_COLOR: Record<string, string> = {
  verde: "var(--emerald)", amarillo: "var(--yellow)", rojo: "var(--red)", sin_datos: "var(--muted)",
};

function fmt(n: number) { return "$" + Math.round(n).toLocaleString("es-AR"); }

function inp(): React.CSSProperties {
  return { width: "100%", padding: "11px 14px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" };
}

export default function Red() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Sucursal | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editGuardando, setEditGuardando] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    cargar();
  }, [ready, token]);

  async function cargar() {
    setLoading(true);
    const data = await fetch(`${API}/api/multilocal/red`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).catch(() => null);
    setSucursales(data?.sucursales || []);
    setResumen(data?.resumen || null);
    setLoading(false);
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setGuardando(true); setError("");
    try {
      const resp = await fetch(`${API}/api/multilocal/sucursal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), direccion: direccion.trim() || null }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || "Error");
      setNombre(""); setDireccion(""); setMostrarForm(false); await cargar();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setGuardando(false); }
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!editando || !editNombre.trim()) return;
    setEditGuardando(true);
    try {
      await fetch(`${API}/api/multilocal/sucursal/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: editNombre.trim(), direccion: editDireccion.trim() || null }),
      });
      setEditando(null); await cargar();
    } finally { setEditGuardando(false); }
  }

  async function eliminar(id: number) {
    if (!confirm("¿Desactivar este local?")) return;
    await fetch(`${API}/api/multilocal/sucursal/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await cargar();
  }

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader
        title="Tu red"
        sub={resumen && resumen.total_sucursales > 0 ? `${resumen.total_sucursales} local${resumen.total_sucursales !== 1 ? "es" : ""} activo${resumen.total_sucursales !== 1 ? "s" : ""}` : "Multi-local"}
      />

      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 3, textTransform: "uppercase" }}>Cargando...</div>
        </div>
      ) : (
        <>
          {resumen && resumen.ventas_red_mes > 0 && (
            <HeroCard
              label="Ventas de la red este mes"
              value={fmt(resumen.ventas_red_mes)}
              sub={resumen.local_mas_ventas ? `Mejor local: ${resumen.local_mas_ventas}` : undefined}
            />
          )}

          {resumen && sucursales.length > 1 && (
            <StatRow>
              <StatCard label="Locales" value={String(resumen.total_sucursales)} color="blue" />
              <StatCard label="En rojo" value={String(resumen.sucursales_en_rojo)} color={resumen.sucursales_en_rojo > 0 ? "red" : "green"} />
              <StatCard label="Ventas red" value={resumen.ventas_red_mes > 0 ? fmt(resumen.ventas_red_mes) : "—"} color="green" />
            </StatRow>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px 8px" }}>
            <SectionTitle>Tus locales</SectionTitle>
            <button
              onClick={() => { setMostrarForm(f => !f); setError(""); }}
              style={{ fontSize: 12, fontWeight: 700, color: "var(--cyan)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
              {mostrarForm ? "Cancelar" : "+ Agregar local"}
            </button>
          </div>

          {/* Formulario agregar */}
          {mostrarForm && (
            <form onSubmit={agregar} style={{ margin: "0 12px 10px", background: "var(--card)", border: "1px solid #007AFF25", borderRadius: 16, padding: 18, boxShadow: "var(--sh)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "var(--cyan)", textTransform: "uppercase", marginBottom: 14 }}>// Nuevo local</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                <input placeholder="Nombre del local *" value={nombre} onChange={e => { setNombre(e.target.value); setError(""); }} style={inp()} autoFocus />
                <input placeholder="Dirección (opcional)" value={direccion} onChange={e => setDireccion(e.target.value)} style={inp()} />
              </div>
              {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <button type="submit" disabled={guardando} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg,#007AFF,#00C2FF)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1 }}>
                {guardando ? "Guardando..." : "Guardar local"}
              </button>
            </form>
          )}

          {/* Modal edición */}
          {editando && (
            <form onSubmit={guardarEdicion} style={{ margin: "0 12px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--sh)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>// Editar local</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                <input placeholder="Nombre del local *" value={editNombre} onChange={e => setEditNombre(e.target.value)} style={inp()} autoFocus />
                <input placeholder="Dirección (opcional)" value={editDireccion} onChange={e => setEditDireccion(e.target.value)} style={inp()} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setEditando(null)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: 12, color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={editGuardando} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#007AFF12,#00C2FF08)", border: "1px solid #007AFF20", borderRadius: 12, color: "var(--cyan)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {editGuardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}

          {sucursales.length === 0 ? (
            <AlertCard
              variant="ok"
              tag="Sin locales"
              title="Todavía no tenés locales registrados"
              desc='Tocá "+ Agregar local" para registrar tu primera sucursal.'
            />
          ) : (
            sucursales.map(s => {
              const semColor = SEM_COLOR[s.semaforo];
              return (
                <div key={s.id} style={{ margin: "0 12px 8px", background: "var(--card)", borderRadius: 14, padding: 14, border: "1px solid var(--border)", borderLeft: `3px solid ${semColor}`, boxShadow: "var(--sh)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{s.nombre}</div>
                      {s.direccion && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.direccion}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: semColor }} />
                      <button onClick={() => { setEditando(s); setEditNombre(s.nombre); setEditDireccion(s.direccion || ""); setMostrarForm(false); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>Editar</button>
                      <button onClick={() => eliminar(s.id)} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 14, cursor: "pointer" }}>×</button>
                    </div>
                  </div>

                  {s.sin_datos ? (
                    <div style={{ padding: "8px 12px", background: "var(--card2)", borderRadius: 8, fontSize: 11, color: "var(--muted)" }}>
                      Sin datos aún — las transacciones aparecerán automáticamente.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Ventas mes</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, color: "var(--emerald)" }}>{fmt(s.ventas_mes)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Brecha prom.</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, color: s.brecha_promedio > 1000 ? "var(--red)" : "var(--text)" }}>{fmt(s.brecha_promedio)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Turnos</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{s.n_turnos_analizados}</div>
                      </div>
                    </div>
                  )}

                  {s.turno_activo && (
                    <div style={{ marginTop: 10, padding: "7px 12px", background: "linear-gradient(135deg,#007AFF08,#00C2FF05)", border: "1px solid #007AFF15", borderRadius: 8, fontSize: 11, color: "var(--cyan)" }}>
                      Turno activo: {s.turno_activo.nombre_empleado} · {s.turno_activo.tipo_turno}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      <Nav />
    </main>
  );
}
