"use client";
// Activación de LumoBi — "LumoBi funcionando al X%" (14/11/2026)
// Cuanto más activa el dueño, mejor lo cuida LumoBi. Cada cosa dice qué gana y lleva a hacerla.
// Se usa en el Inicio (tarjeta), en el encabezado (porcentaje) y en /activar (lista completa).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export type Item = { id: string; peso: number; titulo: string; beneficio: string; ir: string | null; listo: boolean };
export type Activacion = { porcentaje: number; items: Item[]; siguiente: Item | null; aprendiendo: string[] };

let cache: { at: number; data: Activacion } | null = null;
const oyentes = new Set<(a: Activacion) => void>();

export function useActivacion(): Activacion | null {
  const [a, setA] = useState<Activacion | null>(cache ? cache.data : null);
  useEffect(() => {
    oyentes.add(setA);
    const token = localStorage.getItem("lumo_token");
    if (token && (!cache || Date.now() - cache.at > 60000)) {
      fetch(`${API}/api/guia/estado`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.activacion) { cache = { at: Date.now(), data: d.activacion }; oyentes.forEach((f) => f(d.activacion)); }
        })
        .catch(() => {});
    }
    return () => { oyentes.delete(setA); };
  }, []);
  return a;
}

function Barra({ pct }: { pct: number }) {
  return (
    <div style={{ height: 10, borderRadius: 5, background: "var(--papel)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#16A34A" : "var(--tinta)", transition: "width .4s" }} />
    </div>
  );
}

const botonOscuro = { padding: "8px 12px", borderRadius: 8, border: "none", background: "var(--tinta)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 } as const;

// Tarjeta del Inicio: el porcentaje y lo próximo para activar
export function ActivacionCard({ compacta }: { compacta?: boolean } = {}) {
  const a = useActivacion();
  const router = useRouter();
  if (!a) return null;
  if (compacta) {
    if (a.porcentaje >= 100) return null;
    return (
      <button onClick={() => router.push("/activar")}
        style={{ width: "100%", textAlign: "left", margin: "0 0 14px", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>LumoBi funcionando al {a.porcentaje}%</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#007AFF", whiteSpace: "nowrap" }}>Activar lo que falta →</span>
        </div>
        <Barra pct={a.porcentaje} />
      </button>
    );
  }
  if (a.porcentaje >= 100) {
    return (
      <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)", fontSize: 14, color: "#16A34A", fontWeight: 700 }}>
        ✓ LumoBi está funcionando al 100%
      </div>
    );
  }
  const pendientes = a.items.filter((i) => !i.listo).slice(0, 2);
  return (
    <div style={{ margin: "0 0 16px", padding: 16, borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tinta)" }}>LumoBi funcionando al {a.porcentaje}%</div>
      </div>
      <Barra pct={a.porcentaje} />
      <div style={{ fontSize: 13, color: "var(--tinta-apagada)", margin: "8px 0 12px", lineHeight: 1.5 }}>
        Cuanto más activás, más cosas ve LumoBi y mejor cuida tu negocio.
      </div>
      {pendientes.map((i) => (
        <div key={i.id} style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--linea)" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)" }}>{i.titulo}</div>
            <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.45 }}>{i.beneficio}</div>
          </div>
          {i.ir && <button style={botonOscuro} onClick={() => router.push(i.ir as string)}>Activar</button>}
        </div>
      ))}
      <button onClick={() => router.push("/activar")}
        style={{ width: "100%", marginTop: 6, padding: "10px", borderRadius: 8, border: "1px solid var(--linea)", background: "transparent", color: "var(--tinta)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Ver todo lo que se puede activar
      </button>
    </div>
  );
}

// Porcentaje chiquito para el encabezado
export function ActivacionChip() {
  const a = useActivacion();
  const router = useRouter();
  if (!a || a.porcentaje >= 100) return null;
  return (
    <button onClick={() => router.push("/activar")} aria-label={`LumoBi funcionando al ${a.porcentaje}%. Ver qué falta activar`}
      style={{ padding: "3px 8px", borderRadius: 999, border: "1px solid var(--linea)", background: "var(--papel)", color: "var(--tinta)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
      {a.porcentaje}%
    </button>
  );
}

// Lista completa (pantalla /activar)
export function ActivacionLista() {
  const a = useActivacion();
  const router = useRouter();
  if (!a) return <div style={{ padding: 16, color: "var(--tinta-apagada)" }}>Cargando…</div>;
  return (
    <div style={{ padding: "0 16px 24px" }}>
      <div style={{ padding: 16, borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)", marginBottom: 14 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--tinta)", marginBottom: 8 }}>{a.porcentaje}%</div>
        <Barra pct={a.porcentaje} />
        <div style={{ fontSize: 14, color: "var(--tinta-apagada)", marginTop: 10, lineHeight: 1.55 }}>
          {a.porcentaje >= 100
            ? "Activaste todo: LumoBi ve todo tu negocio."
            : "Cada cosa que activás le da a LumoBi más información para cuidar tu plata. Empezá por la de arriba."}
        </div>
      </div>
      {a.items.map((i) => (
        <div key={i.id} style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", padding: 14, marginBottom: 10, borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: i.listo ? "#16A34A" : "var(--tinta-apagada)" }}>{i.listo ? "✓" : "○"}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tinta)" }}>{i.titulo}</div>
              <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.45, marginTop: 2 }}>{i.beneficio}</div>
            </div>
          </div>
          {!i.listo && i.ir && <button style={botonOscuro} onClick={() => router.push(i.ir as string)}>Activar</button>}
        </div>
      ))}
      {a.aprendiendo.length > 0 && (
        <div style={{ padding: 14, borderRadius: 10, background: "var(--papel)", marginTop: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tinta)", marginBottom: 6 }}>LumoBi está aprendiendo solo</div>
          <div style={{ fontSize: 13, color: "var(--tinta-apagada)", lineHeight: 1.5, marginBottom: 6 }}>Esto no lo tenés que hacer vos: se junta con el uso de la caja.</div>
          {a.aprendiendo.map((t) => <div key={t} style={{ fontSize: 13, color: "var(--tinta)", lineHeight: 1.6 }}>· {t}</div>)}
        </div>
      )}
    </div>
  );
}
