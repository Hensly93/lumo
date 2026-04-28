// Ícono micro del ojo LUMO — viewBox 44×44, renderiza a 20px en header
// SVG exacto del mockup oficial (lumo-app-completa.html)
export default function LumoEyeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="eG-lu" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#007AFF" />
          <stop offset="100%" stopColor="#00C2FF" />
        </linearGradient>
        <filter id="eF-lu">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer eye shape */}
      <path
        d="M2 22 C8 11 36 11 42 22 C36 33 8 33 2 22Z"
        stroke="url(#eG-lu)" strokeWidth="1.8" fill="none" filter="url(#eF-lu)"
      />
      {/* Iris */}
      <circle cx="22" cy="22" r="5.5" fill="none" stroke="url(#eG-lu)" strokeWidth="1.4" filter="url(#eF-lu)" />
      {/* Pupil */}
      <circle cx="22" cy="22" r="2.8" fill="url(#eG-lu)" filter="url(#eF-lu)" />
      {/* Highlight */}
      <circle cx="20.8" cy="20.8" r="1" fill="white" fillOpacity="0.65" />
      {/* Rayo central — espíritu LUMENS */}
      <line x1="22" y1="19.2" x2="22" y2="8" stroke="#007AFF" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
    </svg>
  );
}
