"use client";
// Proveedores: la ficha de cada uno se arma sola con las facturas que ya cargaste.
// Lista -> toca uno -> qué te vende, cuánto subió cada cosa y dónde otro proveedor lo cobra menos.
import { useCallback, useEffect, useState } from "react";
import Nav from "../components/Nav";
import Estado from "../components/Estado";
import { PageHeader } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const tarjeta: React.CSSProperties = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 10, padding: 16, margin: "0 16px 12px" };
const chico: React.CSSProperties = { fontSize: 12, color: "var(--tinta-apagada)", lineHeight: 1.5 };

type Prov = { clave: string; nombre: string; cuit: string | null; facturas: number; total: number; ultima: string; pct: number };
type Lista = { dias: number; total: number; proveedores: Prov[] };
type Prod = {
  clave: string; descripcion: string; compras: number; cantidad: number; gastado: number; precio_primero: number; precio_ultimo: number;
  cambio_pct: number | null; subio: boolean; mas_barato: { proveedor: string; precio: number; menos_pct: number; ahorro_90d: number } | null;
};
type Ficha = { nombre: string; cuit: string | null; facturas: number; total: number; productos: Prod[]; subas: number; ahorro_posible_90d: number; aviso: string };

const dia = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

export default function Proveedores() {
  const { token, ready } = useAuth();
  const [lista, setLista] = useState<Lista | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async (ruta: string) => {
    const r = await fetch(`${API}/api/proveedores${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error((d && d.error) || "No pude cargar los proveedores.");
    return d;
  }, [token]);

  const cargarLista = useCallback(() => {
    setCargando(true); setError(null); setFicha(null);
    get("").then(setLista).catch(e => setError(e.message)).finally(() => setCargando(false));
  }, [get]);
  useEffect(() => { if (ready && token) cargarLista(); }, [ready, token, cargarLista]);

  function abrir(p: Prov) {
    setCargando(true); setError(null);
    get(`/ficha?nombre=${encodeURIComponent(p.nombre)}`).then(setFicha).catch(e => setError(e.message)).finally(() => setCargando(false));
  }

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 150 }}>
      <PageHeader title={ficha ? ficha.nombre : "Proveedores"} sub={ficha ? "Últimos 90 días" : "Armado con las facturas que cargaste, últimos 90 días"} negocioEntero />
      <div style={{ padding: "0 0" }}>
        <Estado cargando={cargando} error={error} onReintentar={ficha ? cargarLista : cargarLista}
          vacio={!cargando && !error && !ficha && lista && lista.proveedores.length === 0 ? "Todavía no hay facturas de los últimos 90 días. Sacale una foto a una factura de tu proveedor en Facturas y acá aparece su ficha." : null} />

        {!cargando && !error && !ficha && lista && lista.proveedores.length > 0 && (
          <>
            <div style={tarjeta}>
              <div style={chico}>Le compraste en total</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "var(--tinta)" }}>{fmt(lista.total)}</div>
            </div>
            {lista.proveedores.map(p => (
              <button key={p.clave} onClick={() => abrir(p)} style={{ ...tarjeta, width: "calc(100% - 32px)", textAlign: "left", cursor: "pointer", display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{p.nombre}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{fmt(p.total)}</div>
                </div>
                <div style={chico}>{p.facturas} {p.facturas === 1 ? "factura" : "facturas"} · {p.pct}% de tus compras · última el {dia(p.ultima)}</div>
              </button>
            ))}
          </>
        )}

        {!cargando && !error && ficha && (
          <>
            <button onClick={cargarLista} style={{ margin: "0 16px 12px", padding: 0, border: "none", background: "none", color: "#007AFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Todos los proveedores</button>
            <div style={tarjeta}>
              <div style={chico}>Le compraste</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "var(--tinta)" }}>{fmt(ficha.total)}</div>
              <div style={chico}>en {ficha.facturas} {ficha.facturas === 1 ? "factura" : "facturas"}{ficha.cuit ? ` · CUIT ${ficha.cuit}` : ""}</div>
              {ficha.subas > 0 && <div style={{ fontSize: 14, color: "#D97706", fontWeight: 700, marginTop: 8 }}>{ficha.subas} {ficha.subas === 1 ? "producto subió" : "productos subieron"} de precio.</div>}
              {ficha.ahorro_posible_90d > 0 && <div style={{ fontSize: 14, color: "var(--ok, #16A34A)", fontWeight: 700, marginTop: 4 }}>Con otro proveedor habrías pagado hasta {fmt(ficha.ahorro_posible_90d)} menos en estos 90 días.</div>}
            </div>
            {ficha.productos.map(p => (
              <div key={p.clave} style={tarjeta}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>{p.descripcion}</div>
                  <div style={{ fontSize: 14, color: "var(--tinta)" }}>{fmt(p.gastado)}</div>
                </div>
                <div style={chico}>{p.compras} {p.compras === 1 ? "compra" : "compras"} · {p.cantidad} unidades · hoy {fmt(p.precio_ultimo)} c/u</div>
                {p.cambio_pct != null && Math.abs(p.cambio_pct) >= 1 && (
                  <div style={{ fontSize: 13, marginTop: 4, fontWeight: 600, color: p.subio ? "#D97706" : "var(--tinta-apagada)" }}>
                    {p.cambio_pct > 0 ? "Subió" : "Bajó"} {Math.abs(p.cambio_pct)}%: de {fmt(p.precio_primero)} a {fmt(p.precio_ultimo)}
                  </div>
                )}
                {p.mas_barato && (
                  <div style={{ fontSize: 13, marginTop: 4, color: "var(--ok, #16A34A)", fontWeight: 600 }}>
                    {p.mas_barato.proveedor} lo cobra {p.mas_barato.menos_pct}% menos ({fmt(p.mas_barato.precio)} c/u).
                  </div>
                )}
              </div>
            ))}
            <div style={{ ...chico, margin: "0 16px" }}>{ficha.aviso}</div>
          </>
        )}
      </div>
      <Nav />
    </main>
  );
}
