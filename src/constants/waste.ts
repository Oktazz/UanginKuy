export const MATERIAL_GROUPS = [
  { value: "plastic", label: "Plastik" },
  { value: "paper", label: "Kertas" },
  { value: "metal", label: "Logam" },
  { value: "glass", label: "Kaca" },
] as const;

export type MaterialGroupKey = (typeof MATERIAL_GROUPS)[number]["value"];

export const MATERIAL_GROUP_LABELS: Record<string, string> = {
  plastic: "Plastik",
  paper: "Kertas",
  metal: "Logam",
  glass: "Kaca",
};

export const MATERIAL_GROUP_ORDER: Record<string, number> = Object.fromEntries(
  MATERIAL_GROUPS.map((group, index) => [group.value, index])
);

export const normalizeMaterialGroup = (group?: string): MaterialGroupKey | "other" => {
  const g = (group || "").trim().toLowerCase();
  if (g === "plastic" || g === "plastik") return "plastic";
  if (g === "paper" || g === "kertas") return "paper";
  if (g === "metal" || g === "logam") return "metal";
  if (g === "glass" || g === "kaca") return "glass";
  return "other";
};

export const DEFAULT_CARBON_FACTOR = 2.5;

/**
 * Calculates estimated CO2 emissions avoided in kg.
 */
export function calculateCarbonSavings(
  weightKg: number,
  factor?: number | null
): number {
  const validFactor = factor && factor > 0 ? Number(factor) : DEFAULT_CARBON_FACTOR;
  return Number((weightKg * validFactor).toFixed(2));
}
