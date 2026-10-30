// Único punto de entrada del logo de LumoBi. No dibujes el logo en ningún otro lado.
// Archivos fuente: /public/brand/ (ver BRAND.md)
type Props = {
  type?: "logo" | "icon"; // logo = ícono + wordmark · icon = solo el ícono
  variant?: "light" | "dark"; // light = para fondos claros · dark = para fondos oscuros
  height?: number;
  className?: string;
};

export default function Logo({ type = "logo", variant = "light", height = 32, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/lumobi-${type}-${variant}.svg`}
      alt="LumoBi"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
    />
  );
}
