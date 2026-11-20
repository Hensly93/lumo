"use client";
// NICOLE siempre a un toque (19/11/2026): burbuja flotante en todas las pantallas de la app que abre un panel
// ENCIMA de la pantalla actual, así el dueño pregunta sin perder lo que estaba mirando.
// La pantalla completa /nicole sigue existiendo (desde el panel hay un link a "Abrir en pantalla completa").
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NicoleMessage from "./NicoleMessage";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

const SIN_BOTON = ["/nicole", "/empleado", "/scan", "/scan-dueno", "/salir", "/login", "/onboarding", "/landing", "/soluciones", "/reset-password", "/admin", "/privacidad", "/terminos", "/primeros-pasos"];

type Mensaje = { id: string; rol: "usuario" | "nicole"; texto: string };

const SUGERENCIAS_BASE = ["¿Cómo estuvo la semana?", "¿Cuánto voy a vender mañana?", "¿Dónde estoy perdiendo plata?"];
// Una pregunta propia de la pantalla en la que está el dueño (va primera).
const SUGERENCIA_POR_PANTALLA: Record<string, string> = {
  "/que-hacer": "¿Cuál de estas conviene hacer primero?",
  "/fugas": "¿Cuál es la fuga más grande y por qué?",
  "/catalogo": "¿Qué productos me dejan poco margen?",
  "/costos": "¿A qué producto le tengo que subir el precio primero?",
  "/periodos": "¿Por qué vendí distinto que el período anterior?",
  "/predicciones": "¿En qué se basa la predicción de hoy?",
  "/equipo": "¿Tengo que hablar con algún empleado?",
  "/pedidos": "¿Qué conviene pedir esta semana?",
};

const BIENVENIDA = "Hola, soy NICOLE. Preguntame lo que quieras de tu negocio: ventas, turnos, diferencias, precios o qué hacer hoy.";

function uid() { return Math.random().toString(36).slice(2); }

export default function BotonNicole() {
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ id: "hola", rol: "nicole", texto: BIENVENIDA }]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes, cargando, abierto]);
  useEffect(() => { if (abierto) setTimeout(() => inputRef.current?.focus(), 120); }, [abierto]);
  useEffect(() => {
    if (!abierto) return;
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [abierto]);
  // Al cambiar de pantalla el panel se cierra (la conversación se conserva)
  useEffect(() => { setAbierto(false); }, [path]);

  if (SIN_BOTON.some(r => path === r || path.startsWith(r + "/"))) return null;

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || cargando) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("lumo_token") : null;
    const historial = mensajes.filter(m => m.id !== "hola").map(m => ({ rol: m.rol, texto: m.texto }));
    setMensajes(prev => [...prev, { id: uid(), rol: "usuario", texto: t }]);
    setInput("");
    if (!token) {
      setMensajes(prev => [...prev, { id: uid(), rol: "nicole", texto: "Tu sesión se cerró. Entrá de nuevo para que te pueda responder." }]);
      return;
    }
    setCargando(true);
    try {
      const resp = await fetch(`${API}/api/nicole/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mensaje: t, historial }),
      });
      const data = await resp.json();
      setMensajes(prev => [...prev, { id: uid(), rol: "nicole", texto: data.respuesta || "No pude responder. Probá de nuevo." }]);
    } catch {
      setMensajes(prev => [...prev, { id: uid(), rol: "nicole", texto: "Hubo un problema de conexión. Revisá tu internet y probá de nuevo." }]);
    } finally {
      setCargando(false);
    }
  }

  const sugerencias = [SUGERENCIA_POR_PANTALLA[path], ...SUGERENCIAS_BASE].filter(Boolean).slice(0, 3) as string[];
  const enHome = path === "/";

  return (
    <>
      {!abierto && (
        <button onClick={() => setAbierto(true)} aria-label="Preguntarle a NICOLE" style={{
          position: "fixed", right: 16, bottom: "calc(86px + env(safe-area-inset-bottom))", zIndex: 40,
          height: 52, minWidth: 52, padding: enHome ? "0 18px 0 14px" : 0, borderRadius: 99, background: "var(--tinta)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
          fontFamily: "var(--font-instrument), sans-serif", boxShadow: "0 6px 20px #0A162833",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
          </svg>
          {enHome && "Preguntale a NICOLE"}
        </button>
      )}

      {abierto && (
        <div role="dialog" aria-modal="true" aria-label="NICOLE" style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setAbierto(false)} style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.45)" }} />
          <div style={{
            position: "relative", width: "100%", maxWidth: 520, height: "min(80dvh, 680px)", background: "var(--papel, #fff)",
            borderRadius: "18px 18px 0 0", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--linea)", flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif" }}>NICOLE</div>
                <div style={{ fontSize: 12, color: "var(--tinta-apagada)" }}>{cargando ? "Pensando…" : "Tu socia para decidir"}</div>
              </div>
              <Link href="/nicole" style={{ fontSize: 13, fontWeight: 700, color: "var(--azul)", textDecoration: "none" }}>Pantalla completa</Link>
              <button onClick={() => setAbierto(false)} aria-label="Cerrar" style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--linea)", background: "var(--blanco)", cursor: "pointer", fontSize: 18, lineHeight: 1, color: "var(--tinta)" }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px" }}>
              {mensajes.map(m => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.rol === "nicole" ? "flex-start" : "flex-end", marginBottom: 10 }}>
                  <div style={{
                    maxWidth: "86%", padding: "10px 13px", fontSize: 14, lineHeight: 1.5,
                    borderRadius: m.rol === "nicole" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    ...(m.rol === "nicole"
                      ? { background: "var(--blanco)", border: "1px solid var(--linea)", color: "var(--tinta)" }
                      : { background: "var(--tinta)", color: "#fff" }),
                  }}>
                    {m.rol === "nicole"
                      ? <NicoleMessage texto={m.texto} accentColor="var(--azul)" style={{ color: "var(--tinta)" }} />
                      : <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.texto}</div>}
                  </div>
                </div>
              ))}
              {cargando && <div style={{ fontSize: 13, color: "var(--tinta-apagada)", margin: "0 4px 10px" }}>NICOLE está pensando…</div>}
              {mensajes.length === 1 && !cargando && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "6px 0 8px" }}>
                  {sugerencias.map(sg => (
                    <button key={sg} onClick={() => enviar(sg)} style={{ textAlign: "left", padding: "11px 14px", borderRadius: 12, border: "1px solid var(--linea)", background: "var(--blanco)", color: "var(--tinta)", fontSize: 14, cursor: "pointer", minHeight: 44 }}>{sg}</button>
                  ))}
                </div>
              )}
              <div ref={finRef} />
            </div>

            <div style={{ padding: "8px 12px 12px", borderTop: "1px solid var(--linea)", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", border: "1px solid var(--linea)", borderRadius: 14, padding: "8px 8px 8px 12px", background: "var(--blanco)" }}>
                <textarea ref={inputRef} value={input} rows={1} disabled={cargando}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(input); } }}
                  onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px"; }}
                  placeholder="Preguntale algo a NICOLE"
                  style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", fontSize: 15, color: "var(--tinta)", fontFamily: "var(--font-instrument), sans-serif", lineHeight: 1.45, maxHeight: 100 }} />
                <button onClick={() => enviar(input)} aria-label="Enviar" style={{ width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0, cursor: "pointer", background: input.trim() && !cargando ? "var(--tinta)" : "var(--linea)", color: "#fff", fontSize: 18 }}>↑</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
