"use client";
import React from "react";
import NicoleStarIcon from "./NicoleStarIcon";

// ── HeroCard ──────────────────────────────────────────────────────
type HeroCardProps = {
  label: string;
  value: string;
  sub?: string;
  tag?: string;
  gradient?: "blue" | "green";
};
export function HeroCard({ label, value, sub, tag, gradient = "blue" }: HeroCardProps) {
  return (
    <div style={{
      margin: "12px 12px 10px",
      background: gradient === "green"
        ? "linear-gradient(135deg,#00C2FF,#00C48C)"
        : "linear-gradient(135deg,#007AFF,#00C2FF)",
      borderRadius: 20, padding: 20,
      position: "relative", overflow: "hidden",
      boxShadow: "0 8px 28px #007AFF25",
    }}>
      <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, background:"radial-gradient(circle,#ffffff20,transparent 65%)", borderRadius:"50%" }} />
      <div style={{ fontSize:9, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:"#fff", lineHeight:1, marginBottom:4, fontVariantNumeric:"tabular-nums" }}>{value}</div>
      {(sub || tag) && (
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", display:"flex", alignItems:"center", gap:6 }}>
          {sub}
          {tag && <span style={{ background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:700, fontSize:11, padding:"1px 7px", borderRadius:8 }}>{tag}</span>}
        </div>
      )}
    </div>
  );
}

// ── StatRow + StatCard ────────────────────────────────────────────
const colorMap = { blue:"var(--cyan)", green:"var(--emerald)", yellow:"var(--yellow)", red:"var(--red)" } as const;
type StatColor = keyof typeof colorMap;

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, margin:"0 12px 10px" }}>
      {children}
    </div>
  );
}
export function StatCard({ label, value, color = "blue" }: { label: string; value: string; color?: StatColor }) {
  return (
    <div style={{ background:"var(--card2)", borderRadius:14, padding:"12px 8px", border:"1px solid var(--border)", textAlign:"center", boxShadow:"var(--sh)" }}>
      <div style={{ fontSize:8, fontWeight:600, letterSpacing:1, textTransform:"uppercase", color:"var(--muted)", marginBottom:4, lineHeight:1.3 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:colorMap[color] }}>{value}</div>
    </div>
  );
}

// ── AlertCard ─────────────────────────────────────────────────────
type AlertVariant = "ok" | "warn" | "crit";
type AlertCardProps = {
  variant: AlertVariant;
  tag: string;
  title: string;
  desc?: string;
  amount?: string;
  positive?: boolean;
  time?: string;
  actions?: { primary: string; secondary: string };
};
const alertBg   = { ok:"#F0FFF8", warn:"#FFFBF0", crit:"#FFF5F5" };
const alertBdr  = { ok:"#00C48C22", warn:"#F59E0B22", crit:"#EF444422" };
const tagBg     = { ok:"#00C48C15", warn:"#F59E0B15", crit:"#EF444415" };
const tagColor  = { ok:"var(--emerald)", warn:"var(--yellow)", crit:"var(--red)" };

export function AlertCard({ variant, tag, title, desc, amount, positive, time, actions }: AlertCardProps) {
  return (
    <div style={{ margin:"0 12px 8px", borderRadius:14, padding:14, border:`1px solid ${alertBdr[variant]}`, background:alertBg[variant], boxShadow:"var(--sh)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:8, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", padding:"2px 7px", borderRadius:20, background:tagBg[variant], color:tagColor[variant] }}>{tag}</span>
        {time && <span style={{ fontSize:10, color:"var(--muted)" }}>{time}</span>}
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{title}</div>
      {desc && <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.45 }}>{desc}</div>}
      {amount && (
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:positive ? "var(--emerald)" : "var(--red)", marginTop:6 }}>{amount}</div>
      )}
      {actions && (
        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          <div style={{ flex:1, background:"linear-gradient(135deg,#007AFF,#00C2FF)", color:"#fff", padding:7, borderRadius:10, fontSize:10, fontWeight:700, textAlign:"center", cursor:"pointer" }}>{actions.primary}</div>
          <div style={{ flex:1, background:"var(--card2)", color:"var(--muted)", padding:7, borderRadius:10, fontSize:10, fontWeight:600, textAlign:"center", cursor:"pointer", border:"1px solid var(--border)" }}>{actions.secondary}</div>
        </div>
      )}
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:9, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--muted)", padding:"0 12px", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ color:"var(--cyan)", fontFamily:"'Syne',sans-serif", fontWeight:800 }}>//</span>
      {children}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────
