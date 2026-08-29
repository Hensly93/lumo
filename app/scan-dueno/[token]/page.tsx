"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function ScanDuenoPage() {
  const params = useParams();
  const token = params.token as string;

  const [valida, setValida] = useState<boolean | null>(null);
  const [ultimoEscaneo, setUltimoEscaneo] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    async function validarSesion() {
      try {
        const r = await fetch(`${API}/api/scanner-dueno/sesion/${token}`);
        const d = await r.json();
        setValida(!!d.valida);
      } catch {
        setValida(false);
      }
    }
    validarSesion();
  }, [token]);

  useEffect(() => {
    if (!valida || !videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let activo = true;
    reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (result && activo) {
        agregarCodigo(result.getText());
      }
    });
    return () => {
      activo = false;
      readerRef.current = null;
    };
  }, [valida]);

  async function agregarCodigo(codigo: string) {
    setUltimoEscaneo(`Procesando ${codigo}...`);
    try {
      const r = await fetch(`${API}/api/scanner-dueno/${token}/codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo_barras: codigo }),
      });
      const d = await r.json();
      if (d.ya_existe) {
        setUltimoEscaneo(`○ ${codigo} ya está en tu catálogo`);
      } else if (d.agregado) {
        setUltimoEscaneo(`✓ ${codigo} agregado a pendientes`);
      } else {
        setUltimoEscaneo(`✗ Error con ${codigo}`);
      }
    } catch {
      setUltimoEscaneo(`✗ Error de conexión`);
    }
  }

  if (valida === null) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070B12", color: "#EDF2FF", padding: 24 }}>
        <div>Validando sesión...</div>
      </main>
    );
  }

  if (!valida) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070B12", color: "#FF4560", padding: 24, textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Este código ya no es válido</div>
          <div style={{ fontSize: 14, color: "#7090AA", marginTop: 8 }}>Generá un nuevo QR desde Catálogo</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#070B12", color: "#EDF2FF", padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, color: "#7090AA", marginBottom: 8, fontWeight: 600 }}>LUMO SCAN · DUEÑO</div>
          <h1 style={{ fontWeight: 800, fontSize: 28, margin: "0 0 8px 0" }}>Cargar mercadería</h1>
          <p style={{ fontSize: 14, color: "#7090AA", margin: 0 }}>Escaneá y después completás precio en la compu</p>
        </div>

        <video
          ref={videoRef}
          style={{ width: "100%", borderRadius: 20, marginBottom: 24, background: "#000" }}
          muted
          playsInline
        />

        <div style={{ background: "#111827", border: "2px solid #1C2E42", borderRadius: 20, padding: 32, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Apuntá la cámara al código de barras</div>
          <div style={{ fontSize: 14, color: "#7090AA" }}>Cada código se guarda en tu lista de pendientes</div>
        </div>

        {ultimoEscaneo && (
          <div style={{
            background: ultimoEscaneo.startsWith("✓") ? "#00E5A010" : ultimoEscaneo.startsWith("✗") ? "#FF456010" : "#00D4FF10",
            border: `2px solid ${ultimoEscaneo.startsWith("✓") ? "#00E5A0" : ultimoEscaneo.startsWith("✗") ? "#FF4560" : "#00D4FF"}`,
            borderRadius: 16,
            padding: 16,
            fontSize: 14,
            color: ultimoEscaneo.startsWith("✓") ? "#00E5A0" : ultimoEscaneo.startsWith("✗") ? "#FF4560" : "#00D4FF",
            textAlign: "center",
            fontWeight: 600,
          }}>
            {ultimoEscaneo}
          </div>
        )}

        <div style={{ marginTop: 48, padding: 20, background: "#111827", borderRadius: 14, fontSize: 13, color: "#7090AA", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: "#EDF2FF", marginBottom: 8 }}>💡 Cómo usar:</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Apuntá la cámara al código de barras del producto</li>
            <li>Se guarda como pendiente automáticamente</li>
            <li>En la compu, completás nombre y precio de cada uno</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
