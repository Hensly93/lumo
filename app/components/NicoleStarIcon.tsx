"use client";
import { useId } from "react";

// SVG exacto del mockup — viewBox 80×80, animaciones via CSS globals
export default function NicoleStarIcon({
  size = 20,
  state = "idle",
}: {
  size?: number;
  state?: "idle" | "thinking";
}) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  const hG = `nH${raw}`;
  const dG = `nG${raw}`;
  const fB = `nF${raw}`;
  const fS = `nS${raw}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={state === "thinking" ? "nic-icon-think" : "nic-icon-idle"}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={hG} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#007AFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id={dG} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#007AFF" />
          <stop offset="100%" stopColor="#00C2FF" />
        </linearGradient>
        <filter id={fB}>
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={fS}>
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Halo */}
      <ellipse className="nic-halo" cx="40" cy="40" rx="30" ry="30" fill={`url(#${hG})`} />

      {/* Líneas verticales */}
      <line className="nic-line-v" x1="16" y1="12" x2="16" y2="68" stroke="#007AFF" strokeWidth="1.2" strokeOpacity="0.22" strokeLinecap="round" />
      <line className="nic-line-v" x1="64" y1="12" x2="64" y2="68" stroke="#007AFF" strokeWidth="1.2" strokeOpacity="0.22" strokeLinecap="round" />

      {/* Diagonal principal */}
      <line className="nic-line-diag" x1="16" y1="12" x2="64" y2="68" stroke={`url(#${dG})`} strokeWidth="2.5" strokeLinecap="round" filter={`url(#${fB})`} />

      {/* Sub-diagonales */}
      <line className="nic-line-sub" x1="16" y1="12" x2="30" y2="30" stroke="#00C2FF" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <line className="nic-line-sub" x1="30" y1="30" x2="50" y2="52" stroke="#00C2FF" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <line className="nic-line-sub" x1="50" y1="52" x2="64" y2="68" stroke="#00C2FF" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />

      {/* Estrellas — columna izquierda */}
      <circle className="nic-s1" cx="16" cy="12" r="5.5" fill={`url(#${dG})`}                   filter={`url(#${fB})`} />
      <circle className="nic-s2" cx="16" cy="24" r="3.5" fill="#007AFF" fillOpacity="0.75"        filter={`url(#${fS})`} />
      <circle className="nic-s3" cx="16" cy="40" r="3"   fill="#007AFF" fillOpacity="0.6" />
      <circle className="nic-s4" cx="16" cy="56" r="3.5" fill="#007AFF" fillOpacity="0.7"         filter={`url(#${fS})`} />
      <circle className="nic-s5" cx="16" cy="68" r="5"   fill={`url(#${dG})`}                   filter={`url(#${fB})`} />

      {/* Estrellas — columna derecha */}
      <circle className="nic-s6"  cx="64" cy="12" r="4.5" fill={`url(#${dG})`} fillOpacity="0.85" filter={`url(#${fS})`} />
      <circle className="nic-s7"  cx="64" cy="24" r="3"   fill="#007AFF" fillOpacity="0.6" />
      <circle className="nic-s8"  cx="64" cy="40" r="3.5" fill="#007AFF" fillOpacity="0.7"        filter={`url(#${fS})`} />
      <circle className="nic-s9"  cx="64" cy="56" r="3"   fill="#007AFF" fillOpacity="0.6" />
      <circle className="nic-s10" cx="64" cy="68" r="5.5" fill={`url(#${dG})`}                   filter={`url(#${fB})`} />

      {/* Nodos centrales */}
      <circle className="nic-central" cx="30" cy="30" r="8" fill={`url(#${dG})`} filter={`url(#${fB})`} />
      <circle cx="28"   cy="28"   r="2.5" fill="white" fillOpacity="0.45" />
      <circle className="nic-central" cx="50" cy="52" r="6" fill={`url(#${dG})`} filter={`url(#${fB})`} />
      <circle cx="48.5" cy="50.5" r="2"   fill="white" fillOpacity="0.4" />
    </svg>
  );
}
