// Analitica propia de LumoBi. No guarda textos escritos por el usuario ni montos.
// Respeta "No rastrear" del navegador y se apaga en el dispositivo donde abras el panel /admin/embudo.
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://lumo-backend-1.onrender.com";

type Ev = { t: string; r: string; d?: Record<string, string | number | boolean> };

let cola: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function ls(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function ss(k: string): string | null { try { return sessionStorage.getItem(k); } catch { return null; } }

function apagado(): boolean {
  if (typeof window === "undefined") return true;
  if (ls("lb_ignorar") === "1") return true;
  if ((navigator as Navigator & { doNotTrack?: string }).doNotTrack === "1") return true;
  if (navigator.webdriver) return true;
  if (/bot|crawl|spider|headless|lighthouse|preview/i.test(navigator.userAgent)) return true;
  return false;
}

function azar(): string {
  try { return crypto.randomUUID().replace(/-/g, "").slice(0, 24); } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

function visitante(): string {
  let v = ls("lb_v");
  if (!v) { v = azar(); try { localStorage.setItem("lb_v", v); } catch { /* sin acceso */ } }
  return v;
}

function sesion(): string {
  let s = ss("lb_s");
  if (!s) {
    s = azar();
    try {
      sessionStorage.setItem("lb_s", s);
      const p = new URLSearchParams(window.location.search);
      const utm = [p.get("utm_source"), p.get("utm_medium"), p.get("utm_campaign"), p.get("utm_content")].filter(Boolean).join("/");
      let ref = "";
      try { if (document.referrer) { const h = new URL(document.referrer).hostname; if (h !== window.location.hostname) ref = h; } } catch { /* sin referrer */ }
      sessionStorage.setItem("lb_o", JSON.stringify({ utm: utm.slice(0, 120), ref: ref.slice(0, 80) }));
    } catch { /* sin acceso */ }
  }
  return s;
}

export function normRuta(p: string): string {
  const base = (p || "/").split("?")[0].split("#")[0];
  return base.split("/").map((seg) => (seg && (/^\d+$/.test(seg) || /^[0-9a-f-]{16,}$/i.test(seg) || seg.length >= 20) ? ":id" : seg)).join("/") || "/";
}

export function normApi(url: string): string {
  try { return normRuta(new URL(url).pathname); } catch { return normRuta(url); }
}

function enviar(final: boolean) {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!cola.length) return;
  const lote = cola.splice(0, 25);
  let usuario: { id?: unknown; negocio_id?: unknown } = {};
  try { usuario = JSON.parse(ls("lumo_usuario") || "{}") || {}; } catch { /* sin sesion */ }
  let o: { utm?: string; ref?: string } = {};
  try { o = JSON.parse(ss("lb_o") || "{}") || {}; } catch { /* sin origen */ }
  const body = JSON.stringify({
    v: visitante(), s: sesion(),
    u: usuario.id != null ? String(usuario.id) : undefined,
    n: usuario.negocio_id != null ? String(usuario.negocio_id) : undefined,
    disp: window.matchMedia && window.matchMedia("(display-mode: standalone)").matches ? "pwa" : window.innerWidth < 760 ? "m" : "d",
    ref: o.ref, utm: o.utm, e: lote,
  });
  try {
    fetch(`${API}/api/analitica/evento`, { method: "POST", body, headers: { "Content-Type": "text/plain" }, keepalive: final, mode: "cors", credentials: "omit" }).catch(() => {});
  } catch { /* se pierde el lote, no pasa nada */ }
  if (cola.length) enviar(final);
}

// Eventos que se mandan a PostHog (el resto queda solo en tu panel propio)
const POSTHOG_EVENTOS: Record<string, string> = {
  pantalla: "$pageview", cta_landing: "cta_landing", scroll: "scroll_landing",
  registro_envio: "registro_envio", registro_ok: "registro_ok", registro_error: "registro_error",
  login_ok: "login_ok", login_error: "login_error",
};

export function track(t: string, r?: string, d?: Ev["d"]) {
  if (apagado()) return;
  const ruta = normRuta(r ?? window.location.pathname);
  if (ruta.startsWith("/admin")) return;
  sesion();
  // Pixel de Meta (solo si esta cargado): interesado = toco el boton de la landing, registro = cuenta creada
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (fbq) {
      if (t === "cta_landing") fbq("track", "Lead");
      else if (t === "registro_ok") fbq("track", "CompleteRegistration");
    }
  } catch { /* el Pixel no debe romper nada */ }
  // PostHog: solo nombres de eventos y la ruta. Nunca textos escritos ni montos.
  try {
    const nombre = POSTHOG_EVENTOS[t];
    if (nombre) {
      const w = window as unknown as { posthog?: { capture: (n: string, p?: Record<string, unknown>) => void }; __phq?: [string, Record<string, unknown>][] };
      const props: Record<string, unknown> = { ruta };
      if (t === "scroll" && d && typeof d.pct === "number") props.pct = d.pct;
      if ((t === "registro_error" || t === "login_error") && d && typeof d.st === "number") props.estado = d.st;
      if (w.posthog && typeof w.posthog.capture === "function") w.posthog.capture(nombre, props);
      else { (w.__phq = w.__phq || []).push([nombre, props]); if (w.__phq.length > 50) w.__phq.shift(); }
    }
  } catch { /* PostHog no debe romper nada */ }
  cola.push({ t, r: ruta, d });
  if (cola.length >= 10) enviar(false);
  else if (!timer) timer = setTimeout(() => enviar(false), 4000);
}

export function vaciar() { enviar(true); }
