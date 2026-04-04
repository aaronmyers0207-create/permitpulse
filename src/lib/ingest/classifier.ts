const HVAC_KEYWORDS = [
  "hvac", "air conditioning", "a/c", "ac unit", "mechanical",
  "heat pump", "furnace", "duct", "ductwork", "condenser",
  "air handler", "split system", "mini split", "package unit",
  "changeout", "change-out", "change out", "cooling", "heating"
];

const CHANGEOUT_KEYWORDS = ["changeout", "change-out", "change out", "replacement", "replace"];
const NEW_CONSTRUCTION_KEYWORDS = ["new construction", "new residential", "new single", "new dwelling", "new home"];
const RENOVATION_KEYWORDS = ["renovation", "addition", "remodel", "alteration", "improvement"];

export function classifyPermit(permitType: string, description: string): string {
  const text = `${permitType} ${description}`.toLowerCase();
  const isHVAC = HVAC_KEYWORDS.some((kw) => text.includes(kw));
  const isNewConstruction = NEW_CONSTRUCTION_KEYWORDS.some((kw) => text.includes(kw));
  const isChangeout = CHANGEOUT_KEYWORDS.some((kw) => text.includes(kw));
  const isRenovation = RENOVATION_KEYWORDS.some((kw) => text.includes(kw));

  if (isChangeout && isHVAC) return "hvac_changeout";
  if (isNewConstruction && isHVAC) return "hvac_new_install";
  if (isNewConstruction) return "new_construction";
  if (isRenovation && isHVAC) return "renovation_mechanical";
  if (isHVAC) return "general_mechanical";
  if (isNewConstruction) return "new_construction";
  return "other";
}

export function estimateValue(category: string): number {
  const ranges: Record<string, [number, number]> = {
    hvac_changeout: [6000, 12000],
    hvac_new_install: [12000, 18000],
    new_construction: [12000, 18000],
    renovation_mechanical: [5000, 8000],
    general_mechanical: [4000, 8000],
    other: [0, 0],
  };
  const [min, max] = ranges[category] || [0, 0];
  if (min === 0) return 0;
  return Math.round(min + Math.random() * (max - min));
}
