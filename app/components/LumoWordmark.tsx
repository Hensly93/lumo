export default function LumoWordmark({ width = 140 }: { width?: number }) {
  const height = Math.round(width * (44 / 140));
  return (
    <svg width={width} height={height} viewBox="0 0 140 44" fill="none" aria-label="LUMO">
      <defs>
        <linearGradient id="lw-icon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="100%" stopColor="#00C2FF" />
        </linearGradient>
        <radialGradient id="lw-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#007AFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="lw-glow">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="lw-text" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="100%" stopColor="#00A0CC" />
        </linearGradient>
        <linearGradient id="lw-beam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="transparent" />
          <stop offset="20%"  stopColor="#007AFF" stopOpacity="0.5" />
          <stop offset="70%"  stopColor="#00C2FF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Icon */}
      <ellipse cx="18" cy="22" rx="20" ry="20" fill="url(#lw-halo)" />
      <path d="M2 22 C7 11 29 11 34 22 C29 33 7 33 2 22Z" stroke="url(#lw-icon)" strokeWidth="1.8" fill="none" filter="url(#lw-glow)" />
      <circle cx="18" cy="22" r="6"   fill="none" stroke="url(#lw-icon)" strokeWidth="1.5" filter="url(#lw-glow)" />
      <circle cx="18" cy="22" r="3"   fill="url(#lw-icon)" filter="url(#lw-glow)" />
      <circle cx="16.5" cy="20.5" r="1.2" fill="white" fillOpacity="0.65" />
      <line x1="18" y1="19" x2="18" y2="6"  stroke="#007AFF" strokeWidth="1.3" strokeOpacity="0.35" strokeLinecap="round" />
      <line x1="18" y1="19" x2="25" y2="9"  stroke="#007AFF" strokeWidth="0.9" strokeOpacity="0.22" strokeLinecap="round" />
      <line x1="18" y1="19" x2="11" y2="9"  stroke="#007AFF" strokeWidth="0.9" strokeOpacity="0.22" strokeLinecap="round" />

      {/* Wordmark */}
      <text x="42" y="30" fontFamily="Syne, sans-serif" fontWeight="800" fontSize="28" fill="url(#lw-text)" letterSpacing="-1">lumo</text>
      <rect x="42" y="36" width="96" height="2" rx="1" fill="url(#lw-beam)" />
    </svg>
  );
}
