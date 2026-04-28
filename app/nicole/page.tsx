"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import NicoleMessage from "../components/NicoleMessage";
import { NicoleHero } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Mensaje = { id: string; rol: "usuario" | "nicole"; texto: string; ts: number };

const SUGERENCIAS = [
  "¿Cómo estuvo la semana?",
  "¿Cuánto voy a vender mañana?",
  "¿Tengo que hablar con algún empleado?",
];

function uid() { return Math.random().toString(36).slice(2); }

function Burbuja({ m }: { m: Mensaje }) {
  const esNicole = m.rol === "nicole";
  return (
    <div style={{ display: "flex", justifyContent: esNicole ? "flex-start" : "flex-end", marginBottom: 10, padding: "0 4px" }}>
      <div style={{
        maxWidth: "82%",
        padding: "11px 14px",
        borderRadius: esNicole ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
        fontSize: 13, lineHeight: 1.55,
        ...(esNicole
          ? { background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", boxShadow: "var(--sh)" }
          : { background: "linear-gradient(135deg,#007AFF,#00C2FF)", color: "#fff", boxShadow: "0 4px 14px #007AFF20" }
        ),
      }}>
        {esNicole ? (
          <NicoleMessage texto={m.texto} accentColor="var(--cyan)" style={{ color: "var(--text)" }} />
        ) : (
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.texto}</div>
        )}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10, padding: "0 4px" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "4px 14px 14px 14px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center", boxShadow: "var(--sh)" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", opacity: 0.4, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

export default function Nicole() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = localStorage.getItem("lumo_token");
    if (!t) { router.replace("/login"); return; }
    setToken(t);
    setMensajes([{
      id: uid(), rol: "nicole",
      texto: "Hola. Soy NICOLE, la inteligencia de Lumo. Preguntame lo que quieras sobre tu negocio — ventas, turnos, brechas, predicciones. ¿En qué te ayudo hoy?",
      ts: Date.now(),
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || cargando || !token) return;
    const msgUsuario: Mensaje = { id: uid(), rol: "usuario", texto: t, ts: Date.now() };
    setMensajes(prev => [...prev, msgUsuario]);
    setInput("");
    setCargando(true);
    const historial = mensajes.map(m => ({ rol: m.rol, texto: m.texto }));
    try {
      const resp = await fetch(`${API}/api/nicole/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mensaje: t, historial }),
      });
      const data = await resp.json();
      setMensajes(prev => [...prev, { id: uid(), rol: "nicole", texto: data.respuesta || "No pude responder. Intentá de nuevo.", ts: Date.now() }]);
    } catch {
      setMensajes(prev => [...prev, { id: uid(), rol: "nicole", texto: "Hubo un problema de conexión. Verificá tu internet e intentá de nuevo.", ts: Date.now() }]);
    } finally {
      setCargando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(input); }
  }

  return (
    <main style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: 80 }}>

      <NicoleHero
        sub={cargando ? "pensando..." : "tu socia de confianza"}
        state={cargando ? "thinking" : "idle"}
      />

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {mensajes.map(m => <Burbuja key={m.id} m={m} />)}
        {cargando && <Typing />}

        {mensajes.length === 1 && !cargando && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>// preguntás algo como</div>
            {SUGERENCIAS.map(s => (
              <button key={s} onClick={() => enviar(s)} style={{
                background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
                padding: "10px 14px", color: "var(--text2)", fontSize: 13, textAlign: "left",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "var(--sh)",
              }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px 14px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 14, padding: "10px 14px", boxShadow: "var(--sh)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Preguntale algo a NICOLE..."
            rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, resize: "none", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}
            onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px"; }}
            disabled={cargando}
          />
          <button
            onClick={() => enviar(input)}
            disabled={!input.trim() || cargando}
            style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0, border: "none", cursor: input.trim() && !cargando ? "pointer" : "not-allowed",
              background: input.trim() && !cargando ? "linear-gradient(135deg,#007AFF,#00C2FF)" : "var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: input.trim() && !cargando ? "0 4px 10px #007AFF25" : "none",
              transition: "background 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", marginTop: 6 }}>
          Enter para enviar · Shift+Enter nueva línea
        </div>
      </div>

      <Nav />
    </main>
  );
}
