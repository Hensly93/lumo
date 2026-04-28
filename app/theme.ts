export const darkTheme = {
  bg: "#070B12",
  bgCard: "#111827",
  bgSecondary: "#0D1520",
  border: "#1C2E42",
  borderBright: "#2A4460",
  textPrimary: "#EDF2FF",
  textSecondary: "#7090AA",
  textMuted: "#3A5270",
  accent: "#00D4FF",
  green: "#00E5A0",
  red: "#FF4560",
  yellow: "#FFB800",
  navBg: "rgba(13,21,32,0.97)",
};

export const midnightTheme = {
  bg: "#050D1A",
  bgCard: "#071428",
  bgSecondary: "#071428",
  border: "#0E2340",
  borderBright: "#1E3A5F",
  textPrimary: "#E8F4FF",
  textSecondary: "#2A4A6B",
  textMuted: "#1E3A5F",
  accent: "#38BDF8",
  green: "#34D399",
  red: "#EF4444",
  yellow: "#FBBF24",
  navBg: "rgba(5,13,26,0.97)",
};

export function getTheme() {
  if (typeof window === "undefined") return darkTheme;
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6 ? darkTheme : midnightTheme;
}
