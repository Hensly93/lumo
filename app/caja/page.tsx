"use client";
// Cobrar (vista del dueño): cómo se abre la caja del local y quién está atendiendo ahora.
// La caja NO se abre desde la cuenta del dueño: se abre desde el link del local, con el código del negocio y el nombre + PIN
// de quien atiende (así cada turno queda a nombre de alguien). Antes el botón "Cobrar" mandaba al dueño directo a la pantalla
// de empleado, sin explicar nada y sin forma de volver; acá queda claro y el panel del dueño sigue abierto.
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "../components/Nav";
import Estado from "../components/Estado";
import LinkCaja from "../components/LinkCaja";
import { PageHeader } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useSucursal } from "../hooks/useSucursal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

type Vivo = { id: number; nombre: string; ventas_hoy: number; tx_hoy: number; turno_activo: { nombre_empleado: string; hora_apertura: string } | null };

const tarjeta: React.CSSProperties = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 16, margin: "0 16px 12px" };
const chico: React.CSSProperties = { fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 };
const titulo: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "var(--tinta)", marginBottom: 8 };

function desde(iso: string) {
  try { return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }); } catch { return ""; }
}

export default function Cobrar() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const { sucursalId } = useSucursal();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [equipo, setEquipo] = useState<string[] | null>(null);
  const [vivo, setVivo] = useState<Vivo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!token) return;
    setError(null);
    const h = { Authorization: `Bearer ${token}` };
    const ok = (r: Response) => { if (!r.ok) throw new Error(); return r.json(); };
    Promise.all([
      fetch(`${API}/api/multilocal/codigo-acceso`, { headers: h }).then(ok),
      fetch(`${API}/api/usuario/empleados`, { headers: h }).then(ok),
      fetch(`${API}/api/multilocal/red-vivo${sucursalId ? `?sucursal_ids=${sucursalId}` : ""}`, { headers: h }).then(ok),
    ])
      .then(([c, e, v]: [{ codigo?: string }, { nombre: string }[], { sucursales?: Vivo[] }]) => {
        setCodigo(c.codigo || null);
        setEquipo(Array.isArray(e) ? e.map(x => x.nombre) : []);
        setVivo(Array.isArray(v.sucursales) ? v.sucursales : []);
      })
      .catch(() => setError("No pudimos cargar los datos de tu caja."));
  }, [token, sucursalId]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    cargar();
  }, [ready, token, cargar, router]);

  const cargando = !error && (equipo === null || vivo === null);
  const sinEquipo = equipo !== null && equipo.length === 0;

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 110 }}>
      <PageHeader title="Cobrar" sub="La caja se abre con el código del negocio y el PIN de quien atiende" />
      <div style={{ margin: "0 16px" }}><Estado cargando={cargando} error={error} onReintentar={cargar} /></div>

      {!cargando && !error && (
        <>
          <div style={tarjeta}>
            <div style={titulo}>Ahora en la caja</div>
            {(vivo || []).length === 0 ? <div style={chico}>Todavía no hay locales cargados.</div> : (vivo || []).map(l => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: "1px solid var(--linea)" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--tinta)", fontSize: 14 }}>{l.nombre}</div>
                  <div style={chico}>{l.turno_activo ? `Atiende ${l.turno_activo.nombre_empleado} desde las ${desde(l.turno_activo.hora_apertura)}` : "Caja cerrada ahora"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--tinta)", fontSize: 14 }}>{fmt(l.ventas_hoy)}</div>
                  <div style={chico}>hoy · {l.tx_hoy} ventas</div>
                </div>
              </div>
            ))}
            <Link href="/en-vivo" style={{ display: "inline-block", marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--azul)" }}>Ver la caja en vivo</Link>
          </div>

          {sinEquipo ? (
            <div style={tarjeta}>
              <div style={titulo}>Primero, quién atiende la caja</div>
              <div style={chico}>Para cobrar hace falta al menos una persona con nombre y PIN (puede ser vos). Después acá vas a ver el link y el código.</div>
              <Link href="/equipo" style={{ display: "inline-block", marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "var(--tinta)", color: "var(--blanco)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>Sumar a quien atiende</Link>
            </div>
          ) : (
            <>
              <div style={tarjeta}>
                <div style={titulo}>Cómo se abre la caja</div>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--tinta)", lineHeight: 1.7 }}>
                  <li>En el celu o la compu de la caja, abrí el link de tu local (abajo).</li>
                  <li>Si el link no trae el código, escribí el código de tu negocio.</li>
                  <li>Elegí el nombre de quien atiende y poné su PIN de 4 números.</li>
                </ol>
                <div style={{ ...chico, marginTop: 8 }}>Pasa lo mismo si cobrás vos: entrás con tu nombre y tu PIN, así el turno queda a tu nombre.</div>
              </div>

              <div style={tarjeta}>
                <div style={titulo}>El código y el link de tu local</div>
                <div style={{ fontSize: 12, color: "var(--tinta-apagada)" }}>Código del negocio</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 3, color: "var(--tinta)", margin: "2px 0 12px" }}>{codigo || "…"}</div>
                <LinkCaja />
              </div>

              <div style={tarjeta}>
                <div style={titulo}>Quién puede entrar</div>
                <div style={{ fontSize: 14, color: "var(--tinta)" }}>{(equipo || []).join(", ")}</div>
                <Link href="/equipo" style={{ display: "inline-block", marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--azul)" }}>Sumar gente o cambiar un PIN</Link>
              </div>

              <div style={{ margin: "0 16px" }}>
                <button onClick={() => window.open("/empleado", "_blank", "noopener")}
                  style={{ width: "100%", padding: 14, border: "none", borderRadius: 12, background: "linear-gradient(135deg, #0A5BD3, #00C2FF)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Abrir la caja en este dispositivo
                </button>
                <div style={{ ...chico, marginTop: 8 }}>Se abre en otra pestaña y te va a pedir el código y tu PIN, igual que a cualquier empleado. Tu panel de dueño sigue abierto acá.</div>
              </div>
            </>
          )}
        </>
      )}
      <Nav />
    </main>
  );
}
