"use client";

import { useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";
const FUENTE = "var(--font-instrument), sans-serif";

type Resultado = {
  transacciones_cargadas: number;
  duplicadas_omitidas?: number;
  dias_datos?: number;
  advertencias?: string | null;
};

type Patron = {
  id: string;
  titulo: string;
  descripcion: string;
  recomendacion: string;
};

type Wow = { patrones?: Patron[]; mensaje?: string };

type Fase = "reposo" | "leyendo" | "listo" | "error";

const btnPrimario: React.CSSProperties = {
  width: "100%", padding: "14px", border: "none", borderRadius: 12,
  background: "linear-gradient(135deg, #007AFF, #00C2FF)", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FUENTE,
};

const btnSecundario: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12,
  border: "1px solid var(--border, #E0E7F1)", background: "transparent",
  color: "var(--text, #0A1628)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FUENTE,
};

const nota: React.CSSProperties = {
  margin: 0, fontSize: 12, color: "var(--muted, #64748B)", lineHeight: 1.5, fontFamily: FUENTE,
};

const PLANTILLA =
  "fecha,hora,monto,metodo_pago,empleado\n" +
  "2026-10-01,09:15,3500,efectivo,Juan\n" +
  "2026-10-01,10:40,8200,mercado_pago,Juan\n" +
  "2026-10-01,18:05,12400,debito,Maria\n";

export default function SubirVentas({ token, onListo }: { token: string; onListo?: () => void }) {
  const [fase, setFase] = useState<Fase>("reposo");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [nombre, setNombre] = useState("");
  const [wow, setWow] = useState<Wow | null>(null);
  const entrada = useRef<HTMLInputElement | null>(null);
  const entradaFoto = useRef<HTMLInputElement | null>(null);

  function descargarPlantilla() {
    const blob = new Blob([PLANTILLA], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_ventas_lumobi.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function subir(archivo: File) {
    setFase("leyendo");
    setNombre(archivo.name);
    setError("");
    setResultado(null);
    setWow(null);
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), 150000);
    try {
      const datos = new FormData();
      datos.append("archivo", archivo);
      const r = await fetch(API + "/api/negocio/upload-historial", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: datos,
        signal: control.signal,
      });
      const cuerpo = (await r.json().catch(() => ({}))) as Resultado & { error?: string };
      if (!r.ok) throw new Error(cuerpo.error || "No pudimos leer el archivo (error " + r.status + ")");
      setResultado(cuerpo);
      try {
        const w = await fetch(API + "/api/negocio/wow-moment", { headers: { Authorization: "Bearer " + token } });
        if (w.ok) setWow((await w.json()) as Wow);
      } catch { /* si falla el análisis, igual quedó cargado */ }
      setFase("listo");
      if (onListo) onListo();
    } catch (e) {
      const abortado = e instanceof Error && e.name === "AbortError";
      setError(abortado ? "El archivo tardó demasiado en leerse. Probá con uno más chico o con menos días." : e instanceof Error ? e.message : "Error desconocido");
      setFase("error");
    } finally {
      clearTimeout(reloj);
      if (entrada.current) entrada.current.value = "";
      if (entradaFoto.current) entradaFoto.current.value = "";
    }
  }

  // Dos selectores: si se mezclan archivos e imagenes en uno solo, el celular ofrece solo Camara y Fotos
  // y no deja elegir un Excel, un CSV ni un PDF.
  const selector = (
    <>
      <input
        ref={entrada}
        type="file"
        accept=".xlsx,.xls,.csv,.pdf,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        aria-label="Elegir el archivo de ventas"
        style={{ display: "none" }}
        onChange={e => { const f = e.currentTarget.files; if (f && f[0]) subir(f[0]); }}
      />
      <input
        ref={entradaFoto}
        type="file"
        accept="image/*"
        aria-label="Sacar o elegir una foto de las ventas"
        style={{ display: "none" }}
        onChange={e => { const f = e.currentTarget.files; if (f && f[0]) subir(f[0]); }}
      />
    </>
  );

  if (fase === "leyendo") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text, #0A1628)", fontFamily: FUENTE }}>Leyendo tu archivo...</div>
        <p style={nota}>Si es una foto o un PDF puede tardar hasta un minuto. No cierres esta pantalla.</p>
        {selector}
      </div>
    );
  }

  if (fase === "listo" && resultado) {
    const patrones = wow?.patrones ?? [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#16A34A", fontFamily: FUENTE }}>
          Listo: se cargaron {resultado.transacciones_cargadas} ventas.
        </div>
        {nombre && <p style={nota}>Archivo leído: {nombre}</p>}
        {(resultado.duplicadas_omitidas ?? 0) > 0 && (
          <p style={nota}>{resultado.duplicadas_omitidas} ya estaban cargadas y no se repitieron.</p>
        )}
        {resultado.advertencias && <p style={nota}>{resultado.advertencias}</p>}
        {patrones.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted, #64748B)", fontFamily: FUENTE }}>
              Lo primero que vemos en tu negocio
            </div>
            {patrones.map(p => (
              <div key={p.id} style={{ border: "1px solid var(--border, #E0E7F1)", borderRadius: 12, padding: "12px 14px", background: "var(--card, #fff)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text, #0A1628)", lineHeight: 1.35, fontFamily: FUENTE }}>{p.titulo}</div>
                <p style={{ ...nota, marginTop: 4 }}>{p.descripcion}</p>
                <p style={{ ...nota, marginTop: 4, color: "var(--text, #0A1628)" }}>{p.recomendacion}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={nota}>{wow?.mensaje || "Cargamos tus ventas. Con unos días más de datos aparecen los primeros patrones."}</p>
        )}
        <button style={btnSecundario} onClick={() => entrada.current?.click()}>Cargar otro archivo</button>
        {selector}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {fase === "error" && (
        <div style={{ border: "1px solid #FCA5A5", background: "rgba(239,68,68,0.08)", borderRadius: 12, padding: "10px 12px", fontSize: 13, color: "#B91C1C", lineHeight: 1.45, fontFamily: FUENTE }}>
          {error}
        </div>
      )}
      <button style={btnPrimario} onClick={() => entrada.current?.click()}>
        {fase === "error" ? "Probar de nuevo con un archivo" : "Subir archivo (Excel, CSV o PDF)"}
      </button>
      <button style={btnSecundario} onClick={() => entradaFoto.current?.click()}>
        Sacar o elegir una foto
      </button>
      <p style={nota}>Sirve una foto del cuaderno o del ticket. Con 2 o 3 semanas de ventas alcanza.</p>
      <p style={nota}>Guardamos estas ventas en tu cuenta para calcular tus patrones. Solo las ves vos.</p>
      <button
        onClick={descargarPlantilla}
        style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#007AFF", fontFamily: FUENTE }}
      >
        Descargar plantilla de ejemplo
      </button>
      {selector}
    </div>
  );
}
