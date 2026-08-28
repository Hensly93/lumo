"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

export default function ScanPage() {
  const params = useParams();
  const token = params.token as string;

  const [sesion, setSesion] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [ultimoEscaneo, setUltimoEscaneo] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    async function validarSesion() {
      try {
        const r = await fetch(`${API}/api/scanner/sesion/${token}`);
        const d = await r.json();
        if (!r.ok || !d.valida) {
          setError(d.error || "Sesión inválida");
          return;
        }
        setSesion(d);
      } catch {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    }
    validarSesion();
  }, [token]);

  useEffect(() => {
    if (!sesion || !videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let activo = true;
    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
      if (result && activo) {
        agregarProducto(result.getText());
      }
    });
    return () => {
      activo = false;
      readerRef.current = null;
    };
  }, [sesion]);

  async function agregarProducto(codigo: string) {
    if (!sesion?.turno_id) return;
    setUltimoEscaneo(`Buscando ${codigo}...`);
    try {
      const r = await fetch(`${API}/api/scanner/producto?turno_id=${sesion.turno_id}&codigo=${encodeURIComponent(codigo)}`);
      const d = await r.json();
      if (d.existe) {
        await fetch(`${API}/api/scanner/carrito`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turno_id: sesion.turno_id,
            producto_id: d.producto.id,
            cantidad: 1,
            agregado_por: 'camara_celu',
          }),
        });
        setUltimoEscaneo(`✓ ${d.producto.nombre}`);
      } else {
        setUltimoEscaneo(`✗ Código ${codigo} no encontrado`);
      }
    } catch {
      setUltimoEscaneo(`✗ Error de conexión`);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1628', color: '#FFFFFF', padding: 24 }}>
        <div>Validando sesión...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1628', color: '#FF3B30', padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{error}</div>
          <div style={{ fontSize: 14, color: '#6B8099', marginTop: 8 }}>Generá un nuevo QR desde la compu</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0A1628', color: '#FFFFFF', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, color: '#6B8099', marginBottom: 8, fontWeight: 600 }}>LUMO SCAN</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, margin: '0 0 8px 0' }}>Scanner móvil</h1>
          <p style={{ fontSize: 14, color: '#6B8099', margin: 0 }}>Turno de {sesion?.empleado}</p>
        </div>

        {/* Cámara para leer códigos de barras */}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            borderRadius: 20,
            marginBottom: 24,
            background: '#000',
          }}
          muted
          playsInline
        />

        {/* Estado visual */}
        <div style={{
          background: '#1A2B42',
          border: '2px solid #2D4A6C',
          borderRadius: 20,
          padding: 32,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
            Apuntá la cámara al código de barras
          </div>
          <div style={{ fontSize: 14, color: '#6B8099' }}>
            Los productos se agregan automáticamente
          </div>
        </div>

        {/* Último escaneo */}
        {ultimoEscaneo && (
          <div style={{
            background: ultimoEscaneo.startsWith('✓') ? '#34C75910' : ultimoEscaneo.startsWith('✗') ? '#FF3B3010' : '#FFCC0010',
            border: `2px solid ${ultimoEscaneo.startsWith('✓') ? '#34C759' : ultimoEscaneo.startsWith('✗') ? '#FF3B30' : '#FFCC00'}`,
            borderRadius: 14,
            padding: 16,
            fontSize: 14,
            color: ultimoEscaneo.startsWith('✓') ? '#34C759' : ultimoEscaneo.startsWith('✗') ? '#FF3B30' : '#FFCC00',
            textAlign: 'center',
            fontWeight: 600,
          }}>
            {ultimoEscaneo}
          </div>
        )}

        {/* Instrucciones */}
        <div style={{
          marginTop: 48,
          padding: 20,
          background: '#1A2B42',
          borderRadius: 14,
          fontSize: 13,
          color: '#6B8099',
          lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>💡 Cómo usar:</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Mantené el foco en esta pantalla</li>
            <li>Apuntá la cámara al código de barras</li>
            <li>El producto se agrega automáticamente al carrito de la compu</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
