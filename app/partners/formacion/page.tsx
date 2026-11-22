"use client";
// Formación de LumoBi Partners: 5 lecciones tipo historia (pasan solas, como un video) + una pregunta al final de cada una,
// y la primera misión: mandarle el link a 3 personas. Se puede repetir cuando quiera.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, C, FUENTE, REGLAS_BASE, Reglas, boton, botonSec, pedir, tarjeta, tokenPartner, whatsapp } from "../comun";
import { lecciones, Leccion } from "../lecciones";
import Historias from "../Historias";

const CLAVE = "lumobi_partner_formacion";
type Progreso = { hechas: string[]; mision: number[] };
const leer = (): Progreso => { try { return { hechas: [], mision: [], ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; } catch { return { hechas: [], mision: [] }; } };
const guardar = (p: Progreso) => { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch { /* sin acceso */ } };

type Vista = { tipo: "lista" } | { tipo: "historia"; l: Leccion } | { tipo: "pregunta"; l: Leccion } | { tipo: "mision" };

export default function Formacion() {
  const router = useRouter();
  const [R, setR] = useState<Reglas>(REGLAS_BASE);
  const [prog, setProg] = useState<Progreso>({ hechas: [], mision: [] });
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });
  const [mensaje, setMensaje] = useState("");
  const [elegida, setElegida] = useState<number | null>(null);

  useEffect(() => {
    const t = tokenPartner();
    if (!t) { router.replace("/partners/ingresar"); return; }
    fetch(`${API}/api/partners/reglas`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) setR(j); }).catch(() => {});
    pedir<{ mensajes: { texto: string }[] }>("/api/partners/material", { token: t }).then((m) => setMensaje(m.mensajes[0]?.texto || "")).catch(() => {});
    const p = leer();
    Promise.resolve().then(() => setProg(p));
  }, [router]);

  const L = lecciones(R);
  const siguiente = L.find((l) => !prog.hechas.includes(l.id));
  const todas = !siguiente;

  const terminarLeccion = useCallback((l: Leccion) => {
    const p = { ...prog, hechas: Array.from(new Set([...prog.hechas, l.id])) };
    setProg(p); guardar(p);
    if (p.hechas.length >= L.length) {
      pedir("/api/partners/yo", { metodo: "PATCH", cuerpo: { formacion: true }, token: tokenPartner() }).catch(() => {});
    }
  }, [prog, L.length]);

  // ─── Historia ───
  if (vista.tipo === "historia") {
    return <Historias pantallas={vista.l.pantallas} titulo={vista.l.titulo} textoFin="Ir a la pregunta" onCerrar={() => setVista({ tipo: "lista" })}
      onFin={() => { setElegida(null); setVista({ tipo: "pregunta", l: vista.l }); }} />;
  }

  // ─── Pregunta ───
  if (vista.tipo === "pregunta") {
    const q = vista.l.pregunta;
    const ok = elegida === q.correcta;
    const idx = L.findIndex((x) => x.id === vista.l.id);
    const prox = L[idx + 1];
    return (
      <Marco>
        <div style={{ fontSize: 14, color: C.apagada, fontWeight: 700, marginBottom: 6 }}>Pregunta · {vista.l.titulo}</div>
        <h1 style={{ fontSize: 26, lineHeight: 1.25, margin: "0 0 20px" }}>{q.texto}</h1>
        <div style={{ display: "grid", gap: 12 }}>
          {q.opciones.map((o, k) => {
            const marcada = elegida === k;
            const color = marcada ? (k === q.correcta ? C.ok : C.critico) : C.linea;
            return (
              <button key={o} onClick={() => setElegida(k)} disabled={ok}
                style={{ textAlign: "left", padding: "18px 16px", fontSize: 18, fontWeight: 600, borderRadius: 14, border: `2px solid ${color}`, background: marcada ? (k === q.correcta ? C.okFondo : "#FCEDEC") : C.blanco, color: C.tinta, fontFamily: FUENTE, cursor: ok ? "default" : "pointer" }}>
                {marcada ? (k === q.correcta ? "✅ " : "❌ ") : ""}{o}
              </button>
            );
          })}
        </div>
        {elegida !== null && !ok && (
          <div style={{ ...tarjeta, marginTop: 16, background: "#FCEDEC", borderColor: "#F2C2BE" }}>
            <b>Esa no es.</b> Probá otra. <button onClick={() => setVista({ tipo: "historia", l: vista.l })} style={{ background: "none", border: "none", color: C.azul, fontWeight: 700, fontSize: 15, cursor: "pointer", padding: 0, fontFamily: FUENTE }}>Ver la lección de nuevo</button>
          </div>
        )}
        {ok && (
          <>
            <div style={{ ...tarjeta, marginTop: 16, background: C.okFondo, borderColor: "#B7DFCB" }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>¡Bien! 🎉</div>
              <div style={{ fontSize: 16, color: C.suave, lineHeight: 1.5 }}>{q.porque}</div>
            </div>
            <button style={boton} onClick={() => {
              terminarLeccion(vista.l);
              if (prox && !prog.hechas.includes(prox.id)) setVista({ tipo: "historia", l: prox });
              else if (!prox) setVista({ tipo: "mision" });
              else setVista({ tipo: "lista" });
            }}>{prox ? `Siguiente: ${prox.titulo}` : "Terminar la formación"}</button>
          </>
        )}
      </Marco>
    );
  }

  // ─── Misión ───
  if (vista.tipo === "mision") {
    const hechas = prog.mision.length;
    return (
      <Marco>
        <div style={{ fontSize: 56, textAlign: "center" }}>🏆</div>
        <h1 style={{ fontSize: 26, textAlign: "center", margin: "8px 0 6px" }}>¡Terminaste la formación!</h1>
        <p style={{ textAlign: "center", color: C.suave, fontSize: 17, margin: "0 0 20px", lineHeight: 1.5 }}>Ahora tu primera misión: mandale tu link a <b>3 personas que tengan un comercio</b>.</p>
        <div style={{ ...tarjeta, padding: 14 }}>
          {[0, 1, 2].map((k) => {
            const hecho = prog.mision.includes(k);
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: k ? `1px solid ${C.linea}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: hecho ? C.ok : C.papel, color: hecho ? C.blanco : C.tinta, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>{hecho ? "✓" : k + 1}</div>
                <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{hecho ? "Enviado" : `Comercio ${k + 1}`}</div>
                <a href={mensaje ? whatsapp(mensaje) : undefined} target="_blank" rel="noreferrer"
                  onClick={() => { const p = { ...prog, mision: Array.from(new Set([...prog.mision, k])) }; setProg(p); guardar(p); }}
                  style={{ padding: "12px 14px", borderRadius: 12, background: hecho ? C.papel : "#1FA855", color: hecho ? C.suave : C.blanco, fontWeight: 700, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap" }}>
                  {hecho ? "Mandar otra vez" : "Mandar por WhatsApp"}
                </a>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 14, color: C.apagada, textAlign: "center", margin: "0 0 14px" }}>Se abre WhatsApp con el mensaje y tu link. Elegís el contacto y enviás.</p>
        <button style={hechas >= 3 ? boton : botonSec} onClick={() => router.push("/partners/panel")}>{hechas >= 3 ? "¡Listo! Ir a mi panel" : "Lo hago después, ir a mi panel"}</button>
      </Marco>
    );
  }

  // ─── Lista de lecciones ───
  return (
    <Marco>
      <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>{todas ? "Tu formación ✅" : "Antes de arrancar: tu formación"}</h1>
      <p style={{ color: C.suave, fontSize: 17, margin: "0 0 14px", lineHeight: 1.5 }}>
        {todas ? "Ya la terminaste. Podés volver a ver cualquier lección cuando quieras." : "Son 5 lecciones de 1 minuto. Pasan solas, como un video. Al final de cada una hay una pregunta fácil."}
      </p>
      <div style={{ height: 12, background: C.blanco, border: `1px solid ${C.linea}`, borderRadius: 6, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ width: `${(prog.hechas.length / L.length) * 100}%`, height: "100%", background: C.ok, transition: "width .4s" }} />
      </div>
      {L.map((l, k) => {
        const hecha = prog.hechas.includes(l.id);
        const esLaSiguiente = siguiente && siguiente.id === l.id;
        const bloqueada = !hecha && !esLaSiguiente;
        return (
          <button key={l.id} disabled={bloqueada} onClick={() => setVista({ tipo: "historia", l })}
            style={{ ...tarjeta, width: "100%", display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: bloqueada ? "default" : "pointer", opacity: bloqueada ? 0.5 : 1, border: `2px solid ${esLaSiguiente ? C.azul : C.linea}`, fontFamily: FUENTE, color: C.tinta }}>
            <div style={{ width: 54, height: 54, borderRadius: 27, background: hecha ? C.okFondo : C.papel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{hecha ? "✅" : bloqueada ? "🔒" : l.icono}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.apagada, fontWeight: 600 }}>Lección {k + 1} · {l.minutos}</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{l.titulo}</div>
            </div>
            {esLaSiguiente && <span style={{ background: C.azul, color: C.blanco, borderRadius: 10, padding: "8px 12px", fontWeight: 800, fontSize: 15 }}>Empezar ▶</span>}
          </button>
        );
      })}
      {todas ? (
        <div style={{ display: "grid", gap: 10 }}>
          <button style={boton} onClick={() => setVista({ tipo: "mision" })}>Ver mi primera misión</button>
          <button style={botonSec} onClick={() => router.push("/partners/panel")}>Ir a mi panel</button>
        </div>
      ) : (
        <button style={boton} onClick={() => siguiente && setVista({ tipo: "historia", l: siguiente })}>{prog.hechas.length ? "Seguir donde dejé" : "Empezar la formación"}</button>
      )}
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ background: C.papel, minHeight: "100vh", fontFamily: FUENTE, color: C.tinta }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 16px 60px" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lumobi-logo-light.svg" alt="LumoBi" width={104} height={27} />
          <span style={{ fontWeight: 800, fontSize: 15, color: C.azul }}>Partners</span>
        </header>
        {children}
      </div>
    </main>
  );
}
