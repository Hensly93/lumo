"use client";
// Antes de mandar al dueño a Mercado Pago: qué ve LumoBi, qué no, cómo se corta. Todo lo que dice acá es lo que el código hace.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/ui";
import Nav from "../components/Nav";
import { track } from "../lib/track";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Estado = { conectado: boolean; mp_email?: string | null };

const caja = { background: "var(--blanco)", border: "1px solid var(--linea)", borderRadius: 12, padding: 14, marginBottom: 10 } as const;
const titulo = { fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: "var(--tinta-apagada)", marginBottom: 6 } as const;
const texto = { fontSize: 14, color: "var(--tinta)", lineHeight: 1.55 } as const;
const boton = { fontSize: 15, fontWeight: 700, padding: "13px 18px", borderRadius: 24, cursor: "pointer", width: "100%", marginBottom: 8 } as const;

function Fila({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, ...texto, marginTop: 6 }}>
      <span aria-hidden style={{ fontWeight: 800, color: ok ? "var(--ok)" : "var(--critico)", width: 14, flexShrink: 0 }}>{ok ? "✓" : "✕"}</span>
      <span>{children}</span>
    </div>
  );
}

export default function MercadoPagoPage() {
  const router = useRouter();
  const [e, setE] = useState<Estado | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [haciendo, setHaciendo] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
    track("mp_vista");
    fetch(`${API}/api/mp/estado`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json()).then(setE).catch(() => setE({ conectado: false }));
  }, [router]);

  function conectar() {
    track("mp_conectar");
    window.location.href = `${API}/api/mp/conectar?token=${token}`;
  }
  function ahoraNo() { track("mp_ahora_no"); router.back(); }
  async function desconectar() {
    setHaciendo(true); setError("");
    try {
      const r = await fetch(`${API}/api/mp/desconectar`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No pudimos desconectar.");
      track("mp_desconectar");
      setE({ conectado: false }); setConfirmar(false);
    } catch (x) { setError(x instanceof Error ? x.message : "No pudimos desconectar."); }
    setHaciendo(false);
  }

  return (
    <main style={{ background: "var(--papel)", minHeight: "100vh", paddingBottom: 100 }}>
      <PageHeader title="Tus cobros de Mercado Pago" sub="Lo que le permite a LumoBi ver toda la plata que entra" />
      <div style={{ padding: "0 16px" }}>
        {!e && <div style={{ color: "var(--tinta-apagada)" }}>Cargando…</div>}

        {e?.conectado && (
          <div style={caja}>
            <div style={titulo}>ESTADO</div>
            <div style={{ ...texto, fontWeight: 700 }}>Conectado{e.mp_email ? ` (${e.mp_email})` : ""}</div>
            <div style={{ ...texto, marginTop: 6 }}>LumoBi mira los cobros de esa cuenta y los compara con lo que anota tu caja.</div>
            {!confirmar ? (
              <button onClick={() => setConfirmar(true)} style={{ ...boton, marginTop: 12, marginBottom: 0, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)" }}>Desconectar</button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={texto}>LumoBi borra la autorización que guardó y deja de mirar tu cuenta. Los cobros que ya trajo quedan en tu historial. ¿Desconectamos?</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button disabled={haciendo} onClick={desconectar} style={{ ...boton, marginBottom: 0, border: "1px solid var(--critico)", background: "var(--critico)", color: "var(--blanco)" }}>{haciendo ? "Desconectando…" : "Sí, desconectar"}</button>
                  <button disabled={haciendo} onClick={() => setConfirmar(false)} style={{ ...boton, marginBottom: 0, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)" }}>No</button>
                </div>
              </div>
            )}
            {error && <div style={{ fontSize: 12, color: "var(--critico)", marginTop: 8 }}>{error}</div>}
          </div>
        )}

        {e && !e.conectado && (<>
          <div style={caja}>
            <div style={titulo}>PARA QUÉ LO CONECTÁS</div>
            <div style={{ ...texto, fontWeight: 700 }}>Para que LumoBi analice todas tus ventas y sea más preciso y más efectivo con tu negocio.</div>
            <Fila ok>Cruza lo que entró a tu Mercado Pago con lo que anotó tu caja. Si entró plata que nadie anotó, te avisa. Ejemplo: la caja anotó $80.000 y entraron $95.000: hay $15.000 sin anotar.</Fila>
            <Fila ok>Puede traer hasta 18 meses de tus cobros, así arranca con historia. Con más historia, los avisos y las predicciones se ajustan mejor a tu negocio.</Fila>
            <Fila ok>Ve la comisión real que te sacó Mercado Pago en cada cobro.</Fila>
            <div style={{ ...texto, marginTop: 10, fontWeight: 700 }}>Sin conectarlo, LumoBi solo ve lo que se anota en la caja: no puede detectar plata que entró por QR o posnet y nadie anotó.</div>
          </div>

          <div style={{ ...caja, border: "2px solid var(--tinta)" }}>
            <div style={titulo}>LO PRIMERO: TU PLATA</div>
            <Fila ok={false}>LumoBi no te saca plata. No tiene ninguna función para retirar, transferir ni devolver dinero de tu cuenta.</Fila>
            <Fila ok={false}>No te cobra nada por conectar.</Fila>
            <Fila ok>Lo que cobrás sigue cayendo directo en tu cuenta de Mercado Pago, como hasta ahora.</Fila>
            <Fila ok>Antes de aceptar, Mercado Pago te muestra qué permisos pedimos. Aceptás o no ahí mismo.</Fila>
            <Fila ok>Lo cortás cuando quieras con “Desconectar”.</Fila>
          </div>

          <div style={caja}>
            <div style={titulo}>QUÉ MIRA LUMOBI</div>
            <Fila ok>De cada cobro: cuánto fue, cuánta comisión te sacaron, cuánto te quedó, cómo pagaron (tarjeta, QR, etc.), cuándo y si se aprobó.</Fila>
            <Fila ok={false}>No ve tu clave de Mercado Pago: la escribís en la página de Mercado Pago, no en LumoBi.</Fila>
            <Fila ok={false}>No guarda datos de tus clientes: ni nombres, ni DNI, ni tarjetas.</Fila>
          </div>

          <div style={caja}>
            <div style={titulo}>LO ÚNICO MÁS QUE HABILITA (OPCIONAL)</div>
            <div style={texto}>Al conectar, la caja de LumoBi puede ofrecerte cobrar una venta con un QR de Mercado Pago o con tu posnet Point, por el monto exacto del carrito. Lo usa quien atiende la caja cuando quiere, y la plata cae en tu cuenta. Si no lo usás, no pasa nada.</div>
          </div>

          <div style={caja}>
            <div style={titulo}>CÓMO ES (30 SEGUNDOS)</div>
            <div style={texto}>1. Tocás “Conectar con Mercado Pago”.<br />2. Mercado Pago te muestra los permisos que pedimos y aceptás ahí.<br />3. Volvés a LumoBi.</div>
          </div>

          <div style={caja}>
            <div style={titulo}>SI TE ARREPENTÍS</div>
            <div style={texto}>Volvés a esta pantalla y tocás “Desconectar”. LumoBi borra la autorización que guardó y deja de mirar tu cuenta. Los cobros que ya trajo quedan en tu historial.</div>
          </div>

          <button onClick={conectar} style={{ ...boton, border: "1px solid var(--azul)", background: "var(--azul)", color: "var(--blanco)" }}>Conectar con Mercado Pago</button>
          <button onClick={ahoraNo} style={{ ...boton, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)" }}>Ahora no, sigo sin conectar</button>
          <div style={{ fontSize: 12, color: "var(--tinta-apagada)", textAlign: "center", marginTop: 4 }}>
            Más detalle en nuestra <a href="/privacidad" style={{ color: "var(--tinta-apagada)", textDecoration: "underline" }}>política de privacidad</a>.
          </div>
        </>)}
      </div>
      <Nav />
    </main>
  );
}
