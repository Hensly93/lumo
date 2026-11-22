// Imagen que muestran WhatsApp, Facebook e Instagram al compartir lumobi.com.ar/partners.
// Montos fijos de LumoBi Partners (si cambian PARTNER_ALTA_MONTO o PARTNER_CARTERA_MONTO en Render, actualizarlos acá).
// Le habla a quien quiere ganar plata recomendando LumoBi (NO al dueño de un comercio): por eso no reusa la imagen general.
import { ImageResponse } from "next/og";

export const alt = "LumoBi busca vendedores a comisión: cada comercio que traés te paga $22.500 y después te sigue pagando $10.000 todos los meses.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagen() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0A1628", padding: "44px 72px", color: "#FFFFFF", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", left: 17, top: 13, width: 10, height: 38, borderRadius: 4, background: "#0A1628" }} />
            <div style={{ position: "absolute", left: 17, top: 41, width: 30, height: 10, borderRadius: 4, background: "#0A1628" }} />
            <div style={{ position: "absolute", left: 38, top: 13, width: 11, height: 11, borderRadius: 6, background: "#00C2FF" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>LumoBi</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#00C2FF" }}>Partners</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#00C2FF", marginBottom: 12 }}>BUSCAMOS VENDEDORES A COMISIÓN</div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08 }}>Cada comercio que traés te paga $22.500</div>
          <div style={{ fontSize: 38, lineHeight: 1.2, marginTop: 12, color: "#CFE3F5" }}>y después te sigue pagando $10.000 todos los meses</div>
          <div style={{ fontSize: 30, lineHeight: 1.2, marginTop: 12, color: "#00C2FF" }}>10 comercios = $100.000 por mes, sin volver a venderles</div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          {["Formación gratis", "Cobrás por transferencia", "Tus horarios"].map((t) => (
            <div key={t} style={{ display: "flex", whiteSpace: "nowrap", fontSize: 27, fontWeight: 700, background: "rgba(0,194,255,0.16)", border: "2px solid #00C2FF", borderRadius: 40, padding: "12px 26px" }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