export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding:"10px 16px 12px" }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"var(--text)" }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{sub}</div>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height:1, background:"var(--border)", margin:"6px 12px" }} />;
}

// ── FilterChips ───────────────────────────────────────────────────
type Chip = { label: string; active?: boolean; onClick?: () => void };
export function FilterChips({ chips }: { chips: Chip[] }) {
  return (
    <div style={{ display:"flex", gap:6, margin:"0 12px 12px", overflowX:"auto" }}>
      {chips.map((c, i) => (
        <div
          key={i}
          onClick={c.onClick}
          style={{
            background: c.active ? "linear-gradient(135deg,#007AFF,#00C2FF)" : "var(--card2)",
            color: c.active ? "#fff" : "var(--muted)",
            padding:"5px 12px", borderRadius:20, fontSize:10, fontWeight: c.active ? 700 : 600,
            whiteSpace:"nowrap", cursor:"pointer",
            border: c.active ? "none" : "1px solid var(--border)",
            boxShadow: c.active ? "0 3px 8px #007AFF25" : "none",
          }}
        >{c.label}</div>
      ))}
    </div>
  );
}

// ── EmployeeCard ──────────────────────────────────────────────────
const eavStyles = {
  a: { background:"linear-gradient(135deg,#007AFF15,#007AFF08)", color:"var(--cyan)", border:"1px solid #007AFF20" },
  b: { background:"linear-gradient(135deg,#00C48C15,#00C48C08)", color:"var(--emerald)", border:"1px solid #00C48C20" },
  c: { background:"linear-gradient(135deg,#F59E0B15,#F59E0B08)", color:"var(--yellow)", border:"1px solid #F59E0B20" },
} as const;
type EmpVariant = keyof typeof eavStyles;

export function EmployeeCard({ initials, colorVariant = "a", name, sub, amount, badge }: {
  initials: string; colorVariant?: EmpVariant;
  name: string; sub: string; amount: string;
  badge?: { text: string; variant: "ok" | "warn" };
}) {
  return (
    <div style={{ margin:"0 12px 7px", background:"var(--card)", borderRadius:14, padding:"12px 14px", border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, boxShadow:"var(--sh)" }}>
      <div style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, flexShrink:0, ...eavStyles[colorVariant] }}>
        {initials}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:1 }}>{name}</div>
        <div style={{ fontSize:10, color:"var(--muted)" }}>{sub}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:"var(--text)", fontVariantNumeric:"tabular-nums" }}>{amount}</div>
        {badge && (
          <span style={{ fontSize:9, padding:"2px 7px", borderRadius:20, fontWeight:600, display:"inline-block", marginTop:2, background:badge.variant==="ok"?"#00C48C12":"#F59E0B12", color:badge.variant==="ok"?"var(--emerald)":"var(--yellow)" }}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", onClick }: {
  children: React.ReactNode;
  variant?: "primary" | "soft";
  onClick?: () => void;
}) {
  const p = variant === "primary";
  return (
    <button onClick={onClick} style={{
      display:"block", width:"calc(100% - 24px)", margin:"8px 12px", padding:14,
      borderRadius:14,
      background: p ? "linear-gradient(135deg,#007AFF,#00C2FF)" : "linear-gradient(135deg,#007AFF12,#00C2FF08)",
      color: p ? "#fff" : "var(--cyan)",
      textAlign:"center", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700,
      boxShadow: p ? "0 6px 20px #007AFF25" : "none",
      border: p ? "none" : "1px solid #007AFF15",
      cursor:"pointer",
    }}>
      {children}
    </button>
  );
}

// ── Toggle ────────────────────────────────────────────────────────
export function Toggle({ label, sub, value, onChange }: {
  label: string; sub?: string;
  value: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"0 12px 7px", padding:"12px 14px", background:"var(--card)", borderRadius:14, border:"1px solid var(--border)", boxShadow:"var(--sh)" }}>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:"var(--text2)" }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange?.(!value)} style={{ width:36, height:20, borderRadius:10, background:value?"linear-gradient(135deg,#007AFF,#00C2FF)":"#D8E4F5", position:"relative", flexShrink:0, cursor:"pointer", transition:"background 0.2s" }}>
        <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:value?18:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
}

