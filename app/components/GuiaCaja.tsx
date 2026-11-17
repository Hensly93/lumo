"use client";
// GuiaCaja — qué hacer, paso por paso, para empezar a cobrar: abrir la caja, conectar la pistola y la primera venta.
// Va dentro del paso "Abrí tu caja" de Primeros pasos. Todo lo que dice es lo que la caja hace hoy.
import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

const FUENTE = "var(--font-instrument), sans-serif";

const num: CSSProperties = {
  flexShrink: 0, width: 24, height: 24, borderRadius: 12, background: "#0A5BD3", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800,
};
const t1: CSSProperties = { fontSize: 14, fontWeight: 700, color: "var(--text, #0A1628)", lineHeight: 1.3 };
const t2: CSSProperties = { fontSize: 13, color: "var(--muted, #475569)", lineHeight: 1.55, marginTop: 3 };

function Paso({ n, titulo, children }: { n: number; titulo: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: n > 1 ? "1px solid var(--border, #E0E7F1)" : "none" }}>
      <span aria-hidden style={num}>{n}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={t1}>{titulo}</div>
        {children}
      </div>
    </div>
  );
}

export default function GuiaCaja() {
  const router = useRouter();
  const [pistola, setPistola] = useState(true);

  return (
    <div style={{ marginTop: 6, padding: "6px 14px 10px", borderRadius: 12, background: "var(--card, #F8FAFC)", border: "1px solid var(--border, #E0E7F1)", fontFamily: FUENTE }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "var(--muted, #64748B)", padding: "8px 0 2px" }}>CÓMO COBRAR TU PRIMERA VENTA</div>

      <Paso n={1} titulo="Abrí la caja donde vas a cobrar">
        <div style={t2}>
          Poné tu nombre y un PIN de 4 números en el formulario de arriba: con eso se abre la caja. Entrá con tu nombre y tu PIN, y escribí con cuánta plata arrancás.
          Si la caja va a estar en otra compu o celu del local, tocá <b>“La caja está en otra compu o celu del local”</b>: te da el link para mandar por WhatsApp o un QR.
        </div>
      </Paso>

      <Paso n={2} titulo="Conectá la pistola lectora">
        <button type="button" onClick={() => setPistola(!pistola)} aria-expanded={pistola}
          style={{ background: "none", border: "none", padding: 0, marginTop: 3, color: "#0A5BD3", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE }}>
          {pistola ? "Ocultar cómo se conecta" : "Ver cómo se conecta"}
        </button>
        {pistola && (
          <div style={{ ...t2, display: "flex", flexDirection: "column", gap: 6 }}>
            <div>• <b>Enchufala</b> al USB de la compu. Si es Bluetooth, emparejala desde la configuración, como unos auriculares.</div>
            <div>• <b>No hay nada que instalar.</b> La pistola escribe el código como si fuera un teclado.</div>
            <div>• En la caja mirá el puntito de arriba del cuadro de escaneo: <b>verde y “Listo para escanear”</b> es que está lista. Si está naranja, tocá el cuadro una vez.</div>
            <div>• <b>Probala:</b> pasale un producto. Si aparece en el carrito, anda. Si no aparece, fijate que la pistola mande “Enter” al final del código (la mayoría ya lo trae; el manual lo explica).</div>
            <div>• <b>¿No tenés pistola?</b> Escribí el nombre del producto en el mismo cuadro, o usá los botones del acceso rápido (paso 5).</div>
          </div>
        )}
      </Paso>

      <Paso n={3} titulo="Cobrá">
        <div style={t2}>
          Pasá los productos. Cuando termines, elegí cómo paga en el panel de cobro: efectivo, QR, débito o crédito. Con el cuadro vacío, apretar Enter abre el cobro en efectivo.
          Si un producto no está cargado, la caja te deja cargarlo ahí mismo y lo suma a la venta.
        </div>
      </Paso>

      <Paso n={4} titulo="Al terminar el día, cerrá el turno">
        <div style={t2}>
          Tocá <b>“☰ Menú del turno”</b> (arriba a la derecha en la caja), contá la plata y cerrá. Te llega al celu cuánto vendiste y si la caja cerró bien.
        </div>
      </Paso>

      <Paso n={5} titulo="¿Vendés cosas sin código de barras?">
        <div style={t2}>
          Pan, facturas, fiambre, verdura. Marcalas en el catálogo con <b>“☆ A la caja”</b> y aparecen como botones grandes en la caja. Si se venden por kilo, poné “kg” como unidad y la caja pregunta cuántos kilos.
        </div>
        <button type="button" onClick={() => router.push("/catalogo")}
          style={{ marginTop: 8, width: "100%", padding: "11px", borderRadius: 10, border: "1px solid var(--border, #CBD5E1)", background: "transparent", color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE }}>
          Armar mi acceso rápido
        </button>
      </Paso>
    </div>
  );
}
