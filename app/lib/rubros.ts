// rubros.ts — UNA sola lista de rubros para todo el frontend (18/11/2026).
// Antes el registro, Ajustes y el onboarding tenían cada uno la suya y no coincidían (por ejemplo,
// el onboarding todavía ofrecía Panadería y juntaba "indumentaria y otros" en un solo botón).
// Los ids tienen que ser los mismos que TIPOS_VALIDOS de benchmarks_sector.js en el backend.

export type Rubro = { id: string; nombre: string; icono: string };

// Lo que se ofrece hoy al elegir rubro (foco: retail en general)
export const RUBROS: Rubro[] = [
  { id: "kiosko", nombre: "Kiosco", icono: "🍫" },
  { id: "almacen", nombre: "Almacén", icono: "🥫" },
  { id: "supermercado", nombre: "Supermercado", icono: "🛒" },
  { id: "retail_indumentaria", nombre: "Ropa y calzado", icono: "👕" },
  { id: "retail_electronica", nombre: "Electrónica y tecnología", icono: "🔌" },
  { id: "retail_hogar", nombre: "Hogar y bazar", icono: "🏠" },
  { id: "farmacia", nombre: "Farmacia", icono: "💊" },
  { id: "retail_otro", nombre: "Otro comercio", icono: "🛍️" },
];

// Rubros de cuentas que ya existían: no se ofrecen a cuentas nuevas, pero se muestran bien si la cuenta ya lo tiene
const ANTERIORES: Record<string, string> = {
  retail: "Retail (general)",
  cafeteria: "Cafetería",
  cafeteria_bar: "Cafetería / bar",
  restaurante: "Restaurante",
  parrilla: "Parrilla",
  panaderia: "Panadería",
};

export function nombreRubro(id: string | null | undefined): string {
  if (!id) return "";
  return RUBROS.find((r) => r.id === id)?.nombre ?? ANTERIORES[id] ?? id;
}

// Opciones para un selector: los rubros de hoy y, si la cuenta tiene uno anterior, ese también (para no perderlo al guardar)
export function opcionesRubro(actual?: string | null): { id: string; nombre: string }[] {
  const base = RUBROS.map(({ id, nombre }) => ({ id, nombre }));
  if (actual && !base.some((r) => r.id === actual)) base.push({ id: actual, nombre: nombreRubro(actual) });
  return base;
}
