"use client";
// El link de la caja del local: lo que el dueño le manda al empleado. Copiar, mandar por WhatsApp o mostrar el QR, sin buscar nada.
import { useEffect, useState, type CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";

const btnP: CSSProperties = {
  width: "100%", padding: "14px", border: "none", borderRadius: 12, background: "linear-gradient(135deg, #0A5BD3, #00C2FF)",
  color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE,
};
const btnS: CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12, border: "1px solid var(--border, #E0E7F1)", background: "transparent",
  color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE,
};

export default function LinkCaja() {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [verQR, setVerQR] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) return;
    fetch(`${API}/api/multilocal/codigo-acceso`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d: { codigo?: string }) => { if (d.codigo) setCodigo(d.codigo); })
      .catch(() => { /* el link queda vacío */ });
  }, []);

  // Siempre el dominio oficial, aunque se abra la app desde la dirección vieja de Vercel
  const origen = typeof window === "undefined" ? "" : /vercel\.app$/i.test(window.location.hostname) ? "https://lumobi.com.ar" : window.location.origin;
  const link = codigo ? `${origen}/empleado?c=${encodeURIComponent(codigo)}` : "";
  const dec = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  async function copiar() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); dec("Link copiado"); } catch { dec("No se pudo copiar"); }
  }
  function whatsapp() {
    if (!link) return;
    const texto = `Para entrar a la caja de LumoBi abrí este link: ${link}\nElegí tu nombre y poné tu PIN.`;
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
  }

  if (!link) return <div style={{ fontSize: 13, color: "var(--muted, #64748B)", padding: "8px 0" }}>Preparando el link de tu caja…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button style={btnP} onClick={whatsapp}>Mandar el link por WhatsApp</button>
      <button style={btnS} onClick={copiar}>Copiar el link</button>
      <button style={btnS} onClick={() => setVerQR((v) => !v)}>{verQR ? "Ocultar el QR" : "Ver el QR para escanear desde el local"}</button>
      {verQR && (
        <div style={{ display: "flex", justifyContent: "center", padding: 12, background: "#fff", borderRadius: 12 }}>
          <QRCodeSVG value={link} size={168} />
        </div>
      )}
      {aviso && <div style={{ fontSize: 12, textAlign: "center", color: "var(--muted, #64748B)" }}>{aviso}</div>}
    </div>
  );
}