// ── FieldCard ─────────────────────────────────────────────────────
export function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ margin:"0 12px 8px", background:"var(--card2)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 14px", boxShadow:"var(--sh)" }}>
      <div style={{ fontSize:9, fontWeight:600, letterSpacing:1, textTransform:"uppercase", color:"var(--muted)", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{value}</div>
    </div>
  );
}

// ── PlanCard ──────────────────────────────────────────────────────
export function PlanCard({ title, sub, badge }: { title: string; sub: string; badge: string }) {
  return (
    <div style={{ margin:"0 12px 8px", background:"linear-gradient(135deg,#007AFF,#00C2FF)", borderRadius:16, padding:16, position:"relative", overflow:"hidden", boxShadow:"0 8px 24px #007AFF20" }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, background:"radial-gradient(circle,#ffffff18,transparent 65%)", borderRadius:"50%" }} />
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#fff", marginBottom:2 }}>{title}</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)" }}>{sub}</div>
      <div style={{ display:"inline-block", background:"rgba(255,255,255,0.25)", color:"#fff", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", padding:"3px 9px", borderRadius:20, marginTop:8 }}>{badge}</div>
    </div>
  );
}

// ── ChartCard ─────────────────────────────────────────────────────
type BarData = { day: string; height: number; variant?: "normal" | "active" | "high" };
export function ChartCard({ title, period, bars }: { title: string; period: string; bars: BarData[] }) {
  return (
    <div style={{ margin:"0 12px 10px", background:"var(--card)", borderRadius:16, padding:14, border:"1px solid var(--border)", boxShadow:"var(--sh)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"var(--text)" }}>{title}</div>
        <div style={{ fontSize:9, color:"var(--muted)", background:"var(--bg2)", padding:"3px 8px", borderRadius:12, border:"1px solid var(--border)" }}>{period}</div>
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:50 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, height:"100%", justifyContent:"flex-end" }}>
            <div style={{
              width:"100%", height:`${b.height}%`, borderRadius:"3px 3px 0 0",
              background: b.variant==="active" ? "linear-gradient(135deg,#007AFF,#00C2FF)" : b.variant==="high" ? "linear-gradient(180deg,#007AFF50,#007AFF25)" : "#D8E4F5",
              boxShadow: b.variant==="active" ? "0 3px 8px #007AFF25" : "none",
            }} />
            <div style={{ fontSize:8, color:"var(--muted)", fontWeight:600 }}>{b.day}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PredCard ──────────────────────────────────────────────────────
type PredRow = { label: string; value: string; color?: "green" | "yellow" | "red" };
const predColorMap = { green:"var(--emerald)", yellow:"var(--yellow)", red:"var(--red)" } as const;

export function PredCard({ title, rows, confidence, confidenceLabel, warningBadge }: {
  title: string; rows: PredRow[];
  confidence?: number; confidenceLabel?: string; warningBadge?: string;
}) {
  const barBg = warningBadge ? "linear-gradient(90deg,#F59E0B,#EF4444)" : "linear-gradient(135deg,#007AFF,#00C2FF)";
  return (
    <div style={{ margin:"0 12px 8px", background:"var(--card)", borderRadius:14, padding:14, border:"1px solid var(--border)", boxShadow:"var(--sh)" }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:8 }}>{title}</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ fontSize:11, color:"var(--muted)" }}>{r.label}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:r.color ? predColorMap[r.color] : "var(--text)" }}>{r.value}</div>
        </div>
      ))}
      {confidence !== undefined && (
        <>
          <div style={{ height:6, background:"var(--bg2)", borderRadius:3, marginTop:4, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:3, background:barBg, width:`${confidence}%` }} />
          </div>
          {warningBadge ? (
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#F59E0B12", border:"1px solid #F59E0B20", padding:"3px 9px", borderRadius:20, marginTop:8 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"var(--yellow)" }}>{warningBadge}</div>
            </div>
          ) : (
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"linear-gradient(135deg,#007AFF12,#00C2FF08)", border:"1px solid #007AFF15", padding:"3px 9px", borderRadius:20, marginTop:8 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"var(--cyan)" }}>{confidenceLabel ?? `Confianza ${confidence}%`}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── RedCard ───────────────────────────────────────────────────────
export function RedCard({ name, loc, value, sectorValue, progress, progressColor = "blue", comparison, comparisonColor = "cyan" }: {
  name: string; loc: string; value: string; sectorValue: string;
  progress: number; progressColor?: "blue" | "yellow-red";
  comparison?: string; comparisonColor?: "cyan" | "yellow";
}) {
  const barBg = progressColor === "yellow-red" ? "linear-gradient(90deg,#F59E0B,#EF4444)" : "linear-gradient(135deg,#007AFF,#00C2FF)";
  const valColor = progressColor === "yellow-red" ? "var(--yellow)" : "var(--cyan)";
  const compColor = comparisonColor === "yellow" ? "var(--yellow)" : "var(--cyan)";
  return (
    <div style={{ margin:"0 12px 8px", background:"var(--card)", borderRadius:14, padding:14, border:"1px solid var(--border)", boxShadow:"var(--sh)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"var(--text)" }}>{name}</div>
          <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>{loc}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:valColor }}>{value}</div>
          <div style={{ fontSize:9, color:"var(--muted)" }}>{sectorValue}</div>
        </div>
      </div>
      <div style={{ height:5, background:"var(--bg2)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:3, background:barBg, width:`${progress}%` }} />
      </div>
      {comparison && (
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:9, color:"var(--muted)" }}>
          <span>Sector</span>
          <span style={{ color:compColor, fontWeight:700 }}>{comparison}</span>
        </div>
      )}
    </div>
  );
}

// ── NicoleHero ────────────────────────────────────────────────────
export function NicoleHero({ sub = "analizando tu negocio...", state = "idle" }: { sub?: string; state?: "idle" | "thinking" }) {
  return (
    <div style={{ margin:12, background:"linear-gradient(135deg,#007AFF,#00C2FF)", borderRadius:20, padding:18, display:"flex", alignItems:"center", gap:14, position:"relative", overflow:"hidden", boxShadow:"0 8px 28px #007AFF25" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,#ffffff18,transparent 70%)" }} />
      <div style={{ position:"relative" }}>
        <NicoleStarIcon size={36} state={state} />
      </div>
      <div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", lineHeight:1, position:"relative" }}>nicole</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", letterSpacing:1, marginTop:2, position:"relative" }}>{sub}</div>
      </div>
    </div>
  );
}

// ── ChatBubble ────────────────────────────────────────────────────
export function ChatBubble({ role, children }: { role: "nicole" | "user"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div style={{ padding:"0 12px 7px", display:"flex", justifyContent:isUser ? "flex-end" : "flex-start" }}>
      <div style={{
        padding:"12px 14px", borderRadius:14, fontSize:12, lineHeight:1.5, maxWidth:"82%",
        ...(isUser
          ? { background:"linear-gradient(135deg,#007AFF,#00C2FF)", color:"#fff", borderBottomRightRadius:3, boxShadow:"0 4px 14px #007AFF20" }
          : { background:"var(--card)", border:"1px solid var(--border)", color:"var(--text)", borderBottomLeftRadius:3, boxShadow:"var(--sh)" }
        ),
      }}>
        {children}
      </div>
    </div>
  );
}

// ── ChatInput ─────────────────────────────────────────────────────
export function ChatInput({ placeholder = "Preguntale algo a NICOLE...", onSend }: { placeholder?: string; onSend?: (v: string) => void }) {
  const [v, setV] = React.useState("");
  return (
    <div style={{ margin:"8px 12px 0", background:"var(--card2)", border:"1px solid var(--border)", borderRadius:14, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, boxShadow:"var(--sh)" }}>
      <input
        value={v}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && v.trim()) { onSend?.(v); setV(""); } }}
        placeholder={placeholder}
        style={{ flex:1, fontSize:12, color:"var(--muted)", background:"none", border:"none", outline:"none" }}
      />
      <button
        onClick={() => { if (v.trim()) { onSend?.(v); setV(""); } }}
        style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,#007AFF,#00C2FF)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 10px #007AFF25", border:"none", cursor:"pointer" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" />
        </svg>
      </button>
    </div>
  );
}
