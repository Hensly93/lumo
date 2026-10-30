import Logo from "./Logo";

export default function LumoWordmark({ width = 140 }: { width?: number }) {
  const height = Math.round(width * (28 / 140));
  return <Logo height={height} variant="light" />;
}
